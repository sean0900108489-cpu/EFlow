import type {
  EngineeringFlowGraph,
  EngineeringFlowInput,
  FullAIContext,
} from "../types/engineeringFlow";
import { nowIso } from "./dates";
import { isBlockingQuestionNode } from "./trustSummary";

export function buildFullAIContext(
  input: EngineeringFlowInput,
  graph: EngineeringFlowGraph | null,
): FullAIContext {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  return {
    schemaVersion: "engineering-flow-full-context/v0",
    generatedAt: nowIso(),
    projectName: input.projectName,
    projectIntent: input.projectIntent,
    engineeringFlowInput: input,
    engineeringFlowGraph: graph,
    confirmationPolicy: {
      confirmedMeans:
        "Human-confirmed. Future AI systems may treat this as high-trust project context.",
      suggestedMeans:
        "Generated from structured input but not yet human-confirmed. Future AI systems should not treat this as final truth.",
      needsReviewMeans: "Requires further human review before being used as project context.",
      rejectedMeans:
        "Human rejected. Future AI systems should avoid using this relationship or item.",
    },
    confirmationSummary: {
      confirmedNodeIds: nodes.filter((node) => node.status === "confirmed").map((node) => node.id),
      suggestedNodeIds: nodes.filter((node) => node.status === "suggested").map((node) => node.id),
      needsReviewNodeIds: nodes
        .filter((node) => node.status === "needs_review")
        .map((node) => node.id),
      confirmedEdgeIds: edges.filter((edge) => edge.status === "confirmed").map((edge) => edge.id),
      suggestedEdgeIds: edges.filter((edge) => edge.status === "suggested").map((edge) => edge.id),
      rejectedEdgeIds: edges.filter((edge) => edge.status === "rejected").map((edge) => edge.id),
      blockingQuestionNodeIds: nodes.filter(isBlockingQuestionNode).map((node) => node.id),
    },
  };
}
