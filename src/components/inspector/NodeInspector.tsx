import type {
  EngineeringNode,
  EngineeringNodeType,
  NodeStatus,
} from "../../types/engineeringFlow";
import { LIFECYCLE_STATUSES, type LifecycleStatus } from "../../types/eflowCommand";
import {
  lifecycleStatusLabelKeys,
  nodeTypeLabelKeys,
  reviewStatusLabelKeys,
} from "../../lib/i18n/display-labels";
import { useLanguage } from "../../lib/i18n/language-context";

type NodeInspectorProps = {
  node: EngineeringNode;
  onChange: (patch: Partial<EngineeringNode>) => void;
};

const nodeTypes: EngineeringNodeType[] = [
  "intent",
  "user",
  "screen",
  "feature",
  "flow_step",
  "data_object",
  "ai_task",
  "question",
];

const nodeStatuses: NodeStatus[] = ["suggested", "confirmed", "needs_review"];

export function NodeInspector({ node, onChange }: NodeInspectorProps) {
  const { t } = useLanguage();
  const displayedLifecycleStatus = node.lifecycleStatus ?? "planned";

  return (
    <section className="inspector-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("inspector.node.eyebrow")}</p>
          <h2>{node.title}</h2>
        </div>
        {node.provenance.sourceType === "manual_edit" ? (
          <span className="provenance-badge">{t("inspector.node.manualBadge")}</span>
        ) : null}
      </div>
      <div className="inspector-quick-actions">
        <button className="mini-button" type="button" onClick={() => onChange({ status: "confirmed" })}>
          {t("inspector.node.confirm")}
        </button>
        <button
          className="mini-button"
          type="button"
          onClick={() => onChange({ status: "needs_review" })}
        >
          {t("inspector.node.markNeedsReview")}
        </button>
      </div>
      <label className="field">
        <span>{t("inspector.node.title")}</span>
        <input value={node.title} onChange={(event) => onChange({ title: event.target.value })} />
      </label>
      <label className="field">
        <span>{t("inspector.node.description")}</span>
        <textarea
          rows={5}
          value={node.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <div className="two-column-fields">
        <label className="field">
          <span>{t("inspector.node.type")}</span>
          <select
            value={node.type}
            onChange={(event) => onChange({ type: event.target.value as EngineeringNodeType })}
          >
            {nodeTypes.map((type) => (
              <option value={type} key={type}>
                {t(nodeTypeLabelKeys[type])}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("inspector.node.status")}</span>
          <select
            value={node.status}
            onChange={(event) => onChange({ status: event.target.value as NodeStatus })}
          >
            {nodeStatuses.map((status) => (
              <option value={status} key={status}>
                {t(reviewStatusLabelKeys[status])}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>{t("inspector.node.lifecycleStatus")}</span>
        <select
          value={displayedLifecycleStatus}
          onChange={(event) =>
            onChange({ lifecycleStatus: event.target.value as LifecycleStatus })
          }
        >
          {LIFECYCLE_STATUSES.map((status) => (
            <option value={status} key={status}>
              {t(lifecycleStatusLabelKeys[status])}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t("inspector.node.aiReadableSummary")}</span>
        <textarea
          rows={5}
          value={node.aiReadableSummary}
          onChange={(event) => onChange({ aiReadableSummary: event.target.value })}
        />
      </label>
      <AdvancedNodeFields node={node} />
    </section>
  );
}

function AdvancedNodeFields({ node }: { node: EngineeringNode }) {
  const { t } = useLanguage();

  return (
    <details className="advanced-fields" open>
      <summary>{t("inspector.provenance.advanced")}</summary>
      <ReadOnlyRow label={t("inspector.provenance.confidence")} value={String(node.confidence)} />
      <ReadOnlyRow label={t("inspector.provenance.sourceType")} value={node.provenance.sourceType} />
      <ReadOnlyRow
        label={t("inspector.provenance.sourceSection")}
        value={node.provenance.sourceInputSection ?? t("inspector.provenance.none")}
      />
      <ReadOnlyRow
        label={t("inspector.provenance.sourceInputId")}
        value={node.provenance.sourceInputId ?? t("inspector.provenance.none")}
      />
      <ReadOnlyRow
        label={t("inspector.provenance.generationRule")}
        value={node.provenance.generationRule ?? t("inspector.provenance.none")}
      />
    </details>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="readonly-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}
