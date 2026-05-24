import { useMemo, useState } from "react";
import { useLanguage } from "../../lib/i18n/language-context";
import type {
  EFlowWorkspaceDocument,
  EngineeringFlowInput,
  FullAIContext,
} from "../../types/engineeringFlow";
import { makeWorkspaceFilename } from "../../lib/workspacePersistence";
import {
  isEngineeringFlowInput,
  isFullAIContext,
  normalizeEngineeringFlowInput,
  validateEFlowWorkspaceDocument,
} from "../../lib/workspaceValidation";
import { CopyJsonButton } from "./CopyJsonButton";

type WorkspacePersistencePanelProps = {
  workspace: EFlowWorkspaceDocument;
  autosaveStatus: string;
  onImportWorkspace: (workspace: EFlowWorkspaceDocument) => void;
  onImportFullContext: (context: FullAIContext) => void;
  onImportInput: (input: EngineeringFlowInput) => void;
  onClearLocalWorkspace: () => void;
};

export function WorkspacePersistencePanel({
  workspace,
  autosaveStatus,
  onImportWorkspace,
  onImportFullContext,
  onImportInput,
  onClearLocalWorkspace,
}: WorkspacePersistencePanelProps) {
  const { t } = useLanguage();
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const workspaceJson = useMemo(() => JSON.stringify(workspace, null, 2), [workspace]);

  function downloadWorkspaceJson() {
    const blob = new Blob([workspaceJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = makeWorkspaceFilename(workspace);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage({ type: "success", text: t("workspacePersistence.status.downloaded") });
  }

  function importWorkspaceJson() {
    try {
      const parsed = JSON.parse(importText) as unknown;
      const parsedRecord =
        typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
      if (!parsedRecord) {
        throw new Error(t("workspacePersistence.error.unsupportedSchema"));
      }

      const schemaVersion = parsedRecord.schemaVersion;

      if ("EngineeringFlowInput" in parsedRecord) {
        const normalized = normalizeEngineeringFlowInput(parsed);

        onImportInput(normalized.EngineeringFlowInput);
        setMessage({
          type: "success",
          text: t("workspacePersistence.status.inputImported"),
        });
        return;
      }

      if (schemaVersion === "eflow-workspace/v0.3") {
        const workspaceValidation = validateEFlowWorkspaceDocument(parsed);
        if (!workspaceValidation.ok) {
          throw new Error(
            formatValidationErrors(
              t("workspacePersistence.error.importRejected"),
              workspaceValidation.errors,
              t("workspacePersistence.error.moreIssues"),
            ),
          );
        }

        onImportWorkspace(parsed as EFlowWorkspaceDocument);
        setMessage({ type: "success", text: t("workspacePersistence.status.workspaceImported") });
        return;
      }

      if (schemaVersion === "engineering-flow-full-context/v0") {
        if (!isFullAIContext(parsed)) {
          throw new Error(t("workspacePersistence.error.fullContextInvalid"));
        }

        onImportFullContext(parsed);
        setMessage({ type: "success", text: t("workspacePersistence.status.fullContextImported") });
        return;
      }

      if (schemaVersion === "engineering-flow-input/v0") {
        if (!isEngineeringFlowInput(parsed)) {
          throw new Error(t("workspacePersistence.error.inputMissingFields"));
        }

        onImportInput(parsed);
        setMessage({
          type: "success",
          text: t("workspacePersistence.status.inputImported"),
        });
        return;
      }

      throw new Error(t("workspacePersistence.error.unsupportedSchema"));
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error &&
          error.message === "EngineeringFlowInput JSON is missing required fields."
            ? t("workspacePersistence.error.inputMissingFields")
            : error instanceof Error
              ? error.message
              : t("workspacePersistence.error.invalidJson"),
      });
    }
  }

  return (
    <section className="workspace-persistence-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("workspacePersistence.eyebrow")}</p>
          <h2>{t("workspacePersistence.title")}</h2>
        </div>
        <span className="status-indicator status-ok">{autosaveStatus}</span>
      </div>
      <p className="workspace-helper">{t("workspacePersistence.helper")}</p>
      <div className="export-actions">
        <CopyJsonButton label={t("workspacePersistence.copyWorkspace")} value={workspace} />
        <button className="button button-secondary" type="button" onClick={downloadWorkspaceJson}>
          {t("workspacePersistence.downloadWorkspace")}
        </button>
      </div>
      <div className="workspace-import-box">
        <div className="section-header">
          <div>
            <h3>{t("workspacePersistence.importTitle")}</h3>
            <p>{t("workspacePersistence.importSubtitle")}</p>
          </div>
          <button className="mini-button" type="button" onClick={importWorkspaceJson}>
            {t("workspacePersistence.importAction")}
          </button>
        </div>
        <textarea
          rows={6}
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder='{"schemaVersion":"eflow-workspace/v0.3", ...}'
        />
      </div>
      {message ? <p className={`import-message import-${message.type}`}>{message.text}</p> : null}
      <button className="danger-button clear-workspace-button" type="button" onClick={onClearLocalWorkspace}>
        {t("workspacePersistence.clearLocalWorkspace")}
      </button>
    </section>
  );
}

function formatValidationErrors(
  prefix: string,
  errors: string[],
  moreIssuesTemplate: string,
): string {
  const visibleErrors = errors.slice(0, 4).join(" ");
  const remainingCount = errors.length - 4;
  const suffix =
    remainingCount > 0 ? ` ${moreIssuesTemplate.replace("{count}", String(remainingCount))}` : "";

  return `${prefix}: ${visibleErrors}${suffix}`;
}
