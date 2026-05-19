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
import { CollapsibleSection } from "../layout/CollapsibleSection";
import { LifecycleProgressSummary } from "../lifecycle/LifecycleProgressSummary";
import { ReviewPanel } from "../review/ReviewPanel";
import { useLanguage } from "../../lib/i18n/language-context";
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
  const { t } = useLanguage();
  const selectedNode = selectedNodeId
    ? graph?.nodes.find((node) => node.id === selectedNodeId) ?? null
    : null;
  const selectedEdge = selectedEdgeId
    ? graph?.edges.find((edge) => edge.id === selectedEdgeId) ?? null
    : null;

  if (graph) {
    const selectedItemMeta = selectedNode ? "Node" : selectedEdge ? "Edge" : "Project";
    const selectedItemSubtitle = selectedNode
      ? "Inspect and edit the selected graph node."
      : selectedEdge
        ? "Inspect and edit the selected relationship."
        : "Review the generated graph summary.";

    return (
      <div className="inspector-stack right-panel-stack">
        <CollapsibleSection
          title="Selected Item"
          subtitle={selectedItemSubtitle}
          meta={selectedItemMeta}
          defaultOpen
        >
          {selectedNode ? (
            <NodeInspector node={selectedNode} onChange={(patch) => onUpdateNode(selectedNode.id, patch)} />
          ) : selectedEdge ? (
            <EdgeInspector edge={selectedEdge} onChange={(patch) => onUpdateEdge(selectedEdge.id, patch)} />
          ) : (
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
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Review"
          subtitle="Confirm generated nodes and relationships."
          meta="Queue"
          defaultOpen
          tour={{
            id: "inspector-review",
            step: "5",
            title: t("tour.review.title"),
            body: t("tour.review.body"),
            position: "left",
          }}
        >
          <ReviewPanel
            compact={Boolean(selectedNode || selectedEdge)}
            graph={graph}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={onSelectNode}
            onSelectEdge={onSelectEdge}
            onUpdateNode={onUpdateNode}
            onUpdateEdge={onUpdateEdge}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Implementation Progress"
          subtitle="Lifecycle progress and manual context."
          meta="Live"
          defaultOpen
        >
          <LifecycleProgressSummary graph={graph} />
          <ManualContextSummary graph={graph} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Manual Editing"
          subtitle="Add missing graph nodes and relationships."
          meta="Local"
        >
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
        </CollapsibleSection>

        <CollapsibleSection
          title="Change History"
          subtitle="Local workspace audit history."
          meta={`${auditLog.length} events`}
        >
          <AuditLogPanel auditLog={auditLog} />
        </CollapsibleSection>

        <CollapsibleSection
          title="AI Interop"
          subtitle="Local command intake and AI-native context."
          meta="JSON"
          tour={{
            id: "ai-interop",
            step: "6",
            title: t("tour.aiInterop.title"),
            body: t("tour.aiInterop.body"),
            position: "left",
          }}
        >
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
            showJsonExports={false}
            showWorkspacePersistence={false}
            onImportWorkspace={onImportWorkspace}
            onImportFullContext={onImportFullContext}
            onImportInput={onImportInput}
            onClearLocalWorkspace={onClearLocalWorkspace}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Workspace / Export"
          subtitle="Workspace persistence and legacy JSON handoffs."
          meta="Files"
          tour={{
            id: "workspace-export",
            step: "7",
            title: t("tour.workspaceExport.title"),
            body: t("tour.workspaceExport.body"),
            position: "left",
          }}
        >
          <JsonExportPanel
            input={input}
            graph={graph}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            auditLog={auditLog}
            autosaveStatus={autosaveStatus}
            showEFlowContextExport={false}
            onImportWorkspace={onImportWorkspace}
            onImportFullContext={onImportFullContext}
            onImportInput={onImportInput}
            onClearLocalWorkspace={onClearLocalWorkspace}
          />
        </CollapsibleSection>
      </div>
    );
  }

  return (
    <div className="inspector-stack right-panel-stack">
      <CollapsibleSection
        title="Selected Item"
        subtitle="Project summary before graph generation."
        meta="Project"
        defaultOpen
        tour={{
          id: "inspector-review",
          step: "5",
          title: t("tour.review.title"),
          body: t("tour.review.body"),
          position: "left",
        }}
      >
        <EmptyInspector
          input={input}
          graph={graph}
          showExport={false}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          auditLog={auditLog}
          autosaveStatus={autosaveStatus}
          onImportWorkspace={onImportWorkspace}
          onImportFullContext={onImportFullContext}
          onImportInput={onImportInput}
          onClearLocalWorkspace={onClearLocalWorkspace}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Change History"
        subtitle="Local workspace audit history."
        meta={`${auditLog.length} events`}
      >
        <AuditLogPanel auditLog={auditLog} />
      </CollapsibleSection>

      <CollapsibleSection
        title="AI Interop"
        subtitle="Validate local commands and prepare AI context."
        meta="JSON"
        tour={{
          id: "ai-interop",
          step: "6",
          title: t("tour.aiInterop.title"),
          body: t("tour.aiInterop.body"),
          position: "left",
        }}
      >
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
          showJsonExports={false}
          showWorkspacePersistence={false}
          onImportWorkspace={onImportWorkspace}
          onImportFullContext={onImportFullContext}
          onImportInput={onImportInput}
          onClearLocalWorkspace={onClearLocalWorkspace}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Workspace / Export"
        subtitle="Import, restore, and export workspace JSON."
        meta="Files"
        tour={{
          id: "workspace-export",
          step: "7",
          title: t("tour.workspaceExport.title"),
          body: t("tour.workspaceExport.body"),
          position: "left",
        }}
      >
        <JsonExportPanel
          input={input}
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          auditLog={auditLog}
          autosaveStatus={autosaveStatus}
          showEFlowContextExport={false}
          onImportWorkspace={onImportWorkspace}
          onImportFullContext={onImportFullContext}
          onImportInput={onImportInput}
          onClearLocalWorkspace={onClearLocalWorkspace}
        />
      </CollapsibleSection>
    </div>
  );
}
