export const EFLOW_COMMAND_SCHEMA_VERSION = "eflow-command/v0.1" as const;

export type ISODateTimeString = string;
export type EFlowId = string;
export type EFlowMetadata = Record<string, unknown>;

/**
 * Review status answers:
 * "Is this architecture claim trusted?"
 *
 * IMPORTANT:
 * Do not use a generic `status` field in the formal AI command schema.
 * Legacy EFlow graph types may still contain `status`; that legacy field should
 * be treated as review/confirmation status until an explicit migration exists.
 */
export const REVIEW_STATUSES = [
  "suggested",
  "confirmed",
  "needs_review",
  "rejected",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/**
 * Lifecycle status answers:
 * "Where is this node/edge in the implementation process?"
 */
export const LIFECYCLE_STATUSES = [
  "draft",
  "planned",
  "ready",
  "developing",
  "completed",
  "blocked",
  "needs_refactor",
  "deprecated",
] as const;

export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export const EFLOW_NODE_TYPES = [
  "intent",
  "user",
  "screen",
  "feature",
  "flow_step",
  "data_object",
  "ai_task",
  "question",
  "api_endpoint",
  "database_table",
  "state_machine",
  "module",
  "service",
  "external_system",
  "decision",
  "milestone",
  "test_case",
  "unknown",
] as const;

export type EFlowNodeType = (typeof EFLOW_NODE_TYPES)[number];

export const EFLOW_RELATIONSHIP_TYPES = [
  "serves",
  "uses",
  "leads_to",
  "contains",
  "depends_on",
  "produces",
  "needs_confirmation",
  "relates_to",
  "reads_from",
  "writes_to",
  "implements",
  "verifies",
  "blocks",
  "unblocks",
  "replaces",
  "deprecated_by",
] as const;

export type EFlowRelationshipType = (typeof EFLOW_RELATIONSHIP_TYPES)[number];

export const EFLOW_ACTOR_TYPES = ["human", "ai_agent", "system"] as const;

export type EFlowActorType = (typeof EFLOW_ACTOR_TYPES)[number];

export interface EFlowActor {
  type: EFlowActorType;
  id: EFlowId;
  name?: string;
  tool?: string;
  metadata?: EFlowMetadata;
}

export const EFLOW_EVIDENCE_TYPES = [
  "file",
  "directory",
  "commit",
  "pull_request",
  "test",
  "url",
  "note",
] as const;

export type EFlowEvidenceType = (typeof EFLOW_EVIDENCE_TYPES)[number];

export interface EFlowEvidence {
  type: EFlowEvidenceType;
  uri?: string;
  text?: string;
  metadata?: EFlowMetadata;
}

export const EFLOW_PROVENANCE_SOURCE_TYPES = [
  "user_input",
  "raw_project_idea",
  "example_seed",
  "system_generated",
  "ai_suggested",
  "manual_edit",
  "ai_command",
  "ai_progress_sync",
  "context_import",
] as const;

export type EFlowProvenanceSourceType =
  (typeof EFLOW_PROVENANCE_SOURCE_TYPES)[number];

export interface EFlowProvenance {
  sourceType: EFlowProvenanceSourceType;
  commandId?: string;
  actorId?: EFlowId;
  sourceProjectId?: string;
  sourceInputIds?: string[];
  generationRule?: string;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
  reason?: string;
  evidence?: EFlowEvidence[];
  metadata?: EFlowMetadata;
}

export interface EFlowPosition {
  x: number;
  y: number;
}

export const EFLOW_VERIFICATION_STATUSES = [
  "unverified",
  "ai_reported",
  "test_verified",
  "human_verified",
] as const;

export type EFlowVerificationStatus =
  (typeof EFLOW_VERIFICATION_STATUSES)[number];

export const EFLOW_BLOCKER_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type EFlowBlockerSeverity =
  (typeof EFLOW_BLOCKER_SEVERITIES)[number];

export const EFLOW_BLOCKER_STATUSES = ["open", "resolved"] as const;

export type EFlowBlockerStatus = (typeof EFLOW_BLOCKER_STATUSES)[number];

export interface EFlowBlocker {
  id: EFlowId;
  title: string;
  description?: string;
  severity?: EFlowBlockerSeverity;
  status: EFlowBlockerStatus;
}

export interface EFlowStateTransition {
  from?: LifecycleStatus;
  to: LifecycleStatus;
  at: ISODateTimeString;
  by: EFlowActor;
  commandId?: string;
  reason?: string;
  evidence?: EFlowEvidence[];
}

export interface EFlowImplementationState {
  verificationStatus?: EFlowVerificationStatus;
  progressPercent?: number;
  evidence?: EFlowEvidence[];
  blockers?: EFlowBlocker[];
  stateHistory?: EFlowStateTransition[];
}

export interface EFlowCommandNode {
  id: EFlowId;
  type: EFlowNodeType;
  title: string;
  description: string;
  aiReadableSummary?: string;

  reviewStatus: ReviewStatus;
  lifecycleStatus: LifecycleStatus;

  confidence?: number;
  position?: EFlowPosition;

  provenance: EFlowProvenance;
  implementation?: EFlowImplementationState;
  metadata?: EFlowMetadata;
}

export interface EFlowCommandEdge {
  id: EFlowId;
  source: EFlowId;
  target: EFlowId;
  relationshipType: EFlowRelationshipType;
  description?: string;

  reviewStatus: ReviewStatus;
  lifecycleStatus: LifecycleStatus;

  confidence?: number;

  provenance: EFlowProvenance;
  implementation?: EFlowImplementationState;
  metadata?: EFlowMetadata;
}

export type EFlowNodePatch = Partial<Omit<EFlowCommandNode, "id">>;

export type EFlowEdgePatch = Partial<
  Omit<EFlowCommandEdge, "id" | "source" | "target">
>;

export const EFLOW_COMMAND_INTENTS = [
  "architecture_import",
  "architecture_update",
  "review_sync",
  "progress_sync",
  "dependency_sync",
] as const;

export type EFlowCommandIntent = (typeof EFLOW_COMMAND_INTENTS)[number];

export const EFLOW_COMMAND_MODES = ["apply", "dry_run"] as const;

export type EFlowCommandMode = (typeof EFLOW_COMMAND_MODES)[number];

export interface EFlowOperationBase {
  operationId?: string;
  reason?: string;
  evidence?: EFlowEvidence[];
  metadata?: EFlowMetadata;
}

export interface UpsertNodeOperation extends EFlowOperationBase {
  op: "upsertNode";
  node: EFlowCommandNode;
}

export interface UpdateNodeOperation extends EFlowOperationBase {
  op: "updateNode";
  id: EFlowId;
  patch: EFlowNodePatch;
}

export interface TransitionNodeOperation extends EFlowOperationBase {
  op: "transitionNode";
  id: EFlowId;
  from?: LifecycleStatus;
  to: LifecycleStatus;
}

export interface UpsertEdgeOperation extends EFlowOperationBase {
  op: "upsertEdge";
  edge: EFlowCommandEdge;
}

export interface UpdateEdgeOperation extends EFlowOperationBase {
  op: "updateEdge";
  id: EFlowId;
  patch: EFlowEdgePatch;
}

export interface TransitionEdgeOperation extends EFlowOperationBase {
  op: "transitionEdge";
  id: EFlowId;
  from?: LifecycleStatus;
  to: LifecycleStatus;
}

export interface EFlowDecisionRecord {
  id: EFlowId;
  title: string;
  description?: string;
  outcome?: string;
  reviewStatus?: ReviewStatus;
  lifecycleStatus?: LifecycleStatus;
  relatedNodeIds?: EFlowId[];
  provenance?: EFlowProvenance;
  metadata?: EFlowMetadata;
}

export interface AddDecisionOperation extends EFlowOperationBase {
  op: "addDecision";
  decision: EFlowDecisionRecord;
}

export interface EFlowQuestionRecord {
  id: EFlowId;
  title: string;
  question: string;
  answer?: string;
  blocking?: boolean;
  reviewStatus?: ReviewStatus;
  lifecycleStatus?: LifecycleStatus;
  relatedNodeIds?: EFlowId[];
  provenance?: EFlowProvenance;
  metadata?: EFlowMetadata;
}

export interface AddQuestionOperation extends EFlowOperationBase {
  op: "addQuestion";
  question: EFlowQuestionRecord;
}

export type EFlowOperation =
  | UpsertNodeOperation
  | UpdateNodeOperation
  | TransitionNodeOperation
  | UpsertEdgeOperation
  | UpdateEdgeOperation
  | TransitionEdgeOperation
  | AddDecisionOperation
  | AddQuestionOperation;

export interface EFlowCommandEnvelope {
  schemaVersion: typeof EFLOW_COMMAND_SCHEMA_VERSION;
  commandId: string;
  projectId: string;
  graphId?: string;
  baseRevision?: string;
  createdAt: ISODateTimeString;
  actor: EFlowActor;
  intent: EFlowCommandIntent;
  mode?: EFlowCommandMode;
  operations: EFlowOperation[];
  metadata?: EFlowMetadata;
}
