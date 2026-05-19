import type { EngineeringFlowInput, Priority } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";
import { useLanguage } from "../../lib/i18n/language-context";

type CoreFunction = EngineeringFlowInput["coreFunctions"][number];

type CoreFunctionsEditorProps = {
  coreFunctions: CoreFunction[];
  onChange: (coreFunctions: CoreFunction[]) => void;
};

const priorities: Priority[] = ["must_have", "should_have", "later"];

export function CoreFunctionsEditor({ coreFunctions, onChange }: CoreFunctionsEditorProps) {
  const { t } = useLanguage();

  function updateCoreFunction(id: string, patch: Partial<CoreFunction>) {
    onChange(coreFunctions.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addCoreFunction() {
    onChange([
      ...coreFunctions,
      {
        id: makeId("feature"),
        name: "New function",
        description: "",
        priority: "must_have",
        relatedScreenIds: [],
        relatedDataObjectIds: [],
      },
    ]);
  }

  function deleteCoreFunction(id: string) {
    onChange(coreFunctions.filter((item) => item.id !== id));
  }

  return (
    <section className="editor-section">
      <SectionHeader
        title={t("input.coreFunctions.title")}
        count={coreFunctions.length}
        onAdd={addCoreFunction}
      />
      {coreFunctions.map((item) => (
        <article className="editable-card" key={item.id}>
          <CardHeader id={item.id} onDelete={() => deleteCoreFunction(item.id)} />
          <label className="field">
            <span>{t("input.common.name")}</span>
            <input
              value={item.name}
              onChange={(event) => updateCoreFunction(item.id, { name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{t("input.common.description")}</span>
            <textarea
              rows={3}
              value={item.description}
              onChange={(event) => updateCoreFunction(item.id, { description: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{t("input.coreFunctions.priority")}</span>
            <select
              value={item.priority}
              onChange={(event) =>
                updateCoreFunction(item.id, { priority: event.target.value as Priority })
              }
            >
              {priorities.map((priority) => (
                <option value={priority} key={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("input.common.relatedScreenIds")}</span>
            <input
              value={(item.relatedScreenIds ?? []).join(", ")}
              onChange={(event) =>
                updateCoreFunction(item.id, {
                  relatedScreenIds: splitIds(event.target.value),
                })
              }
              placeholder="screen-quick-capture, screen-idea-inbox"
            />
          </label>
          <label className="field">
            <span>{t("input.coreFunctions.relatedDataObjectIds")}</span>
            <input
              value={(item.relatedDataObjectIds ?? []).join(", ")}
              onChange={(event) =>
                updateCoreFunction(item.id, {
                  relatedDataObjectIds: splitIds(event.target.value),
                })
              }
              placeholder="data-thought-item"
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
