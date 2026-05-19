import { useEffect, useMemo, useRef, useState } from "react";
import {
  AI_CHAT_CONTEXT_ATTACHMENT_MODES,
  AI_CHAT_PROMPT_MODES,
  buildAIChatContextSummary,
  buildAIChatPrompt,
  type AIChatContextAttachmentMode,
  type AIChatPromptMode,
  type BuiltAIChatPrompt,
} from "../../lib/buildAIChatPrompt";
import { useLanguage } from "../../lib/i18n/language-context";
import type { TranslationKey, TranslationValues } from "../../lib/i18n/types";
import { buildEFlowContextExport } from "../../lib/buildEflowContextExport";
import type { EngineeringFlowGraph, EngineeringFlowInput } from "../../types/engineeringFlow";

const DEFAULT_BASE_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5-pro";
const API_KEY_STORAGE_KEY = "eflow.aiChat.apiKey";

type AIChatConsoleProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
};

type ChatMessageRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  error?: boolean;
};

type ProviderInputMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type Translate = (key: TranslationKey, values?: TranslationValues) => string;

export function AIChatConsole({ input, graph }: AIChatConsoleProps) {
  const { t } = useLanguage();
  const storedApiKey = useMemo(() => readStoredApiKey(), []);
  const [apiKey, setApiKey] = useState(storedApiKey);
  const [rememberKey, setRememberKey] = useState(storedApiKey.length > 0);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [promptMode, setPromptMode] = useState<AIChatPromptMode>("free_chat");
  const [contextAttachmentMode, setContextAttachmentMode] =
    useState<AIChatContextAttachmentMode>("none");
  const [draftMessage, setDraftMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "info" | "error"; text: string } | null>(
    null,
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  const eflowContextJson = useMemo(() => {
    if (!graph) return "";

    return JSON.stringify(
      buildEFlowContextExport({
        engineeringFlowInput: input,
        engineeringFlowGraph: graph,
      }),
      null,
      2,
    );
  }, [graph, input]);

  const eflowContextSummary = useMemo(
    () => buildAIChatContextSummary({ input, graph }),
    [graph, input],
  );
  const selectedContextText = getSelectedContextText({
    mode: contextAttachmentMode,
    eflowContextSummary,
    eflowContextJson,
  });
  const contextCharCount = selectedContextText.length;
  const contextTokenEstimate = estimateTokenCount(contextCharCount);
  const latestAssistantMessage = getLatestAssistantMessage(chatMessages);
  const canSend = draftMessage.trim().length > 0 && !isSending;
  const promptModeNote = getPromptModeNote(promptMode, t);
  const composedPromptPreview = useMemo(() => {
    const prompt = buildAIChatPrompt({
      mode: promptMode,
      userMessage: draftMessage,
      ...getContextAttachmentArgs({
        mode: contextAttachmentMode,
        eflowContextSummary,
        eflowContextJson,
      }),
    });

    return formatComposedPromptPreview(prompt, t);
  }, [contextAttachmentMode, draftMessage, eflowContextJson, eflowContextSummary, promptMode, t]);

  useEffect(() => {
    writeStoredApiKey(rememberKey ? apiKey : "");
  }, [apiKey, rememberKey]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, isSending]);

  async function sendMessage() {
    const userContent = draftMessage.trim();
    const trimmedApiKey = apiKey.trim();
    const trimmedModel = model.trim();
    const trimmedBaseUrl = baseUrl.trim();

    if (!userContent) {
      setStatusMessage({ type: "error", text: t("aiChat.error.emptyMessage") });
      return;
    }

    if (!trimmedApiKey) {
      setStatusMessage({ type: "error", text: t("aiChat.error.missingApiKey") });
      return;
    }

    if (!trimmedModel) {
      setStatusMessage({ type: "error", text: t("aiChat.error.missingModel") });
      return;
    }

    if (!isValidUrl(trimmedBaseUrl)) {
      setStatusMessage({ type: "error", text: t("aiChat.error.invalidBaseUrl") });
      return;
    }

    const prompt = buildAIChatPrompt({
      mode: promptMode,
      userMessage: userContent,
      ...getContextAttachmentArgs({
        mode: contextAttachmentMode,
        eflowContextSummary,
        eflowContextJson,
      }),
    });
    const historyForRequest = chatMessages
      .filter((message) => !message.error)
      .map<ProviderInputMessage>((message) => ({
        role: message.role,
        content: message.content,
      }));
    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    const requestInput: ProviderInputMessage[] = [
      {
        role: "system",
        content: prompt.systemPrompt,
      },
      ...historyForRequest,
      {
        role: "user",
        content: prompt.userPrompt,
      },
    ];

    setChatMessages((currentMessages) => [...currentMessages, userMessage]);
    setDraftMessage("");
    setStatusMessage(null);
    setIsSending(true);

    try {
      const responsePayload = await postDirectProviderRequest({
        apiKey: trimmedApiKey,
        baseUrl: trimmedBaseUrl,
        model: trimmedModel,
        input: requestInput,
        t,
      });
      const assistantText = extractAssistantText(responsePayload, t);
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: assistantText,
          createdAt: new Date().toISOString(),
        },
      ]);
      setStatusMessage({
        type: "info",
        text:
          prompt.attachedContextSize > 0
            ? t("aiChat.status.responseReceivedWithContext", {
                count: prompt.attachedContextSize.toLocaleString(),
              })
            : t("aiChat.status.responseReceived"),
      });
    } catch (error) {
      const errorText = formatProviderError(error, t);
      setStatusMessage({ type: "error", text: errorText });
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: errorText,
          createdAt: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function copyLatestResponse() {
    if (!latestAssistantMessage) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error(t("aiChat.error.clipboardUnavailable"));
      }

      await navigator.clipboard.writeText(latestAssistantMessage.content);
      setStatusMessage({ type: "info", text: t("aiChat.status.latestResponseCopied") });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("aiChat.error.copyLatestResponseFailed"),
      });
    }
  }

  async function copyComposedPromptPreview() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error(t("aiChat.error.clipboardUnavailable"));
      }

      await navigator.clipboard.writeText(composedPromptPreview);
      setStatusMessage({ type: "info", text: t("aiChat.status.promptPreviewCopied") });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("aiChat.error.copyPromptPreviewFailed"),
      });
    }
  }

  function clearChat() {
    setChatMessages([]);
    setStatusMessage({ type: "info", text: t("aiChat.status.chatCleared") });
  }

  function clearApiKey() {
    setApiKey("");
    setRememberKey(false);
    writeStoredApiKey("");
    setStatusMessage({ type: "info", text: t("aiChat.status.apiKeyCleared") });
  }

  return (
    <section
      className={`ai-chat-console ${isCollapsed ? "is-collapsed" : ""}`}
      data-tour="ai-console"
      data-tour-step="2"
      data-tour-title={t("tour.aiConsole.title")}
      data-tour-body={t("tour.aiConsole.body")}
      data-tour-position="bottom"
    >
      <div className="ai-chat-console-header">
        <div className="ai-chat-title-block">
          <p className="eyebrow">{t("aiChat.header.eyebrow")}</p>
          <h2>{t("aiChat.header.title")}</h2>
          <p>{t("aiChat.header.description")}</p>
        </div>
        <div className="ai-chat-header-actions">
          <div className="ai-chat-badge-row" aria-label={t("aiChat.boundaries.label")}>
            <span className="status-indicator">{t("aiChat.boundaries.personalByok")}</span>
            <span className="status-indicator status-warn">{t("aiChat.boundaries.draftOnly")}</span>
            <span className="status-indicator status-ok">{t("aiChat.boundaries.noGraphMutation")}</span>
          </div>
          <button
            className="mini-button"
            type="button"
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed((currentIsCollapsed) => !currentIsCollapsed)}
          >
            {isCollapsed ? t("common.disclosure.expand") : t("common.disclosure.collapse")}
          </button>
        </div>
      </div>

      {!isCollapsed ? (
        <div className="ai-chat-console-body">
          <div className="ai-chat-config-grid">
            <label className="field">
              <span>{t("aiChat.settings.baseUrl")}</span>
              <input
                type="url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder={DEFAULT_BASE_URL}
              />
            </label>
            <label className="field">
              <span>{t("aiChat.settings.model")}</span>
              <input
                type="text"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder={DEFAULT_MODEL}
              />
            </label>
            <label className="field">
              <span>{t("aiChat.settings.apiKey")}</span>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={t("aiChat.settings.apiKeyPlaceholder")}
                autoComplete="off"
              />
            </label>
            <label className="check-field ai-chat-check-field">
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={(event) => setRememberKey(event.target.checked)}
              />
              <span>{t("aiChat.settings.rememberKey")}</span>
            </label>
          </div>

          <div className="ai-chat-safety-copy">
            <p>
              {t("aiChat.settings.helper.apiKey", { storageKey: API_KEY_STORAGE_KEY })}
            </p>
            <p>{t("aiChat.settings.helper.modelDraft")}</p>
          </div>

          <div className="ai-chat-prompt-grid">
            <label className="field">
              <span>{t("aiChat.prompt.modeLabel")}</span>
              <select
                value={promptMode}
                onChange={(event) => setPromptMode(event.target.value as AIChatPromptMode)}
              >
                {AI_CHAT_PROMPT_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {t(mode.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t("aiChat.context.modeLabel")}</span>
              <select
                value={contextAttachmentMode}
                onChange={(event) =>
                  setContextAttachmentMode(event.target.value as AIChatContextAttachmentMode)
                }
              >
                {AI_CHAT_CONTEXT_ATTACHMENT_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {t(mode.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <div className="ai-chat-context-meter" aria-live="polite">
              {contextAttachmentMode === "none" ? (
                <span>{t("aiChat.context.noContextSelected")}</span>
              ) : selectedContextText ? (
                <>
                  <strong>{contextCharCount.toLocaleString()}</strong>
                  <span>{t("aiChat.context.chars")}</span>
                  <strong>{contextTokenEstimate.toLocaleString()}</strong>
                  <span>{t("aiChat.context.roughTokens")}</span>
                </>
              ) : (
                <span>{t("aiChat.context.unavailable")}</span>
              )}
            </div>
          </div>
          <div className="ai-chat-context-helper">
            <p>{t("aiChat.context.helper.noContext")}</p>
            <p>{t("aiChat.context.helper.summary")}</p>
            <p>{t("aiChat.context.helper.full")}</p>
            <p>{t("aiChat.context.warning.fullCost")}</p>
          </div>
          <p className="ai-chat-mode-note">{promptModeNote}</p>

          {contextAttachmentMode === "summary" ? (
            <p className="ai-chat-warning">{t("aiChat.context.warning.summary")}</p>
          ) : null}
          {contextAttachmentMode === "full" && eflowContextJson ? (
            <p className="ai-chat-warning">{t("aiChat.context.warning.full")}</p>
          ) : null}
          {contextAttachmentMode === "full" && !eflowContextJson ? (
            <p className="ai-chat-warning">{t("aiChat.context.warning.fullUnavailable")}</p>
          ) : null}

          <div className="ai-chat-main">
            <div className="ai-chat-message-list" ref={messageListRef} role="log" aria-live="polite">
              {chatMessages.length === 0 ? (
                <div className="ai-chat-empty-state">
                  <h3>{t("aiChat.state.emptyTitle")}</h3>
                  <p>{t("aiChat.state.emptyBody")}</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <article
                    className={`ai-chat-message ai-chat-message-${message.role} ${
                      message.error ? "ai-chat-message-error" : ""
                    }`}
                    key={message.id}
                  >
                    <div className="ai-chat-message-meta">
                      <span>
                        {message.role === "user"
                          ? t("aiChat.message.you")
                          : message.error
                            ? t("aiChat.message.error")
                            : t("aiChat.message.assistant")}
                      </span>
                      <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                    </div>
                    <p>{message.content}</p>
                  </article>
                ))
              )}
              {isSending ? (
                <article className="ai-chat-message ai-chat-message-assistant ai-chat-message-pending">
                  <div className="ai-chat-message-meta">
                    <span>{t("aiChat.message.assistant")}</span>
                    <span>{t("aiChat.message.thinking")}</span>
                  </div>
                  <p>{t("aiChat.state.pending")}</p>
                </article>
              ) : null}
            </div>

            <div className="ai-chat-composer">
              <textarea
                rows={5}
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={t("aiChat.composer.placeholder")}
                aria-label={t("aiChat.composer.ariaLabel")}
              />
              <div className="ai-chat-actions">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!canSend}
                >
                  {isSending ? t("aiChat.actions.sending") : t("aiChat.actions.send")}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void copyComposedPromptPreview()}
                >
                  {t("aiChat.actions.copyComposedPromptPreview")}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void copyLatestResponse()}
                  disabled={!latestAssistantMessage}
                >
                  {t("aiChat.actions.copyLatestResponse")}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={clearChat}
                  disabled={chatMessages.length === 0 || isSending}
                >
                  {t("aiChat.actions.clearChat")}
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={clearApiKey}
                  disabled={!apiKey && !rememberKey}
                >
                  {t("aiChat.actions.clearApiKey")}
                </button>
              </div>
            </div>
          </div>

          {statusMessage ? (
            <p className={`ai-chat-status ai-chat-status-${statusMessage.type}`}>
              {statusMessage.text}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

async function postDirectProviderRequest({
  apiKey,
  baseUrl,
  model,
  input,
  t,
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  input: ProviderInputMessage[];
  t: Translate;
}): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input,
      }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(t("aiChat.error.networkOrCors"));
    }

    throw error;
  }

  const responseText = await response.text();
  const responsePayload = parseProviderPayload(responseText);

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(response, responsePayload, t));
  }

  return responsePayload;
}

function extractAssistantText(payload: unknown, t: Translate): string {
  if (typeof payload === "string") {
    return payload || t("aiChat.error.providerEmptyResponse");
  }

  if (isRecord(payload)) {
    if (typeof payload.output_text === "string" && payload.output_text.trim()) {
      return payload.output_text;
    }

    const outputText = extractContentText(payload.output).join("\n\n").trim();
    if (outputText) return outputText;

    const choicesText = extractContentText(payload.choices).join("\n\n").trim();
    if (choicesText) return choicesText;

    const contentText = extractContentText(payload.content).join("\n\n").trim();
    if (contentText) return contentText;
  }

  return `${t("aiChat.error.providerMissingOutput")}\n\n${safeStringify(payload)}`;
}

function extractContentText(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractContentText(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const textParts: string[] = [];
  if (typeof value.text === "string") textParts.push(value.text);
  if (typeof value.output_text === "string") textParts.push(value.output_text);

  if (isRecord(value.message)) {
    textParts.push(...extractContentText(value.message.content));
  }

  if (value.content !== undefined) {
    textParts.push(...extractContentText(value.content));
  }

  return textParts;
}

function buildHttpErrorMessage(response: Response, payload: unknown, t: Translate): string {
  const providerMessage = extractProviderErrorMessage(payload);
  const prefix = t("aiChat.error.providerHttp", {
    status: response.status,
    statusText: response.statusText ? ` ${response.statusText}` : "",
  });
  return providerMessage ? `${prefix} ${providerMessage}` : prefix;
}

function extractProviderErrorMessage(payload: unknown): string {
  if (typeof payload === "string") return payload.slice(0, 600);
  if (!isRecord(payload)) return "";

  if (typeof payload.message === "string") return payload.message;
  if (isRecord(payload.error)) {
    if (typeof payload.error.message === "string") return payload.error.message;
    if (typeof payload.error.type === "string") return payload.error.type;
  }

  return "";
}

function parseProviderPayload(responseText: string): unknown {
  if (!responseText) return "";

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function formatProviderError(error: unknown, t: Translate): string {
  if (error instanceof Error) return error.message;
  return t("aiChat.error.unexpectedProvider");
}

function getLatestAssistantMessage(messages: ChatMessage[]): ChatMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "assistant" && !message.error) return message;
  }

  return null;
}

function createMessageId(role: ChatMessageRole): string {
  return `ai-chat-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function estimateTokenCount(characterCount: number): number {
  return Math.ceil(characterCount / 4);
}

function getContextAttachmentArgs({
  mode,
  eflowContextSummary,
  eflowContextJson,
}: {
  mode: AIChatContextAttachmentMode;
  eflowContextSummary: string;
  eflowContextJson: string;
}): { eflowContextSummary?: string; eflowContextJson?: string } {
  if (mode === "summary") {
    return { eflowContextSummary };
  }

  if (mode === "full" && eflowContextJson) {
    return { eflowContextJson };
  }

  return {};
}

function getSelectedContextText({
  mode,
  eflowContextSummary,
  eflowContextJson,
}: {
  mode: AIChatContextAttachmentMode;
  eflowContextSummary: string;
  eflowContextJson: string;
}): string {
  if (mode === "summary") return eflowContextSummary;
  if (mode === "full") return eflowContextJson;
  return "";
}

function formatComposedPromptPreview(prompt: BuiltAIChatPrompt, t: Translate): string {
  return [
    t("aiChat.preview.systemPrompt"),
    prompt.systemPrompt,
    t("aiChat.preview.userPrompt"),
    prompt.userPrompt,
  ].join("\n\n");
}

function getPromptModeNote(mode: AIChatPromptMode, t: Translate): string {
  switch (mode) {
    case "free_chat":
      return t("aiChat.prompt.note.freeChat");
    case "codex_milestone_prompt":
      return t("aiChat.prompt.note.codexMilestonePrompt");
    case "codex_report_to_command":
      return t("aiChat.prompt.note.codexReportToCommand");
    case "raw_idea_to_input":
      return t("aiChat.prompt.note.rawIdeaToInput");
    case "progress_handoff_summary":
      return t("aiChat.prompt.note.progressHandoffSummary");
    case "strategic_architecture_consultation":
      return t("aiChat.prompt.note.strategicArchitectureConsultation");
    default: {
      const exhaustiveCheck: never = mode;
      return exhaustiveCheck;
    }
  }
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function readStoredApiKey(): string {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredApiKey(apiKey: string) {
  if (typeof window === "undefined") return;

  try {
    if (apiKey) {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      return;
    }

    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // localStorage can be disabled in private or locked-down browser contexts.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2).slice(0, 4000);
  } catch {
    return String(value);
  }
}
