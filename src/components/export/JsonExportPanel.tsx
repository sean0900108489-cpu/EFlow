import type {
  EFlowWorkspaceDocument,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  FullAIContext,
} from "../../types/engineeringFlow";
import type { EFlowAuditEvent } from "../../types/eflowAudit";
import { buildFullAIContext } from "../../lib/exportContext";
import { buildWorkspaceDocument } from "../../lib/workspacePersistence";
import { useLanguage } from "../../lib/i18n/language-context";
import { CopyJsonButton } from "./CopyJsonButton";
import { EFlowContextExportPanel } from "./EFlowContextExportPanel";
import { WorkspacePersistencePanel } from "./WorkspacePersistencePanel";

type JsonExportPanelProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  auditLog?: EFlowAuditEvent[];
  autosaveStatus?: string;
  showJsonExports?: boolean;
  showEFlowContextExport?: boolean;
  showWorkspacePersistence?: boolean;
  onImportWorkspace?: (workspace: EFlowWorkspaceDocument) => void;
  onImportFullContext?: (context: FullAIContext) => void;
  onImportInput?: (input: EngineeringFlowInput) => void;
  onClearLocalWorkspace?: () => void;
};

export function JsonExportPanel({
  input,
  graph,
  selectedNodeId = null,
  selectedEdgeId = null,
  auditLog = [],
  autosaveStatus,
  showJsonExports = true,
  showEFlowContextExport = true,
  showWorkspacePersistence = true,
  onImportWorkspace,
  onImportFullContext,
  onImportInput,
  onClearLocalWorkspace,
}: JsonExportPanelProps) {
  const { t } = useLanguage();
  const fullContext = buildFullAIContext(input, graph);
  const displayedAutosaveStatus = autosaveStatus ?? t("app.autosave.ready");
  const workspace = buildWorkspaceDocument({
    input,
    graph,
    selectedNodeId,
    selectedEdgeId,
    auditLog,
  });
  const workspaceHandlers =
    onImportWorkspace && onImportFullContext && onImportInput && onClearLocalWorkspace
      ? {
          onImportWorkspace,
          onImportFullContext,
          onImportInput,
          onClearLocalWorkspace,
        }
      : null;
  const shouldShowWorkspacePersistence = showWorkspacePersistence && workspaceHandlers !== null;

  if (!showJsonExports && !showEFlowContextExport && !shouldShowWorkspacePersistence) {
    return null;
  }

  return (
    <div className="export-stack">
      {showJsonExports ? (
        <section className="export-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t("export.json.eyebrow")}</p>
              <h2>{t("export.json.title")}</h2>
            </div>
          </div>
          <div className="export-actions">
            <CopyJsonButton label={t("export.json.copyInput")} value={input} />
            <CopyJsonButton
              label={t("export.json.copyGraph")}
              value={graph}
              disabled={!graph}
            />
            <CopyJsonButton label={t("export.json.copyFullContext")} value={fullContext} />
          </div>
        </section>
      ) : null}
      {showEFlowContextExport ? <EFlowContextExportPanel input={input} graph={graph} /> : null}
      {shouldShowWorkspacePersistence && workspaceHandlers ? (
        <WorkspacePersistencePanel
          workspace={workspace}
          autosaveStatus={displayedAutosaveStatus}
          onImportWorkspace={workspaceHandlers.onImportWorkspace}
          onImportFullContext={workspaceHandlers.onImportFullContext}
          onImportInput={workspaceHandlers.onImportInput}
          onClearLocalWorkspace={workspaceHandlers.onClearLocalWorkspace}
        />
      ) : null}
    </div>
  );
}
