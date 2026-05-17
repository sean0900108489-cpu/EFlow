import assert from "node:assert/strict";
import { todoThoughtUniverseExample } from "../src/data/todoThoughtUniverseExample";
import {
  applyEFlowCommandToGraph,
  dryRunEFlowCommandOnGraph,
} from "../src/lib/applyEflowCommand";
import {
  isEFlowCommandEnvelope,
  validateEFlowCommandEnvelope,
} from "../src/lib/eflowCommandValidation";
import { buildFullAIContext } from "../src/lib/exportContext";
import { generateEngineeringFlow } from "../src/lib/generateEngineeringFlow";
import { buildWorkspaceDocument } from "../src/lib/workspacePersistence";
import {
  isEFlowWorkspaceDocument,
  validateEngineeringFlowGraph,
} from "../src/lib/workspaceValidation";
import type { EFlowCommandEnvelope } from "../src/types/eflowCommand";

const graph = generateEngineeringFlow(todoThoughtUniverseExample);
const fullContext = buildFullAIContext(todoThoughtUniverseExample, graph);
const workspace = buildWorkspaceDocument({
  input: todoThoughtUniverseExample,
  graph,
  selectedNodeId: "node-intent",
  selectedEdgeId: null,
});
const nodeIds = new Set(graph.nodes.map((node) => node.id));

assert.equal(todoThoughtUniverseExample.schemaVersion, "engineering-flow-input/v0");
assert.equal(graph.schemaVersion, "engineering-flow-graph/v0");
assert.equal(graph.nodes.length, 52, "example graph should have 52 nodes");
assert.equal(graph.edges.length, 93, "example graph should have 93 edges");
assert.deepEqual(validateEngineeringFlowGraph(graph), { ok: true, errors: [] });

for (const node of graph.nodes) {
  assert.ok(node.id, "node should have id");
  assert.ok(node.type, `node ${node.id} should have type`);
  assert.ok(node.title, `node ${node.id} should have title`);
  assert.ok(node.status, `node ${node.id} should have status`);
  assert.ok(node.aiReadableSummary, `node ${node.id} should have aiReadableSummary`);
  assert.equal(typeof node.position.x, "number", `node ${node.id} should have position.x`);
  assert.equal(typeof node.position.y, "number", `node ${node.id} should have position.y`);
  assert.ok(node.provenance, `node ${node.id} should have provenance`);
  assert.equal(node.status, "suggested", `generated node ${node.id} should be suggested`);
}

for (const edge of graph.edges) {
  assert.ok(edge.id, "edge should have id");
  assert.ok(edge.source, `edge ${edge.id} should have source`);
  assert.ok(edge.target, `edge ${edge.id} should have target`);
  assert.ok(nodeIds.has(edge.source), `edge ${edge.id} source should exist`);
  assert.ok(nodeIds.has(edge.target), `edge ${edge.id} target should exist`);
  assert.ok(edge.relationshipType, `edge ${edge.id} should have relationshipType`);
  assert.ok(edge.status, `edge ${edge.id} should have status`);
  assert.ok(edge.description, `edge ${edge.id} should have description`);
  assert.ok(edge.provenance, `edge ${edge.id} should have provenance`);
  assert.equal(edge.status, "suggested", `generated edge ${edge.id} should be suggested`);
}

assert.equal(fullContext.schemaVersion, "engineering-flow-full-context/v0");
assert.ok(fullContext.confirmationPolicy, "full context should include confirmationPolicy");
assert.ok(fullContext.confirmationSummary, "full context should include confirmationSummary");
assert.ok(
  fullContext.confirmationSummary.blockingQuestionNodeIds.length > 0,
  "full context should identify blocking questions",
);
assert.equal(
  fullContext.confirmationSummary.blockingQuestionNodeIds.length,
  3,
  "example graph should have 3 blocking questions",
);

assert.ok(isEFlowWorkspaceDocument(workspace), "workspace document should validate");
const parsedWorkspace = JSON.parse(JSON.stringify(workspace)) as unknown;
assert.ok(isEFlowWorkspaceDocument(parsedWorkspace), "parsed workspace document should validate");

if (!isEFlowWorkspaceDocument(parsedWorkspace)) {
  throw new Error("Parsed workspace did not validate.");
}

const restoredFullContext = buildFullAIContext(
  parsedWorkspace.engineeringFlowInput,
  parsedWorkspace.engineeringFlowGraph,
);
assert.ok(
  restoredFullContext.confirmationSummary,
  "restored full context should include confirmationSummary",
);

const targetNodeId = graph.nodes[0].id;
const targetEdge = graph.edges[0];
const updateCommand: EFlowCommandEnvelope = {
  schemaVersion: "eflow-command/v0.1",
  commandId: "cmd_validate_node_completed",
  projectId: todoThoughtUniverseExample.id,
  graphId: graph.id,
  createdAt: "2026-05-17T00:00:00.000Z",
  actor: {
    type: "ai_agent",
    id: "codex",
    name: "Codex",
  },
  intent: "progress_sync",
  mode: "apply",
  operations: [
    {
      op: "updateNode",
      id: targetNodeId,
      patch: {
        reviewStatus: "confirmed",
      },
      reason: "Architecture item was reviewed during validation.",
    },
    {
      op: "transitionNode",
      id: targetNodeId,
      to: "completed",
      reason: "Implementation state transition was verified.",
      evidence: [
        {
          type: "test",
          text: "scripts/validateExample.ts",
        },
      ],
    },
  ],
};

assert.ok(isEFlowCommandEnvelope(updateCommand), "valid command should be a command envelope");
assert.deepEqual(validateEFlowCommandEnvelope(updateCommand), {
  ok: true,
  errors: [],
  warnings: [],
});

const dryRunResult = dryRunEFlowCommandOnGraph(graph, updateCommand);
assert.ok(dryRunResult.ok, "dry-run command should succeed");
assert.equal(dryRunResult.mode, "dry_run", "dry-run result should report dry_run mode");
assert.strictEqual(dryRunResult.graph, graph, "dry-run should return original graph object");
assert.equal(
  graph.nodes.find((node) => node.id === targetNodeId)?.status,
  "suggested",
  "dry-run should not mutate node status",
);
assert.equal(
  graph.nodes.find((node) => node.id === targetNodeId)?.lifecycleStatus,
  undefined,
  "dry-run should not mutate node lifecycleStatus",
);

const applyResult = applyEFlowCommandToGraph(graph, updateCommand);
assert.ok(applyResult.ok, "apply command should succeed");
assert.notStrictEqual(applyResult.graph, graph, "apply should return a new graph object");
assert.equal(
  graph.nodes.find((node) => node.id === targetNodeId)?.status,
  "suggested",
  "apply should not mutate the original graph",
);

const appliedTargetNode = applyResult.graph.nodes.find((node) => node.id === targetNodeId);
assert.ok(appliedTargetNode, "applied graph should include target node");
assert.equal(appliedTargetNode.status, "confirmed", "reviewStatus should map to legacy node.status");
assert.equal(
  appliedTargetNode.lifecycleStatus,
  "completed",
  "transitionNode should write lifecycleStatus",
);
assert.ok(
  appliedTargetNode.implementation?.stateHistory?.length,
  "transitionNode should append implementation state history",
);

const upsertCommand: EFlowCommandEnvelope = {
  schemaVersion: "eflow-command/v0.1",
  commandId: "cmd_validate_upsert_node_edge",
  projectId: todoThoughtUniverseExample.id,
  graphId: graph.id,
  createdAt: "2026-05-17T00:00:00.000Z",
  actor: {
    type: "ai_agent",
    id: "codex",
    name: "Codex",
  },
  intent: "architecture_update",
  mode: "apply",
  operations: [
    {
      op: "upsertNode",
      node: {
        id: "node-command-validation",
        type: "feature",
        title: "Command Validation",
        description: "Headless validation for local AI command intake.",
        aiReadableSummary: "Feature: command validation for local AI command intake.",
        reviewStatus: "confirmed",
        lifecycleStatus: "planned",
        position: {
          x: 2240,
          y: 0,
        },
        provenance: {
          sourceType: "ai_command",
          commandId: "cmd_validate_upsert_node_edge",
          actorId: "codex",
          createdAt: "2026-05-17T00:00:00.000Z",
          reason: "Validate upsertNode support.",
        },
      },
      reason: "Validate upsertNode support.",
    },
    {
      op: "upsertEdge",
      edge: {
        id: "edge-command-validation",
        source: targetNodeId,
        target: "node-command-validation",
        relationshipType: "relates_to",
        description: "Generated by validation to verify local command edge upsert.",
        reviewStatus: "confirmed",
        lifecycleStatus: "planned",
        provenance: {
          sourceType: "ai_command",
          commandId: "cmd_validate_upsert_node_edge",
          actorId: "codex",
          createdAt: "2026-05-17T00:00:00.000Z",
          reason: "Validate upsertEdge support.",
        },
      },
      reason: "Validate upsertEdge support.",
    },
  ],
};

const upsertResult = applyEFlowCommandToGraph(graph, upsertCommand);
assert.ok(upsertResult.ok, "upsert node/edge command should succeed");
assert.ok(
  upsertResult.graph.nodes.some((node) => node.id === "node-command-validation"),
  "upsertNode should insert a compatible graph node",
);
assert.ok(
  upsertResult.graph.edges.some((edge) => edge.id === "edge-command-validation"),
  "upsertEdge should insert a compatible graph edge",
);

const duplicateEdgeCommand: EFlowCommandEnvelope = {
  schemaVersion: "eflow-command/v0.1",
  commandId: "cmd_validate_duplicate_edge",
  projectId: todoThoughtUniverseExample.id,
  graphId: graph.id,
  createdAt: "2026-05-17T00:00:00.000Z",
  actor: {
    type: "ai_agent",
    id: "codex",
  },
  intent: "architecture_update",
  operations: [
    {
      op: "upsertEdge",
      edge: {
        id: "edge-duplicate-validation",
        source: targetEdge.source,
        target: targetEdge.target,
        relationshipType: targetEdge.relationshipType,
        description: "This should be rejected as a duplicate exact edge.",
        reviewStatus: "suggested",
        lifecycleStatus: "planned",
        provenance: {
          sourceType: "ai_command",
        },
      },
    },
  ],
};

const duplicateResult = applyEFlowCommandToGraph(graph, duplicateEdgeCommand);
assert.equal(duplicateResult.ok, false, "duplicate exact edge command should fail");
assert.ok(
  duplicateResult.errors.some((error) => error.code === "graph.duplicate_exact_edge"),
  "duplicate exact edge should report graph.duplicate_exact_edge",
);

const missingTargetCommand: EFlowCommandEnvelope = {
  ...duplicateEdgeCommand,
  commandId: "cmd_validate_missing_target",
  operations: [
    {
      op: "upsertEdge",
      edge: {
        ...duplicateEdgeCommand.operations[0].edge,
        id: "edge-missing-target-validation",
        source: targetNodeId,
        target: "node-does-not-exist",
        relationshipType: "relates_to",
      },
    },
  ],
};

const missingTargetResult = applyEFlowCommandToGraph(graph, missingTargetCommand);
assert.equal(missingTargetResult.ok, false, "missing target edge command should fail");
assert.ok(
  missingTargetResult.errors.some((error) => error.code === "graph.edge_target_missing"),
  "missing target edge should report graph.edge_target_missing",
);

const invalidLifecycleCommand = {
  ...updateCommand,
  commandId: "cmd_validate_invalid_lifecycle",
  operations: [
    {
      op: "transitionNode",
      id: targetNodeId,
      to: "done",
    },
  ],
} as unknown;

const invalidLifecycleResult = validateEFlowCommandEnvelope(invalidLifecycleCommand);
assert.equal(invalidLifecycleResult.ok, false, "invalid lifecycleStatus should fail validation");
assert.ok(
  invalidLifecycleResult.errors.some((error) => error.code === "operation.invalid_lifecycle_status"),
  "invalid lifecycleStatus should report operation.invalid_lifecycle_status",
);

console.log(
  `Example validation passed: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${fullContext.confirmationSummary.blockingQuestionNodeIds.length} blocking questions.`,
);
