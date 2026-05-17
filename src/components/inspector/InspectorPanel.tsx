import type {
  EFlowWorkspaceDocument,
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNode,
  FullAIContext,
} from "../../types/engineeringFlow";
import { LocalCommandImportPanel } from "../command/LocalCommandImportPanel";
import { JsonExportPanel } from "../export/JsonExportPanel";
import { AddManualEdgePanel } from "../graphEditing/AddManualEdgePanel";
import { AddManualNodePanel } from "../graphEditing/AddManualNodePanel";
import { LifecycleProgressSummary } from "../lifecycle/LifecycleProgressSummary";
import { ReviewPanel } from "../review/ReviewPanel";
import { EdgeInspector } from "./EdgeInspector";
import { EmptyInspector } from "./EmptyInspector";
import { NodeInspector } from "./NodeInspector";

type InspectorPanelProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  autosaveStatus: string;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onUpdateNode: (nodeId: string, patch: Partial<EngineeringNode>) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<EngineeringEdge>) => void;
  onReplaceGraph: (graph: EngineeringFlowGraph) => void;
  onImportWorkspace: (workspace: EFlowWorkspaceDocument) => void;
  onImportFullContext: (context: FullAIContext) => void;
  onImportInput: (input: EngineeringFlowInput) => void;
  onClearLocalWorkspace: () => void;
};

export function InspectorPanel({
  input,
  graph,
  selectedNodeId,
  selectedEdgeId,
  autosaveStatus,
  onSelectNode,
  onSelectEdge,
  onUpdateNode,
  onUpdateEdge,
  onReplaceGraph,
  onImportWorkspace,
  onImportFullContext,
  onImportInput,
  onClearLocalWorkspace,
}: InspectorPanelProps) {
  const selectedNode = selectedNodeId
    ? graph?.nodes.find((node) => node.id === selectedNodeId) ?? null
    : null;
  const selectedEdge = selectedEdgeId
    ? graph?.edges.find((edge) => edge.id === selectedEdgeId) ?? null
    : null;

  if (selectedNode && graph) {
    return (
      <div className="inspector-stack">
        <NodeInspector node={selectedNode} onChange={(patch) => onUpdateNode(selectedNode.id, patch)} />
        <LifecycleProgressSummary graph={graph} />
        <AddManualNodePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectNode={onSelectNode}
        />
        <AddManualEdgePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectEdge={onSelectEdge}
        />
        <ReviewPanel
          compact
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onSelectNode={onSelectNode}
          onSelectEdge={onSelectEdge}
          onUpdateNode={onUpdateNode}
          onUpdateEdge={onUpdateEdge}
        />
        <JsonExportPanel
          input={input}
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          autosaveStatus={autosaveStatus}
          onImportWorkspace={onImportWorkspace}
          onImportFullContext={onImportFullContext}
          onImportInput={onImportInput}
          onClearLocalWorkspace={onClearLocalWorkspace}
        />
      </div>
    );
  }

  if (selectedEdge && graph) {
    return (
      <div className="inspector-stack">
        <EdgeInspector edge={selectedEdge} onChange={(patch) => onUpdateEdge(selectedEdge.id, patch)} />
        <LifecycleProgressSummary graph={graph} />
        <AddManualNodePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectNode={onSelectNode}
        />
        <AddManualEdgePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectEdge={onSelectEdge}
        />
        <ReviewPanel
          compact
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onSelectNode={onSelectNode}
          onSelectEdge={onSelectEdge}
          onUpdateNode={onUpdateNode}
          onUpdateEdge={onUpdateEdge}
        />
        <JsonExportPanel
          input={input}
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          autosaveStatus={autosaveStatus}
          onImportWorkspace={onImportWorkspace}
          onImportFullContext={onImportFullContext}
          onImportInput={onImportInput}
          onClearLocalWorkspace={onClearLocalWorkspace}
        />
      </div>
    );
  }

  if (graph) {
    return (
      <div className="inspector-stack">
        <EmptyInspector
          input={input}
          graph={graph}
          showExport={false}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          autosaveStatus={autosaveStatus}
          onImportWorkspace={onImportWorkspace}
          onImportFullContext={onImportFullContext}
          onImportInput={onImportInput}
          onClearLocalWorkspace={onClearLocalWorkspace}
        />
        <LifecycleProgressSummary graph={graph} />
        <AddManualNodePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectNode={onSelectNode}
        />
        <AddManualEdgePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectEdge={onSelectEdge}
        />
        <ReviewPanel
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onSelectNode={onSelectNode}
          onSelectEdge={onSelectEdge}
          onUpdateNode={onUpdateNode}
          onUpdateEdge={onUpdateEdge}
        />
        <LocalCommandImportPanel graph={graph} onApplyGraph={onReplaceGraph} />
        <JsonExportPanel
          input={input}
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          autosaveStatus={autosaveStatus}
          onImportWorkspace={onImportWorkspace}
          onImportFullContext={onImportFullContext}
          onImportInput={onImportInput}
          onClearLocalWorkspace={onClearLocalWorkspace}
        />
      </div>
    );
  }

  return (
    <div className="inspector-stack">
      <EmptyInspector
        input={input}
        graph={graph}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        autosaveStatus={autosaveStatus}
        onImportWorkspace={onImportWorkspace}
        onImportFullContext={onImportFullContext}
        onImportInput={onImportInput}
        onClearLocalWorkspace={onClearLocalWorkspace}
      />
      <LocalCommandImportPanel graph={graph} onApplyGraph={onReplaceGraph} />
    </div>
  );
}
