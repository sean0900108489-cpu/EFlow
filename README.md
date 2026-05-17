# EFlow / Engineering Flow Intake

Engineering Flow Intake is a local-first, schema-first AI-to-AI Communication & Architecture Sync Hub.

EFlow turns structured project intent into a deterministic, reviewable, editable engineering graph. It is not a generic flowchart tool: the `EngineeringFlowGraph` is the source of truth, and the canvas is a visual rendering of that structured graph. Humans and AI systems read and write through explicit JSON contracts.

## Current Status

EFlow is currently a frontend-only local-first app:

- Runs locally with Vite, React, TypeScript, `@xyflow/react`, plain CSS, and `localStorage`.
- Stores workspace state in the browser.
- Exports and imports structured JSON.
- Supports local AI command validation, dry-run, and apply.
- Does not include a backend, database, auth, cloud sync, real AI API, MCP server, REST API, or CLI yet.

## Quick Start

```bash
npm install
npm run dev
```

Validation and build:

```bash
npm run validate:example
npm run build
```

## Core Workflow

1. Create, edit, load, or import an `EngineeringFlowInput`.
2. Generate a deterministic `EngineeringFlowGraph`.
3. Review generated nodes and relationships.
4. Add missing manual nodes and edges when needed.
5. Track implementation progress with `lifecycleStatus`.
6. Use local workspace autosave, Workspace JSON export, and Workspace JSON import.
7. Export `eflow-context/v0.1` AI-native context for downstream coding agents.
8. Import `eflow-command/v0.1` local AI commands through Validate -> Dry Run -> Apply.
9. Use the audit log as compact local change history.

## Data Model Summary

- `EngineeringFlowInput`: structured project intent: users, screens, functions, flows, data objects, AI roles, and unknowns.
- `EngineeringFlowGraph`: generated or edited architecture graph. This is the app's structured source of truth.
- `EngineeringNode`: graph item such as intent, user, screen, feature, flow step, data object, AI task, or question.
- `EngineeringEdge`: typed relationship between graph nodes.
- `EFlowWorkspaceDocument`: local workspace snapshot with input, graph, selection, and optional audit log.
- `EFlowAuditEvent`: compact local history event, not undo/replay data.

## Status Model

Keep review/confirmation state separate from implementation progress.

Legacy graph fields:

- `node.status` is the legacy node review/confirmation status: `suggested`, `confirmed`, or `needs_review`.
- `edge.status` is the legacy edge review/confirmation status: `suggested`, `confirmed`, or `rejected`.

Formal AI-facing review status:

- `reviewStatus`: `suggested`, `confirmed`, `needs_review`, or `rejected`.

Implementation lifecycle status:

- `lifecycleStatus`: `draft`, `planned`, `ready`, `developing`, `completed`, `blocked`, `needs_refactor`, or `deprecated`.

Mapping rules:

- Command `reviewStatus` maps to legacy `node.status` / `edge.status` where the current graph can represent it.
- Legacy graph `status` maps back to context `reviewStatus` during AI-native context export.
- `lifecycleStatus` remains separate implementation progress state and must not be used as review status.
- Missing node or edge `lifecycleStatus` is treated as `planned` in context exports, canvas badges, filters, and summaries without writing that default back to graph data.
- Current graph compatibility cannot represent node `reviewStatus: "rejected"` or edge `reviewStatus: "needs_review"`, so graph apply rejects those mappings.

## Using The App

The left panel edits structured project input. The center canvas renders the current graph. The right panel organizes product tools into collapsible sections:

- Selected Item: node, edge, or project inspector.
- Review: review progress, filters, and confirm/reject actions.
- Implementation Progress: lifecycle counts and manual context summary.
- Manual Editing: Add Manual Node and Add Manual Edge.
- Change History: local audit log.
- AI Interop: Local Command Import and AI-Native Context Export.
- Workspace / Export: Workspace JSON and legacy JSON handoff exports.

Section open/closed state is local UI state only and is not persisted to workspace JSON.

## AI-Readable Context Export

The preferred AI-readable export is `eflow-context/v0.1`.

Use the AI-Native Context Export panel to copy or download EFlow Context JSON. The export is intended for downstream coding agents such as Codex, Claude, Cursor, or another implementation system.

The export includes:

- Project identity and intent.
- Typed graph nodes and edges.
- `reviewSummary`.
- `progressSummary`.
- `dependencyIndex`.
- Blocking questions.
- Next development target recommendations.
- Mermaid-compatible graph text.
- Confirmation and lifecycle policies.
- `commandInterface` metadata describing accepted command schemas, supported operations, workflow, safety rules, status mapping, defaulting rules, audit behavior, and current graph compatibility limits.

## AI-Writable Command Import

The current AI-writable command format is `eflow-command/v0.1`.

Use the Local Command Import panel for the local workflow:

```text
Validate -> Dry Run -> Apply
```

Supported graph operations:

- `updateNode`
- `transitionNode`
- `upsertNode`
- `updateEdge`
- `transitionEdge`
- `upsertEdge`

Schema-only or unsupported graph operations:

- `addDecision`
- `addQuestion`

Those operations validate as command schema concepts but are rejected by the current graph apply helper because EFlow does not yet have standalone decision or question record stores.

Command safety rules:

- Dry-run does not mutate the graph.
- Failed operations do not partially apply.
- Missing node and edge references are rejected.
- Self-edges are rejected.
- Duplicate exact edges are prevented.
- Schema-valid node or relationship types outside the current `EngineeringFlowGraph` model are rejected during graph apply.
- Successful UI apply records an `ai_command_applied` audit event. The headless apply helper itself does not append audit events.

## Manual Graph Editing

Manual graph editing is local-first and schema-aware.

- Add Manual Node creates a graph node with `provenance.sourceType = "manual_edit"`.
- Add Manual Edge creates a graph edge with `provenance.sourceType = "manual_edit"`.
- Manual items default to review `status: "confirmed"` and `lifecycleStatus: "planned"` unless the UI selection changes them.
- Manual nodes and edges appear on the canvas, in inspectors, in review queues, in lifecycle/manual summaries, in Workspace JSON, in Full AI Context JSON, and in `eflow-context/v0.1`.
- Manual provenance badges identify human-added context and relationships.
- Manual Context Summary counts manual nodes and relationships by legacy review status, not by lifecycle state.

## Lifecycle UI

Lifecycle state is visible and editable in the UI:

- NodeInspector and EdgeInspector expose `lifecycleStatus` controls.
- Lifecycle Progress Summary counts nodes and edges by lifecycle state.
- Canvas node cards show lifecycle badges.
- Lifecycle Canvas Filters filter visible nodes by lifecycle state.
- Edge lifecycle badges and edge lifecycle filters are not implemented yet.

## Audit Log

The audit format is `eflow-audit/v0.1`.

The Change History panel shows compact local workspace history. It records important local actions such as:

- Graph generation and graph replacement.
- Workspace, EngineeringFlowInput, and Full AI Context imports.
- Manual node and manual edge creation.
- Successful local AI command apply.
- Node and edge review status changes.
- Node and edge lifecycle status changes.

The audit log is not undo, replay, conflict resolution, collaboration history, or a signed/tamper-proof event store.

## Workspace Persistence

EFlow uses local browser persistence and explicit JSON workspace files.

- The current workspace autosaves to `localStorage`.
- Workspace JSON export/import preserves input, graph, selected item, manual graph edits, lifecycle state, and `auditLog`.
- Old workspaces without `auditLog` remain valid and restore with an empty local audit history.
- Workspace import validates graph shape, lifecycle status values, and audit log shape.
- Invalid `lifecycleStatus` values or invalid `auditLog` events are rejected.
- Full AI Context import can restore input and graph, but Full AI Context does not carry workspace audit history.

## Built-In Example

The built-in Todo Thought Universe example validates to:

- 52 graph nodes.
- 93 graph edges.
- 3 blocking questions.

Run:

```bash
npm run validate:example
```

## Validation

Use the package scripts:

```bash
npm run validate:example
npm run build
```

`validate:example` checks the built-in example, graph generation, AI context export, command validation/apply behavior, manual graph editing helpers, workspace validation, lifecycle summaries, review summaries, and audit log validation.

## Important Files

- `src/types/engineeringFlow.ts`
- `src/types/eflowCommand.ts`
- `src/types/eflowContext.ts`
- `src/types/eflowAudit.ts`
- `src/lib/generateEngineeringFlow.ts`
- `src/lib/buildEflowContextExport.ts`
- `src/lib/applyEflowCommand.ts`
- `src/lib/eflowCommandValidation.ts`
- `src/lib/workspacePersistence.ts`
- `src/lib/workspaceValidation.ts`
- `src/lib/manualGraphEditing.ts`
- `src/lib/auditLog.ts`
- `src/components/graph/EngineeringFlowCanvas.tsx`
- `src/components/inspector/InspectorPanel.tsx`
- `src/components/export/EFlowContextExportPanel.tsx`
- `src/components/command/LocalCommandImportPanel.tsx`
- `scripts/validateExample.ts`

## Known Limitations

EFlow intentionally does not currently include:

- Backend, database, auth, cloud sync, or multi-project cloud workspaces.
- Real AI API calls.
- MCP server, REST API, or CLI.
- Repo analyzer.
- Autonomous agent execution.
- Team collaboration.
- Undo/redo.
- Command replay.
- Conflict resolution.
- Signed or tamper-proof audit trail.
- Canvas direct editing.
- Drag-to-create.
- Edge lifecycle badges.
- Edge lifecycle filters.
- Deployment/release website link.

## Roadmap

Near-term local-first v1 work:

- Add deployment or GitHub website link.
- Run a final regression pass.
- Cut a v1 tag.

Future protocol work should come after the local-first v1 checkpoint:

- MCP, CLI, REST, or API surfaces.
- Real AI integration.
- Repo analysis.
- Agent execution.
