import { useState } from "react";
import { useLanguage } from "../../lib/i18n/language-context";
import { isEngineeringFlowInput } from "../../lib/workspaceValidation";
import type { EngineeringFlowInput } from "../../types/engineeringFlow";

type ImportInputJsonProps = {
  onImport: (input: EngineeringFlowInput) => void;
};

export function ImportInputJson({ onImport }: ImportInputJsonProps) {
  const { t } = useLanguage();
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function importJson() {
    try {
      const parsed = JSON.parse(jsonText) as Partial<EngineeringFlowInput>;

      if (!parsed || parsed.schemaVersion !== "engineering-flow-input/v0") {
        throw new Error(t("input.importJson.error.expectedSchema"));
      }

      if (!isEngineeringFlowInput(parsed)) {
        throw new Error(t("input.importJson.error.missingFields"));
      }

      onImport(parsed as EngineeringFlowInput);
      setMessage({ type: "success", text: t("input.importJson.status.loaded") });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("input.importJson.error.couldNotImport"),
      });
    }
  }

  return (
    <section className="editor-section import-section">
      <div className="section-header">
        <div>
          <h3>{t("input.importJson.title")}</h3>
          <p>{t("input.importJson.subtitle")}</p>
        </div>
        <button className="mini-button" type="button" onClick={importJson}>
          {t("input.importJson.action")}
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
