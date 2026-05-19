import { useEffect, useMemo, useRef, useState } from "react";
import {
  AI_CHAT_PROMPT_MODES,
  buildAIChatPrompt,
  type AIChatPromptMode,
} from "../../lib/buildAIChatPrompt";
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

export function AIChatConsole({ input, graph }: AIChatConsoleProps) {
  const storedApiKey = useMemo(() => readStoredApiKey(), []);
  const [apiKey, setApiKey] = useState(storedApiKey);
  const [rememberKey, setRememberKey] = useState(storedApiKey.length > 0);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [promptMode, setPromptMode] = useState<AIChatPromptMode>("free_chat");
  const [attachContext, setAttachContext] = useState(false);
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

  const contextCharCount = eflowContextJson.length;
  const contextTokenEstimate = estimateTokenCount(contextCharCount);
  const latestAssistantMessage = getLatestAssistantMessage(chatMessages);
  const canSend = draftMessage.trim().length > 0 && !isSending;
  const promptModeNote = getPromptModeNote(promptMode);

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
      setStatusMessage({ type: "error", text: "Write a message before sending." });
      return;
    }

    if (!trimmedApiKey) {
      setStatusMessage({ type: "error", text: "Add an API key before sending." });
      return;
    }

    if (!trimmedModel) {
      setStatusMessage({ type: "error", text: "Add a model name before sending." });
      return;
    }

    if (!isValidUrl(trimmedBaseUrl)) {
      setStatusMessage({ type: "error", text: "Add a valid provider base URL before sending." });
      return;
    }

    const attachedContextJson = attachContext && eflowContextJson ? eflowContextJson : undefined;
    const prompt = buildAIChatPrompt({
      mode: promptMode,
      userMessage: userContent,
      eflowContextJson: attachedContextJson,
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
      });
      const assistantText = extractAssistantText(responsePayload);
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
            ? `Response received with ${prompt.attachedContextSize.toLocaleString()} context characters attached.`
            : "Response received.",
      });
    } catch (error) {
      const errorText = formatProviderError(error);
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
        throw new Error("Clipboard API is unavailable.");
      }

      await navigator.clipboard.writeText(latestAssistantMessage.content);
      setStatusMessage({ type: "info", text: "Latest assistant response copied." });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not copy the latest response.",
      });
    }
  }

  function clearChat() {
    setChatMessages([]);
    setStatusMessage({ type: "info", text: "Chat cleared. No graph state changed." });
  }

  function clearApiKey() {
    setApiKey("");
    setRememberKey(false);
    writeStoredApiKey("");
    setStatusMessage({ type: "info", text: "API key cleared from this session and localStorage." });
  }

  return (
    <section className={`ai-chat-console ${isCollapsed ? "is-collapsed" : ""}`}>
      <div className="ai-chat-console-header">
        <div className="ai-chat-title-block">
          <p className="eyebrow">AI collaboration</p>
          <h2>AI Collaboration Console</h2>
          <p>Chat with your model using optional current EFlow Context.</p>
        </div>
        <div className="ai-chat-header-actions">
          <div className="ai-chat-badge-row" aria-label="AI collaboration boundaries">
            <span className="status-indicator">Personal BYOK</span>
            <span className="status-indicator status-warn">Draft only</span>
            <span className="status-indicator status-ok">No graph mutation</span>
          </div>
          <button
            className="mini-button"
            type="button"
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed((currentIsCollapsed) => !currentIsCollapsed)}
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!isCollapsed ? (
        <div className="ai-chat-console-body">
          <div className="ai-chat-config-grid">
            <label className="field">
              <span>Base URL</span>
              <input
                type="url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder={DEFAULT_BASE_URL}
              />
            </label>
            <label className="field">
              <span>Model</span>
              <input
                type="text"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder={DEFAULT_MODEL}
              />
            </label>
            <label className="field">
              <span>API key</span>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
            </label>
            <label className="check-field ai-chat-check-field">
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={(event) => setRememberKey(event.target.checked)}
              />
              <span>Remember key in this browser</span>
            </label>
          </div>

          <div className="ai-chat-safety-copy">
            <p>
              API key is used only in this browser session unless remembered. Remembered keys are
              stored in localStorage as <code>{API_KEY_STORAGE_KEY}</code>.
            </p>
            <p>
              Model responses are drafts and cannot modify EFlow. Use Local Command Import to
              validate, dry-run, and apply any generated command.
            </p>
          </div>

          <div className="ai-chat-prompt-grid">
            <label className="field">
              <span>Prompt mode</span>
              <select
                value={promptMode}
                onChange={(event) => setPromptMode(event.target.value as AIChatPromptMode)}
              >
                {AI_CHAT_PROMPT_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-field ai-chat-check-field">
              <input
                type="checkbox"
                checked={attachContext}
                onChange={(event) => setAttachContext(event.target.checked)}
              />
              <span>Attach current EFlow Context</span>
            </label>
            <div className="ai-chat-context-meter" aria-live="polite">
              {eflowContextJson ? (
                <>
                  <strong>{contextCharCount.toLocaleString()}</strong>
                  <span>chars</span>
                  <strong>{contextTokenEstimate.toLocaleString()}</strong>
                  <span>rough tokens</span>
                </>
              ) : (
                <span>No EFlow Context available yet. Generate or import a graph first.</span>
              )}
            </div>
          </div>
          <p className="ai-chat-mode-note">{promptModeNote}</p>

          {attachContext && eflowContextJson ? (
            <p className="ai-chat-warning">
              Attached EFlow Context will be sent to the selected external model provider.
            </p>
          ) : null}
          {attachContext && !eflowContextJson ? (
            <p className="ai-chat-warning">
              No EFlow Context available yet. This message will send without graph context.
            </p>
          ) : null}

          <div className="ai-chat-main">
            <div className="ai-chat-message-list" ref={messageListRef} role="log" aria-live="polite">
              {chatMessages.length === 0 ? (
                <div className="ai-chat-empty-state">
                  <h3>Draft with an external model while EFlow stays local-first.</h3>
                  <p>
                    Attach context only when you want the current graph snapshot sent to the
                    configured provider.
                  </p>
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
                      <span>{message.role === "user" ? "You" : message.error ? "Error" : "Assistant"}</span>
                      <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                    </div>
                    <p>{message.content}</p>
                  </article>
                ))
              )}
              {isSending ? (
                <article className="ai-chat-message ai-chat-message-assistant ai-chat-message-pending">
                  <div className="ai-chat-message-meta">
                    <span>Assistant</span>
                    <span>Thinking</span>
                  </div>
                  <p>Waiting for provider response...</p>
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
                placeholder="Ask for a Codex prompt, paste a report, or explore an architecture decision."
                aria-label="AI collaboration message"
              />
              <div className="ai-chat-actions">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!canSend}
                >
                  {isSending ? "Sending" : "Send"}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void copyLatestResponse()}
                  disabled={!latestAssistantMessage}
                >
                  Copy latest response
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={clearChat}
                  disabled={chatMessages.length === 0 || isSending}
                >
                  Clear chat
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={clearApiKey}
                  disabled={!apiKey && !rememberKey}
                >
                  Clear API key
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
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  input: ProviderInputMessage[];
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
      throw new Error(
        "Network or CORS error while contacting the provider. Some providers block direct browser API calls.",
      );
    }

    throw error;
  }

  const responseText = await response.text();
  const responsePayload = parseProviderPayload(responseText);

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(response, responsePayload));
  }

  return responsePayload;
}

function extractAssistantText(payload: unknown): string {
  if (typeof payload === "string") {
    return payload || "Provider returned an empty response.";
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

  return `Provider response did not include output_text or a recognized content shape.\n\n${safeStringify(payload)}`;
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

function buildHttpErrorMessage(response: Response, payload: unknown): string {
  const providerMessage = extractProviderErrorMessage(payload);
  const prefix = `Provider returned HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}.`;
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

function formatProviderError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected provider error.";
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

function getPromptModeNote(mode: AIChatPromptMode): string {
  switch (mode) {
    case "free_chat":
      return "Free chat is draft-only. Attach context only when the current graph snapshot should leave the browser.";
    case "codex_milestone_prompt":
      return "Codex prompts should keep scope small, inspect the repo first, run validation/build checks, and never commit or push.";
    case "codex_report_to_command":
      return "Generated eflow-command JSON is never applied by chat. Paste it into Local Command Import for Validate -> Dry Run -> Apply.";
    case "raw_idea_to_input":
      return "Raw idea mode should produce EngineeringFlowInput JSON only and preserve unknowns instead of inventing architecture.";
    case "progress_handoff_summary":
      return "Handoff summaries are continuation drafts and should keep do-not-do boundaries visible.";
    case "strategic_architecture_consultation":
      return "Architecture consultation should reason about options and boundaries without writing implementation code.";
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
