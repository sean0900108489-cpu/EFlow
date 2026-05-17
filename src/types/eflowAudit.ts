export const EFLOW_AUDIT_SCHEMA_VERSION = "eflow-audit/v0.1" as const;

export type EFlowAuditMetadata = Record<string, unknown>;
export type EFlowAuditSnapshot = Record<string, unknown>;

export const EFLOW_AUDIT_ACTOR_TYPES = ["human", "ai_agent", "system"] as const;

export type EFlowAuditActorType = (typeof EFLOW_AUDIT_ACTOR_TYPES)[number];

export interface EFlowAuditActor {
  type: EFlowAuditActorType;
  id: string;
  name?: string;
}

export const EFLOW_AUDIT_SOURCES = [
  "manual_ui",
  "ai_command",
  "workspace",
  "system",
] as const;

export type EFlowAuditSource = (typeof EFLOW_AUDIT_SOURCES)[number];

export const EFLOW_AUDIT_TARGET_TYPES = [
  "node",
  "edge",
  "graph",
  "workspace",
  "command",
] as const;

export type EFlowAuditTargetType = (typeof EFLOW_AUDIT_TARGET_TYPES)[number];

export interface EFlowAuditTarget {
  type: EFlowAuditTargetType;
  id?: string;
}

export const EFLOW_AUDIT_EVENT_TYPES = [
  "graph_generated",
  "graph_replaced",
  "workspace_imported",
  "engineering_input_imported",
  "full_ai_context_imported",
  "manual_node_created",
  "manual_edge_created",
  "ai_command_applied",
  "node_review_status_changed",
  "node_lifecycle_status_changed",
  "edge_review_status_changed",
  "edge_lifecycle_status_changed",
] as const;

export type EFlowKnownAuditEventType = (typeof EFLOW_AUDIT_EVENT_TYPES)[number];

export interface EFlowAuditEvent {
  schemaVersion: typeof EFLOW_AUDIT_SCHEMA_VERSION;
  id: string;
  createdAt: string;
  actor: EFlowAuditActor;
  source: EFlowAuditSource;
  eventType: string;
  summary: string;
  target?: EFlowAuditTarget;
  before?: EFlowAuditSnapshot;
  after?: EFlowAuditSnapshot;
  metadata?: EFlowAuditMetadata;
}
