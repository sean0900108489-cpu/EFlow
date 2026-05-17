import {
  EFLOW_COMMAND_SCHEMA_VERSION,
  EFLOW_NODE_TYPES,
  EFLOW_RELATIONSHIP_TYPES,
  LIFECYCLE_STATUSES,
  REVIEW_STATUSES,
  type EFlowCommandEdge,
  type EFlowCommandNode,
  type EFlowEvidence,
  type EFlowId,
  type EFlowMetadata,
  type EFlowNodeType,
  type EFlowOperation,
  type EFlowProvenance,
  type EFlowRelationshipType,
  type LifecycleStatus,
  type ReviewStatus,
} from "../types/eflowCommand";
import type {
  EdgeStatus,
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNode,
  NodeStatus,
} from "../types/engineeringFlow";
import {
  EFLOW_CONTEXT_SCHEMA_VERSION,
  type EFlowCommandInterfaceDescriptor,
  type EFlowContextExport,
  type EFlowDependencyIndex,
  type EFlowProgressSummary,
  type EFlowReviewSummary,
} from "../types/eflowContext";
import { isBlockingQuestionNode } from "./trustSummary";

export interface BuildEFlowContextExportArgs {
  engineeringFlowInput?: EngineeringFlowInput;
  engineeringFlowGraph: EngineeringFlowGraph;
  generatedAt?: string;
  graphRevision?: string;
  sourceWorkspaceSchemaVersion?: string;
}

const DEFAULT_CONTEXT_LIFECYCLE_STATUS: LifecycleStatus = "planned";

const GRAPH_SUPPORTED_NODE_TYPES = [
  "intent",
  "user",
  "screen",
  "feature",
  "flow_step",
  "data_object",
  "ai_task",
  "question",
] as const satisfies readonly EFlowNodeType[];

const GRAPH_SUPPORTED_RELATIONSHIP_TYPES = [
  "serves",
  "uses",
  "leads_to",
  "contains",
  "depends_on",
  "produces",
  "needs_confirmation",
  "relates_to",
] as const satisfies readonly EFlowRelationshipType[];

const GRAPH_SUPPORTED_COMMAND_OPERATIONS = [
  "updateNode",
  "transitionNode",
  "upsertNode",
  "updateEdge",
  "transitionEdge",
  "upsertEdge",
] as const satisfies readonly EFlowOperation["op"][];

export function buildEFlowContextExport({
  engineeringFlowInput,
  engineeringFlowGraph,
  generatedAt = new Date().toISOString(),
  graphRevision,
  sourceWorkspaceSchemaVersion,
}: BuildEFlowContextExportArgs): EFlowContextExport {
  const contextNodes = engineeringFlowGraph.nodes.map(toContextNode);
  const contextEdges = engineeringFlowGraph.edges.map(toContextEdge);
  const dependencyIndex = buildDependencyIndex(contextNodes, contextEdges);
  const reviewSummary = buildReviewSummary(contextNodes, contextEdges);
  const progressSummary = buildProgressSummary(contextNodes, contextEdges);
  const blockingQuestions = buildBlockingQuestions(engineeringFlowGraph, dependencyIndex);

  return {
    schemaVersion: EFLOW_CONTEXT_SCHEMA_VERSION,
    generatedAt,
    project: {
      id:
        engineeringFlowInput?.id ||
        engineeringFlowGraph.sourceInputId ||
        engineeringFlowGraph.id,
      name: engineeringFlowInput?.projectName || engineeringFlowGraph.title,
      intent:
        engineeringFlowInput?.projectIntent ||
        `Engineering flow context for ${engineeringFlowGraph.title}.`,
      sourceType: engineeringFlowInput?.sourceType,
    },
    graphRevision,
    sourceWorkspaceSchemaVersion,
    policies: {
      confirmationPolicy: buildConfirmationPolicy(),
      stateMachinePolicy: buildStateMachinePolicy(),
    },
    graph: {
      nodes: contextNodes,
      edges: contextEdges,
    },
    dependencyIndex,
    progressSummary,
    reviewSummary,
    nextDevelopmentTargets: buildNextDevelopmentTargets(contextNodes, dependencyIndex),
    blockingQuestions,
    mermaid: buildMermaidExport(contextNodes, contextEdges),
    commandInterface: buildCommandInterfaceDescriptor(),
  };
}

function buildCommandInterfaceDescriptor(): EFlowCommandInterfaceDescriptor {
  return {
    acceptedSchemaVersions: [EFLOW_COMMAND_SCHEMA_VERSION],
    preferredOperations: [...GRAPH_SUPPORTED_COMMAND_OPERATIONS],
    unsupportedOrSchemaOnlyOperations: [
      {
        operation: "addDecision",
        behavior: "validates as eflow-command/v0.1 schema, but current graph apply rejects it",
        reason: "EngineeringFlowGraph does not yet have a decision record store.",
      },
      {
        operation: "addQuestion",
        behavior: "validates as eflow-command/v0.1 schema, but current graph apply rejects it",
        reason: "EngineeringFlowGraph does not yet have a standalone question record store.",
      },
    ],
    localWorkflow: [
      {
        step: "validate",
        description: "Parse JSON and validate the eflow-command/v0.1 envelope before graph checks.",
        mutatesGraph: false,
      },
      {
        step: "dry_run",
        description: "Run graph compatibility and safety checks without changing the current graph.",
        mutatesGraph: false,
      },
      {
        step: "apply",
        description: "Apply the command to the current local graph only after validation succeeds.",
        mutatesGraph: true,
      },
    ],
    safetyRules: [
      {
        code: "dry_run_does_not_mutate_graph",
        description: "Dry-run returns the original graph and does not write graph changes.",
      },
      {
        code: "failed_operations_do_not_partially_apply",
        description: "If any operation fails, no changed graph is returned for apply.",
      },
      {
        code: "missing_references_are_rejected",
        description: "Node updates require an existing node; edge upserts require existing source and target nodes.",
      },
      {
        code: "self_edges_are_rejected",
        description: "Edge upserts cannot connect a node to itself.",
      },
      {
        code: "duplicate_exact_edges_are_prevented",
        description: "A second edge with the same source, target, and relationshipType is rejected.",
      },
      {
        code: "unsupported_node_or_relationship_types_are_rejected",
        description: "Schema-valid types outside the current EngineeringFlowGraph model fail graph apply.",
      },
    ],
    statusMapping: {
      commandReviewStatusToGraphStatus:
        "command reviewStatus maps to legacy node.status / edge.status when the legacy graph field can represent it",
      graphStatusToContextReviewStatus:
        "legacy node.status / edge.status maps to context graph reviewStatus for AI-readable export",
      lifecycleStatus:
        "lifecycleStatus remains separate implementation progress state and never substitutes for reviewStatus/status",
      unsupportedReviewStatusMappings: [
        {
          scope: "node",
          reviewStatus: "rejected",
          behavior: "rejected at graph apply because legacy node.status cannot represent rejected",
        },
        {
          scope: "edge",
          reviewStatus: "needs_review",
          behavior: "rejected at graph apply because legacy edge.status cannot represent needs_review",
        },
      ],
    },
    defaultingRules: [
      {
        field: "node.lifecycleStatus",
        defaultValue: DEFAULT_CONTEXT_LIFECYCLE_STATUS,
        behavior:
          "missing lifecycleStatus is treated as planned in AI context, canvas badges, filters, and summaries",
        writesBack: false,
      },
      {
        field: "edge.lifecycleStatus",
        defaultValue: DEFAULT_CONTEXT_LIFECYCLE_STATUS,
        behavior: "missing lifecycleStatus is treated as planned in AI context and summaries",
        writesBack: false,
      },
    ],
    auditBehavior: [
      {
        path: "local_command_import_ui",
        eventType: "ai_command_applied",
        behavior: "successful apply mode records a compact audit event through the UI path",
      },
      {
        path: "headless_apply_helper",
        behavior: "headless apply returns graph changes but does not append audit events by itself",
      },
    ],
    graphCompatibility: {
      supportedNodeTypes: [...GRAPH_SUPPORTED_NODE_TYPES],
      unsupportedSchemaNodeTypes: EFLOW_NODE_TYPES.filter(
        (type) => !(GRAPH_SUPPORTED_NODE_TYPES as readonly string[]).includes(type),
      ),
      supportedRelationshipTypes: [...GRAPH_SUPPORTED_RELATIONSHIP_TYPES],
      unsupportedSchemaRelationshipTypes: EFLOW_RELATIONSHIP_TYPES.filter(
        (type) => !(GRAPH_SUPPORTED_RELATIONSHIP_TYPES as readonly string[]).includes(type),
      ),
      unsupportedTypeBehavior:
        "Schema-valid node and relationship types outside the current graph model are rejected during graph apply.",
    },
  };
}

function toContextNode(node: EngineeringNode): EFlowCommandNode {
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    description: node.description,
    aiReadableSummary: node.aiReadableSummary,
    reviewStatus: nodeStatusToReviewStatus(node.status),
    lifecycleStatus: node.lifecycleStatus ?? DEFAULT_CONTEXT_LIFECYCLE_STATUS,
    confidence: node.confidence,
    position: node.position,
    provenance: toNodeProvenance(node),
    implementation: node.implementation,
    metadata: mergeMetadata(node.metadata, node.commandProvenance),
  };
}

function toContextEdge(edge: EngineeringEdge): EFlowCommandEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    relationshipType: edge.relationshipType,
    description: edge.description,
    reviewStatus: edgeStatusToReviewStatus(edge.status),
    lifecycleStatus: edge.lifecycleStatus ?? DEFAULT_CONTEXT_LIFECYCLE_STATUS,
    confidence: edge.confidence,
    provenance: toEdgeProvenance(edge),
    implementation: edge.implementation,
    metadata: mergeMetadata(edge.metadata, edge.commandProvenance),
  };
}

function toNodeProvenance(node: EngineeringNode): EFlowProvenance {
  return {
    sourceType: node.provenance.sourceType,
    sourceInputIds:
      node.provenance.sourceInputIds ??
      (node.provenance.sourceInputId ? [node.provenance.sourceInputId] : undefined),
    generationRule: node.provenance.generationRule,
    commandId: node.provenance.commandId,
    actorId: node.provenance.actorId,
    updatedAt: node.provenance.updatedAt,
    reason: node.provenance.reason,
    evidence: node.provenance.evidence,
    metadata: node.provenance.sourceInputSection
      ? {
          sourceInputSection: node.provenance.sourceInputSection,
        }
      : undefined,
  };
}

function toEdgeProvenance(edge: EngineeringEdge): EFlowProvenance {
  return {
    sourceType: edge.provenance.sourceType,
    sourceInputIds: edge.provenance.sourceInputIds,
    generationRule: edge.provenance.generationRule,
    commandId: edge.provenance.commandId,
    actorId: edge.provenance.actorId,
    updatedAt: edge.provenance.updatedAt,
    reason: edge.provenance.reason,
    evidence: edge.provenance.evidence,
  };
}

function buildDependencyIndex(
  nodes: EFlowCommandNode[],
  edges: EFlowCommandEdge[],
): EFlowDependencyIndex {
  const dependencyIndex: EFlowDependencyIndex = Object.fromEntries(
    nodes.map((node) => [
      node.id,
      {
        dependsOn: [],
        blocks: [],
        relatedEdges: [],
      },
    ]),
  );

  edges.forEach((edge) => {
    const sourceEntry = dependencyIndex[edge.source];
    const targetEntry = dependencyIndex[edge.target];
    if (!sourceEntry || !targetEntry) return;

    sourceEntry.relatedEdges?.push(edge.id);
    targetEntry.relatedEdges?.push(edge.id);

    const relationshipType = edge.relationshipType as string;
    if (relationshipType === "depends_on") {
      pushUnique(sourceEntry.dependsOn, edge.target);
      pushUnique(targetEntry.blocks, edge.source);
    }

    if (relationshipType === "blocks") {
      pushUnique(sourceEntry.blocks, edge.target);
      pushUnique(targetEntry.dependsOn, edge.source);
    }
  });

  return dependencyIndex;
}

function buildProgressSummary(
  nodes: EFlowCommandNode[],
  edges: EFlowCommandEdge[],
): EFlowProgressSummary {
  const nodesByLifecycle = makeLifecycleBuckets();
  const edgesByLifecycle = makeLifecycleBuckets();

  nodes.forEach((node) => nodesByLifecycle[node.lifecycleStatus].push(node.id));
  edges.forEach((edge) => edgesByLifecycle[edge.lifecycleStatus].push(edge.id));

  return {
    nodesByLifecycle,
    edgesByLifecycle,
  };
}

function buildReviewSummary(
  nodes: EFlowCommandNode[],
  edges: EFlowCommandEdge[],
): EFlowReviewSummary {
  const nodesByReviewStatus = makeReviewBuckets();
  const edgesByReviewStatus = makeReviewBuckets();

  nodes.forEach((node) => nodesByReviewStatus[node.reviewStatus].push(node.id));
  edges.forEach((edge) => edgesByReviewStatus[edge.reviewStatus].push(edge.id));

  return {
    nodesByReviewStatus,
    edgesByReviewStatus,
    blockingQuestionNodeIds: nodes
      .filter((node) => node.type === "question" && node.provenance.generationRule === "blocking_unknown_to_question_node")
      .map((node) => node.id),
  };
}

function buildNextDevelopmentTargets(
  nodes: EFlowCommandNode[],
  dependencyIndex: EFlowDependencyIndex,
) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return nodes
    .filter((node) => {
      if (node.reviewStatus !== "confirmed") return false;
      if (node.lifecycleStatus !== "ready" && node.lifecycleStatus !== "planned") return false;

      const dependencies = dependencyIndex[node.id]?.dependsOn ?? [];
      return dependencies.every((dependencyId) => {
        const dependency = nodeById.get(dependencyId);
        return !dependency || dependency.lifecycleStatus === "completed" || dependency.lifecycleStatus === "deprecated";
      });
    })
    .map((node) => ({
      nodeId: node.id,
      reason: `Confirmed ${node.type} is ${node.lifecycleStatus} and has no open dependency blockers in the exported graph.`,
      priority: node.lifecycleStatus === "ready" ? ("high" as const) : ("medium" as const),
    }));
}

function buildBlockingQuestions(
  graph: EngineeringFlowGraph,
  dependencyIndex: EFlowDependencyIndex,
) {
  return graph.nodes.filter(isBlockingQuestionNode).map((node) => {
    const relatedNodeIds = (dependencyIndex[node.id]?.relatedEdges ?? [])
      .flatMap((edgeId) => {
        const edge = graph.edges.find((candidate) => candidate.id === edgeId);
        if (!edge) return [];
        return [edge.source, edge.target].filter((nodeId) => nodeId !== node.id);
      })
      .filter(uniqueOnly);

    return {
      id: node.id,
      title: node.title,
      question: node.title || node.description,
      relatedNodeIds,
      severity: "high" as const,
      status: node.status === "confirmed" ? ("answered" as const) : ("open" as const),
      evidence: node.provenance.evidence as EFlowEvidence[] | undefined,
    };
  });
}

function buildMermaidExport(nodes: EFlowCommandNode[], edges: EFlowCommandEdge[]) {
  const nodeAliasById = new Map(nodes.map((node, index) => [node.id, `n${index}`]));
  const nodeLines = nodes.map((node) => {
    const alias = nodeAliasById.get(node.id);
    return `  ${alias}["${sanitizeMermaidLabel(node.title)}"]`;
  });
  const edgeLines = edges.flatMap((edge) => {
    const sourceAlias = nodeAliasById.get(edge.source);
    const targetAlias = nodeAliasById.get(edge.target);
    if (!sourceAlias || !targetAlias) return [];
    return `  ${sourceAlias} -->|${sanitizeMermaidLabel(edge.relationshipType)}| ${targetAlias}`;
  });

  const dependencyEdgeLines = edges.flatMap((edge) => {
    const relationshipType = edge.relationshipType as string;
    if (relationshipType !== "depends_on" && relationshipType !== "blocks") return [];
    const sourceAlias = nodeAliasById.get(edge.source);
    const targetAlias = nodeAliasById.get(edge.target);
    if (!sourceAlias || !targetAlias) return [];
    return `  ${sourceAlias} -->|${sanitizeMermaidLabel(edge.relationshipType)}| ${targetAlias}`;
  });

  const lifecycleCounts = Object.fromEntries(
    LIFECYCLE_STATUSES.map((status) => [
      status,
      nodes.filter((node) => node.lifecycleStatus === status).length,
    ]),
  ) as Record<LifecycleStatus, number>;

  return {
    flowchart: ["flowchart LR", ...nodeLines, ...edgeLines].join("\n"),
    dependencyGraph: [
      "flowchart LR",
      ...nodeLines,
      ...(dependencyEdgeLines.length > 0 ? dependencyEdgeLines : ["  noDependencies[\"No explicit dependency edges\"]"]),
    ].join("\n"),
    stateDiagram: [
      "stateDiagram-v2",
      ...LIFECYCLE_STATUSES.map((status) => `  ${status}: ${status} (${lifecycleCounts[status]})`),
    ].join("\n"),
  };
}

function buildConfirmationPolicy(): Record<ReviewStatus, string> {
  return {
    suggested:
      "Generated or imported but not yet human-confirmed. Downstream AI should treat this as tentative context.",
    confirmed:
      "Human-confirmed. Downstream AI may treat this as high-trust project context.",
    needs_review:
      "Requires further human review before downstream AI treats this as trusted context.",
    rejected:
      "Human rejected. Downstream AI should avoid using this item or relationship as valid project context.",
  };
}

function buildStateMachinePolicy(): Record<LifecycleStatus, string> {
  return {
    draft: "Early formulation. Not ready for implementation planning.",
    planned: "Planned but not actively being implemented.",
    ready: "Ready to be picked up for implementation.",
    developing: "Currently being implemented.",
    completed: "Implemented or otherwise finished for the current scope.",
    blocked: "Cannot proceed until blockers are resolved.",
    needs_refactor: "Implemented or designed but requires cleanup or redesign.",
    deprecated: "No longer recommended for active implementation.",
  };
}

function makeLifecycleBuckets(): Record<LifecycleStatus, EFlowId[]> {
  return Object.fromEntries(
    LIFECYCLE_STATUSES.map((status) => [status, [] as EFlowId[]]),
  ) as Record<LifecycleStatus, EFlowId[]>;
}

function makeReviewBuckets(): Record<ReviewStatus, EFlowId[]> {
  return Object.fromEntries(
    REVIEW_STATUSES.map((status) => [status, [] as EFlowId[]]),
  ) as Record<ReviewStatus, EFlowId[]>;
}

function nodeStatusToReviewStatus(status: NodeStatus): ReviewStatus {
  return status;
}

function edgeStatusToReviewStatus(status: EdgeStatus): ReviewStatus {
  return status;
}

function mergeMetadata(
  metadata: EFlowMetadata | undefined,
  commandProvenance: EFlowProvenance[] | undefined,
): EFlowMetadata | undefined {
  if (!metadata && !commandProvenance?.length) return undefined;
  return {
    ...(metadata ?? {}),
    ...(commandProvenance?.length ? { commandProvenance } : {}),
  };
}

function pushUnique(target: string[], value: string): void {
  if (!target.includes(value)) target.push(value);
}

function uniqueOnly(value: string, index: number, array: string[]): boolean {
  return array.indexOf(value) === index;
}

function sanitizeMermaidLabel(label: string): string {
  return label.replace(/["\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}
