import type { ReviewQueue } from "../../lib/buildReviewQueue";

type ReviewProgressProps = {
  queue: ReviewQueue;
};

export function ReviewProgress({ queue }: ReviewProgressProps) {
  const completeCount = queue.confirmedCount + queue.rejectedCount;

  return (
    <section className="review-progress">
      <div className="review-progress-heading">
        <div>
          <p className="eyebrow">Review mode</p>
          <h2>Review progress</h2>
        </div>
        <strong>
          {completeCount} / {queue.totalReviewable}
        </strong>
      </div>
      <div
        className="review-progress-bar"
        aria-label={`Review progress ${queue.progressPercent}%`}
      >
        <span style={{ width: `${queue.progressPercent}%` }} />
      </div>
      <div className="review-progress-stats">
        <span>Suggested: {queue.suggestedCount}</span>
        <span>Confirmed: {queue.confirmedCount}</span>
        <span>Needs review: {queue.needsReviewCount}</span>
        <span>Rejected: {queue.rejectedCount}</span>
      </div>
    </section>
  );
}
