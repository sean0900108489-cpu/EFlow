import { nowIso } from "./dates";
import {
  EFLOW_AUDIT_ACTOR_TYPES,
  EFLOW_AUDIT_SCHEMA_VERSION,
  EFLOW_AUDIT_SOURCES,
  EFLOW_AUDIT_TARGET_TYPES,
  type EFlowAuditActorType,
  type EFlowAuditEvent,
  type EFlowAuditSource,
  type EFlowAuditTargetType,
} from "../types/eflowAudit";

export const MAX_AUDIT_LOG_EVENTS = 200;
export const DEFAULT_AUDIT_LOG_DISPLAY_LIMIT = 10;

type CreateAuditEventArgs = Omit<
  EFlowAuditEvent,
  "schemaVersion" | "id" | "createdAt"
> & {
  id?: string;
  createdAt?: string;
};

export type AuditLogSummary = {
  totalEvents: number;
  recentEvents: EFlowAuditEvent[];
  byEventType: Record<string, number>;
  bySource: Record<EFlowAuditSource, number>;
};

let auditEventSequence = 0;

export function createAuditEvent(args: CreateAuditEventArgs): EFlowAuditEvent {
  const createdAt = args.createdAt ?? nowIso();

  return {
    schemaVersion: EFLOW_AUDIT_SCHEMA_VERSION,
    id: args.id ?? makeAuditEventId(args.eventType, createdAt),
    createdAt,
    actor: { ...args.actor },
    source: args.source,
    eventType: args.eventType,
    summary: args.summary,
    target: args.target ? { ...args.target } : undefined,
    before: args.before ? { ...args.before } : undefined,
    after: args.after ? { ...args.after } : undefined,
    metadata: args.metadata ? { ...args.metadata } : undefined,
  };
}

export function appendAuditEvent(
  auditLog: EFlowAuditEvent[],
  event: EFlowAuditEvent,
  maxEvents = MAX_AUDIT_LOG_EVENTS,
): EFlowAuditEvent[] {
  return trimAuditLog([cloneAuditEvent(event), ...auditLog], maxEvents);
}

export function trimAuditLog(
  auditLog: EFlowAuditEvent[],
  maxEvents = MAX_AUDIT_LOG_EVENTS,
): EFlowAuditEvent[] {
  return [...auditLog]
    .sort((left, right) => getEventTime(right) - getEventTime(left))
    .slice(0, maxEvents)
    .map(cloneAuditEvent);
}

export function buildAuditLogSummary(
  auditLog: EFlowAuditEvent[],
  displayLimit = DEFAULT_AUDIT_LOG_DISPLAY_LIMIT,
): AuditLogSummary {
  const bySource = makeEmptySourceCounts();
  const byEventType: Record<string, number> = {};

  auditLog.forEach((event) => {
    bySource[event.source] += 1;
    byEventType[event.eventType] = (byEventType[event.eventType] ?? 0) + 1;
  });

  return {
    totalEvents: auditLog.length,
    recentEvents: trimAuditLog(auditLog, displayLimit),
    byEventType,
    bySource,
  };
}

export function isEFlowAuditLog(value: unknown): value is EFlowAuditEvent[] {
  return Array.isArray(value) && value.every(isEFlowAuditEvent);
}

export function isEFlowAuditEvent(value: unknown): value is EFlowAuditEvent {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== EFLOW_AUDIT_SCHEMA_VERSION) return false;
  if (typeof value.id !== "string" || !value.id) return false;
  if (typeof value.createdAt !== "string" || !value.createdAt) return false;
  if (typeof value.eventType !== "string" || !value.eventType) return false;
  if (typeof value.summary !== "string" || !value.summary) return false;

  if (
    typeof value.source !== "string" ||
    !EFLOW_AUDIT_SOURCES.includes(value.source as EFlowAuditSource)
  ) {
    return false;
  }

  if (!isRecord(value.actor)) return false;
  if (
    typeof value.actor.type !== "string" ||
    !EFLOW_AUDIT_ACTOR_TYPES.includes(value.actor.type as EFlowAuditActorType)
  ) {
    return false;
  }
  if (typeof value.actor.id !== "string" || !value.actor.id) return false;
  if (value.actor.name !== undefined && typeof value.actor.name !== "string") return false;

  if (value.target !== undefined) {
    if (!isRecord(value.target)) return false;
    if (
      typeof value.target.type !== "string" ||
      !EFLOW_AUDIT_TARGET_TYPES.includes(value.target.type as EFlowAuditTargetType)
    ) {
      return false;
    }
    if (value.target.id !== undefined && typeof value.target.id !== "string") return false;
  }

  if (value.before !== undefined && !isRecord(value.before)) return false;
  if (value.after !== undefined && !isRecord(value.after)) return false;
  if (value.metadata !== undefined && !isRecord(value.metadata)) return false;

  return true;
}

function makeAuditEventId(eventType: string, createdAt: string): string {
  auditEventSequence += 1;

  const safeTimestamp = createdAt.replace(/[^0-9a-z]+/gi, "").slice(0, 20);
  const safeEventType =
    eventType
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "event";
  const safeSequence = String(auditEventSequence).padStart(4, "0");

  return `audit-${safeTimestamp}-${safeEventType}-${safeSequence}`;
}

function cloneAuditEvent(event: EFlowAuditEvent): EFlowAuditEvent {
  return {
    ...event,
    actor: { ...event.actor },
    target: event.target ? { ...event.target } : undefined,
    before: event.before ? { ...event.before } : undefined,
    after: event.after ? { ...event.after } : undefined,
    metadata: event.metadata ? { ...event.metadata } : undefined,
  };
}

function makeEmptySourceCounts(): Record<EFlowAuditSource, number> {
  return {
    manual_ui: 0,
    ai_command: 0,
    workspace: 0,
    system: 0,
  };
}

function getEventTime(event: EFlowAuditEvent): number {
  const time = new Date(event.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
