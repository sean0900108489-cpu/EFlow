import type {
  EFlowCommandEdge,
  EFlowCommandEnvelope,
  EFlowCommandNode,
  EFlowEdgePatch,
  EFlowEvidence,
  EFlowNodePatch,
  EFlowOperation,
  EFlowProvenance,
  LifecycleStatus,
  ReviewStatus,
} from "../types/eflowCommand";
import type {
  EdgeStatus,
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringNode,
  EngineeringNodeType,
  NodeStatus,
  RelationshipType,
  SourceType,
} from "../types/engineeringFlow";
import { nowIso } from "./dates";
import {
  type EFlowCommandValidationIssue,
  validateEFlowCommandEnvelope,
} from "./eflowCommandValidation";

export const DEFAULT_COMMAND_LIFECYCLE_STATUS: LifecycleStatus = "planned";

export interface EFlowCommandChange {
  operationIndex: number;
  operation: string;
  targetId?: string;
  changeType:
    | "node_updated"
    | "node_upserted"
    | "node_transitioned"
    | "edge_updated"
    | "edge_upserted"
    | "edge_transitioned"
    | "skipped";
  summary: string;
}

export interface EFlowCommandApplyResult {
  ok: boolean;
  mode: "apply" | "dry_run";
  graph: EngineeringFlowGraph;
  changes: EFlowCommandChange[];
  errors: EFlowCommandValidationIssue[];
  warnings: EFlowCommandValidationIssue[];
}

const supportedGraphNodeTypes: EngineeringNodeType[] = [
  "intent",
  "user",
  "screen",
  "feature",
  "flow_step",
  "data_object",
  "ai_task",
  "question",
];

const supportedGraphRelationshipTypes: RelationshipType[] = [
  "serves",
  "uses",
  "leads_to",
  "contains",
  "depends_on",
  "produces",
  "needs_confirmation",
  "relates_to",
];

export function dryRunEFlowCommandOnGraph(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
): EFlowCommandApplyResult {
  return runCommandOnGraph(graph, command, "dry_run");
}

export function applyEFlowCommandToGraph(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
): EFlowCommandApplyResult {
  return runCommandOnGraph(graph, command, command.mode === "dry_run" ? "dry_run" : "apply");
}

function runCommandOnGraph(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
  mode: "apply" | "dry_run",
): EFlowCommandApplyResult {
  const validation = validateEFlowCommandEnvelope(command);
  if (!validation.ok) {
    return {
      ok: false,
      mode,
      graph,
      changes: [],
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const workingGraph = cloneGraph(graph);
  const changes: EFlowCommandChange[] = [];
  const errors: EFlowCommandValidationIssue[] = [];

  command.operations.forEach((operation, operationIndex) => {
    if (errors.length > 0) return;
    applyOperation(workingGraph, command, operation, operationIndex, changes, errors);
  });

  if (errors.length > 0) {
    return {
      ok: false,
      mode,
      graph,
      changes: [],
      errors,
      warnings: validation.warnings,
    };
  }

  if (mode === "apply") {
    workingGraph.updatedAt = nowIso();
  }

  return {
    ok: true,
    mode,
    graph: mode === "apply" ? workingGraph : graph,
    changes,
    errors: [],
    warnings: validation.warnings,
  };
}

function applyOperation(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
  operation: EFlowOperation,
  operationIndex: number,
  changes: EFlowCommandChange[],
  errors: EFlowCommandValidationIssue[],
): void {
  switch (operation.op) {
    case "updateNode":
      updateNode(graph, command, operation.id, operation.patch, operation, operationIndex, changes, errors);
      break;
    case "transitionNode":
      transitionNode(graph, command, operation.id, operation.from, operation.to, operation, operationIndex, changes, errors);
      break;
    case "upsertNode":
      upsertNode(graph, command, operation.node, operation, operationIndex, changes, errors);
      break;
    case "updateEdge":
      updateEdge(graph, command, operation.id, operation.patch, operation, operationIndex, changes, errors);
      break;
    case "transitionEdge":
      transitionEdge(graph, command, operation.id, operation.from, operation.to, operation, operationIndex, changes, errors);
      break;
    case "upsertEdge":
      upsertEdge(graph, command, operation.edge, operation, operationIndex, changes, errors);
      break;
    case "addDecision":
    case "addQuestion":
      errors.push(
        makeApplyIssue(
          "command.operation_unsupported_for_graph",
          `$.operations[${operationIndex}].op`,
          `${operation.op} is valid command schema, but graph mutation support is not implemented in this milestone.`,
        ),
      );
      break;
  }
}

function updateNode(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
  id: string,
  patch: EFlowNodePatch,
  operation: EFlowOperation,
  operationIndex: number,
  changes: EFlowCommandChange[],
  errors: EFlowCommandValidationIssue[],
): void {
  const nodeIndex = graph.nodes.findIndex((node) => node.id === id);
  if (nodeIndex === -1) {
    errors.push(makeApplyIssue("graph.node_missing", `$.operations[${operationIndex}].id`, `Node "${id}" does not exist.`));
    return;
  }

  const node = graph.nodes[nodeIndex];
  if (patch.type !== undefined && !isSupportedGraphNodeType(patch.type)) {
    errors.push(makeUnsupportedNodeTypeIssue(patch.type, operationIndex));
    return;
  }

  const nextStatus = reviewStatusToNodeStatus(patch.reviewStatus);
  if (patch.reviewStatus !== undefined && nextStatus === null) {
    errors.push(
      makeApplyIssue(
        "graph.node_review_status_unsupported",
        `$.operations[${operationIndex}].patch.reviewStatus`,
        `Node reviewStatus "${patch.reviewStatus}" cannot be represented in the legacy node.status field.`,
      ),
    );
    return;
  }

  const updatedNode: EngineeringNode = {
    ...node,
    type: patch.type !== undefined ? (patch.type as EngineeringNodeType) : node.type,
    title: patch.title ?? node.title,
    description: patch.description ?? node.description,
    status: nextStatus ?? node.status,
    aiReadableSummary: patch.aiReadableSummary ?? node.aiReadableSummary,
    position: patch.position ? { ...patch.position } : { ...node.position },
    confidence: patch.confidence ?? node.confidence,
    provenance: patch.provenance
      ? toNodeProvenance(patch.provenance, command, operation)
      : node.provenance,
    lifecycleStatus: patch.lifecycleStatus ?? node.lifecycleStatus ?? DEFAULT_COMMAND_LIFECYCLE_STATUS,
    commandProvenance: appendCommandProvenance(node.commandProvenance, command, operation),
    implementation: mergeImplementation(node, command, operation, patch.lifecycleStatus),
    metadata: patch.metadata ?? node.metadata,
  };

  graph.nodes[nodeIndex] = updatedNode;
  changes.push({
    operationIndex,
    operation: "updateNode",
    targetId: id,
    changeType: "node_updated",
    summary: `Updated node "${id}".`,
  });
}

function transitionNode(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
  id: string,
  from: LifecycleStatus | undefined,
  to: LifecycleStatus,
  operation: EFlowOperation,
  operationIndex: number,
  changes: EFlowCommandChange[],
  errors: EFlowCommandValidationIssue[],
): void {
  const nodeIndex = graph.nodes.findIndex((node) => node.id === id);
  if (nodeIndex === -1) {
    errors.push(makeApplyIssue("graph.node_missing", `$.operations[${operationIndex}].id`, `Node "${id}" does not exist.`));
    return;
  }

  const node = graph.nodes[nodeIndex];
  const currentLifecycle = node.lifecycleStatus ?? DEFAULT_COMMAND_LIFECYCLE_STATUS;
  if (from !== undefined && from !== currentLifecycle) {
    errors.push(
      makeApplyIssue(
        "graph.lifecycle_transition_conflict",
        `$.operations[${operationIndex}].from`,
        `Node "${id}" lifecycleStatus is "${currentLifecycle}", not "${from}".`,
      ),
    );
    return;
  }

  graph.nodes[nodeIndex] = {
    ...node,
    lifecycleStatus: to,
    commandProvenance: appendCommandProvenance(node.commandProvenance, command, operation),
    implementation: mergeImplementation(node, command, operation, to),
  };

  changes.push({
    operationIndex,
    operation: "transitionNode",
    targetId: id,
    changeType: "node_transitioned",
    summary: `Transitioned node "${id}" from "${currentLifecycle}" to "${to}".`,
  });
}

function upsertNode(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
  commandNode: EFlowCommandNode,
  operation: EFlowOperation,
  operationIndex: number,
  changes: EFlowCommandChange[],
  errors: EFlowCommandValidationIssue[],
): void {
  if (!isSupportedGraphNodeType(commandNode.type)) {
    errors.push(makeUnsupportedNodeTypeIssue(commandNode.type, operationIndex));
    return;
  }

  const nodeStatus = reviewStatusToNodeStatus(commandNode.reviewStatus);
  if (nodeStatus === null || nodeStatus === undefined) {
    errors.push(
      makeApplyIssue(
        "graph.node_review_status_unsupported",
        `$.operations[${operationIndex}].node.reviewStatus`,
        `Node reviewStatus "${commandNode.reviewStatus}" cannot be represented in the legacy node.status field.`,
      ),
    );
    return;
  }

  const existingIndex = graph.nodes.findIndex((node) => node.id === commandNode.id);
  const existingNode = existingIndex >= 0 ? graph.nodes[existingIndex] : null;
  const nextNode: EngineeringNode = {
    id: commandNode.id,
    type: commandNode.type,
    title: commandNode.title,
    description: commandNode.description,
    status: nodeStatus,
    aiReadableSummary:
      commandNode.aiReadableSummary ?? `${commandNode.title}: ${commandNode.description}`,
    position: commandNode.position ?? existingNode?.position ?? { x: 0, y: 0 },
    confidence: commandNode.confidence ?? existingNode?.confidence ?? 0.8,
    provenance: toNodeProvenance(commandNode.provenance, command, operation),
    lifecycleStatus: commandNode.lifecycleStatus ?? DEFAULT_COMMAND_LIFECYCLE_STATUS,
    commandProvenance: appendCommandProvenance(existingNode?.commandProvenance, command, operation),
    implementation: mergeImplementation(existingNode, command, operation, commandNode.lifecycleStatus, commandNode.implementation),
    metadata: commandNode.metadata ?? existingNode?.metadata,
  };

  if (existingIndex >= 0) {
    graph.nodes[existingIndex] = nextNode;
  } else {
    graph.nodes.push(nextNode);
  }

  changes.push({
    operationIndex,
    operation: "upsertNode",
    targetId: commandNode.id,
    changeType: "node_upserted",
    summary: existingIndex >= 0 ? `Updated existing node "${commandNode.id}".` : `Inserted node "${commandNode.id}".`,
  });
}

function updateEdge(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
  id: string,
  patch: EFlowEdgePatch,
  operation: EFlowOperation,
  operationIndex: number,
  changes: EFlowCommandChange[],
  errors: EFlowCommandValidationIssue[],
): void {
  const edgeIndex = graph.edges.findIndex((edge) => edge.id === id);
  if (edgeIndex === -1) {
    errors.push(makeApplyIssue("graph.edge_missing", `$.operations[${operationIndex}].id`, `Edge "${id}" does not exist.`));
    return;
  }

  const edge = graph.edges[edgeIndex];
  if (
    patch.relationshipType !== undefined &&
    !isSupportedGraphRelationshipType(patch.relationshipType)
  ) {
    errors.push(makeUnsupportedRelationshipTypeIssue(patch.relationshipType, operationIndex));
    return;
  }

  const nextRelationshipType = patch.relationshipType ?? edge.relationshipType;
  const nextStatus =
    patch.reviewStatus !== undefined ? reviewStatusToEdgeStatus(patch.reviewStatus) : undefined;
  if (patch.reviewStatus !== undefined && nextStatus === null) {
    errors.push(
      makeApplyIssue(
        "graph.edge_review_status_unsupported",
        `$.operations[${operationIndex}].patch.reviewStatus`,
        `Edge reviewStatus "${patch.reviewStatus}" cannot be represented in the legacy edge.status field.`,
      ),
    );
    return;
  }

  if (wouldDuplicateExactEdge(graph, edge.id, edge.source, edge.target, nextRelationshipType)) {
    errors.push(makeDuplicateEdgeIssue(edge.source, edge.target, nextRelationshipType, operationIndex));
    return;
  }

  graph.edges[edgeIndex] = {
    ...edge,
    relationshipType: nextRelationshipType,
    status: nextStatus ?? edge.status,
    description: patch.description ?? edge.description,
    confidence: patch.confidence ?? edge.confidence,
    provenance: patch.provenance ? toEdgeProvenance(patch.provenance, command, operation) : edge.provenance,
    lifecycleStatus: patch.lifecycleStatus ?? edge.lifecycleStatus ?? DEFAULT_COMMAND_LIFECYCLE_STATUS,
    commandProvenance: appendCommandProvenance(edge.commandProvenance, command, operation),
    implementation: mergeImplementation(edge, command, operation, patch.lifecycleStatus),
    metadata: patch.metadata ?? edge.metadata,
  };

  changes.push({
    operationIndex,
    operation: "updateEdge",
    targetId: id,
    changeType: "edge_updated",
    summary: `Updated edge "${id}".`,
  });
}

function transitionEdge(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
  id: string,
  from: LifecycleStatus | undefined,
  to: LifecycleStatus,
  operation: EFlowOperation,
  operationIndex: number,
  changes: EFlowCommandChange[],
  errors: EFlowCommandValidationIssue[],
): void {
  const edgeIndex = graph.edges.findIndex((edge) => edge.id === id);
  if (edgeIndex === -1) {
    errors.push(makeApplyIssue("graph.edge_missing", `$.operations[${operationIndex}].id`, `Edge "${id}" does not exist.`));
    return;
  }

  const edge = graph.edges[edgeIndex];
  const currentLifecycle = edge.lifecycleStatus ?? DEFAULT_COMMAND_LIFECYCLE_STATUS;
  if (from !== undefined && from !== currentLifecycle) {
    errors.push(
      makeApplyIssue(
        "graph.lifecycle_transition_conflict",
        `$.operations[${operationIndex}].from`,
        `Edge "${id}" lifecycleStatus is "${currentLifecycle}", not "${from}".`,
      ),
    );
    return;
  }

  graph.edges[edgeIndex] = {
    ...edge,
    lifecycleStatus: to,
    commandProvenance: appendCommandProvenance(edge.commandProvenance, command, operation),
    implementation: mergeImplementation(edge, command, operation, to),
  };

  changes.push({
    operationIndex,
    operation: "transitionEdge",
    targetId: id,
    changeType: "edge_transitioned",
    summary: `Transitioned edge "${id}" from "${currentLifecycle}" to "${to}".`,
  });
}

function upsertEdge(
  graph: EngineeringFlowGraph,
  command: EFlowCommandEnvelope,
  commandEdge: EFlowCommandEdge,
  operation: EFlowOperation,
  operationIndex: number,
  changes: EFlowCommandChange[],
  errors: EFlowCommandValidationIssue[],
): void {
  if (!isSupportedGraphRelationshipType(commandEdge.relationshipType)) {
    errors.push(makeUnsupportedRelationshipTypeIssue(commandEdge.relationshipType, operationIndex));
    return;
  }

  if (commandEdge.source === commandEdge.target) {
    errors.push(
      makeApplyIssue("graph.self_edge", `$.operations[${operationIndex}].edge`, "Edges cannot connect a node to itself."),
    );
    return;
  }

  if (!graph.nodes.some((node) => node.id === commandEdge.source)) {
    errors.push(
      makeApplyIssue(
        "graph.edge_source_missing",
        `$.operations[${operationIndex}].edge.source`,
        `Edge source node "${commandEdge.source}" does not exist.`,
      ),
    );
    return;
  }

  if (!graph.nodes.some((node) => node.id === commandEdge.target)) {
    errors.push(
      makeApplyIssue(
        "graph.edge_target_missing",
        `$.operations[${operationIndex}].edge.target`,
        `Edge target node "${commandEdge.target}" does not exist.`,
      ),
    );
    return;
  }

  if (
    wouldDuplicateExactEdge(
      graph,
      commandEdge.id,
      commandEdge.source,
      commandEdge.target,
      commandEdge.relationshipType,
    )
  ) {
    errors.push(
      makeDuplicateEdgeIssue(
        commandEdge.source,
        commandEdge.target,
        commandEdge.relationshipType,
        operationIndex,
      ),
    );
    return;
  }

  const edgeStatus = reviewStatusToEdgeStatus(commandEdge.reviewStatus);
  if (edgeStatus === null) {
    errors.push(
      makeApplyIssue(
        "graph.edge_review_status_unsupported",
        `$.operations[${operationIndex}].edge.reviewStatus`,
        `Edge reviewStatus "${commandEdge.reviewStatus}" cannot be represented in the legacy edge.status field.`,
      ),
    );
    return;
  }
  const existingIndex = graph.edges.findIndex((edge) => edge.id === commandEdge.id);
  const existingEdge = existingIndex >= 0 ? graph.edges[existingIndex] : null;
  const nextEdge: EngineeringEdge = {
    id: commandEdge.id,
    source: commandEdge.source,
    target: commandEdge.target,
    relationshipType: commandEdge.relationshipType,
    status: edgeStatus,
    description:
      commandEdge.description ??
      `AI command relationship from "${commandEdge.source}" to "${commandEdge.target}".`,
    confidence: commandEdge.confidence ?? existingEdge?.confidence ?? 0.8,
    provenance: toEdgeProvenance(commandEdge.provenance, command, operation),
    lifecycleStatus: commandEdge.lifecycleStatus ?? DEFAULT_COMMAND_LIFECYCLE_STATUS,
    commandProvenance: appendCommandProvenance(existingEdge?.commandProvenance, command, operation),
    implementation: mergeImplementation(existingEdge, command, operation, commandEdge.lifecycleStatus, commandEdge.implementation),
    metadata: commandEdge.metadata ?? existingEdge?.metadata,
  };

  if (existingIndex >= 0) {
    graph.edges[existingIndex] = nextEdge;
  } else {
    graph.edges.push(nextEdge);
  }

  changes.push({
    operationIndex,
    operation: "upsertEdge",
    targetId: commandEdge.id,
    changeType: "edge_upserted",
    summary: existingIndex >= 0 ? `Updated existing edge "${commandEdge.id}".` : `Inserted edge "${commandEdge.id}".`,
  });
}

function mergeImplementation(
  item: Pick<EngineeringNode | EngineeringEdge, "implementation" | "lifecycleStatus"> | null,
  command: EFlowCommandEnvelope,
  operation: EFlowOperation,
  lifecycleStatus?: LifecycleStatus,
  incomingImplementation?: EngineeringNode["implementation"],
): EngineeringNode["implementation"] {
  const currentImplementation = incomingImplementation ?? item?.implementation ?? {};
  if (!lifecycleStatus) return currentImplementation;

  const from = item?.lifecycleStatus ?? DEFAULT_COMMAND_LIFECYCLE_STATUS;
  const transition = {
    from,
    to: lifecycleStatus,
    at: nowIso(),
    by: command.actor,
    commandId: command.commandId,
    reason: operation.reason,
    evidence: operation.evidence,
  };

  return {
    ...currentImplementation,
    evidence: currentImplementation.evidence,
    stateHistory: [...(currentImplementation.stateHistory ?? []), transition],
  };
}

function appendCommandProvenance(
  existing: EFlowProvenance[] | undefined,
  command: EFlowCommandEnvelope,
  operation: EFlowOperation,
): EFlowProvenance[] {
  return [
    ...(existing ?? []),
    {
      sourceType: command.intent === "progress_sync" ? "ai_progress_sync" : "ai_command",
      commandId: command.commandId,
      actorId: command.actor.id,
      sourceProjectId: command.projectId,
      createdAt: command.createdAt,
      updatedAt: nowIso(),
      reason: operation.reason,
      evidence: operation.evidence,
      metadata: operation.metadata,
    },
  ];
}

function toNodeProvenance(
  provenance: EFlowProvenance,
  command: EFlowCommandEnvelope,
  operation: EFlowOperation,
): EngineeringNode["provenance"] {
  return {
    sourceType: toSourceType(provenance.sourceType),
    sourceInputId: provenance.sourceInputIds?.[0],
    generationRule: provenance.generationRule,
    commandId: provenance.commandId ?? command.commandId,
    actorId: provenance.actorId ?? command.actor.id,
    updatedAt: nowIso(),
    reason: provenance.reason ?? operation.reason,
    evidence: provenance.evidence ?? operation.evidence,
  };
}

function toEdgeProvenance(
  provenance: EFlowProvenance,
  command: EFlowCommandEnvelope,
  operation: EFlowOperation,
): EngineeringEdge["provenance"] {
  return {
    sourceType: toSourceType(provenance.sourceType),
    sourceInputIds: provenance.sourceInputIds,
    generationRule: provenance.generationRule,
    commandId: provenance.commandId ?? command.commandId,
    actorId: provenance.actorId ?? command.actor.id,
    updatedAt: nowIso(),
    reason: provenance.reason ?? operation.reason,
    evidence: provenance.evidence ?? operation.evidence,
  };
}

function toSourceType(sourceType: string | undefined): SourceType {
  if (
    sourceType === "user_input" ||
    sourceType === "example_seed" ||
    sourceType === "system_generated" ||
    sourceType === "ai_suggested" ||
    sourceType === "manual_edit" ||
    sourceType === "ai_command" ||
    sourceType === "ai_progress_sync" ||
    sourceType === "context_import"
  ) {
    return sourceType;
  }

  return "ai_command";
}

function reviewStatusToNodeStatus(reviewStatus: ReviewStatus | undefined): NodeStatus | null | undefined {
  if (reviewStatus === undefined) return undefined;
  if (reviewStatus === "suggested" || reviewStatus === "confirmed" || reviewStatus === "needs_review") {
    return reviewStatus;
  }
  return null;
}

function reviewStatusToEdgeStatus(reviewStatus: ReviewStatus): EdgeStatus | null {
  if (reviewStatus === "needs_review") return null;
  return reviewStatus;
}

function isSupportedGraphNodeType(type: string): type is EngineeringNodeType {
  return supportedGraphNodeTypes.includes(type as EngineeringNodeType);
}

function isSupportedGraphRelationshipType(type: string): type is RelationshipType {
  return supportedGraphRelationshipTypes.includes(type as RelationshipType);
}

function wouldDuplicateExactEdge(
  graph: EngineeringFlowGraph,
  currentEdgeId: string,
  source: string,
  target: string,
  relationshipType: RelationshipType,
): boolean {
  return graph.edges.some(
    (edge) =>
      edge.id !== currentEdgeId &&
      edge.source === source &&
      edge.target === target &&
      edge.relationshipType === relationshipType,
  );
}

function makeUnsupportedNodeTypeIssue(
  type: string,
  operationIndex: number,
): EFlowCommandValidationIssue {
  return makeApplyIssue(
    "graph.node_type_unsupported",
    `$.operations[${operationIndex}]`,
    `Node type "${type}" is valid command schema but is not supported by the current EngineeringFlowGraph type.`,
  );
}

function makeUnsupportedRelationshipTypeIssue(
  relationshipType: string,
  operationIndex: number,
): EFlowCommandValidationIssue {
  return makeApplyIssue(
    "graph.relationship_type_unsupported",
    `$.operations[${operationIndex}]`,
    `Relationship type "${relationshipType}" is valid command schema but is not supported by the current EngineeringFlowGraph type.`,
  );
}

function makeDuplicateEdgeIssue(
  source: string,
  target: string,
  relationshipType: RelationshipType,
  operationIndex: number,
): EFlowCommandValidationIssue {
  return makeApplyIssue(
    "graph.duplicate_exact_edge",
    `$.operations[${operationIndex}]`,
    `An edge already exists for ${source} -> ${target} (${relationshipType}).`,
  );
}

function makeApplyIssue(
  code: string,
  path: string,
  message: string,
): EFlowCommandValidationIssue {
  return {
    severity: "error",
    code,
    path,
    message,
  };
}

function cloneGraph(graph: EngineeringFlowGraph): EngineeringFlowGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      provenance: { ...node.provenance },
      commandProvenance: node.commandProvenance?.map((provenance) => ({
        ...provenance,
        evidence: cloneEvidence(provenance.evidence),
      })),
      implementation: cloneImplementation(node.implementation),
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      provenance: { ...edge.provenance },
      commandProvenance: edge.commandProvenance?.map((provenance) => ({
        ...provenance,
        evidence: cloneEvidence(provenance.evidence),
      })),
      implementation: cloneImplementation(edge.implementation),
    })),
  };
}

function cloneImplementation(
  implementation: EngineeringNode["implementation"],
): EngineeringNode["implementation"] {
  if (!implementation) return undefined;
  return {
    ...implementation,
    evidence: cloneEvidence(implementation.evidence),
    blockers: implementation.blockers?.map((blocker) => ({ ...blocker })),
    stateHistory: implementation.stateHistory?.map((transition) => ({
      ...transition,
      by: { ...transition.by },
      evidence: cloneEvidence(transition.evidence),
    })),
  };
}

function cloneEvidence(evidence: EFlowEvidence[] | undefined): EFlowEvidence[] | undefined {
  return evidence?.map((entry) => ({
    ...entry,
    metadata: entry.metadata ? { ...entry.metadata } : undefined,
  }));
}
