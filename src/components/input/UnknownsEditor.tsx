import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";
import { useLanguage } from "../../lib/i18n/language-context";

type Unknown = EngineeringFlowInput["unknowns"][number];

type UnknownsEditorProps = {
  unknowns: Unknown[];
  onChange: (unknowns: Unknown[]) => void;
};

export function UnknownsEditor({ unknowns, onChange }: UnknownsEditorProps) {
  const { t } = useLanguage();

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
      <SectionHeader title={t("input.unknowns.title")} count={unknowns.length} onAdd={addUnknown} />
      {unknowns.map((unknown) => (
        <article className="editable-card" key={unknown.id}>
          <CardHeader id={unknown.id} onDelete={() => deleteUnknown(unknown.id)} />
          <label className="field">
            <span>{t("input.unknowns.question")}</span>
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
            <span>{t("input.unknowns.blocksGenerationDecisions")}</span>
          </label>
          <label className="field">
            <span>{t("input.unknowns.relatedObjectIds")}</span>
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
  const { t } = useLanguage();

  return (
    <div className="section-header">
      <div>
        <h3>{title}</h3>
        <p>{t("input.common.items", { count })}</p>
      </div>
      <button className="mini-button" type="button" onClick={onAdd}>
        {t("input.common.add")}
      </button>
    </div>
  );
}

function CardHeader({ id, onDelete }: { id: string; onDelete: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="card-header">
      <span>{id}</span>
      <button className="danger-button" type="button" onClick={onDelete}>
        {t("input.common.delete")}
      </button>
    </div>
  );
}
