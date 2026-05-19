import type { EngineeringFlowGraph, EngineeringFlowInput } from "../../types/engineeringFlow";
import { buildFullAIContext } from "../../lib/exportContext";
import { CopyJsonButton } from "../export/CopyJsonButton";
import { LanguageSwitcher } from "../language/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/language-context";

type TopBarProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
  inputDirtySinceGeneration: boolean;
  showRegenerationConfirm: boolean;
  autosaveStatus: string;
  onLoadExample: () => void;
  onGenerateGraph: () => void;
  onReplaceGraph: () => void;
  onCancelRegeneration: () => void;
};

export function TopBar({
  input,
  graph,
  inputDirtySinceGeneration,
  showRegenerationConfirm,
  autosaveStatus,
  onLoadExample,
  onGenerateGraph,
  onReplaceGraph,
  onCancelRegeneration,
}: TopBarProps) {
  const { t } = useLanguage();

  return (
    <header className="top-bar">
      <div className="top-bar-title">
        <p className="eyebrow">{t("topBar.eyebrow")}</p>
        <h1>{t("topBar.title")}</h1>
      </div>
      <div
        className="top-bar-actions"
        data-tour="top-actions"
        data-tour-step="1"
        data-tour-title={t("tour.topActions.title")}
        data-tour-body={t("tour.topActions.body")}
        data-tour-position="bottom"
      >
        {inputDirtySinceGeneration ? (
          <span className="status-indicator status-warn">{t("topBar.status.inputChanged")}</span>
        ) : graph ? (
          <span className="status-indicator status-ok">{t("topBar.status.graphCurrent")}</span>
        ) : (
          <span className="status-indicator">{t("topBar.status.ready")}</span>
        )}
        <span className="status-indicator">{autosaveStatus}</span>
        <LanguageSwitcher />
        <a className="button button-secondary" href="/tutorial">
          {t("topBar.openTutorial")}
        </a>
        <button className="button button-secondary" type="button" onClick={onLoadExample}>
          {t("topBar.loadExample")}
        </button>
        <button className="button button-primary" type="button" onClick={onGenerateGraph}>
          {t("topBar.generateGraph")}
        </button>
        <CopyJsonButton
          compact
          label={t("topBar.copyFullContext")}
          value={buildFullAIContext(input, graph)}
        />
      </div>
      {showRegenerationConfirm ? (
        <div className="regen-confirm">
          <p>{t("topBar.regenWarning")}</p>
          <div className="regen-actions">
            <button className="button button-primary" type="button" onClick={onReplaceGraph}>
              {t("topBar.replaceGraph")}
            </button>
            <button className="button button-secondary" type="button" onClick={onCancelRegeneration}>
              {t("topBar.cancel")}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
