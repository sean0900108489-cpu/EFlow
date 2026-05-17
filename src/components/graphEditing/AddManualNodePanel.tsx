import { useState } from "react";
import { createAuditEvent } from "../../lib/auditLog";
import { createManualNode, insertManualNode } from "../../lib/manualGraphEditing";
import { LIFECYCLE_STATUSES, type LifecycleStatus } from "../../types/eflowCommand";
import type { EFlowAuditEvent } from "../../types/eflowAudit";
import type {
  EngineeringFlowGraph,
  EngineeringNodeType,
  NodeStatus,
} from "../../types/engineeringFlow";

type AddManualNodePanelProps = {
  graph: EngineeringFlowGraph;
  onApplyGraph: (graph: EngineeringFlowGraph) => void;
  onSelectNode: (nodeId: string) => void;
  onRecordAuditEvent: (event: EFlowAuditEvent) => void;
};

type ManualNodeMessage = {
  type: "success" | "error";
  text: string;
};

const nodeTypes: EngineeringNodeType[] = [
  "intent",
  "user",
  "screen",
  "feature",
  "flow_step",
  "data_object",
  "ai_task",
  "question",
];

const reviewStatuses: NodeStatus[] = ["confirmed", "needs_review"];

const nodeColumnX: Record<EngineeringNodeType, number> = {
  intent: 0,
  user: 280,
  screen: 560,
  feature: 840,
  flow_step: 1120,
  data_object: 1400,
  ai_task: 1680,
  question: 1960,
};

const manualNodeTopY = -180;
const manualNodeRowGap = 150;

export function AddManualNodePanel({
  graph,
  onApplyGraph,
  onSelectNode,
  onRecordAuditEvent,
}: AddManualNodePanelProps) {
  const [type, setType] = useState<EngineeringNodeType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aiReadableSummary, setAiReadableSummary] = useState("");
  const [reviewStatus, setReviewStatus] = useState<NodeStatus>("confirmed");
  const [lifecycleStatus, setLifecycleStatus] = useState<LifecycleStatus>("planned");
  const [message, setMessage] = useState<ManualNodeMessage | null>(null);

  function addManualNode() {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedSummary = aiReadableSummary.trim();

    if (!trimmedTitle) {
      setMessage({ type: "error", text: "Add a title before creating a manual node." });
      return;
    }

    if (!trimmedDescription) {
      setMessage({
        type: "error",
        text: "Add a description so exports have enough context for the new node.",
      });
      return;
    }

    const node = createManualNode({
      type,
      title: trimmedTitle,
      description: trimmedDescription,
      aiReadableSummary: trimmedSummary || undefined,
      status: reviewStatus,
      lifecycleStatus,
      position: getManualNodePosition(graph, type),
    });
    const insertResult = insertManualNode(graph, node);

    if (!insertResult.ok) {
      setMessage({
        type: "error",
        text: insertResult.errors.map((error) => error.message).join(" "),
      });
      return;
    }

    onApplyGraph(insertResult.graph);
    onRecordAuditEvent(
      createAuditEvent({
        actor: {
          type: "human",
          id: "local-user",
          name: "Local user",
        },
        source: "manual_ui",
        eventType: "manual_node_created",
        summary: `Added manual node "${node.title}".`,
        target: {
          type: "node",
          id: node.id,
        },
        after: {
          id: node.id,
          type: node.type,
          title: node.title,
          reviewStatus: node.status,
          lifecycleStatus: node.lifecycleStatus ?? "planned",
        },
      }),
    );
    onSelectNode(node.id);
    setTitle("");
    setDescription("");
    setAiReadableSummary("");
    setMessage({ type: "success", text: `Added "${node.title}" and selected it.` });
  }

  return (
    <section className="manual-node-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Manual graph edit</p>
          <h2>Add manual node</h2>
        </div>
        <span className="status-indicator status-ok">Graph ready</span>
      </div>
      <form
        className="manual-node-form"
        onSubmit={(event) => {
          event.preventDefault();
          addManualNode();
        }}
      >
        <div className="two-column-fields">
          <label className="field">
            <span>Node type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as EngineeringNodeType)}
            >
              {nodeTypes.map((nodeType) => (
                <option value={nodeType} key={nodeType}>
                  {nodeType}
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
          <span>Title</span>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setMessage(null);
            }}
            placeholder="Manual feature title"
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setMessage(null);
            }}
            placeholder="What this node represents in the engineering graph"
          />
        </label>
        <label className="field">
          <span>AI-readable summary</span>
          <textarea
            rows={3}
            value={aiReadableSummary}
            onChange={(event) => {
              setAiReadableSummary(event.target.value);
              setMessage(null);
            }}
            placeholder="Optional concise summary for downstream AI context"
          />
        </label>
        <label className="field">
          <span>Review status</span>
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value as NodeStatus)}
          >
            {reviewStatuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <div className="manual-node-actions">
          <button className="button button-primary" type="submit">
            Add node
          </button>
        </div>
      </form>
      {message ? (
        <p className={`manual-node-message manual-node-message-${message.type}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}

function getManualNodePosition(
  graph: EngineeringFlowGraph,
  type: EngineeringNodeType,
): { x: number; y: number } {
  const existingManualNodeCount = graph.nodes.filter(
    (node) => node.provenance.sourceType === "manual_edit" && node.type === type,
  ).length;

  return {
    x: nodeColumnX[type],
    y: manualNodeTopY - existingManualNodeCount * manualNodeRowGap,
  };
}
