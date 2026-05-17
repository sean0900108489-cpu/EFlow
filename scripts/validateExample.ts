import assert from "node:assert/strict";
import { todoThoughtUniverseExample } from "../src/data/todoThoughtUniverseExample";
import { buildFullAIContext } from "../src/lib/exportContext";
import { generateEngineeringFlow } from "../src/lib/generateEngineeringFlow";
import { buildWorkspaceDocument } from "../src/lib/workspacePersistence";
import {
  isEFlowWorkspaceDocument,
  validateEngineeringFlowGraph,
} from "../src/lib/workspaceValidation";

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
assert.ok(graph.nodes.length > 0, "graph should have nodes");
assert.ok(graph.edges.length > 0, "graph should have edges");
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

console.log(
  `Example validation passed: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${fullContext.confirmationSummary.blockingQuestionNodeIds.length} blocking questions.`,
);
