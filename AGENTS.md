# AGENTS.md — EFlow AI Engineering Instructions

## Project Identity

EFlow / Engineering Flow Intake is the first bootstrap engineering planning tool in a larger AI-native personal tool universe.

It is not a generic todo app.
It is not a generic diagram tool.
It is not a repo analyzer.
It is not an autonomous agent execution platform.

EFlow’s core purpose is to convert structured project intent into a trustworthy, reviewable, AI-readable engineering graph.

The long-term upstream/downstream chain is:

1. Todo Thought Universe captures thoughts, ideas, todos, goals, and projects.
2. Mature project ideas flow into EFlow.
3. EFlow converts structured project input into an engineering graph.
4. Humans and AI agents review, confirm, and complete that graph.
5. EFlow exports AI-native project context.
6. Coding agents use that context to implement the downstream project.
7. Implementation progress syncs back into EFlow.

## Strategic Architecture Update

EFlow has been strategically upgraded from:

> human-reviewed engineering flow diagram tool

to:

> AI-to-AI Communication & Architecture Sync Hub

The product is no longer only a visual website for manually drawing or reviewing architecture.

Its future role is to become the canonical structured project map that both humans and AI agents can read from and write to.

The canvas is a visual rendering layer.
The schema is the source of truth.

## Current Core Product Principles

Always preserve these principles:

- schema-first
- local-first until explicitly changed
- human-confirmed truth
- AI-readable export
- structured graph over visual-only diagram
- provenance-aware mutation history
- deterministic generation where possible
- no hidden AI guessing as trusted truth
- calm Apple-like UI
- no premature backend
- no premature AI automation
- no scope explosion

## Core Mechanism 1: Headless / API-First Command Intake

EFlow must support structured command input in addition to visual UI interaction.

At the current stage, API-first does NOT mean building a network API or backend service.

For the near term, API-first means:

- schema-first command format
- validated local JSON command import
- clipboard or file-based command intake
- deterministic local command application
- future-compatible with CLI, MCP, REST, or agent tool interfaces

The first implementation path should remain local-first.

Acceptable early channels:

- JSON command import panel
- local file import
- clipboard import
- programmatic command parser
- future CLI command
- future REST endpoint
- future MCP/tool interface

All external AI writes should eventually pass through a validated command envelope.

Example future command:

```json
{
  "schemaVersion": "eflow-command/v0.1",
  "commandId": "cmd_2026_05_17_001",
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
      "op": "updateNode",
      "id": "db_user",
      "patch": {
        "reviewStatus": "confirmed",
        "lifecycleStatus": "completed"
      },
      "reason": "User data model has been implemented and verified."
    }
  ]
}
```

## Core Mechanism 2: AI-Native Context Export

EFlow exports must prioritize machine-readable project context over image exports.

PNG/PDF exports may exist later as visual artifacts, but they are not the primary product value.

The most important export is structured AI context usable as:

- downstream AI system prompt
- coding agent knowledge base
- implementation handoff
- reproducible architecture snapshot
- progress synchronization source

AI-native exports should include:

- project identity
- project intent
- typed graph nodes
- typed graph edges
- review / confirmation status
- lifecycle / implementation status
- dependency map
- blocking questions
- next recommended development targets
- Mermaid-compatible structural logic
- confirmation policy
- state machine policy
- provenance metadata
- command schema compatibility

## Core Mechanism 3: Dynamic State Machine Syncing

Nodes and edges must support implementation lifecycle states.

Important distinction:

- `reviewStatus` = whether the architecture claim is trusted / confirmed.
- `lifecycleStatus` = where the item is in the development process.

Do not overload one generic `status` field for both meanings.

Formal schemas should avoid generic `status`.

Legacy code may still contain `status` from earlier versions. Treat that as legacy review/confirmation status until migration is explicitly implemented.

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

Example:

```json
{
  "id": "feature_quick_capture",
  "type": "feature",
  "title": "Quick Capture",
  "reviewStatus": "confirmed",
  "lifecycleStatus": "developing"
}
```

This means:

- The feature is a confirmed part of the architecture.
- The implementation is currently in progress.

## Confirmed Schema Decisions

The user has confirmed the following decisions:

1. Separate `reviewStatus` and `lifecycleStatus`.
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
4. AI command v0.1 should start as local JSON import, not backend API.
5. Edges must also support `lifecycleStatus`.
6. Implementation order:
   - first: AI Command Schema Foundation
   - later: Manual Graph Editing / Add Missing Context

## Provenance and Actor Metadata

Every AI-originated mutation must preserve provenance.

Future provenance source types should include:

- `user_input`
- `example_seed`
- `system_generated`
- `ai_suggested`
- `manual_edit`
- `ai_command`
- `ai_progress_sync`
- `context_import`

AI command provenance should include:

- command id
- actor id
- actor type
- timestamp
- reason
- evidence when available

Do not silently mutate architecture without traceability.

## Command Safety Rules

Future command intake must be:

- validated
- idempotent when possible
- dry-run capable when possible
- provenance-preserving
- conflict-aware through optional base revision
- safe against duplicate exact edges
- safe against missing node references
- explicit about rejected / deprecated data

A repeated command with the same `commandId` should not create duplicate graph objects.

## AI-to-AI Standard Workflow

The target future workflow is:

1. Human or AI creates structured project input.
2. EFlow generates or stores an EngineeringFlowGraph.
3. Human reviews and confirms the architecture.
4. EFlow exports AI-native context.
5. Downstream coding AI reads the context and implements modules.
6. During implementation, downstream AI sends progress sync commands back to EFlow.
7. EFlow updates node / edge lifecycle states.
8. EFlow exports updated project context again.

EFlow is therefore both:

- an architecture planning surface
- a bidirectional AI sync protocol

## Existing Project Architecture

Current known stack:

- Vite
- React
- TypeScript
- @xyflow/react
- plain CSS
- localStorage

Current architectural direction:

- frontend-only
- local-first
- no backend
- no database
- no auth
- no cloud sync
- no real AI API
- no repo analyzer
- no agent execution
- no team collaboration

## Existing Core Concepts

The existing system already revolves around structured graph data:

- EngineeringFlowInput
- EngineeringFlowGraph
- EngineeringNode
- EngineeringEdge
- FullAIContext
- EFlowWorkspaceDocument
- ReviewQueue
- ReviewItem

Important historical detail:

Earlier graph node/edge types may still use `status`.
That status historically means review/confirmation status.
Do not reinterpret legacy `status` as lifecycle status.

Future schema work should normalize toward:

- `reviewStatus`
- `lifecycleStatus`

## Scope Boundaries

Until explicitly approved, do not add:

- backend
- database
- auth
- cloud sync
- paid SaaS features
- team collaboration
- real AI API calls
- repo analyzer
- autonomous agent execution platform
- MCP server
- REST server
- remote collaboration
- complex version management

Headless/API-first should initially be implemented as local structured JSON command handling, not as a network service.

## Development Workflow for AI Agents

Before changing code:

1. Read README.md.
2. Read AGENTS.md.
3. Read HANDOFF.md.
4. Read package.json.
5. Read the latest 5 git commits.
6. Run `git status`.
7. Confirm current project state.
8. Confirm actual setup/run/validate commands.

Do not assume earlier work was committed.
Do not commit unless the user explicitly asks.

Before ending a work session:

1. Run `git status`.
2. Summarize completed work.
3. Summarize unfinished work.
4. Report validation results.
5. Update HANDOFF.md if appropriate.
6. Show git diff summary.
7. Suggest commit message.
8. Do not commit until user confirms.
9. Do not push until user confirms.

## Validation Commands

Use the commands defined in package.json.

Known expected commands from recent project history:

```bash
npm run validate:example
npm run build
```

For documentation-only changes, npm validation may not be required, but if TypeScript schema files are added, run:

```bash
npm run build
```

Do not silently ignore validation failures.

## Current Immediate Milestone

The current immediate milestone is:

> README / Release Documentation Final Polish

This milestone is documentation polish for the local-first v1 checkpoint.

Do:

- Update README.md so it reflects the current product.
- Update HANDOFF.md with the completed checkpoint.
- Keep the local-first / frontend-only status clear.
- Keep `node.status` / `edge.status`, `reviewStatus`, `lifecycleStatus`, and `auditLog` distinctions clear.
- Run `npm run validate:example` and `npm run build`.

Do not:

- Implement product features.
- Change React components, schemas, command behavior, workspace persistence, graph generation, or audit semantics.
- Add backend, database, auth, cloud sync, API, MCP, CLI, repo analyzer, or agent execution.
- Commit or push unless explicitly instructed.
