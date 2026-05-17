import { useEffect, useState } from "react";
import { EngineeringFlowCanvas } from "./components/graph/EngineeringFlowCanvas";
import { StructuredInputPanel } from "./components/input/StructuredInputPanel";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { Workspace } from "./components/layout/Workspace";
import { InspectorPanel } from "./components/inspector/InspectorPanel";
import { emptyEngineeringFlowInput } from "./data/emptyEngineeringFlowInput";
import { todoThoughtUniverseExample } from "./data/todoThoughtUniverseExample";
import {
  appendAuditEvent,
  createAuditEvent,
  trimAuditLog,
} from "./lib/auditLog";
import { nowIso } from "./lib/dates";
import { generateEngineeringFlow } from "./lib/generateEngineeringFlow";
import {
  buildWorkspaceDocument,
  clearWorkspaceFromLocalStorage,
  isWorkspaceLocalStorageAvailable,
  loadWorkspaceFromLocalStorage,
  saveWorkspaceToLocalStorage,
} from "./lib/workspacePersistence";
import type {
  EFlowWorkspaceDocument,
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNode,
  FullAIContext,
} from "./types/engineeringFlow";
import type { EFlowAuditEvent } from "./types/eflowAudit";

function cloneInput(input: EngineeringFlowInput): EngineeringFlowInput {
  return structuredClone(input);
}

export default function App() {
  const [restoredWorkspace] = useState(() => loadWorkspaceFromLocalStorage());
  const restoredSelection = getValidWorkspaceSelection(restoredWorkspace);
  const [engineeringFlowInput, setEngineeringFlowInput] = useState<EngineeringFlowInput>(() =>
    cloneInput(restoredWorkspace?.engineeringFlowInput ?? emptyEngineeringFlowInput),
  );
  const [engineeringFlowGraph, setEngineeringFlowGraph] = useState<EngineeringFlowGraph | null>(() =>
    restoredWorkspace?.engineeringFlowGraph ? structuredClone(restoredWorkspace.engineeringFlowGraph) : null,
  );
  const [auditLog, setAuditLog] = useState<EFlowAuditEvent[]>(() =>
    restoredWorkspace?.auditLog ? trimAuditLog(structuredClone(restoredWorkspace.auditLog)) : [],
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(restoredSelection.nodeId);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(restoredSelection.edgeId);
  const [inputDirtySinceGeneration, setInputDirtySinceGeneration] = useState(false);
  const [showRegenerationConfirm, setShowRegenerationConfirm] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState(() => {
    if (!isWorkspaceLocalStorageAvailable()) return "Autosave unavailable";
    if (restoredWorkspace) return `Restored local workspace ${formatTime(restoredWorkspace.savedAt)}`;
    return "Autosave ready";
  });

  useEffect(() => {
    if (!isWorkspaceLocalStorageAvailable()) {
      setAutosaveStatus("Autosave unavailable");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const workspace = buildWorkspaceDocument({
        input: engineeringFlowInput,
        graph: engineeringFlowGraph,
        selectedNodeId,
        selectedEdgeId,
        auditLog,
      });
      saveWorkspaceToLocalStorage(workspace);
      setAutosaveStatus(`Local workspace saved ${formatTime(workspace.savedAt)}`);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [engineeringFlowInput, engineeringFlowGraph, selectedNodeId, selectedEdgeId, auditLog]);

  function loadTodoThoughtUniverseExample() {
    setEngineeringFlowInput(cloneInput(todoThoughtUniverseExample));
    setEngineeringFlowGraph(null);
    setAuditLog([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
  }

  function updateInput(nextInput: EngineeringFlowInput) {
    setEngineeringFlowInput({
      ...nextInput,
      sourceType: nextInput.sourceType === "example_seed" ? "manual_edit" : nextInput.sourceType,
      updatedAt: nowIso(),
    });
    if (engineeringFlowGraph) {
      setInputDirtySinceGeneration(true);
    }
  }

  function importEngineeringFlowInput(nextInput: EngineeringFlowInput) {
    setEngineeringFlowInput({
      ...cloneInput(nextInput),
      updatedAt: nowIso(),
    });
    setEngineeringFlowGraph(null);
    setAuditLog([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
    setAutosaveStatus("Input imported. Graph not generated yet.");
  }

  function importWorkspaceDocument(workspace: EFlowWorkspaceDocument) {
    const normalizedAuditLog = trimAuditLog(workspace.auditLog ?? []);
    const normalizedWorkspace: EFlowWorkspaceDocument = {
      ...workspace,
      auditLog: normalizedAuditLog,
    };
    const selection = getValidWorkspaceSelection(workspace);
    setEngineeringFlowInput(cloneInput(normalizedWorkspace.engineeringFlowInput));
    setEngineeringFlowGraph(
      normalizedWorkspace.engineeringFlowGraph
        ? structuredClone(normalizedWorkspace.engineeringFlowGraph)
        : null,
    );
    setAuditLog(normalizedAuditLog);
    setSelectedNodeId(selection.nodeId);
    setSelectedEdgeId(selection.edgeId);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
    saveWorkspaceToLocalStorage(normalizedWorkspace);
    setAutosaveStatus(`Imported workspace ${formatTime(normalizedWorkspace.savedAt)}`);
  }

  function importFullAIContext(context: FullAIContext) {
    const workspace = buildWorkspaceDocument({
      input: context.engineeringFlowInput,
      graph: context.engineeringFlowGraph,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    importWorkspaceDocument(workspace);
    setAutosaveStatus("Full AI Context imported as workspace");
  }

  function clearLocalWorkspace() {
    const confirmed = window.confirm(
      "Clear the locally saved EFlow workspace? Current open workspace will stay unchanged.",
    );
    if (!confirmed) return;

    clearWorkspaceFromLocalStorage();
    setAutosaveStatus("Local saved workspace cleared. Current open workspace is unchanged.");
  }

  function replaceGraph() {
    setEngineeringFlowGraph(generateEngineeringFlow(engineeringFlowInput));
    setAuditLog([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
  }

  function generateGraph() {
    if (engineeringFlowGraph && inputDirtySinceGeneration) {
      setShowRegenerationConfirm(true);
      return;
    }

    replaceGraph();
  }

  function cancelRegeneration() {
    setShowRegenerationConfirm(false);
  }

  function updateNode(nodeId: string, patch: Partial<EngineeringNode>) {
    if (!engineeringFlowGraph) return;
    const currentNode = engineeringFlowGraph.nodes.find((node) => node.id === nodeId);
    if (!currentNode) return;

    const nextNode = { ...currentNode, ...patch };
    setEngineeringFlowGraph({
      ...engineeringFlowGraph,
      updatedAt: nowIso(),
      nodes: engineeringFlowGraph.nodes.map((node) =>
        node.id === nodeId ? nextNode : node,
      ),
    });
    recordAuditEvents(buildNodeAuditEvents(currentNode, nextNode, patch));
  }

  function updateEdge(edgeId: string, patch: Partial<EngineeringEdge>) {
    if (!engineeringFlowGraph) return;
    const currentEdge = engineeringFlowGraph.edges.find((edge) => edge.id === edgeId);
    if (!currentEdge) return;

    const nextEdge = { ...currentEdge, ...patch };
    setEngineeringFlowGraph({
      ...engineeringFlowGraph,
      updatedAt: nowIso(),
      edges: engineeringFlowGraph.edges.map((edge) =>
        edge.id === edgeId ? nextEdge : edge,
      ),
    });
    recordAuditEvents(buildEdgeAuditEvents(currentEdge, nextEdge, patch));
  }

  function replaceGraphFromCommand(nextGraph: EngineeringFlowGraph) {
    setEngineeringFlowGraph(nextGraph);
  }

  function recordAuditEvent(event: EFlowAuditEvent) {
    setAuditLog((currentAuditLog) => appendAuditEvent(currentAuditLog, event));
  }

  function recordAuditEvents(events: EFlowAuditEvent[]) {
    if (events.length === 0) return;

    setAuditLog((currentAuditLog) =>
      events.reduce(
        (nextAuditLog, event) => appendAuditEvent(nextAuditLog, event),
        currentAuditLog,
      ),
    );
  }

  function updateNodePosition(nodeId: string, position: { x: number; y: number }) {
    updateNode(nodeId, { position });
  }

  function selectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }

  function selectEdge(edgeId: string) {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }

  function clearSelection() {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }

  return (
    <AppShell
      topBar={
        <TopBar
          input={engineeringFlowInput}
          graph={engineeringFlowGraph}
          inputDirtySinceGeneration={inputDirtySinceGeneration}
          showRegenerationConfirm={showRegenerationConfirm}
          autosaveStatus={autosaveStatus}
          onLoadExample={loadTodoThoughtUniverseExample}
          onGenerateGraph={generateGraph}
          onReplaceGraph={replaceGraph}
          onCancelRegeneration={cancelRegeneration}
        />
      }
    >
      <Workspace
        left={
          <StructuredInputPanel
            input={engineeringFlowInput}
            inputDirtySinceGeneration={inputDirtySinceGeneration}
            onChange={updateInput}
            onImport={importEngineeringFlowInput}
          />
        }
        center={
          <EngineeringFlowCanvas
            graph={engineeringFlowGraph}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
            onClearSelection={clearSelection}
            onNodePositionChange={updateNodePosition}
          />
        }
        right={
          <InspectorPanel
            input={engineeringFlowInput}
            graph={engineeringFlowGraph}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            auditLog={auditLog}
            autosaveStatus={autosaveStatus}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
            onUpdateNode={updateNode}
            onUpdateEdge={updateEdge}
            onReplaceGraph={replaceGraphFromCommand}
            onRecordAuditEvent={recordAuditEvent}
            onImportWorkspace={importWorkspaceDocument}
            onImportFullContext={importFullAIContext}
            onImportInput={importEngineeringFlowInput}
            onClearLocalWorkspace={clearLocalWorkspace}
          />
        }
      />
    </AppShell>
  );
}

function getValidWorkspaceSelection(workspace: EFlowWorkspaceDocument | null): {
  nodeId: string | null;
  edgeId: string | null;
} {
  const graph = workspace?.engineeringFlowGraph;
  if (!workspace || !graph) {
    return { nodeId: null, edgeId: null };
  }

  if (workspace.selectedNodeId && graph.nodes.some((node) => node.id === workspace.selectedNodeId)) {
    return { nodeId: workspace.selectedNodeId, edgeId: null };
  }

  if (workspace.selectedEdgeId && graph.edges.some((edge) => edge.id === workspace.selectedEdgeId)) {
    return { nodeId: null, edgeId: workspace.selectedEdgeId };
  }

  return { nodeId: null, edgeId: null };
}

function buildNodeAuditEvents(
  currentNode: EngineeringNode,
  nextNode: EngineeringNode,
  patch: Partial<EngineeringNode>,
): EFlowAuditEvent[] {
  const events: EFlowAuditEvent[] = [];

  if (patch.status !== undefined && currentNode.status !== nextNode.status) {
    events.push(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "node_review_status_changed",
        summary: `Changed node "${currentNode.title}" review status from ${currentNode.status} to ${nextNode.status}.`,
        target: {
          type: "node",
          id: currentNode.id,
        },
        before: {
          reviewStatus: currentNode.status,
        },
        after: {
          reviewStatus: nextNode.status,
        },
        metadata: {
          field: "status",
          legacyFieldMeaning: "review_status",
        },
      }),
    );
  }

  const currentLifecycleStatus = currentNode.lifecycleStatus ?? "planned";
  const nextLifecycleStatus = nextNode.lifecycleStatus ?? "planned";
  if (
    patch.lifecycleStatus !== undefined &&
    currentLifecycleStatus !== nextLifecycleStatus
  ) {
    events.push(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "node_lifecycle_status_changed",
        summary: `Changed node "${currentNode.title}" lifecycle status from ${currentLifecycleStatus} to ${nextLifecycleStatus}.`,
        target: {
          type: "node",
          id: currentNode.id,
        },
        before: {
          lifecycleStatus: currentLifecycleStatus,
        },
        after: {
          lifecycleStatus: nextLifecycleStatus,
        },
        metadata: {
          field: "lifecycleStatus",
        },
      }),
    );
  }

  return events;
}

function buildEdgeAuditEvents(
  currentEdge: EngineeringEdge,
  nextEdge: EngineeringEdge,
  patch: Partial<EngineeringEdge>,
): EFlowAuditEvent[] {
  const events: EFlowAuditEvent[] = [];

  if (patch.status !== undefined && currentEdge.status !== nextEdge.status) {
    events.push(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "edge_review_status_changed",
        summary: `Changed edge "${currentEdge.id}" review status from ${currentEdge.status} to ${nextEdge.status}.`,
        target: {
          type: "edge",
          id: currentEdge.id,
        },
        before: {
          reviewStatus: currentEdge.status,
        },
        after: {
          reviewStatus: nextEdge.status,
        },
        metadata: {
          field: "status",
          legacyFieldMeaning: "review_status",
        },
      }),
    );
  }

  const currentLifecycleStatus = currentEdge.lifecycleStatus ?? "planned";
  const nextLifecycleStatus = nextEdge.lifecycleStatus ?? "planned";
  if (
    patch.lifecycleStatus !== undefined &&
    currentLifecycleStatus !== nextLifecycleStatus
  ) {
    events.push(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "edge_lifecycle_status_changed",
        summary: `Changed edge "${currentEdge.id}" lifecycle status from ${currentLifecycleStatus} to ${nextLifecycleStatus}.`,
        target: {
          type: "edge",
          id: currentEdge.id,
        },
        before: {
          lifecycleStatus: currentLifecycleStatus,
        },
        after: {
          lifecycleStatus: nextLifecycleStatus,
        },
        metadata: {
          field: "lifecycleStatus",
        },
      }),
    );
  }

  return events;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
