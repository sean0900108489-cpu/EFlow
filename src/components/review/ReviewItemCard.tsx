import type { ReviewItem } from "../../lib/buildReviewQueue";

type ReviewItemCardProps = {
  item: ReviewItem;
  isSelected: boolean;
  onSelect: (item: ReviewItem) => void;
  onConfirm: (item: ReviewItem) => void;
  onNeedsReview: (item: ReviewItem) => void;
  onReject: (item: ReviewItem) => void;
};

export function ReviewItemCard({
  item,
  isSelected,
  onSelect,
  onConfirm,
  onNeedsReview,
  onReject,
}: ReviewItemCardProps) {
  const manualBadge =
    item.sourceType === "manual_edit"
      ? item.kind === "node"
        ? "Manual context"
        : "Manual relationship"
      : null;

  return (
    <article className={`review-item-card ${isSelected ? "is-selected" : ""}`}>
      <div className="review-card-topline">
        <div className="review-pill-row">
          <span className={`review-priority-pill priority-${item.priority}`}>{item.priority}</span>
          <span className="review-kind-pill">{item.kind}</span>
          {manualBadge ? <span className="review-manual-pill">{manualBadge}</span> : null}
        </div>
        <span className={`status-pill status-${item.status}`}>{item.status}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="review-subtitle">{item.subtitle}</p>
      <p className="review-reason">{item.reason}</p>
      <div className="review-meta-row">
        <span>Confidence {item.confidence.toFixed(2)}</span>
        {item.sourceType && item.sourceType !== "manual_edit" ? <span>{item.sourceType}</span> : null}
      </div>
      <div className="review-card-actions">
        <button className="mini-button" type="button" onClick={() => onSelect(item)}>
          Select
        </button>
        <button className="mini-button" type="button" onClick={() => onConfirm(item)}>
          Confirm
        </button>
        {item.kind === "node" ? (
          <button className="mini-button" type="button" onClick={() => onNeedsReview(item)}>
            Needs review
          </button>
        ) : (
          <button className="danger-button" type="button" onClick={() => onReject(item)}>
            Reject
          </button>
        )}
      </div>
    </article>
  );
}
