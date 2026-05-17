import type {
  EFlowWorkspaceDocument,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  FullAIContext,
} from "../../types/engineeringFlow";
import { buildFullAIContext } from "../../lib/exportContext";
import { buildWorkspaceDocument } from "../../lib/workspacePersistence";
import { CopyJsonButton } from "./CopyJsonButton";
import { EFlowContextExportPanel } from "./EFlowContextExportPanel";
import { WorkspacePersistencePanel } from "./WorkspacePersistencePanel";

type JsonExportPanelProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  autosaveStatus?: string;
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
  autosaveStatus = "Autosave ready",
  onImportWorkspace,
  onImportFullContext,
  onImportInput,
  onClearLocalWorkspace,
}: JsonExportPanelProps) {
  const fullContext = buildFullAIContext(input, graph);
  const workspace = buildWorkspaceDocument({
    input,
    graph,
    selectedNodeId,
    selectedEdgeId,
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

  return (
    <div className="export-stack">
      <section className="export-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Export</p>
            <h2>AI-readable JSON</h2>
          </div>
        </div>
        <div className="export-actions">
          <CopyJsonButton label="Copy EngineeringFlowInput JSON" value={input} />
          <CopyJsonButton
            label="Copy EngineeringFlowGraph JSON"
            value={graph}
            disabled={!graph}
          />
          <CopyJsonButton label="Copy Full AI Context JSON" value={fullContext} />
        </div>
      </section>
      <EFlowContextExportPanel input={input} graph={graph} />
      {workspaceHandlers ? (
        <WorkspacePersistencePanel
          workspace={workspace}
          autosaveStatus={autosaveStatus}
          onImportWorkspace={workspaceHandlers.onImportWorkspace}
          onImportFullContext={workspaceHandlers.onImportFullContext}
          onImportInput={workspaceHandlers.onImportInput}
          onClearLocalWorkspace={workspaceHandlers.onClearLocalWorkspace}
        />
      ) : null}
    </div>
  );
}
