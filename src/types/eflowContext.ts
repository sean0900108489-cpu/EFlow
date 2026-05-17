import type {
  EFlowCommandEdge,
  EFlowCommandNode,
  EFlowEvidence,
  EFlowId,
  EFlowMetadata,
  EFlowNodeType,
  EFlowOperation,
  ISODateTimeString,
  LifecycleStatus,
  EFlowRelationshipType,
  ReviewStatus,
} from "./eflowCommand";

export const EFLOW_CONTEXT_SCHEMA_VERSION = "eflow-context/v0.1" as const;

export interface EFlowContextProject {
  id: string;
  name: string;
  intent: string;
  sourceType?: string;
  metadata?: EFlowMetadata;
}

export type EFlowStatusPolicyMap<T extends string> = Record<T, string>;

export interface EFlowContextPolicies {
  confirmationPolicy: EFlowStatusPolicyMap<ReviewStatus>;
  stateMachinePolicy: EFlowStatusPolicyMap<LifecycleStatus>;
}

export interface EFlowContextGraph {
  nodes: EFlowCommandNode[];
  edges: EFlowCommandEdge[];
}

export interface EFlowDependencyIndexEntry {
  dependsOn: EFlowId[];
  blocks: EFlowId[];
  relatedEdges?: EFlowId[];
}

export type EFlowDependencyIndex = Record<EFlowId, EFlowDependencyIndexEntry>;

export interface EFlowProgressSummary {
  nodesByLifecycle: Record<LifecycleStatus, EFlowId[]>;
  edgesByLifecycle: Record<LifecycleStatus, EFlowId[]>;
}

export interface EFlowReviewSummary {
  nodesByReviewStatus: Record<ReviewStatus, EFlowId[]>;
  edgesByReviewStatus: Record<ReviewStatus, EFlowId[]>;
  blockingQuestionNodeIds: EFlowId[];
}

export const EFLOW_TARGET_PRIORITIES = ["low", "medium", "high"] as const;

export type EFlowTargetPriority = (typeof EFLOW_TARGET_PRIORITIES)[number];

export interface EFlowNextDevelopmentTarget {
  nodeId?: EFlowId;
  edgeId?: EFlowId;
  reason: string;
  priority?: EFlowTargetPriority;
  evidence?: EFlowEvidence[];
}

export const EFLOW_BLOCKING_QUESTION_STATUSES = [
  "open",
  "answered",
  "deferred",
] as const;

export type EFlowBlockingQuestionStatus =
  (typeof EFLOW_BLOCKING_QUESTION_STATUSES)[number];

export const EFLOW_BLOCKING_QUESTION_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type EFlowBlockingQuestionSeverity =
  (typeof EFLOW_BLOCKING_QUESTION_SEVERITIES)[number];

export interface EFlowBlockingQuestion {
  id: EFlowId;
  title: string;
  question: string;
  relatedNodeIds?: EFlowId[];
  severity?: EFlowBlockingQuestionSeverity;
  status: EFlowBlockingQuestionStatus;
  answer?: string;
  evidence?: EFlowEvidence[];
}

export interface EFlowMermaidExport {
  flowchart?: string;
  dependencyGraph?: string;
  stateDiagram?: string;
}

export type EFlowCommandOperationName = EFlowOperation["op"];

export type EFlowLocalCommandWorkflowStep = "validate" | "dry_run" | "apply";

export interface EFlowLocalCommandWorkflowDescriptor {
  step: EFlowLocalCommandWorkflowStep;
  description: string;
  mutatesGraph: boolean;
}

export interface EFlowUnsupportedOperationDescriptor {
  operation: EFlowCommandOperationName;
  behavior: string;
  reason?: string;
}

export interface EFlowCommandSafetyRuleDescriptor {
  code: string;
  description: string;
}

export interface EFlowUnsupportedReviewStatusMapping {
  scope: "node" | "edge";
  reviewStatus: ReviewStatus;
  behavior: string;
}

export interface EFlowCommandStatusMappingDescriptor {
  commandReviewStatusToGraphStatus: string;
  graphStatusToContextReviewStatus: string;
  lifecycleStatus: string;
  unsupportedReviewStatusMappings: EFlowUnsupportedReviewStatusMapping[];
}

export interface EFlowCommandDefaultingRuleDescriptor {
  field: string;
  defaultValue: string;
  behavior: string;
  writesBack: boolean;
}

export interface EFlowCommandAuditBehaviorDescriptor {
  path: string;
  behavior: string;
  eventType?: string;
}

export interface EFlowCommandGraphCompatibilityDescriptor {
  supportedNodeTypes: EFlowNodeType[];
  unsupportedSchemaNodeTypes: EFlowNodeType[];
  supportedRelationshipTypes: EFlowRelationshipType[];
  unsupportedSchemaRelationshipTypes: EFlowRelationshipType[];
  unsupportedTypeBehavior: string;
}

export interface EFlowCommandInterfaceDescriptor {
  acceptedSchemaVersions: string[];
  preferredOperations: EFlowCommandOperationName[];
  unsupportedOrSchemaOnlyOperations: EFlowUnsupportedOperationDescriptor[];
  localWorkflow: EFlowLocalCommandWorkflowDescriptor[];
  safetyRules: EFlowCommandSafetyRuleDescriptor[];
  statusMapping: EFlowCommandStatusMappingDescriptor;
  defaultingRules: EFlowCommandDefaultingRuleDescriptor[];
  auditBehavior: EFlowCommandAuditBehaviorDescriptor[];
  graphCompatibility: EFlowCommandGraphCompatibilityDescriptor;
}

export interface EFlowContextExport {
  schemaVersion: typeof EFLOW_CONTEXT_SCHEMA_VERSION;
  generatedAt: ISODateTimeString;

  project: EFlowContextProject;
  graphRevision?: string;
  sourceWorkspaceSchemaVersion?: string;

  policies: EFlowContextPolicies;
  graph: EFlowContextGraph;

  dependencyIndex: EFlowDependencyIndex;
  progressSummary: EFlowProgressSummary;
  reviewSummary: EFlowReviewSummary;

  nextDevelopmentTargets: EFlowNextDevelopmentTarget[];
  blockingQuestions: EFlowBlockingQuestion[];

  mermaid?: EFlowMermaidExport;
  commandInterface: EFlowCommandInterfaceDescriptor;

  metadata?: EFlowMetadata;
}
