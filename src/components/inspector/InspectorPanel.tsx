import type {
  EFlowWorkspaceDocument,
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNode,
  FullAIContext,
} from "../../types/engineeringFlow";
import type { EFlowAuditEvent } from "../../types/eflowAudit";
import { AuditLogPanel } from "../audit/AuditLogPanel";
import { LocalCommandImportPanel } from "../command/LocalCommandImportPanel";
import { JsonExportPanel } from "../export/JsonExportPanel";
import { AddManualEdgePanel } from "../graphEditing/AddManualEdgePanel";
import { AddManualNodePanel } from "../graphEditing/AddManualNodePanel";
import { ManualContextSummary } from "../graphEditing/ManualContextSummary";
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
  auditLog: EFlowAuditEvent[];
  autosaveStatus: string;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onUpdateNode: (nodeId: string, patch: Partial<EngineeringNode>) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<EngineeringEdge>) => void;
  onReplaceGraph: (graph: EngineeringFlowGraph) => void;
  onRecordAuditEvent: (event: EFlowAuditEvent) => void;
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
  auditLog,
  autosaveStatus,
  onSelectNode,
  onSelectEdge,
  onUpdateNode,
  onUpdateEdge,
  onReplaceGraph,
  onRecordAuditEvent,
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
        <ManualContextSummary graph={graph} />
        <AuditLogPanel auditLog={auditLog} />
        <AddManualNodePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectNode={onSelectNode}
          onRecordAuditEvent={onRecordAuditEvent}
        />
        <AddManualEdgePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectEdge={onSelectEdge}
          onRecordAuditEvent={onRecordAuditEvent}
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
          auditLog={auditLog}
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
        <ManualContextSummary graph={graph} />
        <AuditLogPanel auditLog={auditLog} />
        <AddManualNodePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectNode={onSelectNode}
          onRecordAuditEvent={onRecordAuditEvent}
        />
        <AddManualEdgePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectEdge={onSelectEdge}
          onRecordAuditEvent={onRecordAuditEvent}
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
          auditLog={auditLog}
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
        <ManualContextSummary graph={graph} />
        <AuditLogPanel auditLog={auditLog} />
        <AddManualNodePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectNode={onSelectNode}
          onRecordAuditEvent={onRecordAuditEvent}
        />
        <AddManualEdgePanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onSelectEdge={onSelectEdge}
          onRecordAuditEvent={onRecordAuditEvent}
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
        <LocalCommandImportPanel
          graph={graph}
          onApplyGraph={onReplaceGraph}
          onRecordAuditEvent={onRecordAuditEvent}
        />
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
        auditLog={auditLog}
        autosaveStatus={autosaveStatus}
        onImportWorkspace={onImportWorkspace}
        onImportFullContext={onImportFullContext}
        onImportInput={onImportInput}
        onClearLocalWorkspace={onClearLocalWorkspace}
      />
      <AuditLogPanel auditLog={auditLog} />
      <LocalCommandImportPanel
        graph={graph}
        onApplyGraph={onReplaceGraph}
        onRecordAuditEvent={onRecordAuditEvent}
      />
    </div>
  );
}
