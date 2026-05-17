import { useMemo, useState } from "react";
import {
  buildReviewQueue,
  type ReviewItem,
  type ReviewQueue,
} from "../../lib/buildReviewQueue";
import type {
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringNode,
} from "../../types/engineeringFlow";
import { ReviewItemCard } from "./ReviewItemCard";
import { ReviewProgress } from "./ReviewProgress";
import { ReviewQueueFilters, type ReviewQueueFilter } from "./ReviewQueueFilters";

type ReviewPanelProps = {
  graph: EngineeringFlowGraph | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  compact?: boolean;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onUpdateNode: (nodeId: string, patch: Partial<EngineeringNode>) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<EngineeringEdge>) => void;
};

export function ReviewPanel({
  graph,
  selectedNodeId,
  selectedEdgeId,
  compact = false,
  onSelectNode,
  onSelectEdge,
  onUpdateNode,
  onUpdateEdge,
}: ReviewPanelProps) {
  const [activeFilter, setActiveFilter] = useState<ReviewQueueFilter>("needs_action");
  const queue = useMemo(() => buildReviewQueue(graph), [graph]);
  const selectedReviewItemId = selectedNodeId
    ? `review-node-${selectedNodeId}`
    : selectedEdgeId
      ? `review-edge-${selectedEdgeId}`
      : null;

  const filteredItems = useMemo(
    () => filterReviewItems(queue, activeFilter),
    [activeFilter, queue],
  );
  const visibleItems = compact ? filteredItems.slice(0, 6) : filteredItems;

  function selectReviewItem(item: ReviewItem) {
    if (item.kind === "node") {
      onSelectNode(item.graphItemId);
    } else {
      onSelectEdge(item.graphItemId);
    }
  }

  function confirmReviewItem(item: ReviewItem) {
    selectReviewItem(item);
    if (item.kind === "node") {
      onUpdateNode(item.graphItemId, { status: "confirmed" });
    } else {
      onUpdateEdge(item.graphItemId, { status: "confirmed" });
    }
  }

  function markNodeNeedsReview(item: ReviewItem) {
    if (item.kind !== "node") return;
    selectReviewItem(item);
    onUpdateNode(item.graphItemId, { status: "needs_review" });
  }

  function rejectEdge(item: ReviewItem) {
    if (item.kind !== "edge") return;
    selectReviewItem(item);
    onUpdateEdge(item.graphItemId, { status: "rejected" });
  }

  function selectNextUnreviewed() {
    const reviewableItems = queue.items.filter(
      (item) => item.status === "suggested" || item.status === "needs_review",
    );
    if (reviewableItems.length === 0) return;

    const currentIndex = selectedReviewItemId
      ? reviewableItems.findIndex((item) => item.id === selectedReviewItemId)
      : -1;
    const nextItem = reviewableItems[(currentIndex + 1) % reviewableItems.length];
    selectReviewItem(nextItem);
  }

  if (!graph) {
    return null;
  }

  return (
    <section className={`review-panel ${compact ? "review-panel-compact" : ""}`}>
      <ReviewProgress queue={queue} />
      <div className="review-toolbar">
        <ReviewQueueFilters activeFilter={activeFilter} onChange={setActiveFilter} />
        <button className="button button-secondary" type="button" onClick={selectNextUnreviewed}>
          Next unreviewed
        </button>
      </div>
      {selectedReviewItemId ? (
        <p className="review-selection-note">
          Selected item may be hidden by the current canvas filter.
        </p>
      ) : null}
      <div className="review-list">
        {visibleItems.length === 0 ? (
          <p className="review-empty">No review items match this filter.</p>
        ) : (
          visibleItems.map((item) => (
            <ReviewItemCard
              item={item}
              isSelected={item.id === selectedReviewItemId}
              key={item.id}
              onSelect={selectReviewItem}
              onConfirm={confirmReviewItem}
              onNeedsReview={markNodeNeedsReview}
              onReject={rejectEdge}
            />
          ))
        )}
      </div>
      {compact && filteredItems.length > visibleItems.length ? (
        <p className="review-empty">{filteredItems.length - visibleItems.length} more items in this filter.</p>
      ) : null}
    </section>
  );
}

function filterReviewItems(queue: ReviewQueue, filter: ReviewQueueFilter): ReviewItem[] {
  if (filter === "all") return queue.items;
  if (filter === "needs_action") {
    return queue.items.filter(
      (item) =>
        item.status === "suggested" || (item.kind === "node" && item.status === "needs_review"),
    );
  }
  if (filter === "critical") {
    return queue.items.filter((item) => item.priority === "critical");
  }
  if (filter === "nodes") {
    return queue.items.filter((item) => item.kind === "node");
  }
  if (filter === "edges") {
    return queue.items.filter((item) => item.kind === "edge");
  }
  if (filter === "confirmed") {
    return queue.items.filter((item) => item.status === "confirmed");
  }
  if (filter === "needs_review") {
    return queue.items.filter((item) => item.status === "needs_review");
  }
  if (filter === "rejected") {
    return queue.items.filter((item) => item.status === "rejected");
  }

  return queue.items;
}
