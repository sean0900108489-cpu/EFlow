import { useMemo, useState } from "react";
import { createAuditEvent } from "../../lib/auditLog";
import {
  applyEFlowCommandToGraph,
  dryRunEFlowCommandOnGraph,
  type EFlowCommandApplyResult,
} from "../../lib/applyEflowCommand";
import {
  validateEFlowCommandEnvelope,
  type EFlowCommandValidationIssue,
  type EFlowCommandValidationResult,
} from "../../lib/eflowCommandValidation";
import type { EFlowAuditEvent } from "../../types/eflowAudit";
import type { EFlowCommandEnvelope } from "../../types/eflowCommand";
import { EFLOW_COMMAND_SCHEMA_VERSION } from "../../types/eflowCommand";
import type { EngineeringFlowGraph } from "../../types/engineeringFlow";

type LocalCommandImportPanelProps = {
  graph: EngineeringFlowGraph | null;
  onApplyGraph: (graph: EngineeringFlowGraph) => void;
  onRecordAuditEvent: (event: EFlowAuditEvent) => void;
};

type CommandMessage = {
  type: "success" | "error" | "info";
  text: string;
};

export function LocalCommandImportPanel({
  graph,
  onApplyGraph,
  onRecordAuditEvent,
}: LocalCommandImportPanelProps) {
  const [commandText, setCommandText] = useState("");
  const [message, setMessage] = useState<CommandMessage | null>(null);
  const [validationResult, setValidationResult] =
    useState<EFlowCommandValidationResult | null>(null);
  const [applyResult, setApplyResult] = useState<EFlowCommandApplyResult | null>(null);

  const exampleNodeId = graph?.nodes[0]?.id ?? "REPLACE_WITH_EXISTING_NODE_ID";
  const canUseGraph = Boolean(graph);
  const hasCommandText = commandText.trim().length > 0;

  const resultSummary = useMemo(() => {
    if (!applyResult) return null;

    return {
      state: applyResult.ok ? "ok" : "failed",
      mode: applyResult.mode,
      changes: applyResult.changes.length,
      errors: applyResult.errors.length,
      warnings: applyResult.warnings.length,
    };
  }, [applyResult]);

  function insertExampleCommand() {
    const commandId = `cmd_local_example_${Date.now()}`;
    const exampleCommand = {
      schemaVersion: EFLOW_COMMAND_SCHEMA_VERSION,
      commandId,
      projectId: graph?.sourceInputId ?? "todo-thought-universe",
      graphId: graph?.id,
      createdAt: new Date().toISOString(),
      actor: {
        type: "ai_agent",
        id: "codex",
        name: "Codex",
      },
      intent: "progress_sync",
      mode: "apply",
      operations: [
        {
          op: "updateNode",
          id: exampleNodeId,
          patch: {
            reviewStatus: "confirmed",
            lifecycleStatus: "completed",
          },
          reason: "This node has been implemented and verified.",
        },
      ],
    };

    setCommandText(JSON.stringify(exampleCommand, null, 2));
    setValidationResult(null);
    setApplyResult(null);
    setMessage({
      type: graph ? "info" : "error",
      text: graph
        ? `Example command targets node "${exampleNodeId}".`
        : "Example inserted with a placeholder node id. Generate or import a graph before dry-run/apply.",
    });
  }

  function clearCommand() {
    setCommandText("");
    setMessage(null);
    setValidationResult(null);
    setApplyResult(null);
  }

  function validateCommand() {
    const parsed = parseAndValidateCommand();
    if (!parsed) return;

    setMessage({
      type: "success",
      text: "Command is valid.",
    });
  }

  function dryRunCommand() {
    const command = parseAndValidateCommand();
    if (!command) return;

    if (!graph) {
      setApplyResult(null);
      setMessage({
        type: "error",
        text: "Generate or import an engineering graph before dry-running commands.",
      });
      return;
    }

    const result = dryRunEFlowCommandOnGraph(graph, command);
    setApplyResult(result);
    setMessage({
      type: result.ok ? "success" : "error",
      text: result.ok
        ? "Dry run completed. Graph state was not changed."
        : "Dry run failed. Graph state was not changed.",
    });
  }

  function applyCommand() {
    const command = parseAndValidateCommand();
    if (!command) return;

    if (!graph) {
      setApplyResult(null);
      setMessage({
        type: "error",
        text: "Generate or import an engineering graph before applying commands.",
      });
      return;
    }

    const result = applyEFlowCommandToGraph(graph, command);
    setApplyResult(result);

    if (result.ok && result.mode === "apply") {
      onApplyGraph(result.graph);
      onRecordAuditEvent(
        createAuditEvent({
          actor: {
            type: command.actor.type,
            id: command.actor.id,
            name: command.actor.name,
          },
          source: "ai_command",
          eventType: "ai_command_applied",
          summary: `Applied AI command ${command.commandId} with ${command.operations.length} ${command.operations.length === 1 ? "operation" : "operations"}.`,
          target: {
            type: "command",
            id: command.commandId,
          },
          after: {
            changes: result.changes.length,
          },
          metadata: {
            commandId: command.commandId,
            intent: command.intent,
            operationsCount: command.operations.length,
            changesCount: result.changes.length,
            warningsCount: result.warnings.length,
          },
        }),
      );
      setMessage({
        type: "success",
        text: "Command applied to the current graph.",
      });
      return;
    }

    if (result.ok && result.mode === "dry_run") {
      setMessage({
        type: "info",
        text: "Command mode is dry_run. Graph state was not changed.",
      });
      return;
    }

    setMessage({
      type: "error",
      text: "Command failed. Graph state was not changed.",
    });
  }

  function parseAndValidateCommand(): EFlowCommandEnvelope | null {
    setApplyResult(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(commandText);
    } catch (error) {
      setValidationResult(null);
      setMessage({
        type: "error",
        text: error instanceof Error ? `Invalid JSON. ${error.message}` : "Invalid JSON.",
      });
      return null;
    }

    const nextValidationResult = validateEFlowCommandEnvelope(parsed);
    setValidationResult(nextValidationResult);

    if (!nextValidationResult.ok) {
      setMessage({
        type: "error",
        text: "Command validation failed. Graph state was not changed.",
      });
      return null;
    }

    return parsed as EFlowCommandEnvelope;
  }

  return (
    <section className="local-command-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Local command</p>
          <h2>AI command import</h2>
        </div>
        <span className={`status-indicator ${canUseGraph ? "status-ok" : "status-warn"}`}>
          {canUseGraph ? "Graph ready" : "Validation only"}
        </span>
      </div>
      <p className="command-helper">
        Paste an eflow-command/v0.1 JSON command to validate, dry-run, or apply local graph
        updates. This stays in the browser and only changes the current graph after Apply Command.
      </p>
      <p className="command-interop-note">
        Accepted schema: <strong>{EFLOW_COMMAND_SCHEMA_VERSION}</strong>. Recommended workflow:
        Validate -&gt; Dry Run -&gt; Apply. reviewStatus updates confirmation state;
        lifecycleStatus updates implementation progress.
      </p>
      {!graph ? (
        <p className="command-note">
          Generate or import an engineering graph before dry-running or applying commands.
        </p>
      ) : null}
      <div className="command-actions">
        <button className="mini-button" type="button" onClick={insertExampleCommand}>
          Insert example command
        </button>
        <button className="mini-button" type="button" onClick={clearCommand}>
          Clear
        </button>
      </div>
      <textarea
        className="command-textarea"
        rows={10}
        value={commandText}
        onChange={(event) => {
          setCommandText(event.target.value);
          setMessage(null);
          setApplyResult(null);
        }}
        placeholder='{"schemaVersion":"eflow-command/v0.1","operations":[...]}'
        aria-label="Local AI command JSON"
      />
      <div className="command-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={validateCommand}
          disabled={!hasCommandText}
        >
          Validate
        </button>
        <button
          className="button button-secondary"
          type="button"
          onClick={dryRunCommand}
          disabled={!hasCommandText || !canUseGraph}
        >
          Dry Run
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={applyCommand}
          disabled={!hasCommandText || !canUseGraph}
        >
          Apply Command
        </button>
      </div>
      {message ? <p className={`command-message command-message-${message.type}`}>{message.text}</p> : null}
      {validationResult ? (
        <div className="command-validation">
          <div className="command-result-summary">
            <span>{validationResult.ok ? "Validation ok" : "Validation failed"}</span>
            <span>{validationResult.errors.length} errors</span>
            <span>{validationResult.warnings.length} warnings</span>
          </div>
          <CommandIssueList title="Errors" issues={validationResult.errors} />
          <CommandIssueList title="Warnings" issues={validationResult.warnings} />
        </div>
      ) : null}
      {resultSummary ? (
        <div className="command-result">
          <div className="command-result-summary">
            <span>{resultSummary.state}</span>
            <span>{resultSummary.mode}</span>
            <span>{resultSummary.changes} changes</span>
            <span>{resultSummary.errors} errors</span>
            <span>{resultSummary.warnings} warnings</span>
          </div>
          <CommandChangeList result={applyResult} />
          <CommandIssueList title="Apply errors" issues={applyResult?.errors ?? []} />
          <CommandIssueList title="Apply warnings" issues={applyResult?.warnings ?? []} />
        </div>
      ) : null}
    </section>
  );
}

function CommandIssueList({
  title,
  issues,
}: {
  title: string;
  issues: EFlowCommandValidationIssue[];
}) {
  if (issues.length === 0) return null;

  return (
    <div className="command-list">
      <h3>{title}</h3>
      {issues.map((issue, index) => (
        <div className={`command-issue command-issue-${issue.severity}`} key={`${issue.code}-${index}`}>
          <strong>{issue.code}</strong>
          <span>{issue.path}</span>
          <p>{issue.message}</p>
        </div>
      ))}
    </div>
  );
}

function CommandChangeList({ result }: { result: EFlowCommandApplyResult | null }) {
  if (!result || result.changes.length === 0) return null;

  return (
    <div className="command-list">
      <h3>Changes</h3>
      {result.changes.map((change) => (
        <div className="command-change" key={`${change.operationIndex}-${change.changeType}`}>
          <strong>{change.changeType}</strong>
          <span>
            {change.operation}
            {change.targetId ? ` - ${change.targetId}` : ""}
          </span>
          <p>{change.summary}</p>
        </div>
      ))}
    </div>
  );
}
