import { useEffect, useState } from "react";
import { EngineeringFlowCanvas } from "./components/graph/EngineeringFlowCanvas";
import { StructuredInputPanel } from "./components/input/StructuredInputPanel";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { Workspace } from "./components/layout/Workspace";
import { InspectorPanel } from "./components/inspector/InspectorPanel";
import { emptyEngineeringFlowInput } from "./data/emptyEngineeringFlowInput";
import { todoThoughtUniverseExample } from "./data/todoThoughtUniverseExample";
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
      });
      saveWorkspaceToLocalStorage(workspace);
      setAutosaveStatus(`Local workspace saved ${formatTime(workspace.savedAt)}`);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [engineeringFlowInput, engineeringFlowGraph, selectedNodeId, selectedEdgeId]);

  function loadTodoThoughtUniverseExample() {
    setEngineeringFlowInput(cloneInput(todoThoughtUniverseExample));
    setEngineeringFlowGraph(null);
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
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
    setAutosaveStatus("Input imported. Graph not generated yet.");
  }

  function importWorkspaceDocument(workspace: EFlowWorkspaceDocument) {
    const selection = getValidWorkspaceSelection(workspace);
    setEngineeringFlowInput(cloneInput(workspace.engineeringFlowInput));
    setEngineeringFlowGraph(
      workspace.engineeringFlowGraph ? structuredClone(workspace.engineeringFlowGraph) : null,
    );
    setSelectedNodeId(selection.nodeId);
    setSelectedEdgeId(selection.edgeId);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
    saveWorkspaceToLocalStorage(workspace);
    setAutosaveStatus(`Imported workspace ${formatTime(workspace.savedAt)}`);
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
    setEngineeringFlowGraph((graph) => {
      if (!graph) return graph;

      return {
        ...graph,
        updatedAt: nowIso(),
        nodes: graph.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
      };
    });
  }

  function updateEdge(edgeId: string, patch: Partial<EngineeringEdge>) {
    setEngineeringFlowGraph((graph) => {
      if (!graph) return graph;

      return {
        ...graph,
        updatedAt: nowIso(),
        edges: graph.edges.map((edge) => (edge.id === edgeId ? { ...edge, ...patch } : edge)),
      };
    });
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
            autosaveStatus={autosaveStatus}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
            onUpdateNode={updateNode}
            onUpdateEdge={updateEdge}
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

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
