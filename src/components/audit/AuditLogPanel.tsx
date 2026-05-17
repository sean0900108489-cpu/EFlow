import { useMemo } from "react";
import { buildAuditLogSummary } from "../../lib/auditLog";
import type { EFlowAuditEvent } from "../../types/eflowAudit";

type AuditLogPanelProps = {
  auditLog: EFlowAuditEvent[];
};

export function AuditLogPanel({ auditLog }: AuditLogPanelProps) {
  const summary = useMemo(() => buildAuditLogSummary(auditLog), [auditLog]);

  return (
    <section className="audit-log-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Audit Log</p>
          <h2>Change History</h2>
        </div>
        <strong className="audit-log-total-pill">{summary.totalEvents} events</strong>
      </div>
      {summary.totalEvents === 0 ? (
        <p className="audit-log-empty">No changes recorded yet.</p>
      ) : (
        <div className="audit-log-list">
          {summary.recentEvents.map((event) => (
            <article className="audit-log-event" key={event.id}>
              <div className="audit-log-event-topline">
                <time dateTime={event.createdAt}>{formatAuditTime(event.createdAt)}</time>
                <span>{event.source}</span>
              </div>
              <p>{event.summary}</p>
              <div className="audit-log-meta-row">
                <span>{event.eventType}</span>
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
