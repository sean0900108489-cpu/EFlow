import Busboy from "busboy";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";

export const config = {
  api: {
    bodyParser: false,
  },
};

const OPENAI_FILES_URL = "https://api.openai.com/v1/files";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5-pro";
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

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class OpenAIRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed" });
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

    if (!message && files.length === 0) {
      throw new HttpError(400, "Message or files are required");
    }

    if (!apiKey) {
      throw new HttpError(400, "Missing API key");
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
      history,
      previousResponseId,
      uploadedFiles,
    });

    sendJson(res, 200, {
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
    const { status, message } = getSafeErrorResponse(error);
    sendJson(res, status, { error: message });
  }
}

function parseMultipartForm(req: IncomingMessage): Promise<{
  fields: RequestFields;
  files: UploadedRequestFile[];
}> {
  return new Promise((resolve, reject) => {
    if (!isMultipartRequest(req.headers)) {
      reject(new HttpError(415, "Expected multipart/form-data"));
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
      reject(new HttpError(400, "Invalid multipart/form-data"));
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
            `Unsupported file type for ${fileName}. Allowed extensions: .json, .txt, .md, .pdf, .png`,
          );
          return;
        }

        if (exceededLimit || size > MAX_FILE_SIZE_BYTES) {
          fileError = new HttpError(400, `${fileName} exceeds the 20MB per-file limit`);
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
    throw new OpenAIRequestError(502, "OpenAI file upload did not return a file id");
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
    ...history.map((historyMessage) => ({
      role: historyMessage.role,
      content: [{ type: "input_text" as const, text: historyMessage.content }],
    })),
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
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item): HistoryMessage[] => {
      if (!isRecord(item)) return [];
      if (item.role !== "system" && item.role !== "user" && item.role !== "assistant") return [];
      if (typeof item.content !== "string" || !item.content.trim()) return [];

      return [{ role: item.role, content: item.content }];
    });
  } catch {
    return [];
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
  const providerMessage = extractOpenAIErrorMessage(payload);
  const safeMessage = providerMessage
    ? `${prefix}: ${providerMessage}`
    : `${prefix} with HTTP ${status}`;

  return new OpenAIRequestError(status >= 400 && status < 500 ? status : 502, safeMessage);
}

function extractOpenAIErrorMessage(payload: unknown): string {
  let message = "";

  if (typeof payload === "string") {
    message = payload;
  } else if (isRecord(payload)) {
    if (typeof payload.message === "string") {
      message = payload.message;
    } else if (isRecord(payload.error)) {
      if (typeof payload.error.message === "string") {
        message = payload.error.message;
      } else if (typeof payload.error.type === "string") {
        message = payload.error.type;
      }
    }
  }

  return redactSensitiveText(message).slice(0, 600);
}

function getSafeErrorResponse(error: unknown): { status: number; message: string } {
  if (error instanceof HttpError || error instanceof OpenAIRequestError) {
    return {
      status: error.status,
      message: redactSensitiveText(error.message),
    };
  }

  return {
    status: 500,
    message: "Unexpected chat route error",
  };
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getField(fields: RequestFields, fieldName: string): string {
  const values = fields[fieldName];
  if (!values || values.length === 0) return "";

  return values[values.length - 1] ?? "";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
