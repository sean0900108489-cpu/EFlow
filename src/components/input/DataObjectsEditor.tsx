import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";

type DataObject = EngineeringFlowInput["dataObjects"][number];

type DataObjectsEditorProps = {
  dataObjects: DataObject[];
  onChange: (dataObjects: DataObject[]) => void;
};

export function DataObjectsEditor({ dataObjects, onChange }: DataObjectsEditorProps) {
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
      <SectionHeader title="Data objects" count={dataObjects.length} onAdd={addDataObject} />
      {dataObjects.map((item) => (
        <article className="editable-card" key={item.id}>
          <CardHeader id={item.id} onDelete={() => deleteDataObject(item.id)} />
          <label className="field">
            <span>Name</span>
            <input
              value={item.name}
              onChange={(event) => updateDataObject(item.id, { name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Description</span>
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
