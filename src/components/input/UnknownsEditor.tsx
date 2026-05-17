import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";

type Unknown = EngineeringFlowInput["unknowns"][number];

type UnknownsEditorProps = {
  unknowns: Unknown[];
  onChange: (unknowns: Unknown[]) => void;
};

export function UnknownsEditor({ unknowns, onChange }: UnknownsEditorProps) {
  function updateUnknown(id: string, patch: Partial<Unknown>) {
    onChange(unknowns.map((unknown) => (unknown.id === id ? { ...unknown, ...patch } : unknown)));
  }

  function addUnknown() {
    onChange([
      ...unknowns,
      {
        id: makeId("unknown"),
        question: "New open question",
        blocksGeneration: false,
        relatedObjectIds: [],
      },
    ]);
  }

  function deleteUnknown(id: string) {
    onChange(unknowns.filter((unknown) => unknown.id !== id));
  }

  return (
    <section className="editor-section">
      <SectionHeader title="Unknowns" count={unknowns.length} onAdd={addUnknown} />
      {unknowns.map((unknown) => (
        <article className="editable-card" key={unknown.id}>
          <CardHeader id={unknown.id} onDelete={() => deleteUnknown(unknown.id)} />
          <label className="field">
            <span>Question</span>
            <textarea
              rows={2}
              value={unknown.question}
              onChange={(event) => updateUnknown(unknown.id, { question: event.target.value })}
            />
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={unknown.blocksGeneration}
              onChange={(event) =>
                updateUnknown(unknown.id, { blocksGeneration: event.target.checked })
              }
            />
            <span>Blocks generation decisions</span>
          </label>
          <label className="field">
            <span>Related object IDs</span>
            <input
              value={(unknown.relatedObjectIds ?? []).join(", ")}
              onChange={(event) =>
                updateUnknown(unknown.id, { relatedObjectIds: splitIds(event.target.value) })
              }
              placeholder="data-thought-item, feature-engineering-export"
            />
          </label>
        </article>
      ))}
    </section>
  );
}

function splitIds(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SectionHeader({
  title,
  count,
  onAdd,
}: {
  title: string;
  count: number;
  onAdd: () => void;
}) {
  return (
    <div className="section-header">
      <div>
        <h3>{title}</h3>
        <p>{count} items</p>
      </div>
      <button className="mini-button" type="button" onClick={onAdd}>
        Add
      </button>
    </div>
  );
}

function CardHeader({ id, onDelete }: { id: string; onDelete: () => void }) {
  return (
    <div className="card-header">
      <span>{id}</span>
      <button className="danger-button" type="button" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
