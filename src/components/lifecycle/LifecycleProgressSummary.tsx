import { useMemo } from "react";
import { buildLifecycleSummary } from "../../lib/buildLifecycleSummary";
import { LIFECYCLE_STATUSES, type LifecycleStatus } from "../../types/eflowCommand";
import type { EngineeringFlowGraph } from "../../types/engineeringFlow";

type LifecycleProgressSummaryProps = {
  graph: EngineeringFlowGraph;
};

const lifecycleLabels: Record<LifecycleStatus, string> = {
  draft: "Draft",
  planned: "Planned",
  ready: "Ready",
  developing: "Developing",
  completed: "Completed",
  blocked: "Blocked",
  needs_refactor: "Needs refactor",
  deprecated: "Deprecated",
};

export function LifecycleProgressSummary({ graph }: LifecycleProgressSummaryProps) {
  const summary = useMemo(() => buildLifecycleSummary(graph), [graph]);
  const visibleStatuses = LIFECYCLE_STATUSES.filter(
    (status) =>
      status === "planned" ||
      summary.nodeCounts[status] > 0 ||
      summary.edgeCounts[status] > 0,
  );

  return (
    <section className="lifecycle-summary">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Lifecycle summary</p>
          <h2>Implementation Progress</h2>
        </div>
        <strong className="lifecycle-total-pill">
          {graph.nodes.length} nodes / {graph.edges.length} edges
        </strong>
      </div>
      <div className="lifecycle-count-grid" aria-label="Implementation lifecycle counts">
        <span className="lifecycle-count-heading">Lifecycle</span>
        <span className="lifecycle-count-heading lifecycle-count-value">Nodes</span>
        <span className="lifecycle-count-heading lifecycle-count-value">Edges</span>
        {visibleStatuses.map((status) => (
          <div className="lifecycle-count-row" key={status}>
            <span className="lifecycle-status-label">{lifecycleLabels[status]}</span>
            <strong className="lifecycle-count-value">{summary.nodeCounts[status]}</strong>
            <strong className="lifecycle-count-value">{summary.edgeCounts[status]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
