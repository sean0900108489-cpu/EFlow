import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type EdgeMouseHandler,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { EngineeringFlowGraph } from "../../types/engineeringFlow";
import {
  LIFECYCLE_STATUSES,
  type LifecycleStatus,
} from "../../types/eflowCommand";
import { toReactFlowEdges, toReactFlowNodes } from "../../lib/graphAdapters";
import { useLanguage } from "../../lib/i18n/language-context";
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

type LifecycleCanvasFilter = "all" | LifecycleStatus;

const lifecycleFilterLabels: Record<LifecycleStatus, string> = {
  draft: "Draft",
  planned: "Planned",
  ready: "Ready",
  developing: "Developing",
  completed: "Completed",
  blocked: "Blocked",
  needs_refactor: "Needs refactor",
  deprecated: "Deprecated",
};

const lifecycleFilters: Array<{ id: LifecycleCanvasFilter; label: string }> = [
  { id: "all", label: "All" },
  ...LIFECYCLE_STATUSES.map((status) => ({
    id: status,
    label: lifecycleFilterLabels[status],
  })),
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
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<CanvasFilter>("all");
  const [activeLifecycleFilter, setActiveLifecycleFilter] =
    useState<LifecycleCanvasFilter>("all");

  const lifecycleCounts = useMemo(() => {
    const counts = Object.fromEntries(
      LIFECYCLE_STATUSES.map((status) => [status, 0]),
    ) as Record<LifecycleStatus, number>;

    graph?.nodes.forEach((node) => {
      counts[getDisplayedLifecycleStatus(node)] += 1;
    });

    return counts;
  }, [graph]);

  const filteredDomainNodes = useMemo(() => {
    if (!graph) return [];

    return graph.nodes.filter((node) => {
      const matchesGraphFilter = matchesCanvasFilter(node, activeFilter);
      const matchesLifecycleFilter =
        activeLifecycleFilter === "all" ||
        getDisplayedLifecycleStatus(node) === activeLifecycleFilter;

      return matchesGraphFilter && matchesLifecycleFilter;
    });
  }, [activeFilter, activeLifecycleFilter, graph]);

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

  useEffect(() => {
    if (!filteredGraph) return;

    if (selectedNodeId && !visibleNodeIds.has(selectedNodeId)) {
      onClearSelection();
      return;
    }

    if (
      selectedEdgeId &&
      !filteredGraph.edges.some((edge) => edge.id === selectedEdgeId)
    ) {
      onClearSelection();
    }
  }, [
    filteredGraph,
    onClearSelection,
    selectedEdgeId,
    selectedNodeId,
    visibleNodeIds,
  ]);

  if (!graph) {
    return (
      <div
        className="canvas-empty-state"
        data-tour="engineering-canvas"
        data-tour-step="4"
        data-tour-title={t("tour.canvas.title")}
        data-tour-body={t("tour.canvas.body")}
        data-tour-position="bottom"
      >
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
      <div
        className="canvas-frame"
        data-tour="engineering-canvas"
        data-tour-step="4"
        data-tour-title={t("tour.canvas.title")}
        data-tour-body={t("tour.canvas.body")}
        data-tour-position="bottom"
      >
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
        <div className="canvas-filter-stack" aria-label="Canvas filters">
          <div className="canvas-filter-group">
            <span className="canvas-filter-label">Graph</span>
            <div className="canvas-filter-row" aria-label="Graph filters">
              {canvasFilters.map((filter) => (
                <button
                  className={`filter-chip ${activeFilter === filter.id ? "is-active" : ""}`}
                  key={filter.id}
                  data-graph-filter={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="canvas-filter-group">
            <span className="canvas-filter-label">Lifecycle</span>
            <div className="canvas-filter-row" aria-label="Lifecycle filters">
              {lifecycleFilters.map((filter) => (
                <button
                  className={`filter-chip ${activeLifecycleFilter === filter.id ? "is-active" : ""}`}
                  key={filter.id}
                  data-lifecycle-filter={filter.id}
                  type="button"
                  onClick={() => setActiveLifecycleFilter(filter.id)}
                >
                  <span>{filter.label}</span>
                  <span className="filter-chip-count">
                    {filter.id === "all"
                      ? graph.nodes.length
                      : lifecycleCounts[filter.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>
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

function matchesCanvasFilter(
  node: EngineeringFlowGraph["nodes"][number],
  activeFilter: CanvasFilter,
): boolean {
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
}

function getDisplayedLifecycleStatus(
  node: EngineeringFlowGraph["nodes"][number],
): LifecycleStatus {
  return node.lifecycleStatus ?? "planned";
}
