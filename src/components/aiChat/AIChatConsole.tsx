import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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

const CHAT_WITH_FILES_ENDPOINT = "/api/chat-with-files";
const DEFAULT_MODEL = "gpt-5.5";
const CUSTOM_MODEL_OPTION_VALUE = "__custom_model__";
const RECOMMENDED_MODELS = [
  { id: "gpt-5.5", label: "gpt-5.5" },
  { id: "gpt-5.4", label: "gpt-5.4" },
  { id: "gpt-5.4-mini", label: "gpt-5.4-mini" },
  { id: "gpt-5.4-nano", label: "gpt-5.4-nano" },
] as const;
const RECOMMENDED_MODEL_IDS = new Set<string>(RECOMMENDED_MODELS.map((recommendedModel) => recommendedModel.id));
const API_KEY_STORAGE_KEY = "eflow.aiChat.apiKey";
const ATTACHMENT_ACCEPT = ".json,.txt,.md,.pdf,.png";
const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([".json", ".txt", ".md", ".pdf", ".png"]);

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
  const [isTestingModel, setIsTestingModel] = useState(false);
  const [previousResponseId, setPreviousResponseId] = useState("");
  const [latestResponseId, setLatestResponseId] = useState("");
  const [autoContinueWithLatestResponseId, setAutoContinueWithLatestResponseId] = useState(false);
  const [promptMode, setPromptMode] = useState<AIChatPromptMode>("free_chat");
  const [contextAttachmentMode, setContextAttachmentMode] =
    useState<AIChatContextAttachmentMode>("none");
  const [draftMessage, setDraftMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "info" | "error"; text: string } | null>(
    null,
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const canSend =
    (draftMessage.trim().length > 0 || attachments.length > 0) && !isSending && !isTestingModel;
  const modelSelectionValue = getModelSelectionValue(model);
  const isCustomModel = modelSelectionValue === CUSTOM_MODEL_OPTION_VALUE;
  const canTestModel = model.trim().length > 0 && !isSending && !isTestingModel;
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
    const trimmedPreviousResponseId = previousResponseId.trim();
    const filesForRequest = [...attachments];

    if (!userContent && filesForRequest.length === 0) {
      setStatusMessage({ type: "error", text: t("aiChat.error.emptyMessage") });
      return;
    }

    if (!trimmedModel) {
      setStatusMessage({ type: "error", text: t("aiChat.error.missingModel") });
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
    const historyForRequest = trimmedPreviousResponseId
      ? []
      : chatMessages
          .filter((message) => !message.error)
          .map<ProviderInputMessage>((message) => ({
            role: message.role,
            content: message.content,
          }));
    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: formatUserMessageContent(userContent, filesForRequest, t),
      createdAt: new Date().toISOString(),
    };

    setChatMessages((currentMessages) => [...currentMessages, userMessage]);
    setStatusMessage(null);
    setIsSending(true);

    try {
      const responsePayload = await postChatWithFilesRequest({
        apiKey: trimmedApiKey,
        model: trimmedModel,
        message: prompt.userPrompt,
        systemPrompt: prompt.systemPrompt,
        history: historyForRequest,
        projectState: selectedContextText,
        previousResponseId: trimmedPreviousResponseId || undefined,
        files: filesForRequest,
        t,
      });
      const assistantText = extractAssistantText(responsePayload, t);
      const providerResponseId = extractProviderResponseId(responsePayload);
      setLatestResponseId(providerResponseId ?? "");
      if (autoContinueWithLatestResponseId && providerResponseId) {
        setPreviousResponseId(providerResponseId);
      }
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
      setDraftMessage("");
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  function handleModelSelectionChange(selectedModel: string) {
    if (selectedModel === CUSTOM_MODEL_OPTION_VALUE) {
      if (!isCustomModel) {
        setModelAndResetContinuation("");
      }
      return;
    }

    if (selectedModel !== model) {
      setModelAndResetContinuation(selectedModel);
    }
  }

  async function testSelectedModel() {
    const trimmedApiKey = apiKey.trim();
    const trimmedModel = model.trim();

    if (!trimmedModel) {
      setStatusMessage({ type: "error", text: t("aiChat.error.missingModel") });
      return;
    }

    setStatusMessage(null);
    setIsTestingModel(true);

    try {
      const responsePayload = await postModelTestRequest({
        apiKey: trimmedApiKey,
        model: trimmedModel,
        t,
      });
      setStatusMessage({
        type: "info",
        text: extractModelTestMessage(responsePayload, t),
      });
    } catch (error) {
      setStatusMessage({ type: "error", text: formatProviderError(error, t) });
    } finally {
      setIsTestingModel(false);
    }
  }

  async function copyLatestResponseId() {
    if (!latestResponseId) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error(t("aiChat.error.clipboardUnavailable"));
      }

      await navigator.clipboard.writeText(latestResponseId);
      setStatusMessage({ type: "info", text: t("aiChat.status.responseIdCopied") });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("aiChat.error.copyResponseIdFailed"),
      });
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
    resetResponseContinuationState();
    setStatusMessage({ type: "info", text: t("aiChat.status.chatCleared") });
  }

  function clearApiKey() {
    setApiKey("");
    setRememberKey(false);
    writeStoredApiKey("");
    resetResponseContinuationState();
    setStatusMessage({ type: "info", text: t("aiChat.status.apiKeyCleared") });
  }

  function clearPreviousResponseId() {
    resetResponseContinuationState();
    setStatusMessage({ type: "info", text: t("aiChat.status.previousResponseIdCleared") });
  }

  function resetResponseContinuationState() {
    setPreviousResponseId("");
    setLatestResponseId("");
    setAutoContinueWithLatestResponseId(false);
  }

  function setModelAndResetContinuation(nextModel: string) {
    setModel(nextModel);
    resetResponseContinuationState();
  }

  function openAttachmentPicker() {
    fileInputRef.current?.click();
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    for (const file of selectedFiles) {
      const extension = getFileExtension(file.name);

      if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
        validationErrors.push(t("aiChat.attachments.error.invalidType", { name: file.name }));
        continue;
      }

      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        validationErrors.push(t("aiChat.attachments.error.tooLarge", { name: file.name }));
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setAttachments((currentAttachments) => [...currentAttachments, ...validFiles]);
    }

    if (validationErrors.length > 0) {
      setStatusMessage({ type: "error", text: validationErrors.join("\n") });
    } else {
      setStatusMessage({
        type: "info",
        text: t("aiChat.attachments.status.added", { count: validFiles.length.toLocaleString() }),
      });
    }

    event.target.value = "";
  }

  function removeAttachment(indexToRemove: number) {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((_, index) => index !== indexToRemove),
    );
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
              <span>{t("aiChat.settings.model")}</span>
              <div className="ai-chat-model-row">
                <select
                  value={modelSelectionValue}
                  onChange={(event) => handleModelSelectionChange(event.target.value)}
                >
                  {RECOMMENDED_MODELS.map((recommendedModel) => (
                    <option key={recommendedModel.id} value={recommendedModel.id}>
                      {recommendedModel.label}
                      {recommendedModel.id === DEFAULT_MODEL
                        ? ` (${t("aiChat.settings.modelDefault")})`
                        : ""}
                    </option>
                  ))}
                  <option value={CUSTOM_MODEL_OPTION_VALUE}>
                    {t("aiChat.settings.modelCustomOption")}
                  </option>
                </select>
                <button
                  className="mini-button ai-chat-model-test-button"
                  type="button"
                  onClick={() => void testSelectedModel()}
                  disabled={!canTestModel}
                >
                  {isTestingModel ? t("aiChat.actions.testingModel") : t("aiChat.actions.testModel")}
                </button>
              </div>
            </label>
            {isCustomModel ? (
              <label className="field">
                <span>{t("aiChat.settings.customModel")}</span>
                <input
                  type="text"
                  value={model}
                  onChange={(event) => setModelAndResetContinuation(event.target.value)}
                  placeholder={t("aiChat.settings.customModelPlaceholder")}
                  autoComplete="off"
                />
              </label>
            ) : null}
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
            <p>{t("aiChat.settings.helper.modelSelection")}</p>
            {isCustomModel ? (
              <p className="ai-chat-warning">{t("aiChat.settings.helper.customModel")}</p>
            ) : null}
            <p>{t("aiChat.settings.helper.modelDraft")}</p>
          </div>

          <div className="ai-chat-thread-panel">
            <div className="ai-chat-thread-panel-header">
              <p className="eyebrow">{t("aiChat.thread.advancedLabel")}</p>
              <span className="status-indicator status-warn">{t("aiChat.boundaries.draftOnly")}</span>
            </div>
            <div className="ai-chat-thread-grid">
              <label className="field">
                <span>{t("aiChat.thread.previousResponseIdLabel")}</span>
                <input
                  type="text"
                  value={previousResponseId}
                  onChange={(event) => setPreviousResponseId(event.target.value)}
                  placeholder={t("aiChat.thread.previousResponseIdPlaceholder")}
                  autoComplete="off"
                />
              </label>
              <label className="check-field ai-chat-check-field">
                <input
                  type="checkbox"
                  checked={autoContinueWithLatestResponseId}
                  onChange={(event) => setAutoContinueWithLatestResponseId(event.target.checked)}
                />
                <span>{t("aiChat.thread.autoContinue")}</span>
              </label>
              <button
                className="mini-button"
                type="button"
                onClick={clearPreviousResponseId}
                disabled={!previousResponseId && !latestResponseId && !autoContinueWithLatestResponseId}
              >
                {t("aiChat.thread.clearPreviousResponseId")}
              </button>
            </div>
            <div className="ai-chat-thread-copy">
              <p>{t("aiChat.thread.helper")}</p>
              <p className="ai-chat-warning">{t("aiChat.thread.warning")}</p>
            </div>
            {latestResponseId ? (
              <div className="ai-chat-latest-response-id">
                <span>{t("aiChat.thread.latestResponseId")}</span>
                <code>{latestResponseId}</code>
                <button className="mini-button" type="button" onClick={() => void copyLatestResponseId()}>
                  {t("aiChat.thread.copyResponseId")}
                </button>
              </div>
            ) : null}
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
              <input
                ref={fileInputRef}
                className="ai-chat-file-input"
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                onChange={handleAttachmentChange}
              />
              <div className="ai-chat-attachment-toolbar">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={openAttachmentPicker}
                  disabled={isSending}
                >
                  {t("aiChat.attachments.add")}
                </button>
                <span>{t("aiChat.attachments.helper")}</span>
              </div>
              {attachments.length > 0 ? (
                <div className="ai-chat-attachment-chips" aria-live="polite">
                  {attachments.map((file, index) => (
                    <span className="ai-chat-attachment-chip" key={`${file.name}-${file.size}-${index}`}>
                      <span className="ai-chat-attachment-name">{file.name}</span>
                      <span className="ai-chat-attachment-size">{formatFileSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        disabled={isSending}
                        aria-label={t("aiChat.attachments.removeAria", { name: file.name })}
                      >
                        {t("aiChat.attachments.remove")}
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
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

async function postChatWithFilesRequest({
  apiKey,
  model,
  message,
  systemPrompt,
  history,
  projectState,
  previousResponseId,
  files,
  t,
}: {
  apiKey: string;
  model: string;
  message: string;
  systemPrompt: string;
  history: ProviderInputMessage[];
  projectState: string;
  previousResponseId?: string;
  files: File[];
  t: Translate;
}): Promise<unknown> {
  let response: Response;
  const formData = new FormData();
  formData.append("message", message);
  formData.append("model", model);
  formData.append("apiKey", apiKey);
  formData.append("systemPrompt", systemPrompt);

  if (projectState) {
    formData.append("projectState", projectState);
  }

  if (history.length > 0) {
    const historyJson = JSON.stringify(history);
    formData.append("history", historyJson);
    formData.append("conversation", historyJson);
  }

  if (previousResponseId) {
    formData.append("previousResponseId", previousResponseId);
  }

  for (const file of files) {
    formData.append("files", file, file.name);
  }

  try {
    response = await fetch(CHAT_WITH_FILES_ENDPOINT, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(t("aiChat.error.networkOrBackend"));
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

async function postModelTestRequest({
  apiKey,
  model,
  t,
}: {
  apiKey: string;
  model: string;
  t: Translate;
}): Promise<unknown> {
  let response: Response;
  const formData = new FormData();
  formData.append("requestMode", "model_test");
  formData.append("model", model);
  formData.append("apiKey", apiKey);

  try {
    response = await fetch(CHAT_WITH_FILES_ENDPOINT, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(t("aiChat.error.networkOrBackend"));
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

function extractModelTestMessage(payload: unknown, t: Translate): string {
  if (!isRecord(payload)) return t("aiChat.status.modelTestUsable");

  return typeof payload.message === "string" && payload.message.trim()
    ? payload.message
    : t("aiChat.status.modelTestUsable");
}

function extractProviderResponseId(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.responseId === "string" && payload.responseId.trim()) {
    return payload.responseId;
  }
  return typeof payload.id === "string" && payload.id.trim() ? payload.id : null;
}

function extractAssistantText(payload: unknown, t: Translate): string {
  if (typeof payload === "string") {
    return payload || t("aiChat.error.providerEmptyResponse");
  }

  if (isRecord(payload)) {
    if (typeof payload.outputText === "string" && payload.outputText.trim()) {
      return payload.outputText;
    }

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
  const backendError = extractBackendError(payload);
  if (backendError) {
    return backendError.code ? `${backendError.message}（${backendError.code}）` : backendError.message;
  }

  const providerMessage = extractProviderErrorMessage(payload);
  const prefix = t("aiChat.error.backendHttp", {
    status: response.status,
    statusText: response.statusText ? ` ${response.statusText}` : "",
  });
  return providerMessage ? `${prefix} ${providerMessage}` : prefix;
}

function extractBackendError(payload: unknown): { code: string; message: string } | null {
  if (!isRecord(payload)) return null;

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  const isStructuredError = payload.ok === false || Boolean(code);

  if (!isStructuredError || !message) return null;

  return { code, message };
}

function extractProviderErrorMessage(payload: unknown): string {
  if (typeof payload === "string") return payload.slice(0, 600);
  if (!isRecord(payload)) return "";

  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.error === "string") return payload.error;
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

function formatUserMessageContent(message: string, files: File[], t: Translate): string {
  const trimmedMessage = message.trim();
  if (files.length === 0) return trimmedMessage;

  const fileLines = files.map((file) => `- ${file.name} (${formatFileSize(file.size)})`);
  return [
    trimmedMessage || t("aiChat.attachments.onlyFilesMessage"),
    `${t("aiChat.attachments.sentFiles")}:`,
    fileLines.join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;

  const units = ["KB", "MB", "GB"];
  let size = sizeInBytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function getFileExtension(fileName: string): string {
  const extensionStart = fileName.lastIndexOf(".");
  if (extensionStart < 0) return "";

  return fileName.slice(extensionStart).toLowerCase();
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

function getModelSelectionValue(model: string): string {
  return RECOMMENDED_MODEL_IDS.has(model.trim()) ? model.trim() : CUSTOM_MODEL_OPTION_VALUE;
}

function readStoredApiKey(): string {
  if (typeof window === "undefined") return "";

  try {
    clearLegacyLocalStorageApiKey();
    return window.sessionStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredApiKey(apiKey: string) {
  if (typeof window === "undefined") return;

  try {
    clearLegacyLocalStorageApiKey();

    if (apiKey) {
      window.sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      return;
    }

    window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // Browser storage can be disabled in private or locked-down contexts.
  }
}

function clearLegacyLocalStorageApiKey() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // Best-effort cleanup for older builds that stored the key in localStorage.
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
