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

type ValidationResult = {
  ok: boolean;
  errors: string[];
};

const sourceTypes: SourceType[] = [
  "user_input",
  "example_seed",
  "system_generated",
  "ai_suggested",
  "manual_edit",
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
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== "eflow-workspace/v0.3") return false;
  if (value.appVersion !== "0.3") return false;
  if (typeof value.savedAt !== "string") return false;
  if (typeof value.workspaceName !== "string") return false;
  if (!isEngineeringFlowInput(value.engineeringFlowInput)) return false;
  if (
    value.engineeringFlowGraph !== null &&
    !isEngineeringFlowGraph(value.engineeringFlowGraph)
  ) {
    return false;
  }
  if (value.selectedNodeId !== undefined && value.selectedNodeId !== null && typeof value.selectedNodeId !== "string") {
    return false;
  }
  if (value.selectedEdgeId !== undefined && value.selectedEdgeId !== null && typeof value.selectedEdgeId !== "string") {
    return false;
  }

  return true;
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

  nodes.forEach((node, index) => {
    if (!isRecord(node)) {
      errors.push(`Node ${index} must be an object.`);
      return;
    }

    if (typeof node.id !== "string" || !node.id) {
      errors.push(`Node ${index} is missing id.`);
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

    if (!relationshipTypes.includes(edge.relationshipType as RelationshipType)) {
      errors.push(`Edge ${edge.id ?? index} has invalid relationshipType.`);
    }

    if (!edgeStatuses.includes(edge.status as EdgeStatus)) {
      errors.push(`Edge ${edge.id ?? index} has invalid status.`);
    }

    if (typeof edge.description !== "string") {
      errors.push(`Edge ${edge.id ?? index} is missing description.`);
    }
  });

  return { ok: errors.length === 0, errors };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
