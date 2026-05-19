import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";
import { useLanguage } from "../../lib/i18n/language-context";

type DataObject = EngineeringFlowInput["dataObjects"][number];

type DataObjectsEditorProps = {
  dataObjects: DataObject[];
  onChange: (dataObjects: DataObject[]) => void;
};

export function DataObjectsEditor({ dataObjects, onChange }: DataObjectsEditorProps) {
  const { t } = useLanguage();

  function updateDataObject(id: string, patch: Partial<DataObject>) {
    onChange(dataObjects.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addDataObject() {
    onChange([
      ...dataObjects,
      {
        id: makeId("data"),
        name: "NewDataObject",
        description: "",
      },
    ]);
  }

  function deleteDataObject(id: string) {
    onChange(dataObjects.filter((item) => item.id !== id));
  }

  return (
    <section className="editor-section">
      <SectionHeader
        title={t("input.dataObjects.title")}
        count={dataObjects.length}
        onAdd={addDataObject}
      />
      {dataObjects.map((item) => (
        <article className="editable-card" key={item.id}>
          <CardHeader id={item.id} onDelete={() => deleteDataObject(item.id)} />
          <label className="field">
            <span>{t("input.common.name")}</span>
            <input
              value={item.name}
              onChange={(event) => updateDataObject(item.id, { name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{t("input.common.description")}</span>
            <textarea
              rows={3}
              value={item.description}
              onChange={(event) => updateDataObject(item.id, { description: event.target.value })}
            />
          </label>
        </article>
      ))}
    </section>
  );
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
