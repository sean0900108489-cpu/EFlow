import type { ReviewItem } from "../../lib/buildReviewQueue";
import {
  nodeTypeLabelKeys,
  relationshipTypeLabelKeys,
  reviewItemKindLabelKeys,
  reviewPriorityLabelKeys,
  reviewStatusLabelKeys,
} from "../../lib/i18n/display-labels";
import { useLanguage } from "../../lib/i18n/language-context";

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
  const { t } = useLanguage();
  const manualBadge =
    item.sourceType === "manual_edit"
      ? item.kind === "node"
        ? t("review.item.manualContext")
        : t("review.item.manualRelationship")
      : null;
  const localizedSubtitle =
    item.kind === "node" && item.nodeType
      ? `${t(nodeTypeLabelKeys[item.nodeType])} · ${t(reviewStatusLabelKeys[item.status])}`
      : item.kind === "edge" && item.relationshipType
        ? `${t(relationshipTypeLabelKeys[item.relationshipType])} · ${t(reviewStatusLabelKeys[item.status])}`
        : item.subtitle;
  const localizedReason = item.reasonKey ? t(item.reasonKey, item.reasonValues) : item.reason;

  return (
    <article className={`review-item-card ${isSelected ? "is-selected" : ""}`}>
      <div className="review-card-topline">
        <div className="review-pill-row">
          <span className={`review-priority-pill priority-${item.priority}`}>
            {t(reviewPriorityLabelKeys[item.priority])}
          </span>
          <span className="review-kind-pill">{t(reviewItemKindLabelKeys[item.kind])}</span>
          {manualBadge ? <span className="review-manual-pill">{manualBadge}</span> : null}
        </div>
        <span className={`status-pill status-${item.status}`}>{t(reviewStatusLabelKeys[item.status])}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="review-subtitle">{localizedSubtitle}</p>
      <p className="review-reason">{localizedReason}</p>
      <div className="review-meta-row">
        <span>{t("review.item.confidence", { value: item.confidence.toFixed(2) })}</span>
        {item.sourceType && item.sourceType !== "manual_edit" ? <span>{item.sourceType}</span> : null}
      </div>
      <div className="review-card-actions">
        <button className="mini-button" type="button" onClick={() => onSelect(item)}>
          {t("review.item.select")}
        </button>
        <button className="mini-button" type="button" onClick={() => onConfirm(item)}>
          {t("review.item.confirm")}
        </button>
        {item.kind === "node" ? (
          <button className="mini-button" type="button" onClick={() => onNeedsReview(item)}>
            {t("review.item.needsReview")}
          </button>
        ) : (
          <button className="danger-button" type="button" onClick={() => onReject(item)}>
            {t("review.item.reject")}
          </button>
        )}
      </div>
    </article>
  );
}
