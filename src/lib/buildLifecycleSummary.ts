import { LIFECYCLE_STATUSES, type EFlowId, type LifecycleStatus } from "../types/eflowCommand";
import type { EngineeringFlowGraph } from "../types/engineeringFlow";

const DEFAULT_LIFECYCLE_STATUS: LifecycleStatus = "planned";

export type LifecycleSummary = {
  nodeCounts: Record<LifecycleStatus, number>;
  edgeCounts: Record<LifecycleStatus, number>;
  nodesByLifecycle: Record<LifecycleStatus, EFlowId[]>;
  edgesByLifecycle: Record<LifecycleStatus, EFlowId[]>;
};

export function buildLifecycleSummary(graph: EngineeringFlowGraph): LifecycleSummary {
  const nodeCounts = makeLifecycleCountRecord();
  const edgeCounts = makeLifecycleCountRecord();
  const nodesByLifecycle = makeLifecycleBuckets();
  const edgesByLifecycle = makeLifecycleBuckets();

  graph.nodes.forEach((node) => {
    const lifecycleStatus = node.lifecycleStatus ?? DEFAULT_LIFECYCLE_STATUS;
    nodeCounts[lifecycleStatus] += 1;
    nodesByLifecycle[lifecycleStatus].push(node.id);
  });

  graph.edges.forEach((edge) => {
    const lifecycleStatus = edge.lifecycleStatus ?? DEFAULT_LIFECYCLE_STATUS;
    edgeCounts[lifecycleStatus] += 1;
    edgesByLifecycle[lifecycleStatus].push(edge.id);
  });

  return {
    nodeCounts,
    edgeCounts,
    nodesByLifecycle,
    edgesByLifecycle,
  };
}

function makeLifecycleCountRecord(): Record<LifecycleStatus, number> {
  return Object.fromEntries(
    LIFECYCLE_STATUSES.map((status) => [status, 0]),
  ) as Record<LifecycleStatus, number>;
}

function makeLifecycleBuckets(): Record<LifecycleStatus, EFlowId[]> {
  return Object.fromEntries(
    LIFECYCLE_STATUSES.map((status) => [status, [] as EFlowId[]]),
  ) as Record<LifecycleStatus, EFlowId[]>;
}
