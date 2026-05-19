import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";
import { useLanguage } from "../../lib/i18n/language-context";

type AiRole = EngineeringFlowInput["aiRoles"][number];

type AiRolesEditorProps = {
  aiRoles: AiRole[];
  onChange: (aiRoles: AiRole[]) => void;
};

export function AiRolesEditor({ aiRoles, onChange }: AiRolesEditorProps) {
  const { t } = useLanguage();

  function updateAiRole(id: string, patch: Partial<AiRole>) {
    onChange(aiRoles.map((role) => (role.id === id ? { ...role, ...patch } : role)));
  }

  function addAiRole() {
    onChange([
      ...aiRoles,
      {
        id: makeId("ai"),
        task: "New AI task",
        requiresHumanConfirmation: true,
        relatedScreenIds: [],
        relatedFunctionIds: [],
      },
    ]);
  }

  function deleteAiRole(id: string) {
    onChange(aiRoles.filter((role) => role.id !== id));
  }

  return (
    <section className="editor-section">
      <SectionHeader title={t("input.aiRoles.title")} count={aiRoles.length} onAdd={addAiRole} />
      {aiRoles.map((role) => (
        <article className="editable-card" key={role.id}>
          <CardHeader id={role.id} onDelete={() => deleteAiRole(role.id)} />
          <label className="field">
            <span>{t("input.aiRoles.task")}</span>
            <input
              value={role.task}
              onChange={(event) => updateAiRole(role.id, { task: event.target.value })}
            />
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={role.requiresHumanConfirmation}
              onChange={(event) =>
                updateAiRole(role.id, { requiresHumanConfirmation: event.target.checked })
              }
            />
            <span>{t("input.aiRoles.requiresHumanConfirmation")}</span>
          </label>
          <label className="field">
            <span>{t("input.common.relatedScreenIds")}</span>
            <input
              value={(role.relatedScreenIds ?? []).join(", ")}
              onChange={(event) =>
                updateAiRole(role.id, { relatedScreenIds: splitIds(event.target.value) })
              }
              placeholder="screen-ai-planning-panel"
            />
          </label>
          <label className="field">
            <span>{t("input.common.relatedFunctionIds")}</span>
            <input
              value={(role.relatedFunctionIds ?? []).join(", ")}
              onChange={(event) =>
                updateAiRole(role.id, { relatedFunctionIds: splitIds(event.target.value) })
              }
              placeholder="feature-ai-organization"
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
