import { useEffect, useState } from "react";
import { createManualEdge, insertManualEdge } from "../../lib/manualGraphEditing";
import { LIFECYCLE_STATUSES, type LifecycleStatus } from "../../types/eflowCommand";
import type {
  EdgeStatus,
  EngineeringFlowGraph,
  EngineeringNode,
  RelationshipType,
} from "../../types/engineeringFlow";

type AddManualEdgePanelProps = {
  graph: EngineeringFlowGraph;
  onApplyGraph: (graph: EngineeringFlowGraph) => void;
  onSelectEdge: (edgeId: string) => void;
};

type ManualEdgeMessage = {
  type: "success" | "error";
  text: string;
};

const relationshipTypes: RelationshipType[] = [
  "serves",
  "uses",
  "leads_to",
  "contains",
  "depends_on",
  "produces",
  "needs_confirmation",
  "relates_to",
];

const reviewStatuses: EdgeStatus[] = ["confirmed", "suggested"];

export function AddManualEdgePanel({
  graph,
  onApplyGraph,
  onSelectEdge,
}: AddManualEdgePanelProps) {
  const [sourceNodeId, setSourceNodeId] = useState(() => graph.nodes[0]?.id ?? "");
  const [targetNodeId, setTargetNodeId] = useState(
    () => graph.nodes.find((node) => node.id !== graph.nodes[0]?.id)?.id ?? "",
  );
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("relates_to");
  const [description, setDescription] = useState("");
  const [reviewStatus, setReviewStatus] = useState<EdgeStatus>("confirmed");
  const [lifecycleStatus, setLifecycleStatus] = useState<LifecycleStatus>("planned");
  const [message, setMessage] = useState<ManualEdgeMessage | null>(null);

  const hasEnoughNodes = graph.nodes.length >= 2;

  useEffect(() => {
    const nodeIds = new Set(graph.nodes.map((node) => node.id));

    setSourceNodeId((currentSourceNodeId) =>
      nodeIds.has(currentSourceNodeId) ? currentSourceNodeId : graph.nodes[0]?.id ?? "",
    );

    setTargetNodeId((currentTargetNodeId) =>
      nodeIds.has(currentTargetNodeId)
        ? currentTargetNodeId
        : graph.nodes.find((node) => node.id !== graph.nodes[0]?.id)?.id ?? "",
    );
  }, [graph.nodes]);

  function addManualEdge() {
    const trimmedDescription = description.trim();

    if (!hasEnoughNodes) {
      setMessage({
        type: "error",
        text: "Add at least two nodes before creating a manual edge.",
      });
      return;
    }

    if (!sourceNodeId) {
      setMessage({ type: "error", text: "Choose a source node before creating an edge." });
      return;
    }

    if (!targetNodeId) {
      setMessage({ type: "error", text: "Choose a target node before creating an edge." });
      return;
    }

    if (sourceNodeId === targetNodeId) {
      setMessage({
        type: "error",
        text: "Choose two different nodes before creating an edge.",
      });
      return;
    }

    if (!trimmedDescription) {
      setMessage({
        type: "error",
        text: "Add a description so exports have enough context for the new edge.",
      });
      return;
    }

    const edge = createManualEdge({
      source: sourceNodeId,
      target: targetNodeId,
      relationshipType,
      description: trimmedDescription,
      status: reviewStatus,
      lifecycleStatus,
    });
    const insertResult = insertManualEdge(graph, edge);

    if (!insertResult.ok) {
      setMessage({
        type: "error",
        text: insertResult.errors.map((error) => error.message).join(" "),
      });
      return;
    }

    onApplyGraph(insertResult.graph);
    onSelectEdge(edge.id);
    setDescription("");
    setMessage({ type: "success", text: "Added manual edge and selected it." });
  }

  return (
    <section className="manual-edge-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Manual graph edit</p>
          <h2>Add manual edge</h2>
        </div>
        <span className={`status-indicator ${hasEnoughNodes ? "status-ok" : "status-warn"}`}>
          {hasEnoughNodes ? "Graph ready" : "Needs nodes"}
        </span>
      </div>
      {!hasEnoughNodes ? (
        <p className="manual-edge-helper">
          At least two nodes are required before a manual relationship can be added.
        </p>
      ) : null}
      <form
        className="manual-edge-form"
        onSubmit={(event) => {
          event.preventDefault();
          addManualEdge();
        }}
      >
        <label className="field">
          <span>Source node</span>
          <select
            value={sourceNodeId}
            onChange={(event) => {
              setSourceNodeId(event.target.value);
              setMessage(null);
            }}
            disabled={!hasEnoughNodes}
          >
            {graph.nodes.map((node) => (
              <option value={node.id} key={node.id}>
                {formatNodeOption(node)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Target node</span>
          <select
            value={targetNodeId}
            onChange={(event) => {
              setTargetNodeId(event.target.value);
              setMessage(null);
            }}
            disabled={!hasEnoughNodes}
          >
            {graph.nodes.map((node) => (
              <option value={node.id} key={node.id}>
                {formatNodeOption(node)}
              </option>
            ))}
          </select>
        </label>
        <div className="two-column-fields">
          <label className="field">
            <span>Relationship type</span>
            <select
              value={relationshipType}
              onChange={(event) =>
                setRelationshipType(event.target.value as RelationshipType)
              }
              disabled={!hasEnoughNodes}
            >
              {relationshipTypes.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Lifecycle status</span>
            <select
              value={lifecycleStatus}
              onChange={(event) =>
                setLifecycleStatus(event.target.value as LifecycleStatus)
              }
              disabled={!hasEnoughNodes}
            >
              {LIFECYCLE_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Description</span>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setMessage(null);
            }}
            placeholder="Why these two graph nodes are related"
            disabled={!hasEnoughNodes}
          />
        </label>
        <label className="field">
          <span>Review status</span>
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value as EdgeStatus)}
            disabled={!hasEnoughNodes}
          >
            {reviewStatuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <div className="manual-edge-actions">
          <button className="button button-primary" type="submit" disabled={!hasEnoughNodes}>
            Add edge
          </button>
        </div>
      </form>
      {message ? (
        <p className={`manual-edge-message manual-edge-message-${message.type}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}

function formatNodeOption(node: EngineeringNode): string {
  return `${node.title} (${node.type}) - ${node.id}`;
}
