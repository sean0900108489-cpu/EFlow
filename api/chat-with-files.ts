import Busboy from "busboy";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";

export const config = {
  api: {
    bodyParser: false,
  },
};

const OPENAI_FILES_URL = "https://api.openai.com/v1/files";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5";
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".json", ".txt", ".md", ".pdf", ".png"]);

type AllowedExtension = ".json" | ".txt" | ".md" | ".pdf" | ".png";

type RequestFields = Record<string, string[]>;

type UploadedRequestFile = {
  fieldName: string;
  name: string;
  size: number;
  type: string;
  extension: AllowedExtension;
  data: Buffer;
};

type UploadedOpenAIFile = {
  name: string;
  size: number;
  type: string;
  extension: AllowedExtension;
  fileId: string;
};

type ResponseInputContent =
  | { type: "input_text"; text: string }
  | { type: "output_text"; text: string }
  | { type: "input_file"; file_id: string }
  | { type: "input_image"; file_id: string; detail: "auto" };

type ResponseInputMessage = {
  role: "system" | "user" | "assistant" | "developer";
  content: ResponseInputContent[];
};

type HistoryMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RequestMode = "chat" | "model_test";

type ChatErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "EXPECTED_MULTIPART_FORM_DATA"
  | "INVALID_MULTIPART_FORM_DATA"
  | "EMPTY_CHAT_REQUEST"
  | "MISSING_API_KEY"
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_HISTORY_JSON"
  | "OPENAI_FILE_UPLOAD_REJECTED"
  | "OPENAI_FILE_UPLOAD_MISSING_ID"
  | "OPENAI_RESPONSE_REJECTED"
  | "INVALID_API_KEY"
  | "INVALID_MODEL"
  | "OPENAI_RATE_LIMITED"
  | "OPENAI_UPSTREAM_ERROR"
  | "CHAT_ROUTE_UNEXPECTED";

type SafeErrorDetails = Record<string, string | number | boolean>;

type SafeErrorResponse = {
  ok: false;
  code: ChatErrorCode;
  message: string;
  details: SafeErrorDetails;
};

class HttpError extends Error {
  status: number;
  code: ChatErrorCode;
  details: SafeErrorDetails;

  constructor(status: number, code: ChatErrorCode, message: string, details: SafeErrorDetails = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class OpenAIRequestError extends Error {
  status: number;
  code: ChatErrorCode;
  details: SafeErrorDetails;

  constructor(status: number, code: ChatErrorCode, message: string, details: SafeErrorDetails = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendErrorJson(res, {
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "這個聊天 route 只接受 POST 請求。",
      details: { allowed: "POST" },
    }, 405);
    return;
  }

  try {
    const { fields, files } = await parseMultipartForm(req);
    const message = getField(fields, "message").trim();
    const model = getField(fields, "model").trim() || DEFAULT_MODEL;
    const apiKey = getField(fields, "apiKey").trim() || process.env.OPENAI_API_KEY?.trim() || "";
    const systemPrompt = getField(fields, "systemPrompt").trim();
    const previousResponseId = getField(fields, "previousResponseId").trim();
    const history = parseHistory(getField(fields, "history"));
    const historyForRequest = previousResponseId ? [] : history;
    const requestMode = getRequestMode(getField(fields, "requestMode"));

    if (!message && files.length === 0 && requestMode !== "model_test") {
      throw new HttpError(
        400,
        "EMPTY_CHAT_REQUEST",
        "請輸入訊息或附加檔案後再送出。",
      );
    }

    if (!apiKey) {
      throw new HttpError(
        400,
        "MISSING_API_KEY",
        "缺少 OpenAI API key。請在 AI Chat 填入 API key，或在 Vercel 設定 OPENAI_API_KEY。",
      );
    }

    if (requestMode === "model_test") {
      const responsePayload = await createOpenAIResponse({
        apiKey,
        model,
        message: "請只回覆 OK。",
        systemPrompt: "This is a minimal backend model availability test. Reply with OK only.",
        history: [],
        previousResponseId: "",
        uploadedFiles: [],
      });

      sendJson(res, 200, {
        ok: true,
        code: "MODEL_USABLE",
        message: "目前 model 可用。",
        model,
        responseId: extractResponseId(responsePayload),
      });
      return;
    }

    const uploadedFiles: UploadedOpenAIFile[] = [];
    for (const file of files) {
      uploadedFiles.push(await uploadOpenAIFile({ apiKey, file }));
    }

    const responsePayload = await createOpenAIResponse({
      apiKey,
      model,
      message,
      systemPrompt,
      history: historyForRequest,
      previousResponseId,
      uploadedFiles,
    });

    sendJson(res, 200, {
      ok: true,
      outputText: extractOutputText(responsePayload),
      responseId: extractResponseId(responsePayload),
      uploadedFiles: uploadedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        fileId: file.fileId,
      })),
    });
  } catch (error) {
    const { status, payload } = getSafeErrorResponse(error);
    logSafeChatError(status, payload);
    sendErrorJson(res, payload, status);
  }
}

function parseMultipartForm(req: IncomingMessage): Promise<{
  fields: RequestFields;
  files: UploadedRequestFile[];
}> {
  return new Promise((resolve, reject) => {
    if (!isMultipartRequest(req.headers)) {
      reject(
        new HttpError(
          415,
          "EXPECTED_MULTIPART_FORM_DATA",
          "聊天請求格式錯誤：請使用 multipart/form-data。",
        ),
      );
      return;
    }

    let parser: ReturnType<typeof Busboy>;
    try {
      parser = Busboy({
        headers: req.headers,
        limits: {
          fileSize: MAX_FILE_SIZE_BYTES,
          files: 20,
          fields: 100,
        },
      });
    } catch {
      reject(
        new HttpError(
          400,
          "INVALID_MULTIPART_FORM_DATA",
          "聊天請求格式錯誤：multipart/form-data 無法解析。",
        ),
      );
      return;
    }

    const fields: RequestFields = {};
    const files: UploadedRequestFile[] = [];
    let fileError: HttpError | null = null;

    parser.on("field", (fieldName, value) => {
      fields[fieldName] = [...(fields[fieldName] ?? []), value];
    });

    parser.on("file", (fieldName, fileStream, info) => {
      const fileName = sanitizeFileName(info.filename || "attachment");
      const extension = getAllowedExtension(fileName);
      const chunks: Buffer[] = [];
      let size = 0;
      let exceededLimit = false;

      fileStream.on("data", (chunk: Buffer) => {
        size += chunk.length;
        chunks.push(chunk);
      });

      fileStream.on("limit", () => {
        exceededLimit = true;
      });

      fileStream.on("error", (error) => {
        reject(error);
      });

      fileStream.on("end", () => {
        if (fieldName !== "files") return;

        if (!extension) {
          fileError = new HttpError(
            400,
            "UNSUPPORTED_FILE_TYPE",
            `${fileName} 的檔案類型不支援。只允許 .json、.txt、.md、.pdf、.png。`,
            { fileName },
          );
          return;
        }

        if (exceededLimit || size > MAX_FILE_SIZE_BYTES) {
          fileError = new HttpError(
            400,
            "FILE_TOO_LARGE",
            `${fileName} 超過 20MB 單檔限制。`,
            { fileName, maxBytes: MAX_FILE_SIZE_BYTES },
          );
          return;
        }

        files.push({
          fieldName,
          name: fileName,
          size,
          type: info.mimeType || getMimeType(extension),
          extension,
          data: Buffer.concat(chunks, size),
        });
      });
    });

    parser.on("error", (error) => {
      reject(error);
    });

    parser.on("finish", () => {
      if (fileError) {
        reject(fileError);
        return;
      }

      resolve({ fields, files });
    });

    req.pipe(parser);
  });
}

async function uploadOpenAIFile({
  apiKey,
  file,
}: {
  apiKey: string;
  file: UploadedRequestFile;
}): Promise<UploadedOpenAIFile> {
  const formData = new FormData();
  const fileBytes = new Uint8Array(new ArrayBuffer(file.data.byteLength));
  fileBytes.set(file.data);
  const blob = new Blob([fileBytes.buffer], { type: file.type || getMimeType(file.extension) });
  formData.append("purpose", file.extension === ".png" ? "vision" : "user_data");
  formData.append("file", blob, file.name);

  const response = await fetch(OPENAI_FILES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw buildOpenAIRequestError("OpenAI file upload failed", response.status, payload);
  }

  if (!isRecord(payload) || typeof payload.id !== "string" || !payload.id.trim()) {
    throw new OpenAIRequestError(
      502,
      "OPENAI_FILE_UPLOAD_MISSING_ID",
      "OpenAI 檔案上傳成功但沒有回傳 file id。",
    );
  }

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    extension: file.extension,
    fileId: payload.id,
  };
}

async function createOpenAIResponse({
  apiKey,
  model,
  message,
  systemPrompt,
  history,
  previousResponseId,
  uploadedFiles,
}: {
  apiKey: string;
  model: string;
  message: string;
  systemPrompt: string;
  history: HistoryMessage[];
  previousResponseId: string;
  uploadedFiles: UploadedOpenAIFile[];
}): Promise<unknown> {
  const input: ResponseInputMessage[] = [];

  if (systemPrompt) {
    input.push({
      role: "system",
      content: [{ type: "input_text", text: systemPrompt }],
    });
  }

  input.push(
    ...history.map(historyMessageToResponseInputMessage),
  );

  input.push({
    role: "user",
    content: [
      {
        type: "input_text",
        text: message || "Please review the attached files.",
      },
      ...uploadedFiles.map<ResponseInputContent>((file) =>
        file.extension === ".png"
          ? { type: "input_image", file_id: file.fileId, detail: "auto" }
          : { type: "input_file", file_id: file.fileId },
      ),
    ],
  });

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
    }),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw buildOpenAIRequestError("OpenAI response creation failed", response.status, payload);
  }

  return payload;
}

function historyMessageToResponseInputMessage(historyMessage: HistoryMessage): ResponseInputMessage {
  return {
    role: historyMessage.role,
    content: [
      {
        type: historyMessage.role === "assistant" ? "output_text" : "input_text",
        text: historyMessage.content,
      },
    ],
  };
}

export function extractOutputText(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (!isRecord(payload)) return "";

  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const outputText = extractTextParts(payload.output).join("\n\n").trim();
  if (outputText) return outputText;

  const contentText = extractTextParts(payload.content).join("\n\n").trim();
  if (contentText) return contentText;

  return "";
}

function extractTextParts(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextParts(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const textParts: string[] = [];
  if (typeof value.text === "string") textParts.push(value.text);
  if (typeof value.output_text === "string") textParts.push(value.output_text);

  if (isRecord(value.message)) {
    textParts.push(...extractTextParts(value.message.content));
  }

  if (value.content !== undefined) {
    textParts.push(...extractTextParts(value.content));
  }

  return textParts;
}

function extractResponseId(payload: unknown): string {
  if (!isRecord(payload)) return "";

  return typeof payload.id === "string" ? payload.id : "";
}

function parseHistory(value: string): HistoryMessage[] {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      throw new HttpError(
        400,
        "INVALID_HISTORY_JSON",
        "聊天歷史資料格式錯誤，請清除對話後再試一次。",
        { field: "history" },
      );
    }

    return parsed.flatMap((item): HistoryMessage[] => {
      if (!isRecord(item)) return [];
      if (item.role !== "system" && item.role !== "user" && item.role !== "assistant") return [];
      if (typeof item.content !== "string" || !item.content.trim()) return [];

      return [{ role: item.role, content: item.content }];
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;

    throw new HttpError(
      400,
      "INVALID_HISTORY_JSON",
      "聊天歷史資料格式錯誤，請清除對話後再試一次。",
      { field: "history" },
    );
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();
  if (!responseText) return "";

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function buildOpenAIRequestError(prefix: string, status: number, payload: unknown): OpenAIRequestError {
  const providerError = extractOpenAIErrorInfo(payload);
  const safeProviderMessage = redactSensitiveText(providerError.message).slice(0, 600);
  const isUpload = prefix.includes("file upload");
  const classifiedCode = classifyOpenAIError(status, providerError);
  const code =
    isUpload && classifiedCode === "OPENAI_RESPONSE_REJECTED"
      ? "OPENAI_FILE_UPLOAD_REJECTED"
      : classifiedCode;
  const safeMessage = getOpenAIErrorMessage({
    code,
    providerMessage: safeProviderMessage,
  });
  const details: SafeErrorDetails = {
    providerStatus: status,
  };

  if (providerError.code) details.providerCode = providerError.code;
  if (providerError.type) details.providerType = providerError.type;
  if (providerError.param) details.providerParam = providerError.param;
  if (safeProviderMessage) details.providerMessage = safeProviderMessage;

  return new OpenAIRequestError(status >= 400 && status < 500 ? status : 502, code, safeMessage, details);
}

function extractOpenAIErrorInfo(payload: unknown): {
  message: string;
  code: string;
  type: string;
  param: string;
} {
  const errorInfo = {
    message: "",
    code: "",
    type: "",
    param: "",
  };

  if (typeof payload === "string") {
    errorInfo.message = payload;
  } else if (isRecord(payload)) {
    if (typeof payload.message === "string") {
      errorInfo.message = payload.message;
    }

    if (typeof payload.code === "string") {
      errorInfo.code = payload.code;
    }

    if (typeof payload.type === "string") {
      errorInfo.type = payload.type;
    }

    if (typeof payload.param === "string") {
      errorInfo.param = payload.param;
    }

    if (isRecord(payload.error)) {
      if (typeof payload.error.message === "string") {
        errorInfo.message = payload.error.message;
      }

      if (typeof payload.error.code === "string") {
        errorInfo.code = payload.error.code;
      }

      if (typeof payload.error.type === "string") {
        errorInfo.type = payload.error.type;
      }

      if (typeof payload.error.param === "string") {
        errorInfo.param = payload.error.param;
      }
    }
  }

  return errorInfo;
}

function classifyOpenAIError(
  status: number,
  providerError: { message: string; code: string; type: string; param: string },
): ChatErrorCode {
  const haystack = [
    providerError.message,
    providerError.code,
    providerError.type,
    providerError.param,
  ]
    .join(" ")
    .toLowerCase();

  if (status === 401 || haystack.includes("invalid api key") || haystack.includes("incorrect api key")) {
    return "INVALID_API_KEY";
  }

  if (
    providerError.param.toLowerCase() === "model" ||
    providerError.code.toLowerCase().includes("model") ||
    (haystack.includes("model") &&
      (haystack.includes("not exist") ||
        haystack.includes("not found") ||
        haystack.includes("invalid") ||
        haystack.includes("does not") ||
        haystack.includes("unavailable") ||
        haystack.includes("access") ||
        haystack.includes("permission") ||
        haystack.includes("unsupported") ||
        haystack.includes("incompatible")))
  ) {
    return "INVALID_MODEL";
  }

  if (status === 429) return "OPENAI_RATE_LIMITED";
  if (status >= 500) return "OPENAI_UPSTREAM_ERROR";

  return "OPENAI_RESPONSE_REJECTED";
}

function getOpenAIErrorMessage({
  code,
  providerMessage,
}: {
  code: ChatErrorCode;
  providerMessage: string;
}): string {
  switch (code) {
    case "INVALID_API_KEY":
      return "OpenAI API key 無效或已被拒絕。請檢查 key 後再試一次。";
    case "INVALID_MODEL":
      return "OpenAI 不接受目前的 model 名稱，或此 API key 無權使用該模型。請改用 gpt-5.5 或其他可用模型。";
    case "OPENAI_RATE_LIMITED":
      return "OpenAI 暫時限制此 API key 的請求量。請稍後再試。";
    case "OPENAI_UPSTREAM_ERROR":
      return "OpenAI 服務暫時無法完成請求。請稍後再試。";
    case "OPENAI_FILE_UPLOAD_REJECTED":
      return "OpenAI 拒絕檔案上傳請求。請確認檔案格式、大小與 API key 權限。";
    case "OPENAI_RESPONSE_REJECTED":
      return "OpenAI 拒絕聊天請求。請確認 model、輸入內容與 API key 權限。";
    default:
      return providerMessage
        ? `OpenAI 請求失敗：${providerMessage}`
        : "OpenAI 請求失敗。";
  }
}

function getSafeErrorResponse(error: unknown): { status: number; payload: SafeErrorResponse } {
  if (error instanceof HttpError || error instanceof OpenAIRequestError) {
    return {
      status: error.status,
      payload: {
        ok: false,
        code: error.code,
        message: redactSensitiveText(error.message),
        details: sanitizeDetails(error.details),
      },
    };
  }

  return {
    status: 500,
    payload: {
      ok: false,
      code: "CHAT_ROUTE_UNEXPECTED",
      message: "聊天 route 發生未預期錯誤。",
      details: {},
    },
  };
}

function sendErrorJson(res: ServerResponse, payload: SafeErrorResponse, status: number) {
  sendJson(res, status, payload);
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function logSafeChatError(status: number, payload: SafeErrorResponse) {
  console.error("[api/chat-with-files] chat_error", {
    status,
    code: payload.code,
    details: getLogSafeDetails(payload.details),
  });
}

function getLogSafeDetails(details: SafeErrorDetails): SafeErrorDetails {
  const { providerMessage: _providerMessage, ...logSafeDetails } = details;
  return logSafeDetails;
}

function getField(fields: RequestFields, fieldName: string): string {
  const values = fields[fieldName];
  if (!values || values.length === 0) return "";

  return values[values.length - 1] ?? "";
}

function getRequestMode(value: string): RequestMode {
  return value.trim() === "model_test" ? "model_test" : "chat";
}

function isMultipartRequest(headers: IncomingHttpHeaders): boolean {
  const contentType = headers["content-type"];
  return typeof contentType === "string" && contentType.toLowerCase().includes("multipart/form-data");
}

function getAllowedExtension(fileName: string): AllowedExtension | null {
  const extensionStart = fileName.lastIndexOf(".");
  const extension = extensionStart >= 0 ? fileName.slice(extensionStart).toLowerCase() : "";

  return ALLOWED_EXTENSIONS.has(extension) ? (extension as AllowedExtension) : null;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[/\\]/g, "_").trim() || "attachment";
}

function getMimeType(extension: AllowedExtension): string {
  switch (extension) {
    case ".json":
      return "application/json";
    case ".txt":
    case ".md":
      return "text/plain";
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    default: {
      const exhaustiveCheck: never = extension;
      return exhaustiveCheck;
    }
  }
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/sk-[^\s'",;:)]+/g, "[redacted_api_key]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/OPENAI_API_KEY\s*=\s*\S+/gi, "OPENAI_API_KEY=[redacted]");
}

function sanitizeDetails(details: SafeErrorDetails): SafeErrorDetails {
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      typeof value === "string" ? redactSensitiveText(value) : value,
    ]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
