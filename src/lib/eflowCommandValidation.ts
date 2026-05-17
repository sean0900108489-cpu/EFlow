import {
  EFLOW_ACTOR_TYPES,
  EFLOW_COMMAND_INTENTS,
  EFLOW_COMMAND_MODES,
  EFLOW_COMMAND_SCHEMA_VERSION,
  EFLOW_EVIDENCE_TYPES,
  EFLOW_NODE_TYPES,
  EFLOW_RELATIONSHIP_TYPES,
  LIFECYCLE_STATUSES,
  REVIEW_STATUSES,
  type EFlowActorType,
  type EFlowCommandEnvelope,
  type EFlowCommandIntent,
  type EFlowCommandMode,
  type EFlowEvidenceType,
  type EFlowNodeType,
  type EFlowRelationshipType,
  type LifecycleStatus,
  type ReviewStatus,
} from "../types/eflowCommand";

export interface EFlowCommandValidationIssue {
  severity: "error" | "warning";
  code: string;
  path: string;
  message: string;
}

export interface EFlowCommandValidationResult {
  ok: boolean;
  errors: EFlowCommandValidationIssue[];
  warnings: EFlowCommandValidationIssue[];
}

const supportedOperationNames = [
  "upsertNode",
  "updateNode",
  "transitionNode",
  "upsertEdge",
  "updateEdge",
  "transitionEdge",
  "addDecision",
  "addQuestion",
] as const;

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return REVIEW_STATUSES.includes(value as ReviewStatus);
}

export function isLifecycleStatus(value: unknown): value is LifecycleStatus {
  return LIFECYCLE_STATUSES.includes(value as LifecycleStatus);
}

export function isEFlowCommandEnvelope(value: unknown): value is EFlowCommandEnvelope {
  return validateEFlowCommandEnvelope(value).ok;
}

export function validateEFlowCommandEnvelope(
  input: unknown,
): EFlowCommandValidationResult {
  const issues: EFlowCommandValidationIssue[] = [];

  if (!isRecord(input)) {
    issues.push(
      makeIssue("error", "command.not_object", "$", "Command envelope must be an object."),
    );
    return toResult(issues);
  }

  if (input.schemaVersion !== EFLOW_COMMAND_SCHEMA_VERSION) {
    issues.push(
      makeIssue(
        "error",
        "command.invalid_schema_version",
        "$.schemaVersion",
        `schemaVersion must be "${EFLOW_COMMAND_SCHEMA_VERSION}".`,
      ),
    );
  }

  requireNonEmptyString(input.commandId, "$.commandId", "commandId", issues);
  requireNonEmptyString(input.projectId, "$.projectId", "projectId", issues);
  requireNonEmptyString(input.createdAt, "$.createdAt", "createdAt", issues);

  if (input.graphId !== undefined && typeof input.graphId !== "string") {
    issues.push(makeIssue("error", "command.invalid_graph_id", "$.graphId", "graphId must be a string."));
  }

  if (input.baseRevision !== undefined && typeof input.baseRevision !== "string") {
    issues.push(
      makeIssue("error", "command.invalid_base_revision", "$.baseRevision", "baseRevision must be a string."),
    );
  }

  validateActor(input.actor, "$.actor", issues);

  if (!EFLOW_COMMAND_INTENTS.includes(input.intent as EFlowCommandIntent)) {
    issues.push(
      makeIssue("error", "command.invalid_intent", "$.intent", "intent must be a supported command intent."),
    );
  }

  if (
    input.mode !== undefined &&
    !EFLOW_COMMAND_MODES.includes(input.mode as EFlowCommandMode)
  ) {
    issues.push(
      makeIssue("error", "command.invalid_mode", "$.mode", 'mode must be "apply" or "dry_run".'),
    );
  }

  if (!Array.isArray(input.operations) || input.operations.length === 0) {
    issues.push(
      makeIssue(
        "error",
        "command.invalid_operations",
        "$.operations",
        "operations must be a non-empty array.",
      ),
    );
  } else {
    input.operations.forEach((operation, index) =>
      validateOperation(operation, `$.operations[${index}]`, issues),
    );
  }

  return toResult(issues);
}

function validateOperation(
  operation: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (!isRecord(operation)) {
    issues.push(makeIssue("error", "operation.not_object", path, "Operation must be an object."));
    return;
  }

  if (!supportedOperationNames.includes(operation.op as (typeof supportedOperationNames)[number])) {
    issues.push(
      makeIssue("error", "operation.unsupported_op", `${path}.op`, "op must be a supported operation name."),
    );
    return;
  }

  validateOptionalEvidence(operation.evidence, `${path}.evidence`, issues);

  switch (operation.op) {
    case "updateNode":
      requireNonEmptyString(operation.id, `${path}.id`, "id", issues);
      validatePatch(operation.patch, `${path}.patch`, issues);
      break;
    case "transitionNode":
      requireNonEmptyString(operation.id, `${path}.id`, "id", issues);
      if (!isLifecycleStatus(operation.to)) {
        issues.push(
          makeIssue("error", "operation.invalid_lifecycle_status", `${path}.to`, "to must be a lifecycleStatus."),
        );
      }
      if (operation.from !== undefined && !isLifecycleStatus(operation.from)) {
        issues.push(
          makeIssue(
            "error",
            "operation.invalid_lifecycle_status",
            `${path}.from`,
            "from must be a lifecycleStatus when provided.",
          ),
        );
      }
      break;
    case "upsertNode":
      validateCommandNode(operation.node, `${path}.node`, issues);
      break;
    case "updateEdge":
      requireNonEmptyString(operation.id, `${path}.id`, "id", issues);
      validatePatch(operation.patch, `${path}.patch`, issues);
      break;
    case "transitionEdge":
      requireNonEmptyString(operation.id, `${path}.id`, "id", issues);
      if (!isLifecycleStatus(operation.to)) {
        issues.push(
          makeIssue("error", "operation.invalid_lifecycle_status", `${path}.to`, "to must be a lifecycleStatus."),
        );
      }
      if (operation.from !== undefined && !isLifecycleStatus(operation.from)) {
        issues.push(
          makeIssue(
            "error",
            "operation.invalid_lifecycle_status",
            `${path}.from`,
            "from must be a lifecycleStatus when provided.",
          ),
        );
      }
      break;
    case "upsertEdge":
      validateCommandEdge(operation.edge, `${path}.edge`, issues);
      break;
    case "addDecision":
      validateDecision(operation.decision, `${path}.decision`, issues);
      break;
    case "addQuestion":
      validateQuestion(operation.question, `${path}.question`, issues);
      break;
  }
}

function validateCommandNode(
  node: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (!isRecord(node)) {
    issues.push(makeIssue("error", "node.not_object", path, "node must be an object."));
    return;
  }

  requireNonEmptyString(node.id, `${path}.id`, "id", issues);
  if (!EFLOW_NODE_TYPES.includes(node.type as EFlowNodeType)) {
    issues.push(makeIssue("error", "node.invalid_type", `${path}.type`, "node type is not supported by the command schema."));
  }
  requireNonEmptyString(node.title, `${path}.title`, "title", issues);
  if (typeof node.description !== "string") {
    issues.push(makeIssue("error", "node.invalid_description", `${path}.description`, "description must be a string."));
  }
  validateReviewAndLifecycle(node, path, issues);
  validateProvenance(node.provenance, `${path}.provenance`, issues, true);
}

function validateCommandEdge(
  edge: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (!isRecord(edge)) {
    issues.push(makeIssue("error", "edge.not_object", path, "edge must be an object."));
    return;
  }

  requireNonEmptyString(edge.id, `${path}.id`, "id", issues);
  requireNonEmptyString(edge.source, `${path}.source`, "source", issues);
  requireNonEmptyString(edge.target, `${path}.target`, "target", issues);
  if (!EFLOW_RELATIONSHIP_TYPES.includes(edge.relationshipType as EFlowRelationshipType)) {
    issues.push(
      makeIssue(
        "error",
        "edge.invalid_relationship_type",
        `${path}.relationshipType`,
        "relationshipType is not supported by the command schema.",
      ),
    );
  }
  if (edge.description !== undefined && typeof edge.description !== "string") {
    issues.push(
      makeIssue("error", "edge.invalid_description", `${path}.description`, "description must be a string."),
    );
  }
  validateReviewAndLifecycle(edge, path, issues);
  validateProvenance(edge.provenance, `${path}.provenance`, issues, true);
}

function validatePatch(
  patch: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (!isRecord(patch)) {
    issues.push(makeIssue("error", "operation.invalid_patch", path, "patch must be an object."));
    return;
  }

  if (Object.keys(patch).length === 0) {
    issues.push(makeIssue("warning", "operation.empty_patch", path, "patch is empty."));
  }

  validateReviewAndLifecycle(patch, path, issues, true);

  if (patch.type !== undefined && !EFLOW_NODE_TYPES.includes(patch.type as EFlowNodeType)) {
    issues.push(makeIssue("error", "patch.invalid_node_type", `${path}.type`, "type is not supported by the command schema."));
  }

  if (
    patch.relationshipType !== undefined &&
    !EFLOW_RELATIONSHIP_TYPES.includes(patch.relationshipType as EFlowRelationshipType)
  ) {
    issues.push(
      makeIssue(
        "error",
        "patch.invalid_relationship_type",
        `${path}.relationshipType`,
        "relationshipType is not supported by the command schema.",
      ),
    );
  }

  if (patch.position !== undefined) {
    if (!isRecord(patch.position)) {
      issues.push(makeIssue("error", "patch.invalid_position", `${path}.position`, "position must be an object."));
    } else {
      if (typeof patch.position.x !== "number") {
        issues.push(makeIssue("error", "patch.invalid_position", `${path}.position.x`, "position.x must be a number."));
      }
      if (typeof patch.position.y !== "number") {
        issues.push(makeIssue("error", "patch.invalid_position", `${path}.position.y`, "position.y must be a number."));
      }
    }
  }

  validateProvenance(patch.provenance, `${path}.provenance`, issues, false);
}

function validateDecision(
  decision: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (!isRecord(decision)) {
    issues.push(makeIssue("error", "decision.not_object", path, "decision must be an object."));
    return;
  }

  requireNonEmptyString(decision.id, `${path}.id`, "id", issues);
  requireNonEmptyString(decision.title, `${path}.title`, "title", issues);
  validateReviewAndLifecycle(decision, path, issues, true);
}

function validateQuestion(
  question: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (!isRecord(question)) {
    issues.push(makeIssue("error", "question.not_object", path, "question must be an object."));
    return;
  }

  requireNonEmptyString(question.id, `${path}.id`, "id", issues);
  requireNonEmptyString(question.title, `${path}.title`, "title", issues);
  requireNonEmptyString(question.question, `${path}.question`, "question", issues);
  validateReviewAndLifecycle(question, path, issues, true);
}

function validateReviewAndLifecycle(
  value: Record<string, unknown>,
  path: string,
  issues: EFlowCommandValidationIssue[],
  optional = false,
): void {
  if (!optional || value.reviewStatus !== undefined) {
    if (!isReviewStatus(value.reviewStatus)) {
      issues.push(
        makeIssue(
          "error",
          "value.invalid_review_status",
          `${path}.reviewStatus`,
          "reviewStatus must be a supported review status.",
        ),
      );
    }
  }

  if (!optional || value.lifecycleStatus !== undefined) {
    if (!isLifecycleStatus(value.lifecycleStatus)) {
      issues.push(
        makeIssue(
          "error",
          "value.invalid_lifecycle_status",
          `${path}.lifecycleStatus`,
          "lifecycleStatus must be a supported lifecycle status.",
        ),
      );
    }
  }
}

function validateActor(
  actor: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (!isRecord(actor)) {
    issues.push(makeIssue("error", "actor.not_object", path, "actor must be an object."));
    return;
  }

  if (!EFLOW_ACTOR_TYPES.includes(actor.type as EFlowActorType)) {
    issues.push(makeIssue("error", "actor.invalid_type", `${path}.type`, "actor.type must be supported."));
  }
  requireNonEmptyString(actor.id, `${path}.id`, "actor.id", issues);
}

function validateOptionalEvidence(
  evidence: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (evidence === undefined) return;
  if (!Array.isArray(evidence)) {
    issues.push(makeIssue("error", "evidence.not_array", path, "evidence must be an array."));
    return;
  }

  evidence.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(makeIssue("error", "evidence.not_object", `${path}[${index}]`, "evidence entry must be an object."));
      return;
    }

    if (!EFLOW_EVIDENCE_TYPES.includes(entry.type as EFlowEvidenceType)) {
      issues.push(
        makeIssue("error", "evidence.invalid_type", `${path}[${index}].type`, "evidence type is not supported."),
      );
    }
  });
}

function validateProvenance(
  provenance: unknown,
  path: string,
  issues: EFlowCommandValidationIssue[],
  required: boolean,
): void {
  if (provenance === undefined) {
    if (required) {
      issues.push(makeIssue("error", "provenance.required", path, "provenance is required."));
    }
    return;
  }

  if (!isRecord(provenance)) {
    issues.push(makeIssue("error", "provenance.not_object", path, "provenance must be an object."));
    return;
  }

  requireNonEmptyString(provenance.sourceType, `${path}.sourceType`, "sourceType", issues);
  validateOptionalEvidence(provenance.evidence, `${path}.evidence`, issues);
}

function requireNonEmptyString(
  value: unknown,
  path: string,
  label: string,
  issues: EFlowCommandValidationIssue[],
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(makeIssue("error", "value.required_string", path, `${label} must be a non-empty string.`));
  }
}

function makeIssue(
  severity: EFlowCommandValidationIssue["severity"],
  code: string,
  path: string,
  message: string,
): EFlowCommandValidationIssue {
  return { severity, code, path, message };
}

function toResult(issues: EFlowCommandValidationIssue[]): EFlowCommandValidationResult {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
