import assert from "node:assert/strict";
import { todoThoughtUniverseExample } from "../src/data/todoThoughtUniverseExample";
import {
  applyEFlowCommandToGraph,
  dryRunEFlowCommandOnGraph,
} from "../src/lib/applyEflowCommand";
import { buildEFlowContextExport } from "../src/lib/buildEflowContextExport";
import { buildLifecycleSummary } from "../src/lib/buildLifecycleSummary";
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
import {
  EFLOW_COMMAND_SCHEMA_VERSION,
  LIFECYCLE_STATUSES,
  REVIEW_STATUSES,
  type EFlowCommandEnvelope,
} from "../src/types/eflowCommand";

const graph = generateEngineeringFlow(todoThoughtUniverseExample);
const fullContext = buildFullAIContext(todoThoughtUniverseExample, graph);
const eflowContext = buildEFlowContextExport({
  engineeringFlowInput: todoThoughtUniverseExample,
  engineeringFlowGraph: graph,
  generatedAt: "2026-05-17T00:00:00.000Z",
  graphRevision: "validate-example",
  sourceWorkspaceSchemaVersion: "eflow-workspace/v0.3",
});
const workspace = buildWorkspaceDocument({
  input: todoThoughtUniverseExample,
  graph,
  selectedNodeId: "node-intent",
  selectedEdgeId: null,
});
const nodeIds = new Set(graph.nodes.map((node) => node.id));
const lifecycleSummary = buildLifecycleSummary(graph);

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

assert.equal(eflowContext.schemaVersion, "eflow-context/v0.1");
assert.ok(eflowContext.generatedAt, "EFlow context should include generatedAt");
assert.equal(
  eflowContext.project.name,
  todoThoughtUniverseExample.projectName,
  "EFlow context project name should match input",
);
assert.equal(eflowContext.graph.nodes.length, 52, "EFlow context should include 52 nodes");
assert.equal(eflowContext.graph.edges.length, 93, "EFlow context should include 93 edges");
for (const status of REVIEW_STATUSES) {
  assert.ok(
    status in eflowContext.policies.confirmationPolicy,
    `confirmationPolicy should include ${status}`,
  );
  assert.ok(
    status in eflowContext.reviewSummary.nodesByReviewStatus,
    `node review summary should include ${status}`,
  );
  assert.ok(
    status in eflowContext.reviewSummary.edgesByReviewStatus,
    `edge review summary should include ${status}`,
  );
}
for (const status of LIFECYCLE_STATUSES) {
  assert.ok(
    status in eflowContext.policies.stateMachinePolicy,
    `stateMachinePolicy should include ${status}`,
  );
  assert.ok(
    status in eflowContext.progressSummary.nodesByLifecycle,
    `node progress summary should include ${status}`,
  );
  assert.ok(
    status in eflowContext.progressSummary.edgesByLifecycle,
    `edge progress summary should include ${status}`,
  );
  assert.ok(status in lifecycleSummary.nodeCounts, `node lifecycle count should include ${status}`);
  assert.ok(status in lifecycleSummary.edgeCounts, `edge lifecycle count should include ${status}`);
  assert.ok(status in lifecycleSummary.nodesByLifecycle, `node lifecycle bucket should include ${status}`);
  assert.ok(status in lifecycleSummary.edgesByLifecycle, `edge lifecycle bucket should include ${status}`);
}
assert.equal(
  lifecycleSummary.nodeCounts.planned,
  graph.nodes.length,
  "missing node lifecycleStatus should count as planned",
);
assert.equal(
  lifecycleSummary.edgeCounts.planned,
  graph.edges.length,
  "missing edge lifecycleStatus should count as planned",
);
assert.equal(
  LIFECYCLE_STATUSES.reduce((total, status) => total + lifecycleSummary.nodeCounts[status], 0),
  graph.nodes.length,
  "node lifecycle counts should sum to generated node count",
);
assert.equal(
  LIFECYCLE_STATUSES.reduce((total, status) => total + lifecycleSummary.edgeCounts[status], 0),
  graph.edges.length,
  "edge lifecycle counts should sum to generated edge count",
);
assert.deepEqual(
  lifecycleSummary.nodesByLifecycle.planned,
  graph.nodes.map((node) => node.id),
  "generated nodes without lifecycleStatus should be bucketed as planned",
);
assert.deepEqual(
  lifecycleSummary.edgesByLifecycle.planned,
  graph.edges.map((edge) => edge.id),
  "generated edges without lifecycleStatus should be bucketed as planned",
);

const lifecycleMutationGraph = structuredClone(graph);
lifecycleMutationGraph.nodes[0] = {
  ...lifecycleMutationGraph.nodes[0],
  lifecycleStatus: "completed",
};
lifecycleMutationGraph.nodes[1] = {
  ...lifecycleMutationGraph.nodes[1],
  lifecycleStatus: "developing",
};
lifecycleMutationGraph.nodes[2] = {
  ...lifecycleMutationGraph.nodes[2],
  lifecycleStatus: "blocked",
};
lifecycleMutationGraph.edges[0] = {
  ...lifecycleMutationGraph.edges[0],
  lifecycleStatus: "completed",
};
lifecycleMutationGraph.edges[1] = {
  ...lifecycleMutationGraph.edges[1],
  lifecycleStatus: "developing",
};
lifecycleMutationGraph.edges[2] = {
  ...lifecycleMutationGraph.edges[2],
  lifecycleStatus: "blocked",
};

const mutatedLifecycleSummary = buildLifecycleSummary(lifecycleMutationGraph);
assert.equal(mutatedLifecycleSummary.nodeCounts.completed, 1);
assert.equal(mutatedLifecycleSummary.nodeCounts.developing, 1);
assert.equal(mutatedLifecycleSummary.nodeCounts.blocked, 1);
assert.equal(mutatedLifecycleSummary.nodeCounts.planned, graph.nodes.length - 3);
assert.equal(mutatedLifecycleSummary.edgeCounts.completed, 1);
assert.equal(mutatedLifecycleSummary.edgeCounts.developing, 1);
assert.equal(mutatedLifecycleSummary.edgeCounts.blocked, 1);
assert.equal(mutatedLifecycleSummary.edgeCounts.planned, graph.edges.length - 3);
assert.deepEqual(mutatedLifecycleSummary.nodesByLifecycle.completed, [graph.nodes[0].id]);
assert.deepEqual(mutatedLifecycleSummary.nodesByLifecycle.developing, [graph.nodes[1].id]);
assert.deepEqual(mutatedLifecycleSummary.nodesByLifecycle.blocked, [graph.nodes[2].id]);
assert.deepEqual(mutatedLifecycleSummary.edgesByLifecycle.completed, [graph.edges[0].id]);
assert.deepEqual(mutatedLifecycleSummary.edgesByLifecycle.developing, [graph.edges[1].id]);
assert.deepEqual(mutatedLifecycleSummary.edgesByLifecycle.blocked, [graph.edges[2].id]);
assert.ok(
  graph.nodes.every((node) => eflowContext.dependencyIndex[node.id]),
  "dependencyIndex should have one entry per node",
);
assert.equal(
  eflowContext.blockingQuestions.length,
  3,
  "EFlow context should include 3 blocking questions",
);
assert.ok(eflowContext.mermaid?.flowchart, "EFlow context should include Mermaid flowchart");
assert.ok(
  eflowContext.commandInterface.acceptedSchemaVersions.includes(EFLOW_COMMAND_SCHEMA_VERSION),
  "EFlow context should advertise accepted command schema version",
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

const appliedEflowContext = buildEFlowContextExport({
  engineeringFlowInput: todoThoughtUniverseExample,
  engineeringFlowGraph: applyResult.graph,
  generatedAt: "2026-05-17T00:00:00.000Z",
});
assert.ok(
  appliedEflowContext.progressSummary.nodesByLifecycle.completed.includes(targetNodeId),
  "completed node should appear in lifecycle progress summary",
);
assert.ok(
  appliedEflowContext.reviewSummary.nodesByReviewStatus.confirmed.includes(targetNodeId),
  "confirmed node should appear in review summary",
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
