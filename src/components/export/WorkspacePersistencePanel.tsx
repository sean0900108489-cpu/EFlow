import { useMemo, useState } from "react";
import type {
  EFlowWorkspaceDocument,
  EngineeringFlowInput,
  FullAIContext,
} from "../../types/engineeringFlow";
import { makeWorkspaceFilename } from "../../lib/workspacePersistence";
import {
  isEngineeringFlowInput,
  isFullAIContext,
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
    setMessage({ type: "success", text: "Workspace JSON downloaded." });
  }

  function importWorkspaceJson() {
    try {
      const parsed = JSON.parse(importText) as unknown;
      const parsedRecord =
        typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
      if (!parsedRecord) {
        throw new Error("Unsupported schemaVersion.");
      }

      const schemaVersion = parsedRecord.schemaVersion;

      if (schemaVersion === "eflow-workspace/v0.3") {
        const workspaceValidation = validateEFlowWorkspaceDocument(parsed);
        if (!workspaceValidation.ok) {
          throw new Error(formatValidationErrors("Workspace import rejected", workspaceValidation.errors));
        }

        onImportWorkspace(parsed as EFlowWorkspaceDocument);
        setMessage({ type: "success", text: "Workspace JSON imported." });
        return;
      }

      if (schemaVersion === "engineering-flow-full-context/v0") {
        if (!isFullAIContext(parsed)) {
          throw new Error("Full AI Context is missing valid input or graph data.");
        }

        onImportFullContext(parsed);
        setMessage({ type: "success", text: "Full AI Context imported as an editable workspace." });
        return;
      }

      if (schemaVersion === "engineering-flow-input/v0") {
        if (!isEngineeringFlowInput(parsed)) {
          throw new Error("EngineeringFlowInput JSON is missing required fields.");
        }

        onImportInput(parsed);
        setMessage({
          type: "success",
          text: "EngineeringFlowInput imported. Generate Engineering Flow when ready.",
        });
        return;
      }

      throw new Error("Unsupported schemaVersion.");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Invalid JSON.",
      });
    }
  }

  return (
    <section className="workspace-persistence-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>Resume locally</h2>
        </div>
        <span className="status-indicator status-ok">{autosaveStatus}</span>
      </div>
      <p className="workspace-helper">
        Workspace JSON restores EFlow editing and review state. Full AI Context remains the AI
        handoff format.
      </p>
      <div className="export-actions">
        <CopyJsonButton label="Copy Workspace JSON" value={workspace} />
        <button className="button button-secondary" type="button" onClick={downloadWorkspaceJson}>
          Download Workspace JSON
        </button>
      </div>
      <div className="workspace-import-box">
        <div className="section-header">
          <div>
            <h3>Import workspace / context</h3>
            <p>Paste Workspace JSON, Full AI Context, or EngineeringFlowInput</p>
          </div>
          <button className="mini-button" type="button" onClick={importWorkspaceJson}>
            Import
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
        Clear local workspace
      </button>
    </section>
  );
}

function formatValidationErrors(prefix: string, errors: string[]): string {
  const visibleErrors = errors.slice(0, 4).join(" ");
  const remainingCount = errors.length - 4;
  const suffix = remainingCount > 0 ? ` ${remainingCount} more issue${remainingCount === 1 ? "" : "s"}.` : "";

  return `${prefix}: ${visibleErrors}${suffix}`;
}
