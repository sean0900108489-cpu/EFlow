# HANDOFF.md — EFlow Current Development State

## Current Strategic State

EFlow has been upgraded from:

> human-reviewed engineering flow diagram tool

to:

> AI-to-AI Communication & Architecture Sync Hub

This is a major strategic shift.

EFlow is not only a visual website for drawing engineering architecture.
It is becoming the canonical structured project map that both humans and AI agents can read from and write to.

The canvas is only a rendering layer.
The schema is the source of truth.

## Confirmed User Decisions

The user confirmed all six schema and architecture decisions:

1. `reviewStatus` and `lifecycleStatus` must be separated.
2. Official schema should deprecate generic `status`.
3. Lifecycle enum is accepted:
   - `draft`
   - `planned`
   - `ready`
   - `developing`
   - `completed`
   - `blocked`
   - `needs_refactor`
   - `deprecated`
4. AI command v0.1 should start as local JSON import / local-first command intake.
5. Edges must also support `lifecycleStatus`.
6. Implementation order:
   - first: AI Command Schema Foundation
   - later: v0.4 Manual Graph Editing / Add Missing Context

## Current Immediate Task

The current immediate task is documentation and TypeScript schema foundation only.

Do:

1. Update / overwrite AGENTS.md with the strategic AI-to-AI sync hub direction.
2. Update / overwrite HANDOFF.md with the confirmed schema decisions and next step.
3. Add TypeScript schema/type files for AI command and AI-native context export.

Do not:

- implement UI
- implement command import panel
- implement command application logic
- modify App.tsx
- modify existing graph generation
- modify canvas
- modify inspectors
- modify review panel
- modify persistence logic
- add backend
- add database
- add auth
- add cloud sync
- add real AI API
- add repo analyzer
- add agent execution
- commit
- push

## New Core Mechanism 1: Headless / API-First Command Intake

EFlow must support structured JSON command input from AI agents.

Example future command intent:

```json
{
  "schemaVersion": "eflow-command/v0.1",
  "commandId": "cmd_2026_05_17_db_user_completed",
  "projectId": "todo-thought-universe",
  "createdAt": "2026-05-17T00:00:00.000Z",
  "actor": {
    "type": "ai_agent",
    "id": "codex",
    "name": "Codex CLI"
  },
  "intent": "progress_sync",
  "mode": "apply",
  "operations": [
    {
      "op": "transitionNode",
      "id": "db_user",
      "to": "completed",
      "reason": "User database schema, migration, and repository layer were implemented.",
      "evidence": [
        {
          "type": "file",
          "uri": "src/db/schema.ts"
        }
      ]
    }
  ]
}
```

This does not require a backend at the current stage.

Early implementation should remain local-first through:

- local JSON import
- clipboard JSON
- file import
- command parser helpers

## New Core Mechanism 2: AI-Native Context Export

EFlow exports must prioritize machine-readable AI context.

The most important export is not PNG/PDF.
The most important export is a complete structured project context usable by future coding agents as a system prompt, knowledge base, or implementation handoff.

The export should include:

- project identity
- project intent
- graph nodes
- graph edges
- confirmation policy
- review statuses
- lifecycle statuses
- dependency map
- blocking questions
- next development targets
- Mermaid-compatible logic
- provenance
- command schema compatibility

## New Core Mechanism 3: Dynamic State Machine Syncing

Each node and edge should support implementation lifecycle state.

Important distinction:

- `reviewStatus` tells AI whether the architecture claim is trusted.
- `lifecycleStatus` tells AI what implementation phase the item is in.

Do not collapse these into one ambiguous generic `status` field.

Recommended review statuses:

- `suggested`
- `confirmed`
- `needs_review`
- `rejected`

Recommended lifecycle statuses:

- `draft`
- `planned`
- `ready`
- `developing`
- `completed`
- `blocked`
- `needs_refactor`
- `deprecated`

## Relationship to Existing Roadmap

The previously planned v0.4 Manual Graph Editing milestone is still valuable.

However, the design now needs to account for the larger direction:

- UI edits
- manual graph edits
- imported AI commands
- progress sync commands

should eventually become different entry points into the same validated graph mutation model.

Manual graph editing should not be designed as a UI-only dead end.

## Current Implementation Boundary

This checkpoint should only create schema foundation files.

Expected new files:

- `src/types/eflowCommand.ts`
- `src/types/eflowContext.ts`

These files should define:

- command schema version constants
- review status enum/union
- lifecycle status enum/union
- actor types
- evidence types
- provenance types
- implementation state types
- node and edge command payload types
- command operation types
- command envelope type
- AI-native context export type

Do not import these new types into the app yet unless explicitly instructed later.

## Next Milestone After This Checkpoint

After this documentation + type schema foundation is complete, the next possible milestone is:

> Local AI Command Intake / Apply Foundation

That future milestone may include:

1. JSON command validation helpers.
2. Local command import parser.
3. Dry-run command result.
4. Apply command to EngineeringFlowGraph.
5. Mapping legacy `status` to `reviewStatus`.
6. Adding `lifecycleStatus` defaults to graph nodes and edges.
7. Exporting AI-native context in the new `eflow-context/v0.1` format.

Do not begin that future milestone in the current task.

## Validation Guidance

For this schema foundation checkpoint:

- Run `npm run build` after creating TypeScript files.
- `npm run validate:example` is optional unless existing validation scripts are affected.
- Do not fix unrelated existing issues without asking.

## Stop Condition

After updating:

- AGENTS.md
- HANDOFF.md
- src/types/eflowCommand.ts
- src/types/eflowContext.ts

stop and report.

Do not write UI code.
Do not implement functionality.
Do not commit.
Do not push.

## Completed Checkpoint: Local AI Command Intake / Apply Foundation

This checkpoint adds headless/local-first command handling foundations only.

Files changed:

- `src/types/engineeringFlow.ts`
- `src/lib/workspaceValidation.ts`
- `src/lib/eflowCommandValidation.ts`
- `src/lib/applyEflowCommand.ts`
- `scripts/validateExample.ts`
- `HANDOFF.md`

Implemented:

- Plain TypeScript validation helpers for `eflow-command/v0.1` envelopes.
- Type guards for review status, lifecycle status, and command envelopes.
- Headless dry-run and apply helpers for `EngineeringFlowGraph`.
- Legacy compatibility mapping from command `reviewStatus` to graph `status`.
- Optional `lifecycleStatus` and implementation state support on graph nodes and edges.
- Provenance-preserving command traces through optional command provenance and implementation history.
- Validation coverage for update, transition, upsert, duplicate edge prevention, missing target detection, and invalid lifecycle status rejection.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.

Known boundaries:

- No UI was added.
- No command import panel was added.
- No backend, database, auth, cloud sync, real AI API, MCP server, CLI command, repo analyzer, or agent execution was added.
- Expanded command node and relationship types that are not supported by the current legacy graph are rejected by apply helpers.
- `addDecision` and `addQuestion` validate as command schema concepts but return unsupported graph-apply errors in this milestone.

Recommended next milestone:

> AI-Native Context Export v0.1

Alternative follow-up:

> Local Command Import UI

Do not begin either follow-up until explicitly instructed.

## Completed Checkpoint: AI-Native Context Export v0.1

This checkpoint adds the headless read-side counterpart to local AI command intake.

Files changed:

- `src/lib/buildEflowContextExport.ts`
- `scripts/validateExample.ts`
- `HANDOFF.md`

Implemented:

- `buildEFlowContextExport` for producing formal `eflow-context/v0.1` exports.
- Mapping from legacy graph `status` fields to official `reviewStatus`.
- Default lifecycle mapping using `planned` when graph items do not yet have `lifecycleStatus`.
- Context graph conversion into `EFlowCommandNode` and `EFlowCommandEdge` compatible shapes.
- Dependency index with `dependsOn`, `blocks`, and `relatedEdges`.
- Review and lifecycle progress summaries.
- Blocking question extraction from blocking question nodes.
- Deterministic next development target recommendations.
- Mermaid flowchart, dependency graph, and lifecycle state summary output.
- Command interface metadata advertising `eflow-command/v0.1` and preferred graph operations.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.

Known boundaries:

- No UI was added.
- Existing Full AI Context export remains unchanged.
- The new `eflow-context/v0.1` builder is headless and not wired into the export panel yet.
- Lifecycle defaults are exported as `planned` when graph items do not yet store lifecycle state.
- Dependency semantics are currently derived from graph edges only.

Recommended next milestone:

> Local Command Import UI

Alternative follow-ups:

- Lifecycle State Display
- Manual Graph Editing / Add Missing Context

Do not begin those follow-ups until explicitly instructed.

## Completed Checkpoint: AI-Native Context Export UI

This checkpoint wires the headless `eflow-context/v0.1` builder into the existing export UI.

Files changed:

- `src/components/export/EFlowContextExportPanel.tsx`
- `src/components/export/JsonExportPanel.tsx`
- `src/styles/components.css`
- `HANDOFF.md`

Implemented:

- Added an AI-Native Context Export section to the existing JSON export area.
- The section calls `buildEFlowContextExport` with the current `EngineeringFlowInput` and `EngineeringFlowGraph`.
- Added copy support through the existing `CopyJsonButton` pattern.
- Added download support for `eflow-context-{project-name}.json`.
- Added concise export metadata for schema version, project, node count, edge count, blocking questions, completed nodes, and accepted command schema.
- Preserved existing EngineeringFlowInput, EngineeringFlowGraph, Full AI Context, Workspace JSON, and import/export behavior.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.
- `git diff --check` passes.

Browser smoke check:

- Passed for section visibility, graph-generated metadata, AI context copy fallback, JSON contents, and existing Full AI Context export visibility.
- The Codex in-app browser does not support download events, so file creation for `Download AI Context JSON` could not be fully verified there. The button is visible and uses the same browser download pattern as the workspace export.

Known boundaries:

- No command import UI was added.
- No command apply UI was added.
- No lifecycle display on the canvas was added.
- No manual graph editing was added.
- No backend, database, auth, cloud sync, real AI API, MCP server, CLI command, repo analyzer, or agent execution was added.

Recommended next milestone:

> Local Command Import UI

Do not begin this follow-up until explicitly instructed.

## Completed Checkpoint: Local Command Import UI

This checkpoint exposes the existing headless `eflow-command/v0.1` validation and graph apply helpers through a local-only UI panel.

Files changed:

- `src/components/command/LocalCommandImportPanel.tsx`
- `src/components/inspector/InspectorPanel.tsx`
- `src/App.tsx`
- `src/styles/components.css`
- `HANDOFF.md`

Implemented:

- Added a right-column Local AI Command Import panel.
- Added paste-based JSON command validation for `eflow-command/v0.1`.
- Added dry-run support through `dryRunEFlowCommandOnGraph` without graph mutation.
- Added explicit apply support through `applyEFlowCommandToGraph`.
- Applied commands update the current `EngineeringFlowGraph` through App state, preserving existing autosave/export behavior.
- Added validation, parse error, dry-run/apply result, change, warning, and error displays.
- Added an example command inserter that targets an existing graph node when available.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.

Browser smoke check:

- Passed for panel visibility, example command insertion, validation, dry-run without mutation, explicit apply, AI-native context export reflection, invalid JSON handling, invalid lifecycle validation, missing node rejection, existing Full AI Context and Workspace export visibility, and local autosave restore after refresh.

Known boundaries:

- This is local browser JSON handling only.
- No command import backend, API, MCP server, CLI command, real AI API, repo analyzer, or agent execution was added.
- The panel does not force-select updated graph items.
- The panel does not add lifecycle badges to the canvas.
- Manual Graph Editing was not implemented.

Recommended next milestone:

> Lifecycle State Display

Alternative follow-up:

> Manual Graph Editing / Add Missing Context

## Completed Checkpoint: Lifecycle State Inspector Display

This checkpoint exposes lifecycle state editing in the existing node and edge inspectors.

Files changed:

- `src/components/inspector/NodeInspector.tsx`
- `src/components/inspector/EdgeInspector.tsx`
- `HANDOFF.md`

Implemented:

- Added `Lifecycle status` display and editing to `NodeInspector`.
- Added `Lifecycle status` display and editing to `EdgeInspector`.
- Missing node and edge `lifecycleStatus` values display as `planned`.
- Lifecycle edits write to `node.lifecycleStatus` or `edge.lifecycleStatus`.
- Existing legacy review status controls remain unchanged and continue to write to `status`.
- Existing immutable graph update paths continue to update `graph.updatedAt`, workspace autosave, and exports.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.
- `git diff --check` passes.

Browser smoke check:

- Passed for node lifecycle display defaulting to `planned`, node lifecycle edit to `completed`, edge lifecycle display defaulting to `planned`, edge lifecycle edit to `blocked`, graph export lifecycle persistence, EFlow Context lifecycle progress summaries, existing review status controls, AI-Native Context export visibility, Local Command Import panel visibility in the empty inspector flow, and local workspace restore after refresh.

Known limitations:

- No canvas lifecycle badges yet.
- No lifecycle progress dashboard yet.
- Manual Graph Editing / Add Missing Context is still not implemented.

Recommended next milestone:

> Lifecycle Progress Summary

## Completed Checkpoint: Lifecycle Progress Summary

This checkpoint adds a compact human-facing lifecycle progress readout derived from the current graph state.

Files changed:

- `src/lib/buildLifecycleSummary.ts`
- `src/components/lifecycle/LifecycleProgressSummary.tsx`
- `src/components/inspector/InspectorPanel.tsx`
- `src/styles/components.css`
- `scripts/validateExample.ts`
- `HANDOFF.md`

Implemented:

- Added `buildLifecycleSummary` for node and edge lifecycle counts and lifecycle ID buckets.
- Missing node and edge `lifecycleStatus` values count as `planned`.
- Added an `Implementation Progress` section to the right inspector stack.
- The summary shows compact node and edge counts by lifecycle status.
- The summary derives from the current `EngineeringFlowGraph`, so inspector edits, local command applies, and restored workspace graph state update it naturally.
- Existing review status controls, command import behavior, graph generation, persistence, and export behavior were preserved.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.
- `git diff --check` passes.

Browser smoke check:

- Passed for Todo Thought Universe example generation, planned default lifecycle counts, node lifecycle edit count updates, edge lifecycle edit count updates, Local Command Import lifecycle update reflection, refresh/local workspace restore, NodeInspector lifecycle controls, EdgeInspector lifecycle controls, AI-Native Context Export visibility, and Local Command Import UI visibility.

Known limitations:

- No canvas lifecycle badges yet.
- No lifecycle filters yet.
- Manual Graph Editing still not implemented.

Recommended next milestone:

> Manual Graph Editing Headless Helpers

## Completed Checkpoint: Manual Graph Editing Headless Helpers

This checkpoint adds local-first helper functions for manually creating and inserting graph items without adding any UI.

Files changed:

- `src/lib/manualGraphEditing.ts`
- `src/types/engineeringFlow.ts`
- `src/lib/buildEflowContextExport.ts`
- `scripts/validateExample.ts`
- `HANDOFF.md`

Implemented:

- Added `createManualNode` for creating `manual_edit` graph nodes.
- Added `createManualEdge` for creating `manual_edit` graph edges.
- Added `insertManualNode` for immutable manual node insertion.
- Added `insertManualEdge` for immutable manual edge insertion.
- Manual nodes default to legacy review `status: "confirmed"` and `lifecycleStatus: "planned"`.
- Manual edges default to legacy review `status: "confirmed"` and `lifecycleStatus: "planned"`.
- Manual provenance uses `sourceType: "manual_edit"`, empty `sourceInputIds`, and human-added generation rules.
- Insert helpers fail safely with result objects and clear error codes.
- Manual node insertion rejects duplicate node ids.
- Manual edge insertion rejects duplicate edge ids, missing sources, missing targets, self-edges, and duplicate exact edges.
- EFlow Context export preserves manual node `sourceInputIds` and includes inserted manual graph items because they are part of `EngineeringFlowGraph`.
- Existing command import behavior, graph generation, persistence, lifecycle summary, and UI surfaces were not changed.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.
- `git diff --check` passes.

Browser smoke check:

- Not required / not run because this is a headless-only helper milestone. The app still builds successfully.

Known limitations:

- No manual node UI yet.
- No manual edge UI yet.
- No canvas editing UI yet.
- No canvas lifecycle badges.
- No lifecycle filters.

Recommended next milestone:

> Add Manual Node UI

## Completed Checkpoint: Add Manual Node UI

This checkpoint adds a small local-first UI for creating manual graph nodes from the right inspector stack.

Files changed:

- `src/components/graphEditing/AddManualNodePanel.tsx`
- `src/components/inspector/InspectorPanel.tsx`
- `src/styles/components.css`
- `HANDOFF.md`

Implemented:

- Added `AddManualNodePanel` for creating manual graph nodes whenever an `EngineeringFlowGraph` exists.
- The panel supports node type, title, description, optional AI-readable summary, review status, and lifecycle status.
- Defaults are `type: "feature"`, legacy review `status: "confirmed"`, and `lifecycleStatus: "planned"`.
- Review status choices are intentionally limited to `confirmed` and `needs_review`.
- Lifecycle choices use the accepted lifecycle state list: `draft`, `planned`, `ready`, `developing`, `completed`, `blocked`, `needs_refactor`, and `deprecated`.
- Manual nodes are created with `createManualNode` and inserted immutably with `insertManualNode`.
- Successful insertion replaces the graph state and selects the newly added node through the existing app selection path.
- Manual nodes appear on the canvas, in `NodeInspector`, in lifecycle and review summaries, and in exports naturally because they are part of the current graph.
- Workspace autosave and restore preserve manual nodes through the existing workspace persistence path.
- Existing graph generation, command import behavior, export behavior, and canvas editing behavior were not changed.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.
- `git diff --check` passes.

Browser smoke check:

- Passed using the Todo Thought Universe example.
- Confirmed Add Manual Node UI appears after graph generation.
- Added a manual node with default `feature`, `confirmed`, and `planned` values.
- Confirmed the manual node appears on the canvas and is selectable.
- Confirmed `NodeInspector` shows the manual node, including `manual_edit` provenance and `human_added_node` generation rule.
- Confirmed EngineeringFlowGraph export, EFlow Context export, and Workspace export include the manual node.
- Confirmed browser refresh restores the manual node from local workspace persistence.
- Confirmed existing NodeInspector lifecycle controls still update lifecycle counts.
- Confirmed Lifecycle Progress Summary updates node counts.
- Confirmed Local Command Import UI and AI-Native Context Export UI still exist.
- Confirmed no manual edge UI was added.

Known limitations:

- Manual edge UI still not implemented.
- Canvas direct editing still not implemented.
- Canvas lifecycle badges still not implemented.
- Lifecycle filters still not implemented.

Recommended next milestone:

> Add Manual Edge UI

## Completed Checkpoint: Add Manual Edge UI and Manual Provenance Polish

This checkpoint adds a small local-first UI for creating manual graph edges and visual-only manual provenance badges in inspectors.

Files changed:

- `src/components/graphEditing/AddManualEdgePanel.tsx`
- `src/components/inspector/InspectorPanel.tsx`
- `src/components/inspector/NodeInspector.tsx`
- `src/components/inspector/EdgeInspector.tsx`
- `src/styles/components.css`
- `HANDOFF.md`

Implemented:

- Added `AddManualEdgePanel` for creating manual graph edges whenever an `EngineeringFlowGraph` exists.
- Source and target nodes are selected from existing `graph.nodes` with simple native selects.
- Relationship type choices are limited to the graph model's supported `RelationshipType` values: `serves`, `uses`, `leads_to`, `contains`, `depends_on`, `produces`, `needs_confirmation`, and `relates_to`.
- The panel supports description, review status, and lifecycle status.
- Defaults are `relationshipType: "relates_to"`, legacy review `status: "confirmed"`, and `lifecycleStatus: "planned"`.
- Review status choices are intentionally limited to `confirmed` and `suggested`.
- Lifecycle choices use the accepted lifecycle state list: `draft`, `planned`, `ready`, `developing`, `completed`, `blocked`, `needs_refactor`, and `deprecated`.
- Manual edges are created with `createManualEdge` and inserted immutably with `insertManualEdge`.
- Successful insertion replaces the graph state and selects the newly added edge through the existing app selection path.
- The UI safely handles missing source, missing target, same source/target, empty descriptions, fewer than two nodes, duplicate exact edges, and helper failure results without throwing.
- Manual edges appear on the canvas, in `EdgeInspector`, in lifecycle and review summaries, and in exports naturally because they are part of the current graph.
- Workspace autosave and restore preserve manual edges through the existing workspace persistence path.
- `NodeInspector` now shows a small visual-only `Manual context` badge for `manual_edit` nodes.
- `EdgeInspector` now shows a small visual-only `Manual relationship` badge for `manual_edit` edges.
- Existing review status controls and lifecycle status controls remain unchanged.
- Existing graph generation, command import behavior, export behavior, and canvas editing behavior were not changed.

Validation results:

- `npm run validate:example` passes.
- `npm run build` passes.
- `git diff --check` passes.

Browser smoke check:

- Passed in Safari against `http://127.0.0.1:5173`.
- Confirmed Add Manual Node UI still appears and still works.
- Confirmed Add Manual Edge UI appears after graph generation.
- Added a manual edge with default `relates_to`, `confirmed`, and `planned` values.
- Confirmed the manual edge appears on the canvas and is selectable.
- Confirmed `EdgeInspector` shows the manual edge, including the `Manual relationship` badge, `manual_edit` provenance, and `human_added_edge` generation rule.
- Confirmed a manual node shows the `Manual context` badge in `NodeInspector`.
- Confirmed EngineeringFlowGraph export, EFlow Context export, and Workspace export include the manual edge.
- Confirmed browser refresh restores the manual edge from local workspace persistence.
- Confirmed duplicate exact edge creation is rejected safely.
- Confirmed same source/target edge creation is rejected safely.
- Confirmed existing inspector lifecycle controls still update lifecycle counts.
- Confirmed Lifecycle Progress Summary updates edge counts.
- Confirmed Local Command Import UI and AI-Native Context Export UI still exist.
- Confirmed no canvas direct editing was added.

Known limitations:

- Canvas direct editing still not implemented.
- Drag-to-create still not implemented.
- Canvas lifecycle badges still not implemented.
- Lifecycle filters still not implemented.
- Command history/audit log still not implemented.

Recommended next milestone:

> Manual Editing Integration Polish

Keep the next polish small and focused on integration fit and rough edges; it should not become a full visual graph editor.
