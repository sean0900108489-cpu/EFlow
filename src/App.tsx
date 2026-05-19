import { useEffect, useState } from "react";
import { AIChatConsole } from "./components/aiChat/AIChatConsole";
import { EngineeringFlowCanvas } from "./components/graph/EngineeringFlowCanvas";
import { StructuredInputPanel } from "./components/input/StructuredInputPanel";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { Workspace } from "./components/layout/Workspace";
import { InspectorPanel } from "./components/inspector/InspectorPanel";
import { TutorialPage } from "./components/tutorial/TutorialPage";
import { emptyEngineeringFlowInput } from "./data/emptyEngineeringFlowInput";
import { todoThoughtUniverseExample } from "./data/todoThoughtUniverseExample";
import { useLanguage } from "./lib/i18n/language-context";
import type { TranslationKey, TranslationValues } from "./lib/i18n/types";
import {
  appendAuditEvent,
  createAuditEvent,
  trimAuditLog,
} from "./lib/auditLog";
import { nowIso } from "./lib/dates";
import { generateEngineeringFlow } from "./lib/generateEngineeringFlow";
import {
  buildWorkspaceDocument,
  clearWorkspaceFromLocalStorage,
  isWorkspaceLocalStorageAvailable,
  loadWorkspaceFromLocalStorage,
  saveWorkspaceToLocalStorage,
} from "./lib/workspacePersistence";
import type {
  EFlowWorkspaceDocument,
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNode,
  FullAIContext,
} from "./types/engineeringFlow";
import type { EFlowAuditEvent } from "./types/eflowAudit";

function cloneInput(input: EngineeringFlowInput): EngineeringFlowInput {
  return structuredClone(input);
}

type ImportAuditEventType = "workspace_imported" | "full_ai_context_imported";
type Translate = (key: TranslationKey, values?: TranslationValues) => string;
type AutosaveStatus =
  | { key: "app.autosave.unavailable" }
  | { key: "app.autosave.ready" }
  | { key: "app.autosave.restored"; time: string }
  | { key: "app.autosave.saved"; time: string }
  | { key: "app.autosave.inputImported" }
  | { key: "app.autosave.workspaceImported"; time: string }
  | { key: "app.autosave.fullContextImported" }
  | { key: "app.autosave.cleared" };

export default function App() {
  const [route, setRoute] = useState(() => readAppRoute());

  useEffect(() => {
    function updateRoute() {
      setRoute(readAppRoute());
    }

    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  if (route.pathname === "/tutorial") {
    return <TutorialPage />;
  }

  return <WorkspaceApp tutorialMode={route.tutorialMode} />;
}

type WorkspaceAppProps = {
  tutorialMode: boolean;
};

function WorkspaceApp({ tutorialMode }: WorkspaceAppProps) {
  const { t } = useLanguage();
  const [restoredWorkspace] = useState(() => loadWorkspaceFromLocalStorage());
  const restoredSelection = getValidWorkspaceSelection(restoredWorkspace);
  const [engineeringFlowInput, setEngineeringFlowInput] = useState<EngineeringFlowInput>(() =>
    cloneInput(restoredWorkspace?.engineeringFlowInput ?? emptyEngineeringFlowInput),
  );
  const [engineeringFlowGraph, setEngineeringFlowGraph] = useState<EngineeringFlowGraph | null>(() =>
    restoredWorkspace?.engineeringFlowGraph ? structuredClone(restoredWorkspace.engineeringFlowGraph) : null,
  );
  const [auditLog, setAuditLog] = useState<EFlowAuditEvent[]>(() =>
    restoredWorkspace?.auditLog ? trimAuditLog(structuredClone(restoredWorkspace.auditLog)) : [],
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(restoredSelection.nodeId);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(restoredSelection.edgeId);
  const [inputDirtySinceGeneration, setInputDirtySinceGeneration] = useState(false);
  const [showRegenerationConfirm, setShowRegenerationConfirm] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>(() => {
    if (!isWorkspaceLocalStorageAvailable()) return { key: "app.autosave.unavailable" };
    if (restoredWorkspace) {
      return {
        key: "app.autosave.restored",
        time: formatTime(restoredWorkspace.savedAt),
      };
    }
    return { key: "app.autosave.ready" };
  });
  const autosaveStatusText = formatAutosaveStatus(autosaveStatus, t);

  useEffect(() => {
    if (!isWorkspaceLocalStorageAvailable()) {
      setAutosaveStatus({ key: "app.autosave.unavailable" });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const workspace = buildWorkspaceDocument({
        input: engineeringFlowInput,
        graph: engineeringFlowGraph,
        selectedNodeId,
        selectedEdgeId,
        auditLog,
      });
      saveWorkspaceToLocalStorage(workspace);
      setAutosaveStatus({
        key: "app.autosave.saved",
        time: formatTime(workspace.savedAt),
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [engineeringFlowInput, engineeringFlowGraph, selectedNodeId, selectedEdgeId, auditLog]);

  function loadTodoThoughtUniverseExample() {
    setEngineeringFlowInput(cloneInput(todoThoughtUniverseExample));
    setEngineeringFlowGraph(null);
    setAuditLog([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
  }

  function updateInput(nextInput: EngineeringFlowInput) {
    setEngineeringFlowInput({
      ...nextInput,
      sourceType: nextInput.sourceType === "example_seed" ? "manual_edit" : nextInput.sourceType,
      updatedAt: nowIso(),
    });
    if (engineeringFlowGraph) {
      setInputDirtySinceGeneration(true);
    }
  }

  function importEngineeringFlowInput(nextInput: EngineeringFlowInput) {
    const importedInput = {
      ...cloneInput(nextInput),
      updatedAt: nowIso(),
    };

    setEngineeringFlowInput(importedInput);
    setEngineeringFlowGraph(null);
    setAuditLog([buildEngineeringInputImportedAuditEvent(importedInput)]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
    setAutosaveStatus({ key: "app.autosave.inputImported" });
  }

  function importWorkspaceDocument(
    workspace: EFlowWorkspaceDocument,
    importAuditEventType: ImportAuditEventType = "workspace_imported",
  ) {
    const normalizedAuditLog = trimAuditLog(workspace.auditLog ?? []);
    const nextAuditLog = appendAuditEvent(
      normalizedAuditLog,
      buildWorkspaceImportedAuditEvent(
        workspace,
        normalizedAuditLog.length,
        importAuditEventType,
      ),
    );
    const normalizedWorkspace: EFlowWorkspaceDocument = {
      ...workspace,
      auditLog: nextAuditLog,
    };
    const selection = getValidWorkspaceSelection(normalizedWorkspace);
    setEngineeringFlowInput(cloneInput(normalizedWorkspace.engineeringFlowInput));
    setEngineeringFlowGraph(
      normalizedWorkspace.engineeringFlowGraph
        ? structuredClone(normalizedWorkspace.engineeringFlowGraph)
        : null,
    );
    setAuditLog(nextAuditLog);
    setSelectedNodeId(selection.nodeId);
    setSelectedEdgeId(selection.edgeId);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
    saveWorkspaceToLocalStorage(normalizedWorkspace);
    setAutosaveStatus({
      key: "app.autosave.workspaceImported",
      time: formatTime(normalizedWorkspace.savedAt),
    });
  }

  function importFullAIContext(context: FullAIContext) {
    const workspace = buildWorkspaceDocument({
      input: context.engineeringFlowInput,
      graph: context.engineeringFlowGraph,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    importWorkspaceDocument(workspace, "full_ai_context_imported");
    setAutosaveStatus({ key: "app.autosave.fullContextImported" });
  }

  function clearLocalWorkspace() {
    const confirmed = window.confirm(t("app.autosave.clearConfirm"));
    if (!confirmed) return;

    clearWorkspaceFromLocalStorage();
    setAutosaveStatus({ key: "app.autosave.cleared" });
  }

  function replaceGraph() {
    const previousGraph = engineeringFlowGraph;
    const nextGraph = generateEngineeringFlow(engineeringFlowInput);

    setEngineeringFlowGraph(nextGraph);
    setAuditLog([buildGraphGeneratedAuditEvent(engineeringFlowInput, nextGraph, previousGraph)]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setInputDirtySinceGeneration(false);
    setShowRegenerationConfirm(false);
  }

  function generateGraph() {
    if (engineeringFlowGraph && inputDirtySinceGeneration) {
      setShowRegenerationConfirm(true);
      return;
    }

    replaceGraph();
  }

  function cancelRegeneration() {
    setShowRegenerationConfirm(false);
  }

  function updateNode(nodeId: string, patch: Partial<EngineeringNode>) {
    if (!engineeringFlowGraph) return;
    const currentNode = engineeringFlowGraph.nodes.find((node) => node.id === nodeId);
    if (!currentNode) return;

    const nextNode = { ...currentNode, ...patch };
    setEngineeringFlowGraph({
      ...engineeringFlowGraph,
      updatedAt: nowIso(),
      nodes: engineeringFlowGraph.nodes.map((node) =>
        node.id === nodeId ? nextNode : node,
      ),
    });
    recordAuditEvents(buildNodeAuditEvents(currentNode, nextNode, patch));
  }

  function updateEdge(edgeId: string, patch: Partial<EngineeringEdge>) {
    if (!engineeringFlowGraph) return;
    const currentEdge = engineeringFlowGraph.edges.find((edge) => edge.id === edgeId);
    if (!currentEdge) return;

    const nextEdge = { ...currentEdge, ...patch };
    setEngineeringFlowGraph({
      ...engineeringFlowGraph,
      updatedAt: nowIso(),
      edges: engineeringFlowGraph.edges.map((edge) =>
        edge.id === edgeId ? nextEdge : edge,
      ),
    });
    recordAuditEvents(buildEdgeAuditEvents(currentEdge, nextEdge, patch));
  }

  function replaceGraphFromCommand(nextGraph: EngineeringFlowGraph) {
    setEngineeringFlowGraph(nextGraph);
  }

  function recordAuditEvent(event: EFlowAuditEvent) {
    setAuditLog((currentAuditLog) => appendAuditEvent(currentAuditLog, event));
  }

  function recordAuditEvents(events: EFlowAuditEvent[]) {
    if (events.length === 0) return;

    setAuditLog((currentAuditLog) =>
      events.reduce(
        (nextAuditLog, event) => appendAuditEvent(nextAuditLog, event),
        currentAuditLog,
      ),
    );
  }

  function updateNodePosition(nodeId: string, position: { x: number; y: number }) {
    updateNode(nodeId, { position });
  }

  function selectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }

  function selectEdge(edgeId: string) {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }

  function clearSelection() {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }

  return (
    <AppShell
      tutorialMode={tutorialMode}
      topBar={
        <TopBar
          input={engineeringFlowInput}
          graph={engineeringFlowGraph}
          inputDirtySinceGeneration={inputDirtySinceGeneration}
          showRegenerationConfirm={showRegenerationConfirm}
          autosaveStatus={autosaveStatusText}
          onLoadExample={loadTodoThoughtUniverseExample}
          onGenerateGraph={generateGraph}
          onReplaceGraph={replaceGraph}
          onCancelRegeneration={cancelRegeneration}
        />
      }
    >
      <AIChatConsole input={engineeringFlowInput} graph={engineeringFlowGraph} />
      <Workspace
        left={
          <StructuredInputPanel
            input={engineeringFlowInput}
            inputDirtySinceGeneration={inputDirtySinceGeneration}
            onChange={updateInput}
            onImport={importEngineeringFlowInput}
          />
        }
        center={
          <EngineeringFlowCanvas
            graph={engineeringFlowGraph}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
            onClearSelection={clearSelection}
            onNodePositionChange={updateNodePosition}
          />
        }
        right={
          <InspectorPanel
            input={engineeringFlowInput}
            graph={engineeringFlowGraph}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            auditLog={auditLog}
            autosaveStatus={autosaveStatusText}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
            onUpdateNode={updateNode}
            onUpdateEdge={updateEdge}
            onReplaceGraph={replaceGraphFromCommand}
            onRecordAuditEvent={recordAuditEvent}
            onImportWorkspace={importWorkspaceDocument}
            onImportFullContext={importFullAIContext}
            onImportInput={importEngineeringFlowInput}
            onClearLocalWorkspace={clearLocalWorkspace}
          />
        }
      />
    </AppShell>
  );
}

function getValidWorkspaceSelection(workspace: EFlowWorkspaceDocument | null): {
  nodeId: string | null;
  edgeId: string | null;
} {
  const graph = workspace?.engineeringFlowGraph;
  if (!workspace || !graph) {
    return { nodeId: null, edgeId: null };
  }

  if (workspace.selectedNodeId && graph.nodes.some((node) => node.id === workspace.selectedNodeId)) {
    return { nodeId: workspace.selectedNodeId, edgeId: null };
  }

  if (workspace.selectedEdgeId && graph.edges.some((edge) => edge.id === workspace.selectedEdgeId)) {
    return { nodeId: null, edgeId: workspace.selectedEdgeId };
  }

  return { nodeId: null, edgeId: null };
}

function readAppRoute(): { pathname: string; tutorialMode: boolean } {
  return {
    pathname: window.location.pathname,
    tutorialMode: new URLSearchParams(window.location.search).get("tour") === "1",
  };
}

function buildGraphGeneratedAuditEvent(
  input: EngineeringFlowInput,
  graph: EngineeringFlowGraph,
  previousGraph: EngineeringFlowGraph | null,
): EFlowAuditEvent {
  const isReplacement = Boolean(previousGraph);
  const eventType = isReplacement ? "graph_replaced" : "graph_generated";
  const action = isReplacement ? "Replaced" : "Generated";

  return createAuditEvent({
    actor: {
      type: "human",
      id: "local-user",
      name: "Local user",
    },
    source: "manual_ui",
    eventType,
    summary: `${action} engineering graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`,
    target: {
      type: "graph",
      id: graph.id,
    },
    before: previousGraph ? buildGraphAuditSnapshot(previousGraph) : undefined,
    after: buildGraphAuditSnapshot(graph),
    metadata: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      sourceInputId: graph.sourceInputId,
      projectName: input.projectName,
      previousGraphId: previousGraph?.id,
      previousNodeCount: previousGraph?.nodes.length,
      previousEdgeCount: previousGraph?.edges.length,
    },
  });
}

function buildEngineeringInputImportedAuditEvent(
  input: EngineeringFlowInput,
): EFlowAuditEvent {
  return createAuditEvent({
    actor: {
      type: "human",
      id: "local-user",
      name: "Local user",
    },
    source: "workspace",
    eventType: "engineering_input_imported",
    summary: `Imported EngineeringFlowInput "${input.projectName}".`,
    target: {
      type: "workspace",
      id: input.id,
    },
    after: {
      projectName: input.projectName,
      nodeCount: 0,
      edgeCount: 0,
      importedAuditEventCount: 0,
    },
    metadata: {
      projectName: input.projectName,
      nodeCount: 0,
      edgeCount: 0,
      importedAuditEventCount: 0,
      sourceInputId: input.id,
      sourceSchemaVersion: input.schemaVersion,
    },
  });
}

function buildWorkspaceImportedAuditEvent(
  workspace: EFlowWorkspaceDocument,
  importedAuditEventCount: number,
  eventType: ImportAuditEventType,
): EFlowAuditEvent {
  const graph = workspace.engineeringFlowGraph;
  const projectName = workspace.engineeringFlowInput.projectName || workspace.workspaceName;
  const nodeCount = graph?.nodes.length ?? 0;
  const edgeCount = graph?.edges.length ?? 0;
  const sourceLabel =
    eventType === "full_ai_context_imported" ? "Full AI Context" : "workspace";

  return createAuditEvent({
    actor: {
      type: "human",
      id: "local-user",
      name: "Local user",
    },
    source: "workspace",
    eventType,
    summary: `Imported ${sourceLabel} "${projectName}" with ${nodeCount} nodes and ${edgeCount} edges.`,
    target: {
      type: "workspace",
      id: workspace.engineeringFlowInput.id,
    },
    after: {
      projectName,
      nodeCount,
      edgeCount,
      importedAuditEventCount,
    },
    metadata: {
      projectName,
      nodeCount,
      edgeCount,
      importedAuditEventCount,
      sourceInputId: workspace.engineeringFlowInput.id,
      sourceWorkspaceSchemaVersion: workspace.schemaVersion,
    },
  });
}

function buildGraphAuditSnapshot(graph: EngineeringFlowGraph): Record<string, unknown> {
  return {
    graphId: graph.id,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    sourceInputId: graph.sourceInputId,
  };
}

function buildNodeAuditEvents(
  currentNode: EngineeringNode,
  nextNode: EngineeringNode,
  patch: Partial<EngineeringNode>,
): EFlowAuditEvent[] {
  const events: EFlowAuditEvent[] = [];

  if (patch.status !== undefined && currentNode.status !== nextNode.status) {
    events.push(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "node_review_status_changed",
        summary: `Changed node "${currentNode.title}" review status from ${currentNode.status} to ${nextNode.status}.`,
        target: {
          type: "node",
          id: currentNode.id,
        },
        before: {
          reviewStatus: currentNode.status,
        },
        after: {
          reviewStatus: nextNode.status,
        },
        metadata: {
          field: "status",
          legacyFieldMeaning: "review_status",
        },
      }),
    );
  }

  const currentLifecycleStatus = currentNode.lifecycleStatus ?? "planned";
  const nextLifecycleStatus = nextNode.lifecycleStatus ?? "planned";
  if (
    patch.lifecycleStatus !== undefined &&
    currentLifecycleStatus !== nextLifecycleStatus
  ) {
    events.push(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "node_lifecycle_status_changed",
        summary: `Changed node "${currentNode.title}" lifecycle status from ${currentLifecycleStatus} to ${nextLifecycleStatus}.`,
        target: {
          type: "node",
          id: currentNode.id,
        },
        before: {
          lifecycleStatus: currentLifecycleStatus,
        },
        after: {
          lifecycleStatus: nextLifecycleStatus,
        },
        metadata: {
          field: "lifecycleStatus",
        },
      }),
    );
  }

  return events;
}

function buildEdgeAuditEvents(
  currentEdge: EngineeringEdge,
  nextEdge: EngineeringEdge,
  patch: Partial<EngineeringEdge>,
): EFlowAuditEvent[] {
  const events: EFlowAuditEvent[] = [];

  if (patch.status !== undefined && currentEdge.status !== nextEdge.status) {
    events.push(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "edge_review_status_changed",
        summary: `Changed edge "${currentEdge.id}" review status from ${currentEdge.status} to ${nextEdge.status}.`,
        target: {
          type: "edge",
          id: currentEdge.id,
        },
        before: {
          reviewStatus: currentEdge.status,
        },
        after: {
          reviewStatus: nextEdge.status,
        },
        metadata: {
          field: "status",
          legacyFieldMeaning: "review_status",
        },
      }),
    );
  }

  const currentLifecycleStatus = currentEdge.lifecycleStatus ?? "planned";
  const nextLifecycleStatus = nextEdge.lifecycleStatus ?? "planned";
  if (
    patch.lifecycleStatus !== undefined &&
    currentLifecycleStatus !== nextLifecycleStatus
  ) {
    events.push(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "edge_lifecycle_status_changed",
        summary: `Changed edge "${currentEdge.id}" lifecycle status from ${currentLifecycleStatus} to ${nextLifecycleStatus}.`,
        target: {
          type: "edge",
          id: currentEdge.id,
        },
        before: {
          lifecycleStatus: currentLifecycleStatus,
        },
        after: {
          lifecycleStatus: nextLifecycleStatus,
        },
        metadata: {
          field: "lifecycleStatus",
        },
      }),
    );
  }

  return events;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAutosaveStatus(status: AutosaveStatus, t: Translate): string {
  switch (status.key) {
    case "app.autosave.restored":
    case "app.autosave.saved":
    case "app.autosave.workspaceImported":
      return t(status.key, { time: status.time });
    default:
      return t(status.key);
  }
}
