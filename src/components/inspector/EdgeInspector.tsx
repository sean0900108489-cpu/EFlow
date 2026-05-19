import type {
  EdgeStatus,
  EngineeringEdge,
  RelationshipType,
} from "../../types/engineeringFlow";
import { LIFECYCLE_STATUSES, type LifecycleStatus } from "../../types/eflowCommand";
import {
  lifecycleStatusLabelKeys,
  relationshipTypeLabelKeys,
  reviewStatusLabelKeys,
} from "../../lib/i18n/display-labels";
import { useLanguage } from "../../lib/i18n/language-context";

type EdgeInspectorProps = {
  edge: EngineeringEdge;
  onChange: (patch: Partial<EngineeringEdge>) => void;
};

const relationshipTypes: RelationshipType[] = [
  "serves",
  "uses",
  "leads_to",
  "contains",
  "depends_on",
  "produces",
  "needs_confirmation",
  "relates_to",
];

const edgeStatuses: EdgeStatus[] = ["suggested", "confirmed", "rejected"];

export function EdgeInspector({ edge, onChange }: EdgeInspectorProps) {
  const { t } = useLanguage();
  const displayedLifecycleStatus = edge.lifecycleStatus ?? "planned";

  return (
    <section className="inspector-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("inspector.edge.eyebrow")}</p>
          <h2>{t(relationshipTypeLabelKeys[edge.relationshipType])}</h2>
        </div>
        {edge.provenance.sourceType === "manual_edit" ? (
          <span className="provenance-badge">{t("inspector.edge.manualBadge")}</span>
        ) : null}
      </div>
      <div className="inspector-quick-actions">
        <button className="mini-button" type="button" onClick={() => onChange({ status: "confirmed" })}>
          {t("inspector.edge.confirm")}
        </button>
        <button className="danger-button" type="button" onClick={() => onChange({ status: "rejected" })}>
          {t("inspector.edge.reject")}
        </button>
      </div>
      <label className="field">
        <span>{t("inspector.edge.relationshipType")}</span>
        <select
          value={edge.relationshipType}
          onChange={(event) =>
            onChange({ relationshipType: event.target.value as RelationshipType })
          }
        >
          {relationshipTypes.map((type) => (
            <option value={type} key={type}>
              {t(relationshipTypeLabelKeys[type])}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t("inspector.edge.status")}</span>
        <select
          value={edge.status}
          onChange={(event) => onChange({ status: event.target.value as EdgeStatus })}
        >
          {edgeStatuses.map((status) => (
            <option value={status} key={status}>
              {t(reviewStatusLabelKeys[status])}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t("inspector.edge.lifecycleStatus")}</span>
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
        <span>{t("inspector.edge.description")}</span>
        <textarea
          rows={5}
          value={edge.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <AdvancedEdgeFields edge={edge} />
    </section>
  );
}

function AdvancedEdgeFields({ edge }: { edge: EngineeringEdge }) {
  const { t } = useLanguage();

  return (
    <details className="advanced-fields" open>
      <summary>{t("inspector.provenance.advanced")}</summary>
      <ReadOnlyRow label={t("inspector.provenance.confidence")} value={String(edge.confidence)} />
      <ReadOnlyRow label={t("inspector.provenance.sourceType")} value={edge.provenance.sourceType} />
      <ReadOnlyRow
        label={t("inspector.provenance.sourceInputIds")}
        value={edge.provenance.sourceInputIds?.join(", ") ?? t("inspector.provenance.none")}
      />
      <ReadOnlyRow
        label={t("inspector.provenance.generationRule")}
        value={edge.provenance.generationRule ?? t("inspector.provenance.none")}
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
