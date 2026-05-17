import { useMemo, useState } from "react";
import { buildEFlowContextExport } from "../../lib/buildEflowContextExport";
import type { EngineeringFlowGraph, EngineeringFlowInput } from "../../types/engineeringFlow";
import { CopyJsonButton } from "./CopyJsonButton";

type EFlowContextExportPanelProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
};

export function EFlowContextExportPanel({ input, graph }: EFlowContextExportPanelProps) {
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
    setMessage("AI-native context JSON downloaded.");
    window.setTimeout(() => setMessage(""), 1800);
  }

  return (
    <section className="eflow-context-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AI-Native Context Export</p>
          <h2>EFlow Context v0.1</h2>
        </div>
      </div>
      <p className="workspace-helper">
        Machine-readable project context for downstream AI agents. This is the preferred AI read
        format, distinct from visual exports.
      </p>

      {contextExport ? (
        <>
          <div className="summary-grid context-summary-grid">
            <span>
              <strong>{contextExport.schemaVersion}</strong>
              schema
            </span>
            <span>
              <strong>{contextExport.project.name}</strong>
              project
            </span>
            <span>
              <strong>{nodeCount}</strong>
              nodes
            </span>
            <span>
              <strong>{edgeCount}</strong>
              edges
            </span>
            <span>
              <strong>{blockingQuestionCount}</strong>
              blocking questions
            </span>
            <span>
              <strong>{completedNodeCount}</strong>
              completed nodes
            </span>
          </div>
          <p className="context-command-schema">
            Accepted command schema: <strong>{acceptedCommandSchema}</strong>
          </p>
          <div className="export-actions">
            <CopyJsonButton label="Copy AI Context JSON" value={contextExport} />
            <button className="button button-secondary" type="button" onClick={downloadContextJson}>
              Download AI Context JSON
            </button>
          </div>
          {message ? <p className="import-message import-success">{message}</p> : null}
        </>
      ) : (
        <p className="context-empty-note">
          Generate or import an engineering graph to export AI-native context.
        </p>
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
