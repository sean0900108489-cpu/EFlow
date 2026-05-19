import { EFLOW_COMMAND_SCHEMA_VERSION } from "../types/eflowCommand";
import { EFLOW_CONTEXT_SCHEMA_VERSION } from "../types/eflowContext";
import type { EngineeringFlowGraph, EngineeringFlowInput } from "../types/engineeringFlow";
import { buildGraphTrustSummary, isBlockingQuestionNode } from "./trustSummary";

export const AI_CHAT_PROMPT_MODES = [
  {
    id: "free_chat",
    label: "Free chat",
  },
  {
    id: "codex_milestone_prompt",
    label: "Generate Codex milestone prompt",
  },
  {
    id: "codex_report_to_command",
    label: "Convert Codex report to eflow-command",
  },
  {
    id: "raw_idea_to_input",
    label: "Raw idea to EngineeringFlowInput JSON",
  },
  {
    id: "progress_handoff_summary",
    label: "Progress / handoff summary",
  },
  {
    id: "strategic_architecture_consultation",
    label: "Strategic architecture consultation",
  },
] as const;

export type AIChatPromptMode = (typeof AI_CHAT_PROMPT_MODES)[number]["id"];

export const AI_CHAT_CONTEXT_ATTACHMENT_MODES = [
  {
    id: "none",
    label: "No context",
  },
  {
    id: "summary",
    label: "Summary context",
  },
  {
    id: "full",
    label: "Full EFlow Context",
  },
] as const;

export type AIChatContextAttachmentMode = (typeof AI_CHAT_CONTEXT_ATTACHMENT_MODES)[number]["id"];

export interface BuildAIChatPromptArgs {
  mode: AIChatPromptMode;
  userMessage: string;
  eflowContextSummary?: string;
  eflowContextJson?: string;
}

export interface BuiltAIChatPrompt {
  systemPrompt: string;
  userPrompt: string;
  attachedContextSize: number;
}

export function buildAIChatPrompt({
  mode,
  userMessage,
  eflowContextSummary,
  eflowContextJson,
}: BuildAIChatPromptArgs): BuiltAIChatPrompt {
  const trimmedMessage = userMessage.trim();
  const contextBlock = eflowContextJson
    ? buildFullContextAttachmentBlock(eflowContextJson)
    : eflowContextSummary
      ? buildSummaryContextAttachmentBlock(eflowContextSummary)
      : "";
  const modeInstruction = getModeInstruction(mode);
  const userPrompt = [contextBlock, modeInstruction, buildUserMessageBlock(trimmedMessage)]
    .filter(Boolean)
    .join("\n\n");

  return {
    systemPrompt: buildSystemPrompt(),
    userPrompt,
    attachedContextSize: eflowContextJson?.length ?? eflowContextSummary?.length ?? 0,
  };
}

export function buildAIChatContextSummary({
  input,
  graph,
}: {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
}): string {
  const inputShape = [
    `${input.userTypes.length} user types`,
    `${input.mainScreens.length} screens`,
    `${input.coreFunctions.length} core functions`,
    `${input.flowSteps.length} flow steps`,
    `${input.dataObjects.length} data objects`,
    `${input.aiRoles.length} AI roles`,
    `${input.unknowns.length} unknowns`,
  ].join(", ");

  if (!graph) {
    return [
      `Project: ${input.projectName}`,
      `Intent: ${input.projectIntent}`,
      `Input shape: ${inputShape}.`,
      "Graph state: no graph has been generated or imported yet.",
    ].join("\n");
  }

  const trustSummary = buildGraphTrustSummary(graph);
  const blockingQuestions = graph.nodes
    .filter(isBlockingQuestionNode)
    .slice(0, 3)
    .map((node) => `- ${node.title}`);

  return [
    `Project: ${input.projectName}`,
    `Intent: ${input.projectIntent}`,
    `Input shape: ${inputShape}.`,
    `Graph state: ${trustSummary.totalNodes} nodes and ${trustSummary.totalEdges} edges.`,
    `Node review state: ${trustSummary.confirmedNodes} confirmed, ${trustSummary.suggestedNodes} suggested, ${trustSummary.needsReviewNodes} needs review.`,
    `Edge review state: ${trustSummary.confirmedEdges} confirmed, ${trustSummary.suggestedEdges} suggested, ${trustSummary.rejectedEdges} rejected.`,
    `Blocking questions: ${trustSummary.blockingQuestions}.`,
    blockingQuestions.length > 0 ? `Top blocking questions:\n${blockingQuestions.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSystemPrompt(): string {
  return [
    "You are collaborating inside EFlow, a local-first, schema-first AI-to-AI Communication & Architecture Sync Hub.",
    "EngineeringFlowGraph is the source of truth. The canvas is only a rendering.",
    "Legacy node.status and edge.status are review/confirmation status. Formal AI-facing review status is reviewStatus. Implementation progress is lifecycleStatus.",
    "LLM chat responses are drafts only. They must not be treated as truth, must not mutate the graph, and must not auto-apply commands.",
    `Any generated ${EFLOW_COMMAND_SCHEMA_VERSION} must still go through EFlow Local Command Import: Validate -> Dry Run -> Apply.`,
    "Any attached project context is read-only context for reasoning.",
  ].join("\n");
}

function buildSummaryContextAttachmentBlock(eflowContextSummary: string): string {
  return [
    "CURRENT EFLOW CONTEXT SUMMARY:",
    "This is compact project state, not the full context JSON.",
    eflowContextSummary,
  ].join("\n");
}

function buildFullContextAttachmentBlock(eflowContextJson: string): string {
  return [
    `CURRENT EFLOW CONTEXT JSON (${EFLOW_CONTEXT_SCHEMA_VERSION}):`,
    "```json",
    eflowContextJson,
    "```",
  ].join("\n");
}

function buildUserMessageBlock(userMessage: string): string {
  return ["User message:", userMessage || "(No additional user text provided.)"].join("\n");
}

function getModeInstruction(mode: AIChatPromptMode): string {
  switch (mode) {
    case "free_chat":
      return [
        "Mode: Free chat.",
        "Respond directly to the user's message.",
        "If an EFlow Context block is attached, use it as read-only project context and do not imply that your answer changes EFlow state.",
      ].join("\n");

    case "codex_milestone_prompt":
      return [
        "Mode: Generate Codex milestone prompt.",
        "Produce a Codex App implementation prompt for the next small milestone.",
        "The prompt must require Codex to inspect the repository first, preserve local-first boundaries, keep scope small, and avoid backend/cloud/API/MCP work unless explicitly requested.",
        "The prompt must require Codex to run npm run validate:example, npm run build, git diff --check, git status -sb, git diff --stat, and git diff --name-only before reporting.",
        "The prompt must say Codex must not commit or push.",
        "The prompt must ask for a final report with files changed, validation results, known limitations, and a suggested commit message.",
      ].join("\n");

    case "codex_report_to_command":
      return [
        "Mode: Convert Codex report to eflow-command.",
        `Output only valid ${EFLOW_COMMAND_SCHEMA_VERSION} JSON if a safe command can be generated. Do not output markdown.`,
        "Use existing node and edge ids only unless safe upsert is clearly supported by the current context.",
        "reviewStatus is review/confirmation state. lifecycleStatus is implementation progress.",
        "Never put completed, blocked, developing, needs_refactor, deprecated, ready, draft, or planned into legacy graph status.",
        "Use lifecycleStatus for implementation progress and reviewStatus for architecture confirmation.",
        "If mapping is uncertain, say no safe command can be generated.",
        "Generated commands are drafts and must still be pasted into Local Command Import for Validate -> Dry Run -> Apply.",
      ].join("\n");

    case "raw_idea_to_input":
      return [
        "Mode: Raw idea to EngineeringFlowInput JSON.",
        "Output valid EngineeringFlowInput JSON only. Do not output markdown.",
        "Use schemaVersion, id, projectName, projectIntent, sourceType, createdAt, updatedAt, userTypes, mainScreens, coreFunctions, flowSteps, dataObjects, aiRoles, and unknowns.",
        "Preserve uncertainty as unknowns instead of silently inventing facts.",
        "Do not invent backend, cloud sync, auth, payment, AI automation, or external integrations unless the user's intent requires them.",
      ].join("\n");

    case "progress_handoff_summary":
      return [
        "Mode: Progress / handoff summary.",
        "Generate a compact continuation report with current checkpoint, completed milestones, known limitations, next recommended milestone, do-not-do boundaries, and a suggested Codex state-check or implementation prompt.",
        "Preserve EngineeringFlowGraph as source of truth and distinguish reviewStatus from lifecycleStatus.",
      ].join("\n");

    case "strategic_architecture_consultation":
      return [
        "Mode: Strategic architecture consultation.",
        "Reason about architecture and product direction rather than writing implementation code.",
        "Include candidate options, tradeoffs, anti-goals, a recommendation, and downstream Codex boundaries.",
        "Preserve EngineeringFlowGraph as source of truth and distinguish reviewStatus from lifecycleStatus.",
      ].join("\n");

    default: {
      const exhaustiveCheck: never = mode;
      return exhaustiveCheck;
    }
  }
}
