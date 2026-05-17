import type { EngineeringFlowGraph, EngineeringFlowInput } from "../../types/engineeringFlow";
import { buildFullAIContext } from "../../lib/exportContext";
import { CopyJsonButton } from "../export/CopyJsonButton";

type TopBarProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
  inputDirtySinceGeneration: boolean;
  showRegenerationConfirm: boolean;
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
  onLoadExample,
  onGenerateGraph,
  onReplaceGraph,
  onCancelRegeneration,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-title">
        <p className="eyebrow">Engineering planning</p>
        <h1>Engineering Flow Intake v0</h1>
      </div>
      <div className="top-bar-actions">
        {inputDirtySinceGeneration ? (
          <span className="status-indicator status-warn">Input changed</span>
        ) : graph ? (
          <span className="status-indicator status-ok">Graph current</span>
        ) : (
          <span className="status-indicator">Ready</span>
        )}
        <button className="button button-secondary" type="button" onClick={onLoadExample}>
          Use Todo Thought Universe Example
        </button>
        <button className="button button-primary" type="button" onClick={onGenerateGraph}>
          Generate Engineering Flow
        </button>
        <CopyJsonButton
          compact
          label="Copy Full AI Context"
          value={buildFullAIContext(input, graph)}
        />
      </div>
      {showRegenerationConfirm ? (
        <div className="regen-confirm">
          <p>Input changed. Regenerating will replace the current graph and any manual graph edits.</p>
          <div className="regen-actions">
            <button className="button button-primary" type="button" onClick={onReplaceGraph}>
              Replace graph
            </button>
            <button className="button button-secondary" type="button" onClick={onCancelRegeneration}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
