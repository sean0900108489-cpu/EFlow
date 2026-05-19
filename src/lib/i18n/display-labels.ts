import type {
  EdgeStatus,
  EngineeringNodeType,
  NodeStatus,
  RelationshipType,
} from "../../types/engineeringFlow";
import type { LifecycleStatus } from "../../types/eflowCommand";
import type { ReviewItemKind, ReviewPriority } from "../buildReviewQueue";
import type { TranslationKey } from "./types";

export const nodeTypeLabelKeys: Record<EngineeringNodeType, TranslationKey> = {
  intent: "graph.nodeType.intent",
  user: "graph.nodeType.user",
  screen: "graph.nodeType.screen",
  feature: "graph.nodeType.feature",
  flow_step: "graph.nodeType.flowStep",
  data_object: "graph.nodeType.dataObject",
  ai_task: "graph.nodeType.aiTask",
  question: "graph.nodeType.question",
};

export const reviewStatusLabelKeys: Record<NodeStatus | EdgeStatus, TranslationKey> = {
  suggested: "review.status.suggested",
  confirmed: "review.status.confirmed",
  needs_review: "review.status.needsReview",
  rejected: "review.status.rejected",
};

export const lifecycleStatusLabelKeys: Record<LifecycleStatus, TranslationKey> = {
  draft: "lifecycle.status.draft",
  planned: "lifecycle.status.planned",
  ready: "lifecycle.status.ready",
  developing: "lifecycle.status.developing",
  completed: "lifecycle.status.completed",
  blocked: "lifecycle.status.blocked",
  needs_refactor: "lifecycle.status.needsRefactor",
  deprecated: "lifecycle.status.deprecated",
};

export const relationshipTypeLabelKeys: Record<RelationshipType, TranslationKey> = {
  serves: "graph.relationshipType.serves",
  uses: "graph.relationshipType.uses",
  leads_to: "graph.relationshipType.leadsTo",
  contains: "graph.relationshipType.contains",
  depends_on: "graph.relationshipType.dependsOn",
  produces: "graph.relationshipType.produces",
  needs_confirmation: "graph.relationshipType.needsConfirmation",
  relates_to: "graph.relationshipType.relatesTo",
};

export const reviewPriorityLabelKeys: Record<ReviewPriority, TranslationKey> = {
  critical: "review.priority.critical",
  high: "review.priority.high",
  normal: "review.priority.normal",
};

export const reviewItemKindLabelKeys: Record<ReviewItemKind, TranslationKey> = {
  node: "review.kind.node",
  edge: "review.kind.edge",
};
