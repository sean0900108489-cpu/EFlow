import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type EdgeMouseHandler,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import { useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { EngineeringFlowGraph } from "../../types/engineeringFlow";
import { toReactFlowEdges, toReactFlowNodes } from "../../lib/graphAdapters";
import { EngineeringNodeCard } from "./EngineeringNodeCard";

type EngineeringFlowCanvasProps = {
  graph: EngineeringFlowGraph | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onClearSelection: () => void;
  onNodePositionChange: (nodeId: string, position: { x: number; y: number }) => void;
};

const nodeTypes = {
  engineeringNode: EngineeringNodeCard,
};

type CanvasFilter =
  | "all"
  | "intent"
  | "users"
  | "screens"
  | "features"
  | "flow"
  | "data"
  | "ai"
  | "questions"
  | "confirmed"
  | "needs_review";

const canvasFilters: Array<{ id: CanvasFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "intent", label: "Intent" },
  { id: "users", label: "Users" },
  { id: "screens", label: "Screens" },
  { id: "features", label: "Features" },
  { id: "flow", label: "Flow" },
  { id: "data", label: "Data" },
  { id: "ai", label: "AI" },
  { id: "questions", label: "Questions" },
  { id: "confirmed", label: "Confirmed" },
  { id: "needs_review", label: "Needs Review" },
];

export function EngineeringFlowCanvas({
  graph,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onClearSelection,
  onNodePositionChange,
}: EngineeringFlowCanvasProps) {
  const [activeFilter, setActiveFilter] = useState<CanvasFilter>("all");

  const filteredDomainNodes = useMemo(() => {
    if (!graph) return [];

    return graph.nodes.filter((node) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "intent") return node.type === "intent";
      if (activeFilter === "users") return node.type === "user";
      if (activeFilter === "screens") return node.type === "screen";
      if (activeFilter === "features") return node.type === "feature";
      if (activeFilter === "flow") return node.type === "flow_step";
      if (activeFilter === "data") return node.type === "data_object";
      if (activeFilter === "ai") return node.type === "ai_task";
      if (activeFilter === "questions") return node.type === "question";
      if (activeFilter === "confirmed") return node.status === "confirmed";
      if (activeFilter === "needs_review") return node.status === "needs_review";
      return true;
    });
  }, [activeFilter, graph]);

  const visibleNodeIds = useMemo(
    () => new Set(filteredDomainNodes.map((node) => node.id)),
    [filteredDomainNodes],
  );

  const filteredGraph = useMemo(() => {
    if (!graph) return null;

    return {
      ...graph,
      nodes: filteredDomainNodes,
      edges: graph.edges.filter(
        (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
      ),
    };
  }, [filteredDomainNodes, graph, visibleNodeIds]);

  if (!graph) {
    return (
      <div className="canvas-empty-state">
        <p className="eyebrow">Canvas</p>
        <h2>Generate an engineering flow</h2>
        <p>
          The graph will render here from structured input. It stays editable, but the exported
          JSON remains the source of truth.
        </p>
      </div>
    );
  }

  if (!filteredGraph) return null;

  const nodes = toReactFlowNodes(filteredGraph).map((node) => ({
    ...node,
    selected: node.id === selectedNodeId,
  }));
  const edges = toReactFlowEdges(filteredGraph).map((edge) => ({
    ...edge,
    selected: edge.id === selectedEdgeId,
  }));

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    onSelectNode(node.id);
  };

  const handleEdgeClick: EdgeMouseHandler = (_, edge) => {
    onSelectEdge(edge.id);
  };

  function handleNodesChange(changes: NodeChange[]) {
    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        onNodePositionChange(change.id, change.position);
      }
    });
  }

  return (
    <ReactFlowProvider>
      <div className="canvas-frame">
        <div className="canvas-heading">
          <div>
            <p className="eyebrow">Engineering Flow Canvas</p>
            <h2>{graph.title}</h2>
          </div>
          <span className="graph-counts">
            {filteredGraph.nodes.length} of {graph.nodes.length} nodes / {filteredGraph.edges.length} of{" "}
            {graph.edges.length} edges
          </span>
        </div>
        <div className="canvas-filter-row" aria-label="Canvas filters">
          {canvasFilters.map((filter) => (
            <button
              className={`filter-chip ${activeFilter === filter.id ? "is-active" : ""}`}
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="react-flow-shell">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={onClearSelection}
            onNodesChange={handleNodesChange}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.2}
          >
            <Background color="#d7dde8" gap={24} />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
