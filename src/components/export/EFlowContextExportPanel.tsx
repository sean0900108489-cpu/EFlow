import { useMemo, useState } from "react";
import { useLanguage } from "../../lib/i18n/language-context";
import { buildEFlowContextExport } from "../../lib/buildEflowContextExport";
import type { EngineeringFlowGraph, EngineeringFlowInput } from "../../types/engineeringFlow";
import { CopyJsonButton } from "./CopyJsonButton";

type EFlowContextExportPanelProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
};

export function EFlowContextExportPanel({ input, graph }: EFlowContextExportPanelProps) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const contextExport = useMemo(
    () =>
      graph
        ? buildEFlowContextExport({
            engineeringFlowInput: input,
            engineeringFlowGraph: graph,
          })
        : null,
    [graph, input],
  );

  const nodeCount = contextExport?.graph.nodes.length ?? 0;
  const edgeCount = contextExport?.graph.edges.length ?? 0;
  const blockingQuestionCount = contextExport?.blockingQuestions.length ?? 0;
  const completedNodeCount =
    contextExport?.progressSummary.nodesByLifecycle.completed.length ?? 0;
  const acceptedCommandSchema =
    contextExport?.commandInterface.acceptedSchemaVersions.join(", ") ?? "eflow-command/v0.1";
  const commandWorkflow =
    contextExport?.commandInterface.localWorkflow
      .map((step) => formatWorkflowStep(step.step, t))
      .join(" -> ") ?? t("export.aiContext.defaultWorkflow");

  function downloadContextJson() {
    if (!contextExport) return;

    const json = JSON.stringify(contextExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = makeContextFilename(input.projectName || graph?.title || input.id);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage(t("export.aiContext.status.downloaded"));
    window.setTimeout(() => setMessage(""), 1800);
  }

  return (
    <section className="eflow-context-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("export.aiContext.eyebrow")}</p>
          <h2>{t("export.aiContext.title")}</h2>
        </div>
      </div>
      <p className="workspace-helper">{t("export.aiContext.helper")}</p>

      {contextExport ? (
        <>
          <div className="summary-grid context-summary-grid">
            <span>
              <strong>{contextExport.schemaVersion}</strong>
              {t("export.aiContext.meta.schema")}
            </span>
            <span>
              <strong>{contextExport.project.name}</strong>
              {t("export.aiContext.meta.project")}
            </span>
            <span>
              <strong>{nodeCount}</strong>
              {t("export.aiContext.meta.nodes")}
            </span>
            <span>
              <strong>{edgeCount}</strong>
              {t("export.aiContext.meta.edges")}
            </span>
            <span>
              <strong>{blockingQuestionCount}</strong>
              {t("export.aiContext.meta.blockingQuestions")}
            </span>
            <span>
              <strong>{completedNodeCount}</strong>
              {t("export.aiContext.meta.completedNodes")}
            </span>
          </div>
          <p className="context-command-schema">
            {t("export.aiContext.acceptedCommandSchema")} <strong>{acceptedCommandSchema}</strong>
          </p>
          <p className="context-interop-note">
            {t("export.aiContext.interopNote", { workflow: commandWorkflow })}
          </p>
          <div className="export-actions">
            <CopyJsonButton label={t("export.aiContext.copyJson")} value={contextExport} />
            <button className="button button-secondary" type="button" onClick={downloadContextJson}>
              {t("export.aiContext.downloadJson")}
            </button>
          </div>
          {message ? <p className="import-message import-success">{message}</p> : null}
        </>
      ) : (
        <p className="context-empty-note">{t("export.aiContext.empty")}</p>
      )}
    </section>
  );
}

function makeContextFilename(projectName: string): string {
  const safeName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return `eflow-context-${safeName || "project"}.json`;
}

function formatWorkflowStep(step: string, translate: (key: "commandImport.actions.dryRun") => string): string {
  if (step === "dry_run") return translate("commandImport.actions.dryRun");
  return step.charAt(0).toUpperCase() + step.slice(1);
}
