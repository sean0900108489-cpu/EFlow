import type {
  EFlowEvidence,
  EFlowImplementationState,
  EFlowMetadata,
  EFlowProvenance,
  LifecycleStatus,
} from "./eflowCommand";
import type { EFlowAuditEvent } from "./eflowAudit";

export type SourceType =
  | "user_input"
  | "example_seed"
  | "system_generated"
  | "ai_suggested"
  | "manual_edit"
  | "ai_command"
  | "ai_progress_sync"
  | "context_import";

export type Priority = "must_have" | "should_have" | "later";

export type EngineeringFlowInput = {
  schemaVersion: "engineering-flow-input/v0";
  id: string;
  projectName: string;
  projectIntent: string;
  sourceType: SourceType;
  createdAt: string;
  updatedAt: string;

  userTypes: Array<{
    id: string;
    name: string;
    goal: string;
    description: string;
  }>;

  mainScreens: Array<{
    id: string;
    name: string;
    purpose: string;
    keyActions: string[];
  }>;

  coreFunctions: Array<{
    id: string;
    name: string;
    description: string;
    priority: Priority;
    relatedScreenIds?: string[];
    relatedDataObjectIds?: string[];
  }>;

  flowSteps: Array<{
    id: string;
    step: number;
    title: string;
    description: string;
    relatedScreenId?: string;
    relatedFunctionIds?: string[];
  }>;

  dataObjects: Array<{
    id: string;
    name: string;
    description: string;
  }>;

  aiRoles: Array<{
    id: string;
    task: string;
    requiresHumanConfirmation: boolean;
    relatedScreenIds?: string[];
    relatedFunctionIds?: string[];
  }>;

  unknowns: Array<{
    id: string;
    question: string;
    blocksGeneration: boolean;
    relatedObjectIds?: string[];
  }>;
};

export type EngineeringNodeType =
  | "intent"
  | "user"
  | "screen"
  | "feature"
  | "flow_step"
  | "data_object"
  | "ai_task"
  | "question";

export type NodeStatus = "suggested" | "confirmed" | "needs_review";

export type RelationshipType =
  | "serves"
  | "uses"
  | "leads_to"
  | "contains"
  | "depends_on"
  | "produces"
  | "needs_confirmation"
  | "relates_to";

export type EdgeStatus = "suggested" | "confirmed" | "rejected";

export type EngineeringNode = {
  id: string;
  type: EngineeringNodeType;
  title: string;
  description: string;
  status: NodeStatus;
  aiReadableSummary: string;
  position: {
    x: number;
    y: number;
  };
  confidence: number;
  provenance: {
    sourceType: SourceType;
    sourceInputSection?: string;
    sourceInputId?: string;
    sourceInputIds?: string[];
    generationRule?: string;
    commandId?: string;
    actorId?: string;
    updatedAt?: string;
    reason?: string;
    evidence?: EFlowEvidence[];
  };
  lifecycleStatus?: LifecycleStatus;
  commandProvenance?: EFlowProvenance[];
  implementation?: EFlowImplementationState;
  metadata?: EFlowMetadata;
};

export type EngineeringEdge = {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
  status: EdgeStatus;
  description: string;
  confidence: number;
  provenance: {
    sourceType: SourceType;
    sourceInputIds?: string[];
    generationRule?: string;
    commandId?: string;
    actorId?: string;
    updatedAt?: string;
    reason?: string;
    evidence?: EFlowEvidence[];
  };
  lifecycleStatus?: LifecycleStatus;
  commandProvenance?: EFlowProvenance[];
  implementation?: EFlowImplementationState;
  metadata?: EFlowMetadata;
};

export type EngineeringFlowGraph = {
  schemaVersion: "engineering-flow-graph/v0";
  id: string;
  title: string;
  sourceInputId: string;
  nodes: EngineeringNode[];
  edges: EngineeringEdge[];
  createdAt: string;
  updatedAt: string;
};

export type FullAIContext = {
  schemaVersion: "engineering-flow-full-context/v0";
  generatedAt: string;
  projectName: string;
  projectIntent: string;
  engineeringFlowInput: EngineeringFlowInput;
  engineeringFlowGraph: EngineeringFlowGraph | null;
  confirmationPolicy: {
    confirmedMeans: string;
    suggestedMeans: string;
    needsReviewMeans: string;
    rejectedMeans: string;
  };
  confirmationSummary: {
    confirmedNodeIds: string[];
    suggestedNodeIds: string[];
    needsReviewNodeIds: string[];
    confirmedEdgeIds: string[];
    suggestedEdgeIds: string[];
    rejectedEdgeIds: string[];
    blockingQuestionNodeIds: string[];
  };
};

export type EFlowWorkspaceDocument = {
  schemaVersion: "eflow-workspace/v0.3";
  appVersion: "0.3";
  savedAt: string;
  workspaceName: string;
  engineeringFlowInput: EngineeringFlowInput;
  engineeringFlowGraph: EngineeringFlowGraph | null;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  auditLog?: EFlowAuditEvent[];
};
