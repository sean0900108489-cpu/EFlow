import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";
import { useLanguage } from "../../lib/i18n/language-context";

type FlowStep = EngineeringFlowInput["flowSteps"][number];

type FlowStepsEditorProps = {
  flowSteps: FlowStep[];
  onChange: (flowSteps: FlowStep[]) => void;
};

export function FlowStepsEditor({ flowSteps, onChange }: FlowStepsEditorProps) {
  const { t } = useLanguage();

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
      <SectionHeader title={t("input.flowSteps.title")} count={flowSteps.length} onAdd={addFlowStep} />
      {flowSteps.map((step) => (
        <article className="editable-card" key={step.id}>
          <CardHeader id={step.id} onDelete={() => deleteFlowStep(step.id)} />
          <div className="two-column-fields">
            <label className="field">
              <span>{t("input.flowSteps.step")}</span>
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
              <span>{t("input.flowSteps.stepTitle")}</span>
              <input
                value={step.title}
                onChange={(event) => updateFlowStep(step.id, { title: event.target.value })}
              />
            </label>
          </div>
          <label className="field">
            <span>{t("input.common.description")}</span>
            <textarea
              rows={3}
              value={step.description}
              onChange={(event) => updateFlowStep(step.id, { description: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{t("input.flowSteps.relatedScreenId")}</span>
            <input
              value={step.relatedScreenId ?? ""}
              onChange={(event) =>
                updateFlowStep(step.id, { relatedScreenId: event.target.value || undefined })
              }
              placeholder="screen-project-detail"
            />
          </label>
          <label className="field">
            <span>{t("input.common.relatedFunctionIds")}</span>
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
