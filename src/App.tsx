import { useState } from "react";
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
import type {
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNode,
} from "./types/engineeringFlow";

function cloneInput(input: EngineeringFlowInput): EngineeringFlowInput {
  return structuredClone(input);
}

export default function App() {
  const [engineeringFlowInput, setEngineeringFlowInput] = useState<EngineeringFlowInput>(() =>
    cloneInput(emptyEngineeringFlowInput),
  );
  const [engineeringFlowGraph, setEngineeringFlowGraph] = useState<EngineeringFlowGraph | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inputDirtySinceGeneration, setInputDirtySinceGeneration] = useState(false);
  const [showRegenerationConfirm, setShowRegenerationConfirm] = useState(false);

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
    if (engineeringFlowGraph) {
      setInputDirtySinceGeneration(true);
    }
    setShowRegenerationConfirm(false);
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
            onUpdateNode={updateNode}
            onUpdateEdge={updateEdge}
          />
        }
      />
    </AppShell>
  );
}
