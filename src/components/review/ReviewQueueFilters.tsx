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

const reviewFilters: Array<{ id: ReviewQueueFilter; label: string }> = [
  { id: "needs_action", label: "Needs action" },
  { id: "critical", label: "Critical" },
  { id: "nodes", label: "Nodes" },
  { id: "edges", label: "Edges" },
  { id: "confirmed", label: "Confirmed" },
  { id: "needs_review", label: "Needs review" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export function ReviewQueueFilters({ activeFilter, onChange }: ReviewQueueFiltersProps) {
  return (
    <div className="review-filter-row" aria-label="Review queue filters">
      {reviewFilters.map((filter) => (
        <button
          className={`filter-chip review-filter-chip ${activeFilter === filter.id ? "is-active" : ""}`}
          key={filter.id}
          type="button"
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
