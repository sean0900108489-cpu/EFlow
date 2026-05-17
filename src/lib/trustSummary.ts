import type { EngineeringFlowGraph } from "../types/engineeringFlow";

export type GraphTrustSummary = {
  totalNodes: number;
  confirmedNodes: number;
  suggestedNodes: number;
  needsReviewNodes: number;
  totalEdges: number;
  confirmedEdges: number;
  suggestedEdges: number;
  rejectedEdges: number;
  blockingQuestions: number;
};

export function isBlockingQuestionNode(node: EngineeringFlowGraph["nodes"][number]): boolean {
  return (
    node.type === "question" &&
    node.provenance.generationRule === "blocking_unknown_to_question_node"
  );
}

export function buildGraphTrustSummary(graph: EngineeringFlowGraph): GraphTrustSummary {
  return {
    totalNodes: graph.nodes.length,
    confirmedNodes: graph.nodes.filter((node) => node.status === "confirmed").length,
    suggestedNodes: graph.nodes.filter((node) => node.status === "suggested").length,
    needsReviewNodes: graph.nodes.filter((node) => node.status === "needs_review").length,
    totalEdges: graph.edges.length,
    confirmedEdges: graph.edges.filter((edge) => edge.status === "confirmed").length,
    suggestedEdges: graph.edges.filter((edge) => edge.status === "suggested").length,
    rejectedEdges: graph.edges.filter((edge) => edge.status === "rejected").length,
    blockingQuestions: graph.nodes.filter(isBlockingQuestionNode).length,
  };
}
