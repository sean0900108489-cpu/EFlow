import assert from "node:assert/strict";
import { todoThoughtUniverseExample } from "../src/data/todoThoughtUniverseExample";
import {
  appendAuditEvent,
  buildAuditLogSummary,
  createAuditEvent,
  MAX_AUDIT_LOG_EVENTS,
  trimAuditLog,
  validateEFlowAuditLog,
} from "../src/lib/auditLog";
import {
  AI_CHAT_CONTEXT_ATTACHMENT_MODES,
  AI_CHAT_PROMPT_MODES,
  buildAIChatContextSummary,
  buildAIChatPrompt,
} from "../src/lib/buildAIChatPrompt";
import {
  applyEFlowCommandToGraph,
  dryRunEFlowCommandOnGraph,
} from "../src/lib/applyEflowCommand";
import { buildEFlowContextExport } from "../src/lib/buildEflowContextExport";
import { buildLifecycleSummary } from "../src/lib/buildLifecycleSummary";
import { buildManualEditSummary } from "../src/lib/buildManualEditSummary";
import { buildReviewQueue } from "../src/lib/buildReviewQueue";
import {
  isEFlowCommandEnvelope,
  validateEFlowCommandEnvelope,
} from "../src/lib/eflowCommandValidation";
import { buildFullAIContext } from "../src/lib/exportContext";
import { generateEngineeringFlow } from "../src/lib/generateEngineeringFlow";
import {
  createManualEdge,
  createManualNode,
  insertManualEdge,
  insertManualNode,
} from "../src/lib/manualGraphEditing";
import { buildWorkspaceDocument } from "../src/lib/workspacePersistence";
import {
  isEFlowWorkspaceDocument,
  isEngineeringFlowInput,
  normalizeEngineeringFlowInput,
  validateEFlowWorkspaceDocument,
  validateEngineeringFlowGraph,
} from "../src/lib/workspaceValidation";
import { translations } from "../src/lib/i18n/translations";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  type TranslationKey,
} from "../src/lib/i18n/types";
import {
  EFLOW_COMMAND_SCHEMA_VERSION,
  LIFECYCLE_STATUSES,
  REVIEW_STATUSES,
  type EFlowCommandEnvelope,
} from "../src/types/eflowCommand";
import { EFLOW_CONTEXT_SCHEMA_VERSION } from "../src/types/eflowContext";
import {
  EFLOW_AUDIT_EVENT_TYPES,
  EFLOW_AUDIT_SCHEMA_VERSION,
} from "../src/types/eflowAudit";

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
const auditEvent = createAuditEvent({
  createdAt: "2026-05-17T00:00:00.000Z",
  actor: {
    type: "human",
    id: "local-user",
    name: "Local user",
  },
  source: "manual_ui",
  eventType: "manual_node_created",
  summary: "Added manual node for validation.",
  target: {
    type: "node",
    id: "node-manual-validation",
  },
  after: {
    reviewStatus: "confirmed",
    lifecycleStatus: "planned",
  },
});
const graphGeneratedAuditEvent = createAuditEvent({
  createdAt: "2026-05-17T00:02:00.000Z",
  actor: {
    type: "human",
    id: "local-user",
    name: "Local user",
  },
  source: "manual_ui",
  eventType: "graph_generated",
  summary: `Generated engineering graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`,
  target: {
    type: "graph",
    id: graph.id,
  },
  after: {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
  },
  metadata: {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    sourceInputId: graph.sourceInputId,
    projectName: todoThoughtUniverseExample.projectName,
  },
});
const workspaceImportedAuditEvent = createAuditEvent({
  createdAt: "2026-05-17T00:03:00.000Z",
  actor: {
    type: "human",
    id: "local-user",
    name: "Local user",
  },
  source: "workspace",
  eventType: "workspace_imported",
  summary: `Imported workspace "${workspace.workspaceName}" with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`,
  target: {
    type: "workspace",
    id: todoThoughtUniverseExample.id,
  },
  after: {
    projectName: todoThoughtUniverseExample.projectName,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    importedAuditEventCount: 1,
  },
  metadata: {
    projectName: todoThoughtUniverseExample.projectName,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    importedAuditEventCount: 1,
  },
});
const nodeMetadataAuditEvent = createAuditEvent({
  createdAt: "2026-05-17T00:04:00.000Z",
  actor: {
    type: "human",
    id: "local-user",
    name: "Local user",
  },
  source: "manual_ui",
  eventType: "node_metadata_changed",
  summary: `Changed node "${graph.nodes[0].title}" metadata fields: title.`,
  target: {
    type: "node",
    id: graph.nodes[0].id,
  },
  before: {
    title: graph.nodes[0].title,
  },
  after: {
    title: `${graph.nodes[0].title} updated`,
  },
  metadata: {
    action: "owner_ui_metadata_edit",
    fields: ["title"],
  },
});
const edgeMetadataAuditEvent = createAuditEvent({
  createdAt: "2026-05-17T00:05:00.000Z",
  actor: {
    type: "human",
    id: "local-user",
    name: "Local user",
  },
  source: "manual_ui",
  eventType: "edge_metadata_changed",
  summary: `Changed edge "${graph.edges[0].id}" metadata fields: description.`,
  target: {
    type: "edge",
    id: graph.edges[0].id,
  },
  before: {
    description: graph.edges[0].description,
  },
  after: {
    description: `${graph.edges[0].description} updated`,
  },
  metadata: {
    action: "owner_ui_metadata_edit",
    fields: ["description"],
  },
});
const workspaceWithAuditLog = buildWorkspaceDocument({
  input: todoThoughtUniverseExample,
  graph,
  selectedNodeId: "node-intent",
  selectedEdgeId: null,
  auditLog: [auditEvent],
});
const nodeIds = new Set(graph.nodes.map((node) => node.id));
const lifecycleSummary = buildLifecycleSummary(graph);
const manualSummary = buildManualEditSummary(graph);

assert.equal(todoThoughtUniverseExample.schemaVersion, "engineering-flow-input/v0");
assert.equal(graph.schemaVersion, "engineering-flow-graph/v0");
assert.equal(graph.nodes.length, 52, "example graph should have 52 nodes");
assert.equal(graph.edges.length, 93, "example graph should have 93 edges");
assert.deepEqual(validateEngineeringFlowGraph(graph), { ok: true, errors: [] });
assert.equal(manualSummary.manualNodeCount, 0, "generated graph should start with no manual nodes");
assert.equal(manualSummary.manualEdgeCount, 0, "generated graph should start with no manual edges");
assert.deepEqual(
  manualSummary.manualNodeIds,
  [],
  "generated graph should start with no manual node ids",
);
assert.deepEqual(
  manualSummary.manualEdgeIds,
  [],
  "generated graph should start with no manual edge ids",
);

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

assert.equal(eflowContext.schemaVersion, EFLOW_CONTEXT_SCHEMA_VERSION);
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
assert.deepEqual(
  eflowContext.commandInterface.preferredOperations,
  [
    "updateNode",
    "transitionNode",
    "upsertNode",
    "updateEdge",
    "transitionEdge",
    "upsertEdge",
  ],
  "EFlow context should document graph-supported command operations",
);
assert.deepEqual(
  eflowContext.commandInterface.unsupportedOrSchemaOnlyOperations.map((operation) => operation.operation),
  ["addDecision", "addQuestion"],
  "EFlow context should document schema-only operations",
);
assert.deepEqual(
  eflowContext.commandInterface.localWorkflow.map((step) => step.step),
  ["validate", "dry_run", "apply"],
  "EFlow context should document the local command workflow",
);
assert.deepEqual(
  eflowContext.commandInterface.localWorkflow.map((step) => step.mutatesGraph),
  [false, false, true],
  "EFlow context should document which command workflow steps mutate graph state",
);
const commandSafetyRuleCodes = eflowContext.commandInterface.safetyRules.map((rule) => rule.code);
for (const code of [
  "dry_run_does_not_mutate_graph",
  "failed_operations_do_not_partially_apply",
  "missing_references_are_rejected",
  "self_edges_are_rejected",
  "duplicate_exact_edges_are_prevented",
  "unsupported_node_or_relationship_types_are_rejected",
]) {
  assert.ok(
    commandSafetyRuleCodes.includes(code),
    `EFlow context commandInterface safetyRules should include ${code}`,
  );
}
assert.ok(
  eflowContext.commandInterface.statusMapping.commandReviewStatusToGraphStatus.includes("node.status"),
  "statusMapping should document command reviewStatus to graph status mapping",
);
assert.ok(
  eflowContext.commandInterface.statusMapping.graphStatusToContextReviewStatus.includes("context"),
  "statusMapping should document graph status to context reviewStatus mapping",
);
assert.ok(
  eflowContext.commandInterface.statusMapping.lifecycleStatus.includes("separate"),
  "statusMapping should document lifecycleStatus as separate state",
);
assert.ok(
  eflowContext.commandInterface.statusMapping.unsupportedReviewStatusMappings.some(
    (mapping) => mapping.scope === "node" && mapping.reviewStatus === "rejected",
  ),
  "statusMapping should document unsupported node rejected mapping",
);
assert.ok(
  eflowContext.commandInterface.statusMapping.unsupportedReviewStatusMappings.some(
    (mapping) => mapping.scope === "edge" && mapping.reviewStatus === "needs_review",
  ),
  "statusMapping should document unsupported edge needs_review mapping",
);
assert.ok(
  eflowContext.commandInterface.defaultingRules.some(
    (rule) =>
      rule.field === "node.lifecycleStatus" &&
      rule.defaultValue === "planned" &&
      rule.writesBack === false,
  ),
  "commandInterface should document node lifecycleStatus defaulting",
);
assert.ok(
  eflowContext.commandInterface.defaultingRules.some(
    (rule) =>
      rule.field === "edge.lifecycleStatus" &&
      rule.defaultValue === "planned" &&
      rule.writesBack === false,
  ),
  "commandInterface should document edge lifecycleStatus defaulting",
);
assert.ok(
  eflowContext.commandInterface.auditBehavior.some(
    (behavior) =>
      behavior.path === "local_command_import_ui" &&
      behavior.eventType === "ai_command_applied",
  ),
  "commandInterface should document UI audit behavior for applied commands",
);
assert.ok(
  eflowContext.commandInterface.graphCompatibility.supportedNodeTypes.includes("feature"),
  "graphCompatibility should document supported graph node types",
);
assert.ok(
  eflowContext.commandInterface.graphCompatibility.unsupportedSchemaNodeTypes.includes("api_endpoint"),
  "graphCompatibility should document unsupported schema node types",
);
assert.ok(
  eflowContext.commandInterface.graphCompatibility.supportedRelationshipTypes.includes("relates_to"),
  "graphCompatibility should document supported graph relationship types",
);
assert.ok(
  eflowContext.commandInterface.graphCompatibility.unsupportedSchemaRelationshipTypes.includes("blocks"),
  "graphCompatibility should document unsupported schema relationship types",
);

assert.deepEqual(
  AI_CHAT_PROMPT_MODES.map((mode) => mode.id),
  [
    "free_chat",
    "codex_milestone_prompt",
    "codex_report_to_command",
    "raw_idea_to_input",
    "progress_handoff_summary",
    "strategic_architecture_consultation",
  ],
  "AI chat prompt modes should include the required collaboration mode ids",
);
assert.deepEqual(
  AI_CHAT_PROMPT_MODES.map((mode) => translations.en[mode.labelKey]),
  [
    "Free chat",
    "Generate Codex milestone prompt",
    "Convert Codex report to eflow-command",
    "Raw idea to EngineeringFlowInput JSON",
    "Progress / handoff summary",
    "Strategic architecture consultation",
  ],
  "AI chat prompt modes should include the required collaboration modes",
);
assert.deepEqual(
  AI_CHAT_CONTEXT_ATTACHMENT_MODES.map((mode) => mode.id),
  ["none", "summary", "full"],
  "AI chat context attachment modes should keep stable ids",
);
assert.deepEqual(
  AI_CHAT_CONTEXT_ATTACHMENT_MODES.map((mode) => translations.en[mode.labelKey]),
  ["No context", "Summary context", "Full EFlow Context"],
  "AI chat context attachment modes should be explicit and default to No context in the UI",
);
assert.equal(DEFAULT_LOCALE, "zh-TW", "Default UI locale should be zh-TW");
assert.equal(LOCALE_STORAGE_KEY, "eflow.ui.locale", "Locale storage key should stay UI-only");
assert.deepEqual([...LOCALES], ["zh-TW", "en"], "Supported UI locales should be bilingual");
const defaultTranslationKeys = Object.keys(translations[DEFAULT_LOCALE]).sort() as TranslationKey[];
for (const locale of LOCALES) {
  assert.deepEqual(
    Object.keys(translations[locale]).sort(),
    defaultTranslationKeys,
    `Locale ${locale} should cover the same translation keys as the default locale`,
  );
}
const commandConversionPrompt = buildAIChatPrompt({
  mode: "codex_report_to_command",
  userMessage: "Codex completed implementation.",
});
assert.ok(
  commandConversionPrompt.userPrompt.includes("eflow-command/v0.1"),
  "command-conversion prompt should mention eflow-command/v0.1",
);
assert.ok(
  commandConversionPrompt.userPrompt.includes("reviewStatus"),
  "command-conversion prompt should mention reviewStatus",
);
assert.ok(
  commandConversionPrompt.userPrompt.includes("lifecycleStatus"),
  "command-conversion prompt should mention lifecycleStatus",
);
const rawIdeaPrompt = buildAIChatPrompt({
  mode: "raw_idea_to_input",
  userMessage: "A local planning tool.",
});
assert.ok(
  rawIdeaPrompt.userPrompt.includes("EngineeringFlowInput"),
  "raw idea prompt should mention EngineeringFlowInput",
);
const codexMilestonePrompt = buildAIChatPrompt({
  mode: "codex_milestone_prompt",
  userMessage: "Add the next safe milestone.",
});
assert.ok(
  codexMilestonePrompt.userPrompt.includes("npm run validate:example"),
  "Codex milestone prompt should require validate:example",
);
assert.ok(
  codexMilestonePrompt.userPrompt.includes("npm run build"),
  "Codex milestone prompt should require build",
);
const noContextPrompt = buildAIChatPrompt({
  mode: "free_chat",
  userMessage: "Summarize current graph.",
});
assert.ok(
  !noContextPrompt.systemPrompt.includes(EFLOW_CONTEXT_SCHEMA_VERSION) &&
    !noContextPrompt.userPrompt.includes(EFLOW_CONTEXT_SCHEMA_VERSION),
  "No context prompt should exclude eflow-context/v0.1",
);
assert.ok(
  !noContextPrompt.userPrompt.includes("CURRENT EFLOW CONTEXT JSON") &&
    !noContextPrompt.userPrompt.includes('"nodes"') &&
    !noContextPrompt.userPrompt.includes('"edges"'),
  "No context prompt should exclude full context and graph JSON",
);
assert.equal(noContextPrompt.attachedContextSize, 0, "No context prompt should report no attached context");

const summaryContextPrompt = buildAIChatPrompt({
  mode: "free_chat",
  userMessage: "Summarize current graph.",
  eflowContextSummary: buildAIChatContextSummary({
    input: todoThoughtUniverseExample,
    graph,
  }),
});
assert.ok(
  summaryContextPrompt.userPrompt.includes("CURRENT EFLOW CONTEXT SUMMARY"),
  "Summary context prompt should include the summary marker",
);
assert.ok(
  !summaryContextPrompt.userPrompt.includes("CURRENT EFLOW CONTEXT JSON"),
  "Summary context prompt should not include the full JSON marker",
);
assert.ok(
  !summaryContextPrompt.userPrompt.includes(EFLOW_CONTEXT_SCHEMA_VERSION),
  "Summary context prompt should not include eflow-context/v0.1",
);
assert.ok(
  summaryContextPrompt.attachedContextSize > 0,
  "Summary context prompt should report attached summary size",
);

const fullContextPrompt = buildAIChatPrompt({
  mode: "free_chat",
  userMessage: "Summarize current graph.",
  eflowContextJson: JSON.stringify(eflowContext, null, 2),
});
assert.ok(
  fullContextPrompt.userPrompt.includes("CURRENT EFLOW CONTEXT JSON"),
  "Full context prompt should include the full JSON marker",
);
assert.ok(
  fullContextPrompt.userPrompt.includes("eflow-context/v0.1"),
  "Full context block should mention eflow-context/v0.1",
);
assert.ok(
  fullContextPrompt.attachedContextSize > 0,
  "Full context prompt should report context size",
);

assert.ok(isEFlowWorkspaceDocument(workspace), "workspace document should validate");
assert.deepEqual(
  validateEFlowWorkspaceDocument(workspace),
  { ok: true, errors: [] },
  "workspace document should pass detailed workspace validation",
);
assert.deepEqual(
  normalizeEngineeringFlowInput(todoThoughtUniverseExample),
  { EngineeringFlowInput: todoThoughtUniverseExample },
  "direct EngineeringFlowInput should normalize into the wrapper shape",
);
assert.deepEqual(
  normalizeEngineeringFlowInput({ EngineeringFlowInput: todoThoughtUniverseExample }),
  { EngineeringFlowInput: todoThoughtUniverseExample },
  "wrapped EngineeringFlowInput should normalize into the wrapper shape",
);
assert.throws(
  () => normalizeEngineeringFlowInput({ EngineeringFlowInput: { schemaVersion: "engineering-flow-input/v0" } }),
  /missing required fields/,
  "invalid wrapped EngineeringFlowInput should be rejected",
);
assert.ok(
  isEngineeringFlowInput({
    ...todoThoughtUniverseExample,
    sourceType: "raw_project_idea",
  }),
  "raw project idea EngineeringFlowInput should validate",
);
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

assert.equal(auditEvent.schemaVersion, EFLOW_AUDIT_SCHEMA_VERSION);
assert.ok(auditEvent.id.startsWith("audit-"), "audit event id should be prefixed");
assert.equal(auditEvent.eventType, "manual_node_created");
assert.ok(
  EFLOW_AUDIT_EVENT_TYPES.includes("graph_generated"),
  "known audit event types should include graph_generated",
);
assert.ok(
  EFLOW_AUDIT_EVENT_TYPES.includes("workspace_imported"),
  "known audit event types should include workspace_imported",
);
assert.ok(
  EFLOW_AUDIT_EVENT_TYPES.includes("node_metadata_changed"),
  "known audit event types should include node_metadata_changed",
);
assert.ok(
  EFLOW_AUDIT_EVENT_TYPES.includes("edge_metadata_changed"),
  "known audit event types should include edge_metadata_changed",
);
assert.equal(graphGeneratedAuditEvent.schemaVersion, EFLOW_AUDIT_SCHEMA_VERSION);
assert.equal(graphGeneratedAuditEvent.eventType, "graph_generated");
assert.equal(graphGeneratedAuditEvent.target?.type, "graph");
assert.equal(graphGeneratedAuditEvent.target?.id, graph.id);
assert.equal(
  graphGeneratedAuditEvent.metadata?.nodeCount,
  graph.nodes.length,
  "graph_generated audit metadata should store node count",
);
assert.equal(
  graphGeneratedAuditEvent.metadata?.edgeCount,
  graph.edges.length,
  "graph_generated audit metadata should store edge count",
);
const emptyAuditLog = [];
const appendedAuditLog = appendAuditEvent(emptyAuditLog, auditEvent);
assert.deepEqual(appendedAuditLog, [auditEvent], "appendAuditEvent should append event");
assert.equal(emptyAuditLog.length, 0, "appendAuditEvent should not mutate an empty source array");
const originalAuditLog = [auditEvent];
const secondAuditEvent = createAuditEvent({
  createdAt: "2026-05-17T00:01:00.000Z",
  actor: {
    type: "human",
    id: "local-user",
  },
  source: "manual_ui",
  eventType: "manual_edge_created",
  summary: "Added manual edge for validation.",
  target: {
    type: "edge",
    id: "edge-manual-validation",
  },
});
const nextAuditLog = appendAuditEvent(originalAuditLog, secondAuditEvent);
assert.notStrictEqual(nextAuditLog, originalAuditLog, "appendAuditEvent should be immutable");
assert.equal(originalAuditLog.length, 1, "appendAuditEvent should not mutate original array");
assert.equal(nextAuditLog.length, 2, "appendAuditEvent should include the new event");
assert.equal(nextAuditLog[0].id, secondAuditEvent.id, "newest audit event should be first");
const oversizedAuditLog = Array.from({ length: MAX_AUDIT_LOG_EVENTS + 5 }, (_, index) =>
  createAuditEvent({
    createdAt: `2026-05-17T00:${String(index % 60).padStart(2, "0")}:00.000Z`,
    actor: {
      type: "system",
      id: "validate",
    },
    source: "system",
    eventType: "validation_event",
    summary: `Validation audit event ${index}.`,
  }),
);
assert.equal(
  trimAuditLog(oversizedAuditLog).length,
  MAX_AUDIT_LOG_EVENTS,
  "trimAuditLog should cap audit history",
);
const auditSummary = buildAuditLogSummary(nextAuditLog);
assert.equal(auditSummary.totalEvents, 2, "audit summary should count events");
assert.equal(auditSummary.bySource.manual_ui, 2, "audit summary should count manual_ui events");
assert.equal(
  auditSummary.byEventType.manual_node_created,
  1,
  "audit summary should bucket event types",
);
const expandedAuditSummary = buildAuditLogSummary([
  workspaceImportedAuditEvent,
  graphGeneratedAuditEvent,
  ...nextAuditLog,
]);
assert.equal(expandedAuditSummary.totalEvents, 4, "audit summary should count expanded events");
assert.equal(
  expandedAuditSummary.byEventType.graph_generated,
  1,
  "audit summary should bucket graph_generated events",
);
assert.equal(
  expandedAuditSummary.byEventType.workspace_imported,
  1,
  "audit summary should bucket workspace_imported events",
);
assert.equal(
  expandedAuditSummary.bySource.workspace,
  1,
  "audit summary should count workspace import source",
);
assert.ok(
  isEFlowWorkspaceDocument(workspaceWithAuditLog),
  "workspace validation should accept valid auditLog",
);
assert.ok(
  isEFlowWorkspaceDocument(
    buildWorkspaceDocument({
      input: todoThoughtUniverseExample,
      graph,
      auditLog: [graphGeneratedAuditEvent, workspaceImportedAuditEvent],
    }),
  ),
  "workspace validation should accept valid graph/import audit events",
);
const parsedWorkspaceWithAuditLog = JSON.parse(JSON.stringify(workspaceWithAuditLog)) as unknown;
assert.ok(
  isEFlowWorkspaceDocument(parsedWorkspaceWithAuditLog),
  "parsed workspace with auditLog should validate",
);
assert.deepEqual(
  validateEFlowAuditLog([auditEvent]),
  { ok: true, errors: [] },
  "valid auditLog should pass detailed audit validation",
);
assert.deepEqual(
  validateEFlowAuditLog([nodeMetadataAuditEvent, edgeMetadataAuditEvent]),
  { ok: true, errors: [] },
  "metadata edit audit events should pass detailed audit validation",
);
const missingAuditLogWorkspace = {
  ...workspaceWithAuditLog,
} as Record<string, unknown>;
delete missingAuditLogWorkspace.auditLog;
assert.ok(
  isEFlowWorkspaceDocument(missingAuditLogWorkspace),
  "workspace validation should accept missing auditLog for backward compatibility",
);
assert.deepEqual(
  validateEFlowWorkspaceDocument(missingAuditLogWorkspace),
  { ok: true, errors: [] },
  "detailed workspace validation should accept missing auditLog",
);
assert.deepEqual(
  workspace.auditLog,
  [],
  "buildWorkspaceDocument should default missing auditLog to an empty array",
);
assert.deepEqual(
  workspaceWithAuditLog.auditLog?.map((event) => event.id),
  [auditEvent.id],
  "Workspace JSON should include auditLog events",
);
assert.equal(
  isEFlowWorkspaceDocument({
    ...workspaceWithAuditLog,
    auditLog: [{ ...auditEvent, schemaVersion: "wrong-schema" }],
  }),
  false,
  "workspace validation should reject clearly invalid auditLog events",
);
assert.equal(
  validateEFlowWorkspaceDocument({
    ...workspaceWithAuditLog,
    auditLog: { event: auditEvent },
  }).ok,
  false,
  "workspace validation should reject non-array auditLog",
);
assert.equal(
  validateEFlowWorkspaceDocument({
    ...workspaceWithAuditLog,
    auditLog: [{ ...auditEvent, source: "cloud" }],
  }).ok,
  false,
  "workspace validation should reject invalid audit event source",
);
assert.equal(
  validateEFlowWorkspaceDocument({
    ...workspaceWithAuditLog,
    auditLog: [{ ...auditEvent, actor: { type: "robot", id: "bad-actor" } }],
  }).ok,
  false,
  "workspace validation should reject invalid audit event actor shape",
);
assert.equal(
  validateEFlowWorkspaceDocument({
    ...workspaceWithAuditLog,
    auditLog: [{ ...auditEvent, eventType: "" }],
  }).ok,
  false,
  "workspace validation should reject invalid audit eventType shape",
);
assert.ok(
  validateEFlowWorkspaceDocument({
    ...workspace,
    engineeringFlowGraph: lifecycleMutationGraph,
  }).ok,
  "workspace validation should accept valid lifecycleStatus values",
);
assert.ok(
  validateEFlowWorkspaceDocument(workspace).ok,
  "workspace validation should accept missing lifecycleStatus values",
);
const invalidNodeLifecycleWorkspace = structuredClone(workspace);
if (invalidNodeLifecycleWorkspace.engineeringFlowGraph) {
  invalidNodeLifecycleWorkspace.engineeringFlowGraph.nodes[0] = {
    ...invalidNodeLifecycleWorkspace.engineeringFlowGraph.nodes[0],
    lifecycleStatus: "done",
  } as unknown as typeof invalidNodeLifecycleWorkspace.engineeringFlowGraph.nodes[number];
}
assert.equal(
  validateEFlowWorkspaceDocument(invalidNodeLifecycleWorkspace).ok,
  false,
  "workspace validation should reject invalid node lifecycleStatus",
);
const invalidEdgeLifecycleWorkspace = structuredClone(workspace);
if (invalidEdgeLifecycleWorkspace.engineeringFlowGraph) {
  invalidEdgeLifecycleWorkspace.engineeringFlowGraph.edges[0] = {
    ...invalidEdgeLifecycleWorkspace.engineeringFlowGraph.edges[0],
    lifecycleStatus: "done",
  } as unknown as typeof invalidEdgeLifecycleWorkspace.engineeringFlowGraph.edges[number];
}
assert.equal(
  validateEFlowWorkspaceDocument(invalidEdgeLifecycleWorkspace).ok,
  false,
  "workspace validation should reject invalid edge lifecycleStatus",
);
const missingNodeConfidenceWorkspace = structuredClone(workspace);
if (missingNodeConfidenceWorkspace.engineeringFlowGraph) {
  delete (missingNodeConfidenceWorkspace.engineeringFlowGraph.nodes[0] as { confidence?: number })
    .confidence;
}
assert.ok(
  validateEFlowWorkspaceDocument(missingNodeConfidenceWorkspace).errors.some((error) =>
    error.includes("missing confidence"),
  ),
  "workspace validation should reject missing node confidence",
);
const invalidNodeConfidenceWorkspace = structuredClone(workspace);
if (invalidNodeConfidenceWorkspace.engineeringFlowGraph) {
  invalidNodeConfidenceWorkspace.engineeringFlowGraph.nodes[0] = {
    ...invalidNodeConfidenceWorkspace.engineeringFlowGraph.nodes[0],
    confidence: 1.5,
  };
}
assert.ok(
  validateEFlowWorkspaceDocument(invalidNodeConfidenceWorkspace).errors.some((error) =>
    error.includes("invalid confidence"),
  ),
  "workspace validation should reject invalid node confidence",
);
const missingNodeProvenanceWorkspace = structuredClone(workspace);
if (missingNodeProvenanceWorkspace.engineeringFlowGraph) {
  delete (missingNodeProvenanceWorkspace.engineeringFlowGraph.nodes[0] as {
    provenance?: unknown;
  }).provenance;
}
assert.ok(
  validateEFlowWorkspaceDocument(missingNodeProvenanceWorkspace).errors.some((error) =>
    error.includes("missing provenance"),
  ),
  "workspace validation should reject missing node provenance",
);
const invalidNodeProvenanceWorkspace = structuredClone(workspace);
if (invalidNodeProvenanceWorkspace.engineeringFlowGraph) {
  invalidNodeProvenanceWorkspace.engineeringFlowGraph.nodes[0] = {
    ...invalidNodeProvenanceWorkspace.engineeringFlowGraph.nodes[0],
    provenance: {
      sourceType: "unknown_source",
    },
  } as unknown as typeof invalidNodeProvenanceWorkspace.engineeringFlowGraph.nodes[number];
}
assert.ok(
  validateEFlowWorkspaceDocument(invalidNodeProvenanceWorkspace).errors.some((error) =>
    error.includes("provenance.sourceType"),
  ),
  "workspace validation should reject invalid node provenance sourceType",
);
const missingEdgeConfidenceWorkspace = structuredClone(workspace);
if (missingEdgeConfidenceWorkspace.engineeringFlowGraph) {
  delete (missingEdgeConfidenceWorkspace.engineeringFlowGraph.edges[0] as { confidence?: number })
    .confidence;
}
assert.ok(
  validateEFlowWorkspaceDocument(missingEdgeConfidenceWorkspace).errors.some((error) =>
    error.includes("missing confidence"),
  ),
  "workspace validation should reject missing edge confidence",
);
const invalidEdgeConfidenceWorkspace = structuredClone(workspace);
if (invalidEdgeConfidenceWorkspace.engineeringFlowGraph) {
  invalidEdgeConfidenceWorkspace.engineeringFlowGraph.edges[0] = {
    ...invalidEdgeConfidenceWorkspace.engineeringFlowGraph.edges[0],
    confidence: -0.1,
  };
}
assert.ok(
  validateEFlowWorkspaceDocument(invalidEdgeConfidenceWorkspace).errors.some((error) =>
    error.includes("invalid confidence"),
  ),
  "workspace validation should reject invalid edge confidence",
);
const missingEdgeProvenanceWorkspace = structuredClone(workspace);
if (missingEdgeProvenanceWorkspace.engineeringFlowGraph) {
  delete (missingEdgeProvenanceWorkspace.engineeringFlowGraph.edges[0] as {
    provenance?: unknown;
  }).provenance;
}
assert.ok(
  validateEFlowWorkspaceDocument(missingEdgeProvenanceWorkspace).errors.some((error) =>
    error.includes("missing provenance"),
  ),
  "workspace validation should reject missing edge provenance",
);
const invalidEdgeProvenanceWorkspace = structuredClone(workspace);
if (invalidEdgeProvenanceWorkspace.engineeringFlowGraph) {
  invalidEdgeProvenanceWorkspace.engineeringFlowGraph.edges[0] = {
    ...invalidEdgeProvenanceWorkspace.engineeringFlowGraph.edges[0],
    provenance: {
      sourceType: "manual_edit",
      sourceInputIds: ["source-a", 2],
    },
  } as unknown as typeof invalidEdgeProvenanceWorkspace.engineeringFlowGraph.edges[number];
}
assert.ok(
  validateEFlowWorkspaceDocument(invalidEdgeProvenanceWorkspace).errors.some((error) =>
    error.includes("provenance.sourceInputIds"),
  ),
  "workspace validation should reject structurally invalid edge provenance",
);
const duplicateNodeWorkspace = structuredClone(workspace);
if (duplicateNodeWorkspace.engineeringFlowGraph) {
  duplicateNodeWorkspace.engineeringFlowGraph.nodes.push({
    ...duplicateNodeWorkspace.engineeringFlowGraph.nodes[0],
  });
}
assert.ok(
  validateEFlowWorkspaceDocument(duplicateNodeWorkspace).errors.some((error) =>
    error.includes("duplicate id"),
  ),
  "workspace validation should reject duplicate node ids",
);
const duplicateEdgeIdWorkspace = structuredClone(workspace);
if (duplicateEdgeIdWorkspace.engineeringFlowGraph) {
  duplicateEdgeIdWorkspace.engineeringFlowGraph.edges.push({
    ...duplicateEdgeIdWorkspace.engineeringFlowGraph.edges[0],
    source: graph.nodes[0].id,
    target: graph.nodes[1].id,
    relationshipType: "relates_to",
  });
}
assert.ok(
  validateEFlowWorkspaceDocument(duplicateEdgeIdWorkspace).errors.some((error) =>
    error.includes("duplicate id"),
  ),
  "workspace validation should reject duplicate edge ids",
);
const selfEdgeWorkspace = structuredClone(workspace);
if (selfEdgeWorkspace.engineeringFlowGraph) {
  selfEdgeWorkspace.engineeringFlowGraph.edges.push({
    ...selfEdgeWorkspace.engineeringFlowGraph.edges[0],
    id: "edge-validation-self",
    source: graph.nodes[0].id,
    target: graph.nodes[0].id,
  });
}
assert.ok(
  validateEFlowWorkspaceDocument(selfEdgeWorkspace).errors.some((error) =>
    error.includes("cannot reference itself"),
  ),
  "workspace validation should reject self-edges",
);
const duplicateRelationshipWorkspace = structuredClone(workspace);
if (duplicateRelationshipWorkspace.engineeringFlowGraph) {
  duplicateRelationshipWorkspace.engineeringFlowGraph.edges.push({
    ...duplicateRelationshipWorkspace.engineeringFlowGraph.edges[0],
    id: "edge-validation-duplicate-relationship",
  });
}
assert.ok(
  validateEFlowWorkspaceDocument(duplicateRelationshipWorkspace).errors.some((error) =>
    error.includes("duplicates relationship"),
  ),
  "workspace validation should reject duplicate exact relationships",
);

const targetNodeId = graph.nodes[0].id;
const targetEdge = graph.edges[0];
const reviewOnlyCommand: EFlowCommandEnvelope = {
  schemaVersion: "eflow-command/v0.1",
  commandId: "cmd_validate_review_only_update",
  projectId: todoThoughtUniverseExample.id,
  graphId: graph.id,
  createdAt: "2026-05-17T00:00:00.000Z",
  actor: {
    type: "ai_agent",
    id: "codex",
    name: "Codex",
  },
  intent: "review_sync",
  mode: "apply",
  operations: [
    {
      op: "updateNode",
      id: targetNodeId,
      patch: {
        reviewStatus: "confirmed",
      },
      reason: "Validate review-only node update.",
    },
    {
      op: "updateEdge",
      id: targetEdge.id,
      patch: {
        reviewStatus: "confirmed",
      },
      reason: "Validate review-only edge update.",
    },
  ],
};
const reviewOnlyApplyResult = applyEFlowCommandToGraph(graph, reviewOnlyCommand);
assert.ok(reviewOnlyApplyResult.ok, "review-only update command should succeed");
assert.equal(
  reviewOnlyApplyResult.graph.nodes.find((node) => node.id === targetNodeId)?.lifecycleStatus,
  undefined,
  "review-only updateNode should not write a derived lifecycleStatus default",
);
assert.equal(
  reviewOnlyApplyResult.graph.edges.find((edge) => edge.id === targetEdge.id)?.lifecycleStatus,
  undefined,
  "review-only updateEdge should not write a derived lifecycleStatus default",
);
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

const manualNode = createManualNode({
  id: "node-manual-validation",
  type: "feature",
  title: "Manual Validation Node",
  description: "A manually added node for headless graph editing validation.",
  position: {
    x: 2520,
    y: 0,
  },
});
assert.equal(manualNode.id, "node-manual-validation");
assert.equal(manualNode.provenance.sourceType, "manual_edit");
assert.deepEqual(manualNode.provenance.sourceInputIds, []);
assert.equal(manualNode.provenance.generationRule, "human_added_node");
assert.equal(manualNode.status, "confirmed", "manual node should default to confirmed review status");
assert.equal(
  manualNode.lifecycleStatus,
  "planned",
  "manual node should default to planned lifecycleStatus",
);

const manualNodeInsertResult = insertManualNode(graph, manualNode);
assert.ok(manualNodeInsertResult.ok, "manual node insert should succeed");
assert.notStrictEqual(
  manualNodeInsertResult.graph,
  graph,
  "manual node insert should return a new graph object",
);
assert.equal(
  graph.nodes.some((node) => node.id === manualNode.id),
  false,
  "manual node insert should not mutate the original graph",
);
assert.equal(manualNodeInsertResult.graph.nodes.length, graph.nodes.length + 1);
assert.ok(
  manualNodeInsertResult.graph.nodes.some((node) => node.id === manualNode.id),
  "inserted manual node should be present in the new graph",
);

const duplicateManualNodeResult = insertManualNode(manualNodeInsertResult.graph, manualNode);
assert.equal(duplicateManualNodeResult.ok, false, "duplicate manual node id should fail");
assert.strictEqual(
  duplicateManualNodeResult.graph,
  manualNodeInsertResult.graph,
  "failed manual node insert should return the original graph object",
);
assert.ok(
  duplicateManualNodeResult.errors.some((error) => error.code === "graph.duplicate_node"),
  "duplicate manual node id should report graph.duplicate_node",
);

const manualEdge = createManualEdge({
  id: "edge-manual-validation",
  source: targetNodeId,
  target: manualNode.id,
  relationshipType: "relates_to",
  description: "Manual validation edge for headless graph editing.",
});
assert.equal(manualEdge.id, "edge-manual-validation");
assert.equal(manualEdge.provenance.sourceType, "manual_edit");
assert.deepEqual(manualEdge.provenance.sourceInputIds, []);
assert.equal(manualEdge.provenance.generationRule, "human_added_edge");
assert.equal(manualEdge.status, "confirmed", "manual edge should default to confirmed review status");
assert.equal(
  manualEdge.lifecycleStatus,
  "planned",
  "manual edge should default to planned lifecycleStatus",
);

const missingSourceManualEdgeResult = insertManualEdge(manualNodeInsertResult.graph, {
  ...manualEdge,
  id: "edge-manual-missing-source",
  source: "node-does-not-exist",
});
assert.equal(missingSourceManualEdgeResult.ok, false, "manual edge missing source should fail");
assert.ok(
  missingSourceManualEdgeResult.errors.some((error) => error.code === "graph.edge_source_missing"),
  "manual edge missing source should report graph.edge_source_missing",
);

const missingTargetManualEdgeResult = insertManualEdge(manualNodeInsertResult.graph, {
  ...manualEdge,
  id: "edge-manual-missing-target",
  target: "node-does-not-exist",
});
assert.equal(missingTargetManualEdgeResult.ok, false, "manual edge missing target should fail");
assert.ok(
  missingTargetManualEdgeResult.errors.some((error) => error.code === "graph.edge_target_missing"),
  "manual edge missing target should report graph.edge_target_missing",
);

const selfManualEdgeResult = insertManualEdge(manualNodeInsertResult.graph, {
  ...manualEdge,
  id: "edge-manual-self",
  source: targetNodeId,
  target: targetNodeId,
});
assert.equal(selfManualEdgeResult.ok, false, "manual self-edge should fail");
assert.ok(
  selfManualEdgeResult.errors.some((error) => error.code === "graph.self_edge"),
  "manual self-edge should report graph.self_edge",
);

const duplicateExactManualEdgeResult = insertManualEdge(
  manualNodeInsertResult.graph,
  createManualEdge({
    id: "edge-manual-duplicate-exact",
    source: targetEdge.source,
    target: targetEdge.target,
    relationshipType: targetEdge.relationshipType,
    description: "Duplicate exact edge validation.",
  }),
);
assert.equal(duplicateExactManualEdgeResult.ok, false, "duplicate exact manual edge should fail");
assert.ok(
  duplicateExactManualEdgeResult.errors.some((error) => error.code === "graph.duplicate_exact_edge"),
  "duplicate exact manual edge should report graph.duplicate_exact_edge",
);

const manualEdgeInsertResult = insertManualEdge(manualNodeInsertResult.graph, manualEdge);
assert.ok(manualEdgeInsertResult.ok, "manual edge insert should succeed");
assert.notStrictEqual(
  manualEdgeInsertResult.graph,
  manualNodeInsertResult.graph,
  "manual edge insert should return a new graph object",
);
assert.equal(
  manualNodeInsertResult.graph.edges.some((edge) => edge.id === manualEdge.id),
  false,
  "manual edge insert should not mutate the original graph",
);
assert.equal(manualEdgeInsertResult.graph.edges.length, graph.edges.length + 1);

const workspaceWithManualItems = buildWorkspaceDocument({
  input: todoThoughtUniverseExample,
  graph: manualEdgeInsertResult.graph,
  selectedNodeId: manualNode.id,
  selectedEdgeId: manualEdge.id,
  auditLog: [auditEvent, secondAuditEvent],
});
assert.ok(
  isEFlowWorkspaceDocument(workspaceWithManualItems),
  "workspace with auditLog and manual items should validate",
);
const parsedWorkspaceWithManualItems = JSON.parse(
  JSON.stringify(workspaceWithManualItems),
) as typeof workspaceWithManualItems;
assert.ok(
  isEFlowWorkspaceDocument(parsedWorkspaceWithManualItems),
  "workspace JSON with manual items should validate after parse",
);
const restoredManualNode = parsedWorkspaceWithManualItems.engineeringFlowGraph?.nodes.find(
  (node) => node.id === manualNode.id,
);
const restoredManualEdge = parsedWorkspaceWithManualItems.engineeringFlowGraph?.edges.find(
  (edge) => edge.id === manualEdge.id,
);
assert.equal(
  restoredManualNode?.provenance.sourceType,
  "manual_edit",
  "manual node provenance should survive workspace JSON parse",
);
assert.equal(
  restoredManualNode?.lifecycleStatus,
  manualNode.lifecycleStatus,
  "manual node lifecycleStatus should survive workspace JSON parse",
);
assert.equal(
  restoredManualNode?.status,
  manualNode.status,
  "manual node review status should survive workspace JSON parse",
);
assert.deepEqual(
  restoredManualNode?.position,
  manualNode.position,
  "manual node position should survive workspace JSON parse",
);
assert.equal(
  restoredManualEdge?.provenance.sourceType,
  "manual_edit",
  "manual edge provenance should survive workspace JSON parse",
);
assert.equal(
  restoredManualEdge?.lifecycleStatus,
  manualEdge.lifecycleStatus,
  "manual edge lifecycleStatus should survive workspace JSON parse",
);
assert.equal(
  restoredManualEdge?.status,
  manualEdge.status,
  "manual edge review status should survive workspace JSON parse",
);
assert.equal(
  restoredManualEdge?.source,
  manualEdge.source,
  "manual edge source should survive workspace JSON parse",
);
assert.equal(
  restoredManualEdge?.target,
  manualEdge.target,
  "manual edge target should survive workspace JSON parse",
);
assert.deepEqual(
  parsedWorkspaceWithManualItems.auditLog?.map((event) => event.id),
  [auditEvent.id, secondAuditEvent.id],
  "workspace auditLog should survive workspace JSON parse",
);

const insertedManualSummary = buildManualEditSummary(manualEdgeInsertResult.graph);
assert.equal(insertedManualSummary.manualNodeCount, 1, "manual summary should count one manual node");
assert.equal(insertedManualSummary.manualEdgeCount, 1, "manual summary should count one manual edge");
assert.deepEqual(
  insertedManualSummary.manualNodeIds,
  [manualNode.id],
  "manual summary should include inserted manual node id",
);
assert.deepEqual(
  insertedManualSummary.manualEdgeIds,
  [manualEdge.id],
  "manual summary should include inserted manual edge id",
);
assert.deepEqual(
  insertedManualSummary.nodesByReviewStatus.confirmed,
  [manualNode.id],
  "manual summary should bucket nodes by legacy review status",
);
assert.deepEqual(
  insertedManualSummary.edgesByReviewStatus.confirmed,
  [manualEdge.id],
  "manual summary should bucket edges by legacy review status",
);

const manualStatusGraph = structuredClone(manualEdgeInsertResult.graph);
manualStatusGraph.nodes = manualStatusGraph.nodes.map((node) =>
  node.id === manualNode.id
    ? { ...node, status: "needs_review", lifecycleStatus: "completed" }
    : node,
);
manualStatusGraph.edges = manualStatusGraph.edges.map((edge) =>
  edge.id === manualEdge.id
    ? { ...edge, status: "suggested", lifecycleStatus: "blocked" }
    : edge,
);
const manualStatusSummary = buildManualEditSummary(manualStatusGraph);
assert.deepEqual(
  manualStatusSummary.nodesByReviewStatus.needs_review,
  [manualNode.id],
  "manual summary should use node.status, not node.lifecycleStatus, for review buckets",
);
assert.deepEqual(
  manualStatusSummary.edgesByReviewStatus.suggested,
  [manualEdge.id],
  "manual summary should use edge.status, not edge.lifecycleStatus, for review buckets",
);

const manualReviewQueue = buildReviewQueue(manualStatusGraph);
const manualNodeReviewItem = manualReviewQueue.items.find(
  (item) => item.graphItemId === manualNode.id,
);
const manualEdgeReviewItem = manualReviewQueue.items.find(
  (item) => item.graphItemId === manualEdge.id,
);
assert.equal(
  manualNodeReviewItem?.reason,
  "Human-added manual context marked for review.",
  "manual node review queue reason should be manual-aware",
);
assert.ok(
  manualEdgeReviewItem?.reason.includes("Human-added manual relationship"),
  "manual edge review queue reason should be manual-aware",
);

const duplicateManualEdgeIdResult = insertManualEdge(manualEdgeInsertResult.graph, {
  ...manualEdge,
  source: manualNode.id,
  target: targetNodeId,
});
assert.equal(duplicateManualEdgeIdResult.ok, false, "duplicate manual edge id should fail");
assert.ok(
  duplicateManualEdgeIdResult.errors.some((error) => error.code === "graph.duplicate_edge"),
  "duplicate manual edge id should report graph.duplicate_edge",
);

const manualEflowContext = buildEFlowContextExport({
  engineeringFlowInput: todoThoughtUniverseExample,
  engineeringFlowGraph: manualEdgeInsertResult.graph,
  generatedAt: "2026-05-17T00:00:00.000Z",
});
assert.ok(
  manualEflowContext.graph.nodes.some((node) => node.id === manualNode.id),
  "inserted manual node should appear in EFlow context export",
);
assert.ok(
  manualEflowContext.graph.edges.some((edge) => edge.id === manualEdge.id),
  "inserted manual edge should appear in EFlow context export",
);
assert.ok(
  manualEflowContext.reviewSummary.nodesByReviewStatus.confirmed.includes(manualNode.id),
  "manual node should appear as confirmed in EFlow context review summary",
);
assert.ok(
  manualEflowContext.progressSummary.edgesByLifecycle.planned.includes(manualEdge.id),
  "manual edge should appear as planned in EFlow context progress summary",
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
const invalidProvenanceCommand = {
  ...updateCommand,
  commandId: "cmd_validate_invalid_provenance_source",
  operations: [
    {
      op: "updateNode",
      id: targetNodeId,
      patch: {
        provenance: {
          sourceType: "unknown_source",
        },
      },
    },
  ],
} as unknown;
const invalidProvenanceResult = validateEFlowCommandEnvelope(invalidProvenanceCommand);
assert.equal(invalidProvenanceResult.ok, false, "invalid provenance sourceType should fail validation");
assert.ok(
  invalidProvenanceResult.errors.some((error) => error.code === "provenance.invalid_source_type"),
  "invalid provenance sourceType should report provenance.invalid_source_type",
);
const invalidProvenanceApplyResult = applyEFlowCommandToGraph(
  graph,
  invalidProvenanceCommand as EFlowCommandEnvelope,
);
assert.equal(
  invalidProvenanceApplyResult.ok,
  false,
  "apply should reject invalid provenance sourceType during command validation",
);

console.log(
  `Example validation passed: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${fullContext.confirmationSummary.blockingQuestionNodeIds.length} blocking questions.`,
);
