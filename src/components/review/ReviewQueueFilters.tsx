import { useLanguage } from "../../lib/i18n/language-context";
import type { TranslationKey } from "../../lib/i18n/types";

export type ReviewQueueFilter =
  | "needs_action"
  | "critical"
  | "nodes"
  | "edges"
  | "confirmed"
  | "needs_review"
  | "rejected"
  | "all";

type ReviewQueueFiltersProps = {
  activeFilter: ReviewQueueFilter;
  onChange: (filter: ReviewQueueFilter) => void;
};

const reviewFilters: Array<{ id: ReviewQueueFilter; labelKey: TranslationKey }> = [
  { id: "needs_action", labelKey: "review.filters.needsAction" },
  { id: "critical", labelKey: "review.filters.critical" },
  { id: "nodes", labelKey: "review.filters.nodes" },
  { id: "edges", labelKey: "review.filters.edges" },
  { id: "confirmed", labelKey: "review.filters.confirmed" },
  { id: "needs_review", labelKey: "review.filters.needsReview" },
  { id: "rejected", labelKey: "review.filters.rejected" },
  { id: "all", labelKey: "review.filters.all" },
];

export function ReviewQueueFilters({ activeFilter, onChange }: ReviewQueueFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="review-filter-row" aria-label={t("review.filters.ariaLabel")}>
      {reviewFilters.map((filter) => (
        <button
          className={`filter-chip review-filter-chip ${activeFilter === filter.id ? "is-active" : ""}`}
          key={filter.id}
          type="button"
          onClick={() => onChange(filter.id)}
        >
          {t(filter.labelKey)}
        </button>
      ))}
    </div>
  );
}
