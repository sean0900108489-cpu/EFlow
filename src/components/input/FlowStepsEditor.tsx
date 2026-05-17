import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";

type FlowStep = EngineeringFlowInput["flowSteps"][number];

type FlowStepsEditorProps = {
  flowSteps: FlowStep[];
  onChange: (flowSteps: FlowStep[]) => void;
};

export function FlowStepsEditor({ flowSteps, onChange }: FlowStepsEditorProps) {
  function updateFlowStep(id: string, patch: Partial<FlowStep>) {
    onChange(flowSteps.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }

  function addFlowStep() {
    onChange([
      ...flowSteps,
      {
        id: makeId("flow"),
        step: flowSteps.length + 1,
        title: "New flow step",
        description: "",
        relatedFunctionIds: [],
      },
    ]);
  }

  function deleteFlowStep(id: string) {
    onChange(flowSteps.filter((step) => step.id !== id));
  }

  return (
    <section className="editor-section">
      <SectionHeader title="Flow steps" count={flowSteps.length} onAdd={addFlowStep} />
      {flowSteps.map((step) => (
        <article className="editable-card" key={step.id}>
          <CardHeader id={step.id} onDelete={() => deleteFlowStep(step.id)} />
          <div className="two-column-fields">
            <label className="field">
              <span>Step</span>
              <input
                type="number"
                min="1"
                value={step.step}
                onChange={(event) =>
                  updateFlowStep(step.id, { step: Number(event.target.value) || 1 })
                }
              />
            </label>
            <label className="field">
              <span>Title</span>
              <input
                value={step.title}
                onChange={(event) => updateFlowStep(step.id, { title: event.target.value })}
              />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea
              rows={3}
              value={step.description}
              onChange={(event) => updateFlowStep(step.id, { description: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Related screen ID</span>
            <input
              value={step.relatedScreenId ?? ""}
              onChange={(event) =>
                updateFlowStep(step.id, { relatedScreenId: event.target.value || undefined })
              }
              placeholder="screen-project-detail"
            />
          </label>
          <label className="field">
            <span>Related function IDs</span>
            <input
              value={(step.relatedFunctionIds ?? []).join(", ")}
              onChange={(event) =>
                updateFlowStep(step.id, { relatedFunctionIds: splitIds(event.target.value) })
              }
              placeholder="feature-quick-capture"
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
