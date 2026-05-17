import type {
  EdgeStatus,
  EngineeringEdge,
  RelationshipType,
} from "../../types/engineeringFlow";

type EdgeInspectorProps = {
  edge: EngineeringEdge;
  onChange: (patch: Partial<EngineeringEdge>) => void;
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

const edgeStatuses: EdgeStatus[] = ["suggested", "confirmed", "rejected"];

export function EdgeInspector({ edge, onChange }: EdgeInspectorProps) {
  return (
    <section className="inspector-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Edge inspector</p>
          <h2>{edge.relationshipType}</h2>
        </div>
      </div>
      <label className="field">
        <span>Relationship type</span>
        <select
          value={edge.relationshipType}
          onChange={(event) =>
            onChange({ relationshipType: event.target.value as RelationshipType })
          }
        >
          {relationshipTypes.map((type) => (
            <option value={type} key={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Status</span>
        <select
          value={edge.status}
          onChange={(event) => onChange({ status: event.target.value as EdgeStatus })}
        >
          {edgeStatuses.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Description</span>
        <textarea
          rows={5}
          value={edge.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <AdvancedEdgeFields edge={edge} />
    </section>
  );
}

function AdvancedEdgeFields({ edge }: { edge: EngineeringEdge }) {
  return (
    <details className="advanced-fields" open>
      <summary>Advanced provenance</summary>
      <ReadOnlyRow label="Confidence" value={String(edge.confidence)} />
      <ReadOnlyRow label="Source type" value={edge.provenance.sourceType} />
      <ReadOnlyRow
        label="Source input IDs"
        value={edge.provenance.sourceInputIds?.join(", ") ?? "none"}
      />
      <ReadOnlyRow label="Generation rule" value={edge.provenance.generationRule ?? "none"} />
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
