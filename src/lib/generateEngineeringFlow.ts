import type {
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNode,
  RelationshipType,
  SourceType,
} from "../types/engineeringFlow";
import { nowIso } from "./dates";
import { makeEdgeId, makeGraphId, makeNodeId } from "./ids";

type NodeColumn =
  | "intent"
  | "user"
  | "screen"
  | "feature"
  | "flow_step"
  | "data_object"
  | "ai_task"
  | "question";

const columnX: Record<NodeColumn, number> = {
  intent: 0,
  user: 280,
  screen: 560,
  feature: 840,
  flow_step: 1120,
  data_object: 1400,
  ai_task: 1680,
  question: 1960,
};

const rowY = (index: number) => index * 150;

function makeNode(args: {
  id: string;
  type: NodeColumn;
  title: string;
  description: string;
  summary: string;
  x: number;
  y: number;
  sourceType: SourceType;
  sourceInputSection?: string;
  sourceInputId?: string;
  generationRule: string;
}): EngineeringNode {
  return {
    id: args.id,
    type: args.type,
    title: args.title,
    description: args.description,
    status: "suggested",
    aiReadableSummary: args.summary,
    position: {
      x: args.x,
      y: args.y,
    },
    confidence: 1,
    provenance: {
      sourceType: args.sourceType,
      sourceInputSection: args.sourceInputSection,
      sourceInputId: args.sourceInputId,
      generationRule: args.generationRule,
    },
  };
}

function makeEdge(args: {
  source: string;
  target: string;
  relationshipType: RelationshipType;
  description: string;
  confidence: number;
  sourceType: SourceType;
  sourceInputIds?: string[];
  generationRule: string;
}): EngineeringEdge {
  return {
    id: makeEdgeId(args.source, args.target, args.relationshipType),
    source: args.source,
    target: args.target,
    relationshipType: args.relationshipType,
    status: "suggested",
    description: args.description,
    confidence: args.confidence,
    provenance: {
      sourceType: args.sourceType,
      sourceInputIds: args.sourceInputIds,
      generationRule: args.generationRule,
    },
  };
}

function makeSummary(prefix: string, title: string, detail: string): string {
  return `${prefix}: ${title}. ${detail}`.trim();
}

export function generateEngineeringFlow(input: EngineeringFlowInput): EngineeringFlowGraph {
  const generatedAt = nowIso();
  const nodes: EngineeringNode[] = [
    makeNode({
      id: "node-intent",
      type: "intent",
      title: input.projectName,
      description: input.projectIntent,
      summary: `${input.projectName}: ${input.projectIntent}`,
      x: columnX.intent,
      y: rowY(0),
      sourceType: input.sourceType,
      generationRule: "project_intent_to_intent_node",
    }),
  ];

  const nodeIdBySourceInputId = new Map<string, string>();

  input.userTypes.forEach((user, index) => {
    const id = makeNodeId("user", user.id);
    nodeIdBySourceInputId.set(user.id, id);
    nodes.push(
      makeNode({
        id,
        type: "user",
        title: user.name,
        description: `${user.goal}\n${user.description}`,
        summary: makeSummary("User type", user.name, `${user.goal} ${user.description}`),
        x: columnX.user,
        y: rowY(index),
        sourceType: input.sourceType,
        sourceInputSection: "userTypes",
        sourceInputId: user.id,
        generationRule: "user_type_to_user_node",
      }),
    );
  });

  input.mainScreens.forEach((screen, index) => {
    const id = makeNodeId("screen", screen.id);
    nodeIdBySourceInputId.set(screen.id, id);
    nodes.push(
      makeNode({
        id,
        type: "screen",
        title: screen.name,
        description: [screen.purpose, screen.keyActions.join(", ")].filter(Boolean).join("\n"),
        summary: makeSummary("Screen", screen.name, screen.purpose),
        x: columnX.screen,
        y: rowY(index),
        sourceType: input.sourceType,
        sourceInputSection: "mainScreens",
        sourceInputId: screen.id,
        generationRule: "main_screen_to_screen_node",
      }),
    );
  });

  input.coreFunctions.forEach((coreFunction, index) => {
    const id = makeNodeId("feature", coreFunction.id);
    nodeIdBySourceInputId.set(coreFunction.id, id);
    nodes.push(
      makeNode({
        id,
        type: "feature",
        title: coreFunction.name,
        description: `${coreFunction.description}\nPriority: ${coreFunction.priority}`,
        summary: makeSummary("Core function", coreFunction.name, coreFunction.description),
        x: columnX.feature,
        y: rowY(index),
        sourceType: input.sourceType,
        sourceInputSection: "coreFunctions",
        sourceInputId: coreFunction.id,
        generationRule: "core_function_to_feature_node",
      }),
    );
  });

  input.flowSteps.forEach((flowStep, index) => {
    const id = makeNodeId("flow", flowStep.id);
    nodeIdBySourceInputId.set(flowStep.id, id);
    nodes.push(
      makeNode({
        id,
        type: "flow_step",
        title: `${flowStep.step}. ${flowStep.title}`,
        description: flowStep.description,
        summary: makeSummary("Flow step", flowStep.title, flowStep.description),
        x: columnX.flow_step,
        y: rowY(index),
        sourceType: input.sourceType,
        sourceInputSection: "flowSteps",
        sourceInputId: flowStep.id,
        generationRule: "flow_step_to_flow_step_node",
      }),
    );
  });

  input.dataObjects.forEach((dataObject, index) => {
    const id = makeNodeId("data", dataObject.id);
    nodeIdBySourceInputId.set(dataObject.id, id);
    nodes.push(
      makeNode({
        id,
        type: "data_object",
        title: dataObject.name,
        description: dataObject.description,
        summary: makeSummary("Data object", dataObject.name, dataObject.description),
        x: columnX.data_object,
        y: rowY(index),
        sourceType: input.sourceType,
        sourceInputSection: "dataObjects",
        sourceInputId: dataObject.id,
        generationRule: "data_object_to_data_object_node",
      }),
    );
  });

  input.aiRoles.forEach((aiRole, index) => {
    const id = makeNodeId("ai", aiRole.id);
    nodeIdBySourceInputId.set(aiRole.id, id);
    nodes.push(
      makeNode({
        id,
        type: "ai_task",
        title: aiRole.task,
        description: aiRole.requiresHumanConfirmation
          ? "Requires human confirmation."
          : "Can be used as low-risk AI assistance without explicit confirmation.",
        summary: makeSummary(
          "AI task",
          aiRole.task,
          aiRole.requiresHumanConfirmation
            ? "Requires human confirmation."
            : "Does not require human confirmation.",
        ),
        x: columnX.ai_task,
        y: rowY(index),
        sourceType: input.sourceType,
        sourceInputSection: "aiRoles",
        sourceInputId: aiRole.id,
        generationRule: "ai_role_to_ai_task_node",
      }),
    );
  });

  input.unknowns.forEach((unknown, index) => {
    const id = makeNodeId("question", unknown.id);
    nodeIdBySourceInputId.set(unknown.id, id);
    const blockingPrefix = unknown.blocksGeneration
      ? "Blocks generation decisions until resolved."
      : "Does not block first graph generation.";
    nodes.push(
      makeNode({
        id,
        type: "question",
        title: unknown.question,
        description: `${blockingPrefix}\n${unknown.question}`,
        summary: makeSummary("Unknown", unknown.question, blockingPrefix),
        x: columnX.question,
        y: rowY(index),
        sourceType: input.sourceType,
        sourceInputSection: "unknowns",
        sourceInputId: unknown.id,
        generationRule: unknown.blocksGeneration
          ? "blocking_unknown_to_question_node"
          : "unknown_to_question_node",
      }),
    );
  });

  const edges: EngineeringEdge[] = [];
  const screenNameById = new Map(input.mainScreens.map((screen) => [screen.id, screen.name]));
  const dataObjectNameById = new Map(
    input.dataObjects.map((dataObject) => [dataObject.id, dataObject.name]),
  );
  const functionNameById = new Map(
    input.coreFunctions.map((coreFunction) => [coreFunction.id, coreFunction.name]),
  );
  const sourceTitleById = new Map<string, string>([
    ...input.userTypes.map((user) => [user.id, user.name] as const),
    ...input.mainScreens.map((screen) => [screen.id, screen.name] as const),
    ...input.coreFunctions.map((coreFunction) => [coreFunction.id, coreFunction.name] as const),
    ...input.flowSteps.map((flowStep) => [flowStep.id, flowStep.title] as const),
    ...input.dataObjects.map((dataObject) => [dataObject.id, dataObject.name] as const),
    ...input.aiRoles.map((aiRole) => [aiRole.id, aiRole.task] as const),
    ...input.unknowns.map((unknown) => [unknown.id, unknown.question] as const),
  ]);

  input.userTypes.forEach((user) => {
    const target = nodeIdBySourceInputId.get(user.id);
    if (!target) return;
    edges.push(
      makeEdge({
        source: "node-intent",
        target,
        relationshipType: "serves",
        description: `Generated because the project intent serves this user type: '${user.name}'.`,
        confidence: 0.75,
        sourceType: "system_generated",
        sourceInputIds: [input.id, user.id],
        generationRule: "intent_serves_each_user_type",
      }),
    );
  });

  input.mainScreens.forEach((screen) => {
    const target = nodeIdBySourceInputId.get(screen.id);
    if (!target) return;
    edges.push(
      makeEdge({
        source: "node-intent",
        target,
        relationshipType: "contains",
        description: `Generated because the project intent contains this main screen: '${screen.name}'.`,
        confidence: 0.75,
        sourceType: "system_generated",
        sourceInputIds: [input.id, screen.id],
        generationRule: "intent_contains_each_screen",
      }),
    );
  });

  const sortedSteps = [...input.flowSteps].sort((a, b) => a.step - b.step);
  sortedSteps.forEach((flowStep, index) => {
    const nextFlowStep = sortedSteps[index + 1];
    if (!nextFlowStep) return;
    const source = nodeIdBySourceInputId.get(flowStep.id);
    const target = nodeIdBySourceInputId.get(nextFlowStep.id);
    if (!source || !target) return;
    edges.push(
      makeEdge({
        source,
        target,
        relationshipType: "leads_to",
        description: `Generated because flow step ${flowStep.step} leads to flow step ${nextFlowStep.step}.`,
        confidence: 0.9,
        sourceType: "system_generated",
        sourceInputIds: [flowStep.id, nextFlowStep.id],
        generationRule: "flow_step_sequence_to_leads_to_edge",
      }),
    );
  });

  input.coreFunctions.forEach((coreFunction) => {
    const source = nodeIdBySourceInputId.get(coreFunction.id);
    if (!source) return;

    coreFunction.relatedScreenIds?.forEach((screenId) => {
      const target = nodeIdBySourceInputId.get(screenId);
      if (!target) return;
      edges.push(
        makeEdge({
          source,
          target,
          relationshipType: "contains",
          description: `Generated because feature '${coreFunction.name}' declares relatedScreenIds including '${screenNameById.get(screenId) ?? screenId}'.`,
          confidence: 0.95,
          sourceType: input.sourceType,
          sourceInputIds: [coreFunction.id, screenId],
          generationRule: "feature_related_screen_to_contains_edge",
        }),
      );
    });

    coreFunction.relatedDataObjectIds?.forEach((dataObjectId) => {
      const target = nodeIdBySourceInputId.get(dataObjectId);
      if (!target) return;
      edges.push(
        makeEdge({
          source,
          target,
          relationshipType: "uses",
          description: `Generated because feature '${coreFunction.name}' declares relatedDataObjectIds including '${dataObjectNameById.get(dataObjectId) ?? dataObjectId}'.`,
          confidence: 0.95,
          sourceType: input.sourceType,
          sourceInputIds: [coreFunction.id, dataObjectId],
          generationRule: "feature_related_data_object_to_uses_edge",
        }),
      );
    });
  });

  input.flowSteps.forEach((flowStep) => {
    const source = nodeIdBySourceInputId.get(flowStep.id);
    if (!source) return;

    if (flowStep.relatedScreenId) {
      const target = nodeIdBySourceInputId.get(flowStep.relatedScreenId);
      if (target) {
        edges.push(
          makeEdge({
            source,
            target,
            relationshipType: "relates_to",
            description: `Generated because flow step ${flowStep.step} declares relatedScreenId '${screenNameById.get(flowStep.relatedScreenId) ?? flowStep.relatedScreenId}'.`,
            confidence: 0.95,
            sourceType: input.sourceType,
            sourceInputIds: [flowStep.id, flowStep.relatedScreenId],
            generationRule: "flow_step_related_screen_to_relates_to_edge",
          }),
        );
      }
    }

    flowStep.relatedFunctionIds?.forEach((functionId) => {
      const target = nodeIdBySourceInputId.get(functionId);
      if (!target) return;
      edges.push(
        makeEdge({
          source,
          target,
          relationshipType: "depends_on",
          description: `Generated because flow step ${flowStep.step} declares relatedFunctionIds including '${functionNameById.get(functionId) ?? functionId}'.`,
          confidence: 0.95,
          sourceType: input.sourceType,
          sourceInputIds: [flowStep.id, functionId],
          generationRule: "flow_step_related_function_to_depends_on_edge",
        }),
      );
    });
  });

  input.aiRoles.forEach((aiRole) => {
    const source = nodeIdBySourceInputId.get(aiRole.id);
    if (!source) return;

    aiRole.relatedFunctionIds?.forEach((functionId) => {
      const target = nodeIdBySourceInputId.get(functionId);
      if (!target) return;
      edges.push(
        makeEdge({
          source,
          target,
          relationshipType: "needs_confirmation",
          description: `Generated because AI role '${aiRole.task}' requires human confirmation for this related function: '${functionNameById.get(functionId) ?? functionId}'.`,
          confidence: 0.95,
          sourceType: input.sourceType,
          sourceInputIds: [aiRole.id, functionId],
          generationRule: "ai_task_related_function_to_needs_confirmation_edge",
        }),
      );
    });

    aiRole.relatedScreenIds?.forEach((screenId) => {
      const target = nodeIdBySourceInputId.get(screenId);
      if (!target) return;
      edges.push(
        makeEdge({
          source,
          target,
          relationshipType: "needs_confirmation",
          description: `Generated because AI role '${aiRole.task}' requires human confirmation for this related screen: '${screenNameById.get(screenId) ?? screenId}'.`,
          confidence: 0.95,
          sourceType: input.sourceType,
          sourceInputIds: [aiRole.id, screenId],
          generationRule: "ai_task_related_screen_to_needs_confirmation_edge",
        }),
      );
    });
  });

  input.unknowns.forEach((unknown) => {
    const source = nodeIdBySourceInputId.get(unknown.id);
    if (!source) return;

    unknown.relatedObjectIds?.forEach((relatedObjectId) => {
      const target = nodeIdBySourceInputId.get(relatedObjectId);
      if (!target) return;
      edges.push(
        makeEdge({
          source,
          target,
          relationshipType: "relates_to",
          description: `Generated because unknown '${unknown.question}' declares relatedObjectIds including '${sourceTitleById.get(relatedObjectId) ?? relatedObjectId}'.`,
          confidence: 0.95,
          sourceType: input.sourceType,
          sourceInputIds: [unknown.id, relatedObjectId],
          generationRule: "unknown_related_object_to_relates_to_edge",
        }),
      );
    });
  });

  return {
    schemaVersion: "engineering-flow-graph/v0",
    id: makeGraphId(input.id),
    title: input.projectName,
    sourceInputId: input.id,
    nodes,
    edges,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
}
