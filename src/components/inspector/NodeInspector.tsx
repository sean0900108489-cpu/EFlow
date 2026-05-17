import type {
  EngineeringNode,
  EngineeringNodeType,
  NodeStatus,
} from "../../types/engineeringFlow";

type NodeInspectorProps = {
  node: EngineeringNode;
  onChange: (patch: Partial<EngineeringNode>) => void;
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

const nodeStatuses: NodeStatus[] = ["suggested", "confirmed", "needs_review"];

export function NodeInspector({ node, onChange }: NodeInspectorProps) {
  return (
    <section className="inspector-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Node inspector</p>
          <h2>{node.title}</h2>
        </div>
      </div>
      <div className="inspector-quick-actions">
        <button className="mini-button" type="button" onClick={() => onChange({ status: "confirmed" })}>
          Confirm node
        </button>
        <button
          className="mini-button"
          type="button"
          onClick={() => onChange({ status: "needs_review" })}
        >
          Mark needs review
        </button>
      </div>
      <label className="field">
        <span>Title</span>
        <input value={node.title} onChange={(event) => onChange({ title: event.target.value })} />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea
          rows={5}
          value={node.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <div className="two-column-fields">
        <label className="field">
          <span>Type</span>
          <select
            value={node.type}
            onChange={(event) => onChange({ type: event.target.value as EngineeringNodeType })}
          >
            {nodeTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select
            value={node.status}
            onChange={(event) => onChange({ status: event.target.value as NodeStatus })}
          >
            {nodeStatuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>AI-readable summary</span>
        <textarea
          rows={5}
          value={node.aiReadableSummary}
          onChange={(event) => onChange({ aiReadableSummary: event.target.value })}
        />
      </label>
      <AdvancedNodeFields node={node} />
    </section>
  );
}

function AdvancedNodeFields({ node }: { node: EngineeringNode }) {
  return (
    <details className="advanced-fields" open>
      <summary>Advanced provenance</summary>
      <ReadOnlyRow label="Confidence" value={String(node.confidence)} />
      <ReadOnlyRow label="Source type" value={node.provenance.sourceType} />
      <ReadOnlyRow label="Source section" value={node.provenance.sourceInputSection ?? "none"} />
      <ReadOnlyRow label="Source input ID" value={node.provenance.sourceInputId ?? "none"} />
      <ReadOnlyRow label="Generation rule" value={node.provenance.generationRule ?? "none"} />
    </details>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="readonly-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}
