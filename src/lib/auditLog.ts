import { nowIso } from "./dates";
import {
  EFLOW_AUDIT_ACTOR_TYPES,
  EFLOW_AUDIT_EVENT_TYPES,
  EFLOW_AUDIT_SCHEMA_VERSION,
  EFLOW_AUDIT_SOURCES,
  EFLOW_AUDIT_TARGET_TYPES,
  type EFlowAuditActorType,
  type EFlowAuditEvent,
  type EFlowKnownAuditEventType,
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

export type AuditLogValidationResult = {
  ok: boolean;
  errors: string[];
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
  return validateEFlowAuditLog(value).ok;
}

export function isEFlowAuditEvent(value: unknown): value is EFlowAuditEvent {
  return validateEFlowAuditEvent(value).ok;
}

export function validateEFlowAuditLog(value: unknown): AuditLogValidationResult {
  if (!Array.isArray(value)) {
    return { ok: false, errors: ["auditLog must be an array when present."] };
  }

  const errors = value.flatMap((event, index) =>
    validateEFlowAuditEvent(event, `auditLog[${index}]`).errors,
  );

  return { ok: errors.length === 0, errors };
}

export function validateEFlowAuditEvent(
  value: unknown,
  path = "auditLog event",
): AuditLogValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: [`${path} must be an object.`] };
  }

  if (value.schemaVersion !== EFLOW_AUDIT_SCHEMA_VERSION) {
    errors.push(`${path}.schemaVersion must be "${EFLOW_AUDIT_SCHEMA_VERSION}".`);
  }

  if (typeof value.id !== "string" || !value.id) {
    errors.push(`${path}.id must be a non-empty string.`);
  }

  if (typeof value.createdAt !== "string" || !value.createdAt) {
    errors.push(`${path}.createdAt must be a non-empty string.`);
  }

  if (typeof value.eventType !== "string" || !value.eventType) {
    errors.push(`${path}.eventType must be a non-empty string.`);
  } else if (!isKnownOrCompatibleEventType(value.eventType)) {
    errors.push(`${path}.eventType must be a snake_case event name.`);
  }

  if (typeof value.summary !== "string" || !value.summary) {
    errors.push(`${path}.summary must be a non-empty string.`);
  }

  if (
    typeof value.source !== "string" ||
    !EFLOW_AUDIT_SOURCES.includes(value.source as EFlowAuditSource)
  ) {
    errors.push(`${path}.source must be one of ${EFLOW_AUDIT_SOURCES.join(", ")}.`);
  }

  if (!isRecord(value.actor)) {
    errors.push(`${path}.actor must be an object.`);
  } else {
    if (
      typeof value.actor.type !== "string" ||
      !EFLOW_AUDIT_ACTOR_TYPES.includes(value.actor.type as EFlowAuditActorType)
    ) {
      errors.push(`${path}.actor.type must be one of ${EFLOW_AUDIT_ACTOR_TYPES.join(", ")}.`);
    }
    if (typeof value.actor.id !== "string" || !value.actor.id) {
      errors.push(`${path}.actor.id must be a non-empty string.`);
    }
    if (value.actor.name !== undefined && typeof value.actor.name !== "string") {
      errors.push(`${path}.actor.name must be a string when provided.`);
    }
  }

  if (value.target !== undefined) {
    if (!isRecord(value.target)) {
      errors.push(`${path}.target must be an object when provided.`);
    } else {
      if (
        typeof value.target.type !== "string" ||
        !EFLOW_AUDIT_TARGET_TYPES.includes(value.target.type as EFlowAuditTargetType)
      ) {
        errors.push(`${path}.target.type must be one of ${EFLOW_AUDIT_TARGET_TYPES.join(", ")}.`);
      }
      if (value.target.id !== undefined && typeof value.target.id !== "string") {
        errors.push(`${path}.target.id must be a string when provided.`);
      }
    }
  }

  if (value.before !== undefined && !isRecord(value.before)) {
    errors.push(`${path}.before must be an object when provided.`);
  }
  if (value.after !== undefined && !isRecord(value.after)) {
    errors.push(`${path}.after must be an object when provided.`);
  }
  if (value.metadata !== undefined && !isRecord(value.metadata)) {
    errors.push(`${path}.metadata must be an object when provided.`);
  }

  return { ok: errors.length === 0, errors };
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

function isKnownOrCompatibleEventType(eventType: string): boolean {
  return (
    EFLOW_AUDIT_EVENT_TYPES.includes(eventType as EFlowKnownAuditEventType) ||
    /^[a-z][a-z0-9_]*$/.test(eventType)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
