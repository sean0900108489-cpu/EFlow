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
                <span>{formatAuditSource(event.source)}</span>
              </div>
              <p>{event.summary}</p>
              <div className="audit-log-meta-row">
                <span>{formatAuditEventType(event.eventType)}</span>
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

function formatAuditEventType(eventType: string): string {
  const labels: Record<string, string> = {
    graph_generated: "Graph generated",
    graph_replaced: "Graph replaced",
    workspace_imported: "Workspace imported",
    engineering_input_imported: "Input imported",
    full_ai_context_imported: "Full context imported",
    manual_node_created: "Manual node created",
    manual_edge_created: "Manual edge created",
    ai_command_applied: "AI command applied",
    node_review_status_changed: "Node review changed",
    node_lifecycle_status_changed: "Node lifecycle changed",
    edge_review_status_changed: "Edge review changed",
    edge_lifecycle_status_changed: "Edge lifecycle changed",
  };

  return labels[eventType] ?? eventType;
}

function formatAuditSource(source: string): string {
  const labels: Record<string, string> = {
    manual_ui: "Manual UI",
    ai_command: "AI command",
    workspace: "Workspace",
    system: "System",
  };

  return labels[source] ?? source;
}
