import type {
  EdgeStatus,
  EFlowWorkspaceDocument,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNodeType,
  FullAIContext,
  NodeStatus,
  RelationshipType,
  SourceType,
} from "../types/engineeringFlow";
import {
  EFLOW_EVIDENCE_TYPES,
  LIFECYCLE_STATUSES,
  type EFlowEvidenceType,
  type LifecycleStatus,
} from "../types/eflowCommand";
import { validateEFlowAuditLog } from "./auditLog";
import { getExactEdgeRelationshipKey } from "./graphIntegrity";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

const sourceTypes: SourceType[] = [
  "user_input",
  "example_seed",
  "system_generated",
  "ai_suggested",
  "manual_edit",
  "ai_command",
  "ai_progress_sync",
  "context_import",
];

const nodeTypes: EngineeringNodeType[] = [
  "intent",
  "user",
  "screen",
  "feature",
  "flow_step",
  "data_object",
  "ai_task",
  "question",
];

const nodeStatuses: NodeStatus[] = ["suggested", "confirmed", "needs_review"];
const edgeStatuses: EdgeStatus[] = ["suggested", "confirmed", "rejected"];

const relationshipTypes: RelationshipType[] = [
  "serves",
  "uses",
  "leads_to",
  "contains",
  "depends_on",
  "produces",
  "needs_confirmation",
  "relates_to",
];

const provenanceStringFields = [
  "sourceInputSection",
  "sourceInputId",
  "generationRule",
  "commandId",
  "actorId",
  "updatedAt",
  "reason",
] as const;

export function isEngineeringFlowInput(value: unknown): value is EngineeringFlowInput {
  if (!isRecord(value)) return false;

  return (
    value.schemaVersion === "engineering-flow-input/v0" &&
    typeof value.id === "string" &&
    typeof value.projectName === "string" &&
    typeof value.projectIntent === "string" &&
    typeof value.sourceType === "string" &&
    sourceTypes.includes(value.sourceType as SourceType) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.userTypes) &&
    Array.isArray(value.mainScreens) &&
    Array.isArray(value.coreFunctions) &&
    Array.isArray(value.flowSteps) &&
    Array.isArray(value.dataObjects) &&
    Array.isArray(value.aiRoles) &&
    Array.isArray(value.unknowns)
  );
}

export function isEngineeringFlowGraph(value: unknown): value is EngineeringFlowGraph {
  return validateEngineeringFlowGraph(value).ok;
}

export function isFullAIContext(value: unknown): value is FullAIContext {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== "engineering-flow-full-context/v0") return false;
  if (!isEngineeringFlowInput(value.engineeringFlowInput)) return false;

  return value.engineeringFlowGraph === null || isEngineeringFlowGraph(value.engineeringFlowGraph);
}

export function isEFlowWorkspaceDocument(value: unknown): value is EFlowWorkspaceDocument {
  return validateEFlowWorkspaceDocument(value).ok;
}

export function validateEFlowWorkspaceDocument(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["Workspace document must be an object."] };
  }

  if (value.schemaVersion !== "eflow-workspace/v0.3") {
    errors.push('Workspace schemaVersion must be "eflow-workspace/v0.3".');
  }

  if (value.appVersion !== "0.3") {
    errors.push('Workspace appVersion must be "0.3".');
  }

  if (typeof value.savedAt !== "string") {
    errors.push("Workspace savedAt must be a string.");
  }

  if (typeof value.workspaceName !== "string") {
    errors.push("Workspace workspaceName must be a string.");
  }

  if (!isEngineeringFlowInput(value.engineeringFlowInput)) {
    errors.push("Workspace engineeringFlowInput is missing required fields.");
  }

  if (value.engineeringFlowGraph !== null) {
    const graphValidation = validateEngineeringFlowGraph(value.engineeringFlowGraph);
    if (!graphValidation.ok) {
      errors.push(...graphValidation.errors);
    }
  }

  if (
    value.selectedNodeId !== undefined &&
    value.selectedNodeId !== null &&
    typeof value.selectedNodeId !== "string"
  ) {
    errors.push("Workspace selectedNodeId must be a string or null when provided.");
  }

  if (
    value.selectedEdgeId !== undefined &&
    value.selectedEdgeId !== null &&
    typeof value.selectedEdgeId !== "string"
  ) {
    errors.push("Workspace selectedEdgeId must be a string or null when provided.");
  }

  if (value.auditLog !== undefined) {
    const auditValidation = validateEFlowAuditLog(value.auditLog);
    if (!auditValidation.ok) {
      errors.push(...auditValidation.errors);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateEngineeringFlowGraph(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["Graph must be an object."] };
  }

  if (value.schemaVersion !== "engineering-flow-graph/v0") {
    errors.push('Graph schemaVersion must be "engineering-flow-graph/v0".');
  }

  if (!Array.isArray(value.nodes)) {
    errors.push("Graph nodes must be an array.");
  }

  if (!Array.isArray(value.edges)) {
    errors.push("Graph edges must be an array.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const nodes = value.nodes as unknown[];
  const edges = value.edges as unknown[];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const edgeRelationshipKeys = new Set<string>();

  nodes.forEach((node, index) => {
    if (!isRecord(node)) {
      errors.push(`Node ${index} must be an object.`);
      return;
    }

    if (typeof node.id !== "string" || !node.id) {
      errors.push(`Node ${index} is missing id.`);
    } else if (nodeIds.has(node.id)) {
      errors.push(`Node ${node.id} has duplicate id.`);
    } else {
      nodeIds.add(node.id);
    }

    if (!nodeTypes.includes(node.type as EngineeringNodeType)) {
      errors.push(`Node ${node.id ?? index} has invalid type.`);
    }

    if (typeof node.title !== "string" || !node.title) {
      errors.push(`Node ${node.id ?? index} is missing title.`);
    }

    if (!nodeStatuses.includes(node.status as NodeStatus)) {
      errors.push(`Node ${node.id ?? index} has invalid status.`);
    }

    if (typeof node.aiReadableSummary !== "string" || !node.aiReadableSummary) {
      errors.push(`Node ${node.id ?? index} is missing aiReadableSummary.`);
    }

    validateConfidence(node.confidence, `Node ${node.id ?? index}`, errors);
    validateProvenance(node.provenance, `Node ${node.id ?? index}`, errors);

    if (
      node.lifecycleStatus !== undefined &&
      !LIFECYCLE_STATUSES.includes(node.lifecycleStatus as LifecycleStatus)
    ) {
      errors.push(`Node ${node.id ?? index} has invalid lifecycleStatus.`);
    }

    if (!isRecord(node.position)) {
      errors.push(`Node ${node.id ?? index} is missing position.`);
    } else {
      if (typeof node.position.x !== "number") {
        errors.push(`Node ${node.id ?? index} position.x must be a number.`);
      }
      if (typeof node.position.y !== "number") {
        errors.push(`Node ${node.id ?? index} position.y must be a number.`);
      }
    }
  });

  edges.forEach((edge, index) => {
    if (!isRecord(edge)) {
      errors.push(`Edge ${index} must be an object.`);
      return;
    }

    if (typeof edge.id !== "string" || !edge.id) {
      errors.push(`Edge ${index} is missing id.`);
    } else if (edgeIds.has(edge.id)) {
      errors.push(`Edge ${edge.id} has duplicate id.`);
    } else {
      edgeIds.add(edge.id);
    }

    if (typeof edge.source !== "string" || !edge.source) {
      errors.push(`Edge ${edge.id ?? index} is missing source.`);
    } else if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id ?? index} source references missing node "${edge.source}".`);
    }

    if (typeof edge.target !== "string" || !edge.target) {
      errors.push(`Edge ${edge.id ?? index} is missing target.`);
    } else if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id ?? index} target references missing node "${edge.target}".`);
    }

    if (
      typeof edge.source === "string" &&
      edge.source &&
      typeof edge.target === "string" &&
      edge.target &&
      edge.source === edge.target
    ) {
      errors.push(`Edge ${edge.id ?? index} cannot reference itself.`);
    }

    if (!relationshipTypes.includes(edge.relationshipType as RelationshipType)) {
      errors.push(`Edge ${edge.id ?? index} has invalid relationshipType.`);
    }

    if (
      typeof edge.source === "string" &&
      edge.source &&
      typeof edge.target === "string" &&
      edge.target &&
      typeof edge.relationshipType === "string" &&
      edge.relationshipType
    ) {
      const relationshipKey = getExactEdgeRelationshipKey({
        source: edge.source,
        target: edge.target,
        relationshipType: edge.relationshipType,
      });

      if (edgeRelationshipKeys.has(relationshipKey)) {
        errors.push(
          `Edge ${edge.id ?? index} duplicates relationship ${edge.source} -> ${edge.target} (${edge.relationshipType}).`,
        );
      } else {
        edgeRelationshipKeys.add(relationshipKey);
      }
    }

    if (!edgeStatuses.includes(edge.status as EdgeStatus)) {
      errors.push(`Edge ${edge.id ?? index} has invalid status.`);
    }

    if (typeof edge.description !== "string") {
      errors.push(`Edge ${edge.id ?? index} is missing description.`);
    }

    validateConfidence(edge.confidence, `Edge ${edge.id ?? index}`, errors);
    validateProvenance(edge.provenance, `Edge ${edge.id ?? index}`, errors);

    if (
      edge.lifecycleStatus !== undefined &&
      !LIFECYCLE_STATUSES.includes(edge.lifecycleStatus as LifecycleStatus)
    ) {
      errors.push(`Edge ${edge.id ?? index} has invalid lifecycleStatus.`);
    }
  });

  return { ok: errors.length === 0, errors };
}

function validateConfidence(
  confidence: unknown,
  subject: string,
  errors: string[],
): void {
  if (confidence === undefined) {
    errors.push(`${subject} is missing confidence.`);
    return;
  }

  if (
    typeof confidence !== "number" ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    errors.push(`${subject} has invalid confidence.`);
  }
}

function validateProvenance(
  provenance: unknown,
  subject: string,
  errors: string[],
): void {
  if (provenance === undefined) {
    errors.push(`${subject} is missing provenance.`);
    return;
  }

  if (!isRecord(provenance) || Array.isArray(provenance)) {
    errors.push(`${subject} has invalid provenance.`);
    return;
  }

  if (
    typeof provenance.sourceType !== "string" ||
    !sourceTypes.includes(provenance.sourceType as SourceType)
  ) {
    errors.push(`${subject} has invalid provenance.sourceType.`);
  }

  provenanceStringFields.forEach((field) => {
    if (provenance[field] !== undefined && typeof provenance[field] !== "string") {
      errors.push(`${subject} provenance.${field} must be a string when provided.`);
    }
  });

  if (
    provenance.sourceInputIds !== undefined &&
    (!Array.isArray(provenance.sourceInputIds) ||
      provenance.sourceInputIds.some((sourceInputId) => typeof sourceInputId !== "string"))
  ) {
    errors.push(`${subject} provenance.sourceInputIds must be an array of strings when provided.`);
  }

  validateEvidence(provenance.evidence, `${subject} provenance.evidence`, errors);
}

function validateEvidence(
  evidence: unknown,
  path: string,
  errors: string[],
): void {
  if (evidence === undefined) return;

  if (!Array.isArray(evidence)) {
    errors.push(`${path} must be an array when provided.`);
    return;
  }

  evidence.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;

    if (!isRecord(entry) || Array.isArray(entry)) {
      errors.push(`${entryPath} must be an object.`);
      return;
    }

    if (!EFLOW_EVIDENCE_TYPES.includes(entry.type as EFlowEvidenceType)) {
      errors.push(`${entryPath}.type has invalid evidence type.`);
    }

    if (entry.uri !== undefined && typeof entry.uri !== "string") {
      errors.push(`${entryPath}.uri must be a string when provided.`);
    }

    if (entry.text !== undefined && typeof entry.text !== "string") {
      errors.push(`${entryPath}.text must be a string when provided.`);
    }

    if (
      entry.metadata !== undefined &&
      (!isRecord(entry.metadata) || Array.isArray(entry.metadata))
    ) {
      errors.push(`${entryPath}.metadata must be an object when provided.`);
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
