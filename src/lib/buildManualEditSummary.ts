import type {
  EdgeStatus,
  EngineeringFlowGraph,
  NodeStatus,
} from "../types/engineeringFlow";

const NODE_REVIEW_STATUSES: NodeStatus[] = ["suggested", "confirmed", "needs_review"];
const EDGE_REVIEW_STATUSES: EdgeStatus[] = ["suggested", "confirmed", "rejected"];

export type ManualEditSummary = {
  manualNodeIds: string[];
  manualEdgeIds: string[];
  manualNodeCount: number;
  manualEdgeCount: number;
  nodesByReviewStatus: Record<NodeStatus, string[]>;
  edgesByReviewStatus: Record<EdgeStatus, string[]>;
};

export function buildManualEditSummary(graph: EngineeringFlowGraph): ManualEditSummary {
  const manualNodeIds: string[] = [];
  const manualEdgeIds: string[] = [];
  const nodesByReviewStatus = makeNodeReviewBuckets();
  const edgesByReviewStatus = makeEdgeReviewBuckets();

  graph.nodes.forEach((node) => {
    if (node.provenance?.sourceType !== "manual_edit") return;

    manualNodeIds.push(node.id);
    nodesByReviewStatus[node.status].push(node.id);
  });

  graph.edges.forEach((edge) => {
    if (edge.provenance?.sourceType !== "manual_edit") return;

    manualEdgeIds.push(edge.id);
    edgesByReviewStatus[edge.status].push(edge.id);
  });

  return {
    manualNodeIds,
    manualEdgeIds,
    manualNodeCount: manualNodeIds.length,
    manualEdgeCount: manualEdgeIds.length,
    nodesByReviewStatus,
    edgesByReviewStatus,
  };
}

function makeNodeReviewBuckets(): Record<NodeStatus, string[]> {
  return Object.fromEntries(
    NODE_REVIEW_STATUSES.map((status) => [status, [] as string[]]),
  ) as Record<NodeStatus, string[]>;
}

function makeEdgeReviewBuckets(): Record<EdgeStatus, string[]> {
  return Object.fromEntries(
    EDGE_REVIEW_STATUSES.map((status) => [status, [] as string[]]),
  ) as Record<EdgeStatus, string[]>;
}
