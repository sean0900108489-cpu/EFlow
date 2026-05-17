import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";
import { StringListEditor } from "./StringListEditor";

type Screen = EngineeringFlowInput["mainScreens"][number];

type ScreensEditorProps = {
  screens: Screen[];
  onChange: (screens: Screen[]) => void;
};

export function ScreensEditor({ screens, onChange }: ScreensEditorProps) {
  function updateScreen(id: string, patch: Partial<Screen>) {
    onChange(screens.map((screen) => (screen.id === id ? { ...screen, ...patch } : screen)));
  }

  function addScreen() {
    onChange([
      ...screens,
      {
        id: makeId("screen"),
        name: "New screen",
        purpose: "",
        keyActions: [],
      },
    ]);
  }

  function deleteScreen(id: string) {
    onChange(screens.filter((screen) => screen.id !== id));
  }

  return (
    <section className="editor-section">
      <SectionHeader title="Main screens" count={screens.length} onAdd={addScreen} />
      {screens.map((screen) => (
        <article className="editable-card" key={screen.id}>
          <CardHeader id={screen.id} onDelete={() => deleteScreen(screen.id)} />
          <label className="field">
            <span>Name</span>
            <input
              value={screen.name}
              onChange={(event) => updateScreen(screen.id, { name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Purpose</span>
            <textarea
              rows={3}
              value={screen.purpose}
              onChange={(event) => updateScreen(screen.id, { purpose: event.target.value })}
            />
          </label>
          <StringListEditor
            label="Key actions"
            values={screen.keyActions}
            onChange={(keyActions) => updateScreen(screen.id, { keyActions })}
            placeholder="Action"
          />
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
