import type {
  EFlowWorkspaceDocument,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  FullAIContext,
} from "../../types/engineeringFlow";
import type { EFlowAuditEvent } from "../../types/eflowAudit";
import { buildGraphTrustSummary } from "../../lib/trustSummary";
import { JsonExportPanel } from "../export/JsonExportPanel";

type EmptyInspectorProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
  showExport?: boolean;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  auditLog?: EFlowAuditEvent[];
  autosaveStatus?: string;
  onImportWorkspace?: (workspace: EFlowWorkspaceDocument) => void;
  onImportFullContext?: (context: FullAIContext) => void;
  onImportInput?: (input: EngineeringFlowInput) => void;
  onClearLocalWorkspace?: () => void;
};

export function EmptyInspector({
  input,
  graph,
  showExport = true,
  selectedNodeId = null,
  selectedEdgeId = null,
  auditLog = [],
  autosaveStatus,
  onImportWorkspace,
  onImportFullContext,
  onImportInput,
  onClearLocalWorkspace,
}: EmptyInspectorProps) {
  const trustSummary = graph ? buildGraphTrustSummary(graph) : null;

  return (
    <div className="empty-inspector">
      <section className="summary-panel">
        <p className="eyebrow">Project summary</p>
        <h2>{input.projectName}</h2>
        <p>{input.projectIntent || "No intent has been written yet."}</p>
        {trustSummary ? (
          <div className="summary-grid">
            <span>
              <strong>{trustSummary.totalNodes}</strong>
              Total nodes
            </span>
            <span>
              <strong>{trustSummary.confirmedNodes}</strong>
              Confirmed nodes
            </span>
            <span>
              <strong>{trustSummary.suggestedNodes}</strong>
              Suggested nodes
            </span>
            <span>
              <strong>{trustSummary.needsReviewNodes}</strong>
              Needs review nodes
            </span>
            <span>
              <strong>{trustSummary.totalEdges}</strong>
              Total edges
            </span>
            <span>
              <strong>{trustSummary.confirmedEdges}</strong>
              Confirmed edges
            </span>
            <span>
              <strong>{trustSummary.suggestedEdges}</strong>
              Suggested edges
            </span>
            <span>
              <strong>{trustSummary.rejectedEdges}</strong>
              Rejected edges
            </span>
            <span>
              <strong>{trustSummary.blockingQuestions}</strong>
              Blocking questions
            </span>
          </div>
        ) : null}
      </section>
      {showExport ? (
        <JsonExportPanel
          input={input}
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          auditLog={auditLog}
          autosaveStatus={autosaveStatus}
          onImportWorkspace={onImportWorkspace}
          onImportFullContext={onImportFullContext}
          onImportInput={onImportInput}
          onClearLocalWorkspace={onClearLocalWorkspace}
        />
      ) : null}
    </div>
  );
}
