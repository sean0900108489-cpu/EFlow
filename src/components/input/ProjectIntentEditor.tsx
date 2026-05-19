import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { useLanguage } from "../../lib/i18n/language-context";

type ProjectIntentEditorProps = {
  input: EngineeringFlowInput;
  onChange: (input: EngineeringFlowInput) => void;
};

export function ProjectIntentEditor({ input, onChange }: ProjectIntentEditorProps) {
  const { t } = useLanguage();

  return (
    <section className="editor-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("input.projectIntent.eyebrow")}</p>
          <h2>{t("input.projectIntent.title")}</h2>
        </div>
      </div>
      <label className="field">
        <span>{t("input.projectIntent.projectName")}</span>
        <input
          value={input.projectName}
          onChange={(event) => onChange({ ...input, projectName: event.target.value })}
          placeholder={t("input.projectIntent.projectNamePlaceholder")}
        />
      </label>
      <label className="field">
        <span>{t("input.projectIntent.projectIntent")}</span>
        <textarea
          rows={8}
          value={input.projectIntent}
          onChange={(event) => onChange({ ...input, projectIntent: event.target.value })}
          placeholder={t("input.projectIntent.projectIntentPlaceholder")}
        />
      </label>
    </section>
  );
}
