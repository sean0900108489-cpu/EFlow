import type {
  EFlowWorkspaceDocument,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  FullAIContext,
} from "../../types/engineeringFlow";
import type { EFlowAuditEvent } from "../../types/eflowAudit";
import { buildGraphTrustSummary } from "../../lib/trustSummary";
import { useLanguage } from "../../lib/i18n/language-context";
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
  const { t } = useLanguage();
  const trustSummary = graph ? buildGraphTrustSummary(graph) : null;

  return (
    <div className="empty-inspector">
      <section className="summary-panel">
        <p className="eyebrow">{t("inspector.empty.eyebrow")}</p>
        <h2>{input.projectName}</h2>
        <p>{input.projectIntent || t("inspector.empty.noIntent")}</p>
        {trustSummary ? (
          <div className="summary-grid">
            <span>
              <strong>{trustSummary.totalNodes}</strong>
              {t("inspector.empty.totalNodes")}
            </span>
            <span>
              <strong>{trustSummary.confirmedNodes}</strong>
              {t("inspector.empty.confirmedNodes")}
            </span>
            <span>
              <strong>{trustSummary.suggestedNodes}</strong>
              {t("inspector.empty.suggestedNodes")}
            </span>
            <span>
              <strong>{trustSummary.needsReviewNodes}</strong>
              {t("inspector.empty.needsReviewNodes")}
            </span>
            <span>
              <strong>{trustSummary.totalEdges}</strong>
              {t("inspector.empty.totalEdges")}
            </span>
            <span>
              <strong>{trustSummary.confirmedEdges}</strong>
              {t("inspector.empty.confirmedEdges")}
            </span>
            <span>
              <strong>{trustSummary.suggestedEdges}</strong>
              {t("inspector.empty.suggestedEdges")}
            </span>
            <span>
              <strong>{trustSummary.rejectedEdges}</strong>
              {t("inspector.empty.rejectedEdges")}
            </span>
            <span>
              <strong>{trustSummary.blockingQuestions}</strong>
              {t("inspector.empty.blockingQuestions")}
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
