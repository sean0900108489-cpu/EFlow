import { useMemo } from "react";
import { buildManualEditSummary } from "../../lib/buildManualEditSummary";
import type {
  EdgeStatus,
  EngineeringFlowGraph,
  NodeStatus,
} from "../../types/engineeringFlow";

type ManualContextSummaryProps = {
  graph: EngineeringFlowGraph;
};

const nodeReviewLabels: Record<NodeStatus, string> = {
  suggested: "Suggested",
  confirmed: "Confirmed",
  needs_review: "Needs review",
};

const edgeReviewLabels: Record<EdgeStatus, string> = {
  suggested: "Suggested",
  confirmed: "Confirmed",
  rejected: "Rejected",
};

export function ManualContextSummary({ graph }: ManualContextSummaryProps) {
  const summary = useMemo(() => buildManualEditSummary(graph), [graph]);
  const totalManualItems = summary.manualNodeCount + summary.manualEdgeCount;
  const nodeStatusChips = makeStatusChips(summary.nodesByReviewStatus, nodeReviewLabels);
  const edgeStatusChips = makeStatusChips(summary.edgesByReviewStatus, edgeReviewLabels);

  return (
    <section className="manual-context-summary">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Manual Context</p>
          <h2>Manual Context</h2>
        </div>
        <strong className="manual-context-total-pill">{totalManualItems} manual items</strong>
      </div>
      <div className="summary-grid manual-context-grid">
        <span>
          <strong>{summary.manualNodeCount}</strong>
          Manual nodes
        </span>
        <span>
          <strong>{summary.manualEdgeCount}</strong>
          Manual relationships
        </span>
      </div>
      {totalManualItems === 0 ? (
        <p className="manual-context-empty">No manual context added yet.</p>
      ) : (
        <div className="manual-context-status-groups">
          {nodeStatusChips.length > 0 ? (
            <div className="manual-context-status-group">
              <span>Nodes by review status</span>
              <div className="manual-context-chip-row">
                {nodeStatusChips.map((chip) => (
                  <span key={chip.label}>{chip.label}: {chip.count}</span>
                ))}
              </div>
            </div>
          ) : null}
          {edgeStatusChips.length > 0 ? (
            <div className="manual-context-status-group">
              <span>Relationships by review status</span>
              <div className="manual-context-chip-row">
                {edgeStatusChips.map((chip) => (
                  <span key={chip.label}>{chip.label}: {chip.count}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function makeStatusChips<TStatus extends string>(
  buckets: Record<TStatus, string[]>,
  labels: Record<TStatus, string>,
): Array<{ label: string; count: number }> {
  return Object.entries(buckets)
    .map(([status, ids]) => ({
      label: labels[status as TStatus],
      count: (ids as string[]).length,
    }))
    .filter((chip) => chip.count > 0);
}
