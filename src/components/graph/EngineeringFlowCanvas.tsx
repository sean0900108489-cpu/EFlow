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
import { lifecycleStatusLabelKeys } from "../../lib/i18n/display-labels";
import { useLanguage } from "../../lib/i18n/language-context";
import type { TranslationKey } from "../../lib/i18n/types";
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

const canvasFilters: Array<{ id: CanvasFilter; labelKey: TranslationKey }> = [
  { id: "all", labelKey: "canvas.filter.all" },
  { id: "intent", labelKey: "canvas.filter.intent" },
  { id: "users", labelKey: "canvas.filter.users" },
  { id: "screens", labelKey: "canvas.filter.screens" },
  { id: "features", labelKey: "canvas.filter.features" },
  { id: "flow", labelKey: "canvas.filter.flow" },
  { id: "data", labelKey: "canvas.filter.data" },
  { id: "ai", labelKey: "canvas.filter.ai" },
  { id: "questions", labelKey: "canvas.filter.questions" },
  { id: "confirmed", labelKey: "canvas.filter.confirmed" },
  { id: "needs_review", labelKey: "canvas.filter.needsReview" },
];

type LifecycleCanvasFilter = "all" | LifecycleStatus;

const lifecycleFilters: Array<{ id: LifecycleCanvasFilter; labelKey: TranslationKey }> = [
  { id: "all", labelKey: "canvas.filter.all" },
  ...LIFECYCLE_STATUSES.map((status) => ({
    id: status,
    labelKey: lifecycleStatusLabelKeys[status],
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
        <p className="eyebrow">{t("canvas.empty.eyebrow")}</p>
        <h2>{t("canvas.empty.title")}</h2>
        <p>{t("canvas.empty.body")}</p>
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
            <p className="eyebrow">{t("canvas.header.eyebrow")}</p>
            <h2>{graph.title}</h2>
          </div>
          <span className="graph-counts">
            {t("canvas.header.counts", {
              visibleNodes: filteredGraph.nodes.length,
              totalNodes: graph.nodes.length,
              visibleEdges: filteredGraph.edges.length,
              totalEdges: graph.edges.length,
            })}
          </span>
        </div>
        <div className="canvas-filter-stack" aria-label={t("canvas.filters.ariaLabel")}>
          <div className="canvas-filter-group">
            <span className="canvas-filter-label">{t("canvas.filters.graphLabel")}</span>
            <div className="canvas-filter-row" aria-label={t("canvas.filters.graphAriaLabel")}>
              {canvasFilters.map((filter) => (
                <button
                  className={`filter-chip ${activeFilter === filter.id ? "is-active" : ""}`}
                  key={filter.id}
                  data-graph-filter={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {t(filter.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="canvas-filter-group">
            <span className="canvas-filter-label">{t("canvas.filters.lifecycleLabel")}</span>
            <div className="canvas-filter-row" aria-label={t("canvas.filters.lifecycleAriaLabel")}>
              {lifecycleFilters.map((filter) => (
                <button
                  className={`filter-chip ${activeLifecycleFilter === filter.id ? "is-active" : ""}`}
                  key={filter.id}
                  data-lifecycle-filter={filter.id}
                  type="button"
                  onClick={() => setActiveLifecycleFilter(filter.id)}
                >
                  <span>{t(filter.labelKey)}</span>
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
