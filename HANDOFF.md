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
