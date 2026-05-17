import { useState } from "react";
import { isEngineeringFlowInput } from "../../lib/workspaceValidation";
import type { EngineeringFlowInput } from "../../types/engineeringFlow";

type ImportInputJsonProps = {
  onImport: (input: EngineeringFlowInput) => void;
};

export function ImportInputJson({ onImport }: ImportInputJsonProps) {
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function importJson() {
    try {
      const parsed = JSON.parse(jsonText) as Partial<EngineeringFlowInput>;

      if (!parsed || parsed.schemaVersion !== "engineering-flow-input/v0") {
        throw new Error('Expected schemaVersion "engineering-flow-input/v0".');
      }

      if (!isEngineeringFlowInput(parsed)) {
        throw new Error("JSON is missing required EngineeringFlowInput fields.");
      }

      onImport(parsed as EngineeringFlowInput);
      setMessage({ type: "success", text: "EngineeringFlowInput JSON loaded." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not import JSON.",
      });
    }
  }

  return (
    <section className="editor-section import-section">
      <div className="section-header">
        <div>
          <h3>Import input JSON</h3>
          <p>Paste an EngineeringFlowInput object</p>
        </div>
        <button className="mini-button" type="button" onClick={importJson}>
          Import
        </button>
      </div>
      <textarea
        rows={5}
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
        placeholder='{"schemaVersion":"engineering-flow-input/v0", ...}'
      />
      {message ? <p className={`import-message import-${message.type}`}>{message.text}</p> : null}
    </section>
  );
}
