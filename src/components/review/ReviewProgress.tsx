import type { ReviewQueue } from "../../lib/buildReviewQueue";
import { useLanguage } from "../../lib/i18n/language-context";

type ReviewProgressProps = {
  queue: ReviewQueue;
};

export function ReviewProgress({ queue }: ReviewProgressProps) {
  const { t } = useLanguage();
  const completeCount = queue.confirmedCount + queue.rejectedCount;

  return (
    <section className="review-progress">
      <div className="review-progress-heading">
        <div>
          <p className="eyebrow">{t("review.progress.eyebrow")}</p>
          <h2>{t("review.progress.title")}</h2>
        </div>
        <strong>
          {completeCount} / {queue.totalReviewable}
        </strong>
      </div>
      <div
        className="review-progress-bar"
        aria-label={t("review.progress.ariaLabel", { percent: queue.progressPercent })}
      >
        <span style={{ width: `${queue.progressPercent}%` }} />
      </div>
      <div className="review-progress-stats">
        <span>{t("review.progress.suggested", { count: queue.suggestedCount })}</span>
        <span>{t("review.progress.confirmed", { count: queue.confirmedCount })}</span>
        <span>{t("review.progress.needsReview", { count: queue.needsReviewCount })}</span>
        <span>{t("review.progress.rejected", { count: queue.rejectedCount })}</span>
      </div>
    </section>
  );
}
