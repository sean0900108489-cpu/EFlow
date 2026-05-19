import { useMemo } from "react";
import { buildLifecycleSummary } from "../../lib/buildLifecycleSummary";
import { LIFECYCLE_STATUSES, type LifecycleStatus } from "../../types/eflowCommand";
import type { EngineeringFlowGraph } from "../../types/engineeringFlow";
import { lifecycleStatusLabelKeys } from "../../lib/i18n/display-labels";
import { useLanguage } from "../../lib/i18n/language-context";

type LifecycleProgressSummaryProps = {
  graph: EngineeringFlowGraph;
};

export function LifecycleProgressSummary({ graph }: LifecycleProgressSummaryProps) {
  const { t } = useLanguage();
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
          <p className="eyebrow">{t("lifecycle.summary.eyebrow")}</p>
          <h2>{t("lifecycle.summary.title")}</h2>
        </div>
        <strong className="lifecycle-total-pill">
          {t("lifecycle.summary.total", {
            nodes: graph.nodes.length,
            edges: graph.edges.length,
          })}
        </strong>
      </div>
      <div className="lifecycle-count-grid" aria-label={t("lifecycle.summary.ariaLabel")}>
        <span className="lifecycle-count-heading">{t("lifecycle.summary.lifecycle")}</span>
        <span className="lifecycle-count-heading lifecycle-count-value">{t("lifecycle.summary.nodes")}</span>
        <span className="lifecycle-count-heading lifecycle-count-value">{t("lifecycle.summary.edges")}</span>
        {visibleStatuses.map((status) => (
          <div className="lifecycle-count-row" key={status}>
            <span className="lifecycle-status-label">{t(lifecycleStatusLabelKeys[status])}</span>
            <strong className="lifecycle-count-value">{summary.nodeCounts[status]}</strong>
            <strong className="lifecycle-count-value">{summary.edgeCounts[status]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
