import type {
  EFlowWorkspaceDocument,
  EngineeringFlowGraph,
  EngineeringFlowInput,
} from "../types/engineeringFlow";
import { nowIso } from "./dates";
import { isEFlowWorkspaceDocument } from "./workspaceValidation";

export const EFLOW_WORKSPACE_STORAGE_KEY = "eflow.workspace.v0.3.current";
export const EFLOW_WORKSPACE_APP_VERSION = "0.3";

type BuildWorkspaceDocumentArgs = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  savedAt?: string;
};

export function buildWorkspaceDocument({
  input,
  graph,
  selectedNodeId = null,
  selectedEdgeId = null,
  savedAt = nowIso(),
}: BuildWorkspaceDocumentArgs): EFlowWorkspaceDocument {
  return {
    schemaVersion: "eflow-workspace/v0.3",
    appVersion: EFLOW_WORKSPACE_APP_VERSION,
    savedAt,
    workspaceName: input.projectName || graph?.title || input.id,
    engineeringFlowInput: input,
    engineeringFlowGraph: graph,
    selectedNodeId,
    selectedEdgeId,
  };
}

export function saveWorkspaceToLocalStorage(workspace: EFlowWorkspaceDocument): void {
  try {
    if (!isBrowserStorageAvailable()) return;
    window.localStorage.setItem(EFLOW_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    // Local persistence is a convenience. It must never break the planning workflow.
  }
}

export function loadWorkspaceFromLocalStorage(): EFlowWorkspaceDocument | null {
  try {
    if (!isBrowserStorageAvailable()) return null;
    const storedWorkspace = window.localStorage.getItem(EFLOW_WORKSPACE_STORAGE_KEY);
    if (!storedWorkspace) return null;

    const parsed = JSON.parse(storedWorkspace) as unknown;
    return isEFlowWorkspaceDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearWorkspaceFromLocalStorage(): void {
  try {
    if (!isBrowserStorageAvailable()) return;
    window.localStorage.removeItem(EFLOW_WORKSPACE_STORAGE_KEY);
  } catch {
    // Ignore localStorage failures.
  }
}

export function isWorkspaceLocalStorageAvailable(): boolean {
  return isBrowserStorageAvailable();
}

export function makeWorkspaceFilename(workspace: EFlowWorkspaceDocument): string {
  const baseName = workspace.workspaceName || workspace.engineeringFlowInput.id || "workspace";
  const safeName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return `eflow-workspace-${safeName || "workspace"}.json`;
}

function isBrowserStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
