import { useMemo } from "react";
import { buildAuditLogSummary } from "../../lib/auditLog";
import { useLanguage } from "../../lib/i18n/language-context";
import type { TranslationKey } from "../../lib/i18n/types";
import type { EFlowAuditEvent } from "../../types/eflowAudit";

type AuditLogPanelProps = {
  auditLog: EFlowAuditEvent[];
};

export function AuditLogPanel({ auditLog }: AuditLogPanelProps) {
  const { t } = useLanguage();
  const summary = useMemo(() => buildAuditLogSummary(auditLog), [auditLog]);

  return (
    <section className="audit-log-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("auditLog.eyebrow")}</p>
          <h2>{t("auditLog.title")}</h2>
        </div>
        <strong className="audit-log-total-pill">
          {t("auditLog.totalEvents", { count: summary.totalEvents })}
        </strong>
      </div>
      {summary.totalEvents === 0 ? (
        <p className="audit-log-empty">{t("auditLog.empty")}</p>
      ) : (
        <div className="audit-log-list">
          {summary.recentEvents.map((event) => (
            <article className="audit-log-event" key={event.id}>
              <div className="audit-log-event-topline">
                <time dateTime={event.createdAt}>{formatAuditTime(event.createdAt)}</time>
                <span>{formatAuditSource(event.source, t)}</span>
              </div>
              <p>{event.summary}</p>
              <div className="audit-log-meta-row">
                <span>{formatAuditEventType(event.eventType, t)}</span>
                {event.target ? (
                  <span>
                    {event.target.type}
                    {event.target.id ? `:${event.target.id}` : ""}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatAuditTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAuditEventType(
  eventType: string,
  translate: (key: TranslationKey) => string,
): string {
  const labels: Record<string, TranslationKey> = {
    graph_generated: "auditLog.eventType.graphGenerated",
    graph_replaced: "auditLog.eventType.graphReplaced",
    workspace_imported: "auditLog.eventType.workspaceImported",
    engineering_input_imported: "auditLog.eventType.inputImported",
    full_ai_context_imported: "auditLog.eventType.fullContextImported",
    manual_node_created: "auditLog.eventType.manualNodeCreated",
    manual_edge_created: "auditLog.eventType.manualEdgeCreated",
    ai_command_applied: "auditLog.eventType.aiCommandApplied",
    node_review_status_changed: "auditLog.eventType.nodeReviewChanged",
    node_lifecycle_status_changed: "auditLog.eventType.nodeLifecycleChanged",
    edge_review_status_changed: "auditLog.eventType.edgeReviewChanged",
    edge_lifecycle_status_changed: "auditLog.eventType.edgeLifecycleChanged",
  };

  return labels[eventType] ? translate(labels[eventType]) : eventType;
}

function formatAuditSource(source: string, translate: (key: TranslationKey) => string): string {
  const labels: Record<string, TranslationKey> = {
    manual_ui: "auditLog.source.manualUi",
    ai_command: "auditLog.source.aiCommand",
    workspace: "auditLog.source.workspace",
    system: "auditLog.source.system",
  };

  return labels[source] ? translate(labels[source]) : source;
}
