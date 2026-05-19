import type {
  EngineeringEdge,
  EdgeStatus,
  EngineeringFlowGraph,
  EngineeringNode,
  EngineeringNodeType,
  NodeStatus,
  RelationshipType,
} from "../types/engineeringFlow";
import type { TranslationKey, TranslationValues } from "./i18n/types";
import { isBlockingQuestionNode } from "./trustSummary";

export type ReviewItemKind = "node" | "edge";

export type ReviewPriority = "critical" | "high" | "normal";

export type ReviewItem = {
  id: string;
  kind: ReviewItemKind;
  graphItemId: string;
  title: string;
  subtitle: string;
  nodeType?: EngineeringNodeType;
  relationshipType?: RelationshipType;
  status: NodeStatus | EdgeStatus;
  priority: ReviewPriority;
  reason: string;
  reasonKey?: TranslationKey;
  reasonValues?: TranslationValues;
  confidence: number;
  sourceType?: string;
};

export type ReviewQueue = {
  items: ReviewItem[];
  totalReviewable: number;
  confirmedCount: number;
  needsReviewCount: number;
  rejectedCount: number;
  suggestedCount: number;
  progressPercent: number;
};

export function buildReviewQueue(graph: EngineeringFlowGraph | null): ReviewQueue {
  if (!graph) {
    return {
      items: [],
      totalReviewable: 0,
      confirmedCount: 0,
      needsReviewCount: 0,
      rejectedCount: 0,
      suggestedCount: 0,
      progressPercent: 0,
    };
  }

  const nodeTitleById = new Map(graph.nodes.map((node) => [node.id, node.title]));
  const nodeItems = graph.nodes.map((node) => buildNodeReviewItem(node));
  const edgeItems = graph.edges.map((edge) => buildEdgeReviewItem(edge, nodeTitleById));
  const items = [...nodeItems, ...edgeItems].sort(compareReviewItems);

  const confirmedCount = items.filter((item) => item.status === "confirmed").length;
  const needsReviewCount = items.filter((item) => item.status === "needs_review").length;
  const rejectedCount = items.filter((item) => item.status === "rejected").length;
  const suggestedCount = items.filter((item) => item.status === "suggested").length;
  const totalReviewable = items.length;
  const progressScore = confirmedCount + rejectedCount + needsReviewCount * 0.5;

  return {
    items,
    totalReviewable,
    confirmedCount,
    needsReviewCount,
    rejectedCount,
    suggestedCount,
    progressPercent:
      totalReviewable === 0 ? 0 : Math.round((progressScore / totalReviewable) * 100),
  };
}

function buildNodeReviewItem(node: EngineeringNode): ReviewItem {
  return {
    id: `review-node-${node.id}`,
    kind: "node",
    graphItemId: node.id,
    title: node.title,
    subtitle: `${node.type} · ${node.status}`,
    nodeType: node.type,
    status: node.status,
    priority: getNodePriority(node),
    reason: getNodeReason(node),
    reasonKey: getNodeReasonKey(node),
    confidence: node.confidence,
    sourceType: node.provenance.sourceType,
  };
}

function buildEdgeReviewItem(
  edge: EngineeringEdge,
  nodeTitleById: Map<string, string>,
): ReviewItem {
  const sourceTitle = nodeTitleById.get(edge.source) ?? edge.source;
  const targetTitle = nodeTitleById.get(edge.target) ?? edge.target;

  return {
    id: `review-edge-${edge.id}`,
    kind: "edge",
    graphItemId: edge.id,
    title: `${sourceTitle} -> ${targetTitle}`,
    subtitle: `${edge.relationshipType} · ${edge.status}`,
    relationshipType: edge.relationshipType,
    status: edge.status,
    priority: getEdgePriority(edge),
    reason: getEdgeReason(edge),
    ...getEdgeReasonTranslation(edge),
    confidence: edge.confidence,
    sourceType: edge.provenance.sourceType,
  };
}

function getNodePriority(node: EngineeringNode): ReviewPriority {
  if (isBlockingQuestionNode(node) || node.description.includes("Blocks generation decisions")) {
    return "critical";
  }

  if (node.status === "needs_review") {
    return "high";
  }

  if (["intent", "user", "screen", "feature", "data_object"].includes(node.type)) {
    return "high";
  }

  return "normal";
}

function getEdgePriority(edge: EngineeringEdge): ReviewPriority {
  if (
    edge.relationshipType === "depends_on" ||
    edge.relationshipType === "needs_confirmation" ||
    edge.confidence < 0.8
  ) {
    return "high";
  }

  return "normal";
}

function getNodeReason(node: EngineeringNode): string {
  if (node.provenance.sourceType === "manual_edit") {
    if (node.status === "confirmed") {
      return "Human-added manual context.";
    }

    if (node.status === "needs_review") {
      return "Human-added manual context marked for review.";
    }

    return "Human-added manual context that still needs confirmation.";
  }

  if (node.status === "confirmed") {
    return "Human-confirmed.";
  }

  if (node.status === "needs_review") {
    return "Marked as needing human review.";
  }

  return "Generated from structured input and not yet human-confirmed.";
}

function getNodeReasonKey(node: EngineeringNode): TranslationKey {
  if (node.provenance.sourceType === "manual_edit") {
    if (node.status === "confirmed") {
      return "review.reason.manualNodeConfirmed";
    }

    if (node.status === "needs_review") {
      return "review.reason.manualNodeNeedsReview";
    }

    return "review.reason.manualNodeSuggested";
  }

  if (node.status === "confirmed") {
    return "review.reason.nodeConfirmed";
  }

  if (node.status === "needs_review") {
    return "review.reason.nodeNeedsReview";
  }

  return "review.reason.nodeSuggested";
}

function getEdgeReason(edge: EngineeringEdge): string {
  if (edge.provenance.sourceType === "manual_edit") {
    if (edge.status === "rejected") {
      return "Human-added manual relationship was rejected.";
    }

    if (edge.status === "suggested") {
      return edge.description
        ? `${edge.description} Human-added manual relationship that still needs confirmation.`
        : "Human-added manual relationship that still needs confirmation.";
    }

    return edge.description
      ? `${edge.description} Human-added manual relationship.`
      : "Human-added manual relationship.";
  }

  if (edge.status === "rejected") {
    return "Human rejected this relationship.";
  }

  if (edge.status === "suggested") {
    return edge.description
      ? `${edge.description} This relationship is not yet human-confirmed.`
      : "Generated relationship is not yet human-confirmed.";
  }

  return edge.description || "Human-confirmed relationship.";
}

function getEdgeReasonTranslation(
  edge: EngineeringEdge,
): { reasonKey: TranslationKey; reasonValues?: TranslationValues } {
  if (edge.provenance.sourceType === "manual_edit") {
    if (edge.status === "rejected") {
      return { reasonKey: "review.reason.manualEdgeRejected" };
    }

    if (edge.status === "suggested") {
      return edge.description
        ? {
            reasonKey: "review.reason.manualEdgeSuggestedWithDescription",
            reasonValues: { description: edge.description },
          }
        : { reasonKey: "review.reason.manualEdgeSuggested" };
    }

    return edge.description
      ? {
          reasonKey: "review.reason.manualEdgeConfirmedWithDescription",
          reasonValues: { description: edge.description },
        }
      : { reasonKey: "review.reason.manualEdgeConfirmed" };
  }

  if (edge.status === "rejected") {
    return { reasonKey: "review.reason.edgeRejected" };
  }

  if (edge.status === "suggested") {
    return edge.description
      ? {
          reasonKey: "review.reason.edgeSuggestedWithDescription",
          reasonValues: { description: edge.description },
        }
      : { reasonKey: "review.reason.edgeSuggested" };
  }

  return { reasonKey: "review.reason.edgeConfirmed" };
}

function compareReviewItems(a: ReviewItem, b: ReviewItem): number {
  const priorityRank: Record<ReviewPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
  };
  const statusRank: Record<string, number> = {
    suggested: 0,
    needs_review: 1,
    confirmed: 2,
    rejected: 3,
  };

  return (
    priorityRank[a.priority] - priorityRank[b.priority] ||
    (statusRank[a.status] ?? 4) - (statusRank[b.status] ?? 4) ||
    a.kind.localeCompare(b.kind) ||
    a.title.localeCompare(b.title)
  );
}
