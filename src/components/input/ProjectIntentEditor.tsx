import type { EngineeringFlowInput } from "../../types/engineeringFlow";

type ProjectIntentEditorProps = {
  input: EngineeringFlowInput;
  onChange: (input: EngineeringFlowInput) => void;
};

export function ProjectIntentEditor({ input, onChange }: ProjectIntentEditorProps) {
  return (
    <section className="editor-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Project</p>
          <h2>Intent</h2>
        </div>
      </div>
      <label className="field">
        <span>Project name</span>
        <input
          value={input.projectName}
          onChange={(event) => onChange({ ...input, projectName: event.target.value })}
          placeholder="Name this engineering flow"
        />
      </label>
      <label className="field">
        <span>Project intent</span>
        <textarea
          rows={8}
          value={input.projectIntent}
          onChange={(event) => onChange({ ...input, projectIntent: event.target.value })}
          placeholder="Describe what this product is trying to make possible."
        />
      </label>
    </section>
  );
}
