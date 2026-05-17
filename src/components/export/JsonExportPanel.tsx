import type { EngineeringFlowGraph, EngineeringFlowInput } from "../../types/engineeringFlow";
import { buildFullAIContext } from "../../lib/exportContext";
import { CopyJsonButton } from "./CopyJsonButton";

type JsonExportPanelProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
};

export function JsonExportPanel({ input, graph }: JsonExportPanelProps) {
  const fullContext = buildFullAIContext(input, graph);

  return (
    <section className="export-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Export</p>
          <h2>AI-readable JSON</h2>
        </div>
      </div>
      <div className="export-actions">
        <CopyJsonButton label="Copy EngineeringFlowInput JSON" value={input} />
        <CopyJsonButton
          label="Copy EngineeringFlowGraph JSON"
          value={graph}
          disabled={!graph}
        />
        <CopyJsonButton label="Copy Full AI Context JSON" value={fullContext} />
      </div>
    </section>
  );
}
