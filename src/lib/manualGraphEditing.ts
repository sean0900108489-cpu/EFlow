import type { LifecycleStatus } from "../types/eflowCommand";
import type {
  EdgeStatus,
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringNode,
  EngineeringNodeType,
  NodeStatus,
  RelationshipType,
} from "../types/engineeringFlow";
import { nowIso } from "./dates";

const DEFAULT_MANUAL_STATUS = "confirmed";
const DEFAULT_MANUAL_LIFECYCLE_STATUS: LifecycleStatus = "planned";
const DEFAULT_MANUAL_POSITION = { x: 0, y: 0 };

export type CreateManualNodeArgs = {
  id?: string;
  type: EngineeringNodeType;
  title: string;
  description: string;
  aiReadableSummary?: string;
  status?: NodeStatus;
  lifecycleStatus?: LifecycleStatus;
  position?: EngineeringNode["position"];
};

export type CreateManualEdgeArgs = {
  id?: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
  description: string;
  status?: EdgeStatus;
  lifecycleStatus?: LifecycleStatus;
};

export type ManualGraphEditIssue = {
  code: string;
  path: string;
  message: string;
};

export type ManualGraphEditResult = {
  ok: boolean;
  graph: EngineeringFlowGraph;
  errors: ManualGraphEditIssue[];
};

export function createManualNode(args: CreateManualNodeArgs): EngineeringNode {
  const id = makeManualId("node-manual", args.id ?? `${args.type}-${args.title}`);

  return {
    id,
    type: args.type,
    title: args.title,
    description: args.description,
    status: args.status ?? DEFAULT_MANUAL_STATUS,
    aiReadableSummary: args.aiReadableSummary ?? `${args.title}: ${args.description}`.trim(),
    position: args.position ? { ...args.position } : { ...DEFAULT_MANUAL_POSITION },
    confidence: 1,
    provenance: {
      sourceType: "manual_edit",
      sourceInputIds: [],
      generationRule: "human_added_node",
    },
    lifecycleStatus: args.lifecycleStatus ?? DEFAULT_MANUAL_LIFECYCLE_STATUS,
  };
}

export function createManualEdge(args: CreateManualEdgeArgs): EngineeringEdge {
  const id = makeManualId(
    "edge-manual",
    args.id ?? `${args.source}-${args.relationshipType}-${args.target}`,
  );

  return {
    id,
    source: args.source,
    target: args.target,
    relationshipType: args.relationshipType,
    status: args.status ?? DEFAULT_MANUAL_STATUS,
    description: args.description,
    confidence: 1,
    provenance: {
      sourceType: "manual_edit",
      sourceInputIds: [],
      generationRule: "human_added_edge",
    },
    lifecycleStatus: args.lifecycleStatus ?? DEFAULT_MANUAL_LIFECYCLE_STATUS,
  };
}

export function insertManualNode(
  graph: EngineeringFlowGraph,
  node: EngineeringNode,
): ManualGraphEditResult {
  if (graph.nodes.some((candidate) => candidate.id === node.id)) {
    return fail(
      graph,
      "graph.duplicate_node",
      "$.node.id",
      `Node "${node.id}" already exists.`,
    );
  }

  return {
    ok: true,
    graph: {
      ...cloneGraph(graph),
      nodes: [...graph.nodes.map(cloneNode), cloneNode(node)],
      updatedAt: nowIso(),
    },
    errors: [],
  };
}

export function insertManualEdge(
  graph: EngineeringFlowGraph,
  edge: EngineeringEdge,
): ManualGraphEditResult {
  if (graph.edges.some((candidate) => candidate.id === edge.id)) {
    return fail(
      graph,
      "graph.duplicate_edge",
      "$.edge.id",
      `Edge "${edge.id}" already exists.`,
    );
  }

  if (!graph.nodes.some((node) => node.id === edge.source)) {
    return fail(
      graph,
      "graph.edge_source_missing",
      "$.edge.source",
      `Edge source node "${edge.source}" does not exist.`,
    );
  }

  if (!graph.nodes.some((node) => node.id === edge.target)) {
    return fail(
      graph,
      "graph.edge_target_missing",
      "$.edge.target",
      `Edge target node "${edge.target}" does not exist.`,
    );
  }

  if (edge.source === edge.target) {
    return fail(
      graph,
      "graph.self_edge",
      "$.edge",
      "Edges cannot connect a node to itself.",
    );
  }

  if (
    graph.edges.some(
      (candidate) =>
        candidate.source === edge.source &&
        candidate.target === edge.target &&
        candidate.relationshipType === edge.relationshipType,
    )
  ) {
    return fail(
      graph,
      "graph.duplicate_exact_edge",
      "$.edge",
      `An edge already exists for ${edge.source} -> ${edge.target} (${edge.relationshipType}).`,
    );
  }

  return {
    ok: true,
    graph: {
      ...cloneGraph(graph),
      edges: [...graph.edges.map(cloneEdge), cloneEdge(edge)],
      updatedAt: nowIso(),
    },
    errors: [],
  };
}

function fail(
  graph: EngineeringFlowGraph,
  code: string,
  path: string,
  message: string,
): ManualGraphEditResult {
  return {
    ok: false,
    graph,
    errors: [
      {
        code,
        path,
        message,
      },
    ],
  };
}

function makeManualId(prefix: "node-manual" | "edge-manual", value: string): string {
  const rawValue = value.startsWith(`${prefix}-`) ? value.slice(prefix.length + 1) : value;
  const safeValue =
    rawValue
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "item";

  return `${prefix}-${safeValue}`;
}

function cloneGraph(graph: EngineeringFlowGraph): EngineeringFlowGraph {
  return {
    ...graph,
    nodes: graph.nodes.map(cloneNode),
    edges: graph.edges.map(cloneEdge),
  };
}

function cloneNode(node: EngineeringNode): EngineeringNode {
  return {
    ...node,
    position: { ...node.position },
    provenance: {
      ...node.provenance,
      sourceInputIds: node.provenance.sourceInputIds
        ? [...node.provenance.sourceInputIds]
        : undefined,
      evidence: node.provenance.evidence?.map((entry) => ({ ...entry })),
    },
  };
}

function cloneEdge(edge: EngineeringEdge): EngineeringEdge {
  return {
    ...edge,
    provenance: {
      ...edge.provenance,
      sourceInputIds: edge.provenance.sourceInputIds
        ? [...edge.provenance.sourceInputIds]
        : undefined,
      evidence: edge.provenance.evidence?.map((entry) => ({ ...entry })),
    },
  };
}
