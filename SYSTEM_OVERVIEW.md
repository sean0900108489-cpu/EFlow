# SYSTEM OVERVIEW

## What EFlow Is

EFlow is a local-first, schema-first engineering planning system. Its job is to turn structured product intent into a trustworthy, reviewable, AI-readable engineering graph.

This is not a generic React app, not a generic flowchart tool, and not an autonomous coding agent. The UI exists to help a human owner build and maintain a structured project map that downstream AI systems can read safely.

The system thinks in this loop:

```text
Structured intent -> Deterministic graph -> Human review -> Small milestone -> AI handoff -> Verified sync back
```

The important product idea is that architecture claims are data. They must have type, source, confidence, review state, lifecycle state, and provenance. The canvas is only a view over that data.

## Canonical Truth

The canonical in-app truth is `EngineeringFlowGraph`.

`EngineeringFlowGraph` contains typed nodes and typed edges. It is the source of truth for architecture structure, review state, lifecycle state, provenance, and graph relationships.

The canvas is not truth. It renders graph data.

AI chat is not truth. It produces drafts only.

Codex reports are not truth. They are evidence until the owner reviews them and syncs progress back.

Workspace JSON is not the main AI handoff format. It is backup/restore state for EFlow itself.

`eflow-context/v0.1` is the preferred AI-readable handoff format. It is derived from the current graph and adds summaries, policy metadata, dependency indexes, blocking questions, next development target recommendations, Mermaid text, and command compatibility metadata.

## Product Purpose

EFlow sits between raw product ideas and implementation agents.

Its purpose is to:

- Convert owner intent into a structured engineering graph.
- Make uncertainty explicit instead of hiding it.
- Separate architecture trust from implementation progress.
- Preserve provenance for generated, manual, imported, and AI-originated changes.
- Export compact, machine-readable context for downstream coding agents.
- Provide a safe manual command intake path for AI-suggested graph updates.

The broader workflow is:

```text
Idea capture -> EFlow graph -> Human review -> AI implementation -> Human verification -> EFlow lifecycle update
```

## Domain Model

### Structured Input

`EngineeringFlowInput` is the intake schema. It captures:

- project identity and intent
- user types
- main screens
- core functions
- flow steps
- data objects
- AI roles
- unknowns

Input is not a free-form note. It is a structured product sketch that deterministic generation can transform into a graph.

Unknowns are first-class. If something is unclear, it should become an unknown/question rather than being silently guessed.

### Graph

`EngineeringFlowGraph` is the canonical architecture map.

Graph nodes represent:

- `intent`
- `user`
- `screen`
- `feature`
- `flow_step`
- `data_object`
- `ai_task`
- `question`

Graph edges represent typed relationships:

- `serves`
- `uses`
- `leads_to`
- `contains`
- `depends_on`
- `produces`
- `needs_confirmation`
- `relates_to`

Edge direction matters:

```text
source --relationshipType--> target
```

For example:

- `feature --uses--> data_object`
- `flow_step --depends_on--> feature`
- `flow_step_1 --leads_to--> flow_step_2`

Dependency export currently treats `A depends_on B` as "A depends on B" and "B blocks A".

### Review Status

Review status answers: "Can this architecture claim be trusted?"

Legacy graph fields:

- `node.status`: `suggested`, `confirmed`, `needs_review`
- `edge.status`: `suggested`, `confirmed`, `rejected`

Formal AI-facing status:

- `reviewStatus`: `suggested`, `confirmed`, `needs_review`, `rejected`

The formal command/context schema has a richer review enum than the legacy graph can represent. Mapping is explicit:

- node `rejected` cannot be represented in legacy `node.status`
- edge `needs_review` cannot be represented in legacy `edge.status`

Graph apply rejects unsupported mappings rather than smuggling them into the wrong field.

### Lifecycle Status

Lifecycle status answers: "Where is this item in implementation?"

Supported lifecycle states:

- `draft`
- `planned`
- `ready`
- `developing`
- `completed`
- `blocked`
- `needs_refactor`
- `deprecated`

Lifecycle status must never be used as review status. `completed` does not mean `confirmed`; `confirmed` does not mean implemented.

Missing lifecycle values are treated as `planned` for summaries, canvas display, filters, and AI context export. This default is not written back merely for normalization.

## How The System Thinks

EFlow is built around explicit transitions between trust levels.

1. Owner intent is structured.
2. Deterministic generation creates suggested graph claims.
3. The owner reviews claims and confirms, rejects, or marks them for review.
4. The owner marks lifecycle progress separately.
5. AI receives exported context as read-only planning data.
6. AI may suggest commands, but commands must be validated, dry-run, and applied manually.
7. Completed implementation work must be verified before lifecycle state changes to `completed`.

This design avoids the common failure mode where a plausible AI response becomes project truth without review.

## Major Layers

### Domain Types

Primary types live in `src/types/`.

- `engineeringFlow.ts`: current app graph/input/workspace types.
- `eflowCommand.ts`: formal AI-writable command envelope and AI-facing graph concepts.
- `eflowContext.ts`: AI-native export shape.
- `eflowAudit.ts`: compact local audit event shape.

The type layer carries product semantics. It is not just TypeScript plumbing.

### Deterministic Graph Generation

`src/lib/generateEngineeringFlow.ts` transforms `EngineeringFlowInput` into `EngineeringFlowGraph`.

Generation is deterministic and schema-aware:

- intent becomes the root intent node
- users/screens/features/flow/data/AI roles/unknowns become typed nodes
- declared relationships become typed edges
- flow step order becomes `leads_to`
- related functions/data/screens become `depends_on`, `uses`, `contains`, or `relates_to`
- AI roles create `needs_confirmation` relationships
- blocking unknowns become question nodes with a special generation rule

Generated nodes and edges start as review suggestions. Generation does not prove truth.

### Review And Lifecycle Logic

Review queue logic lives in `src/lib/buildReviewQueue.ts`.

It prioritizes:

- blocking question nodes
- nodes marked `needs_review`
- important product nodes such as intent, user, screen, feature, and data object
- dependency or confirmation-sensitive edges
- low-confidence edges

Trust summary logic lives in `src/lib/trustSummary.ts`.

Lifecycle summary logic lives in `src/lib/buildLifecycleSummary.ts`.

These summaries help the owner decide whether a graph is ready for handoff.

### AI-Native Context Export

`src/lib/buildEflowContextExport.ts` converts the internal graph into `eflow-context/v0.1`.

The export is not a raw dump. It packages the graph for downstream AI reasoning:

- project identity
- typed graph nodes and edges
- review policy
- lifecycle policy
- dependency index
- progress summary
- review summary
- blocking questions
- next development targets
- Mermaid-compatible graph text
- command interface descriptor

The command interface descriptor is especially important. It tells AI systems which operations are supported, which schema-valid operations are not currently applicable, how status mapping works, and what safety rules graph apply enforces.

### Command Intake

`eflow-command/v0.1` is the formal AI-writable command format.

The local command workflow is:

```text
Validate -> Dry Run -> Apply
```

Validation lives in `src/lib/eflowCommandValidation.ts`.

Apply/dry-run logic lives in `src/lib/applyEflowCommand.ts`.

Supported current graph operations:

- `updateNode`
- `transitionNode`
- `upsertNode`
- `updateEdge`
- `transitionEdge`
- `upsertEdge`

Schema-valid but currently unsupported for graph mutation:

- `addDecision`
- `addQuestion`

Safety properties:

- validation happens before graph checks
- dry-run does not mutate graph
- failed operations do not partially apply
- missing node references are rejected
- self-edges are rejected
- duplicate exact edges are rejected
- unsupported node/relationship types are rejected
- unsupported review-status mappings are rejected
- command provenance is appended to affected graph items

Headless apply helpers return changed graph data but do not append audit events by themselves. The UI path records compact audit events.

### Manual Graph Editing

Manual graph editing lives in `src/lib/manualGraphEditing.ts`.

Manual nodes and edges use `provenance.sourceType = "manual_edit"` and default to:

- review status: `confirmed`
- lifecycle status: `planned`

This is a workflow default, not objective proof. Manual provenance means "a human added this item"; it does not automatically mean the claim is true.

Manual edge insertion enforces graph consistency:

- no missing source/target nodes
- no self-edges
- no duplicate exact source/target/type relationships

### Audit Log

Audit logic lives in `src/lib/auditLog.ts`.

The audit log is compact local history, not undo/replay, collaboration history, or a signed tamper-proof record.

It records events such as:

- graph generated/replaced
- workspace imported
- full AI context imported
- manual node/edge created
- AI command applied
- node/edge review changes
- node/edge lifecycle changes

Audit events are stored inside workspace documents when present.

### App State And UI Shell

`src/App.tsx` owns the main workspace state:

- `engineeringFlowInput`
- `engineeringFlowGraph`
- selected node/edge
- audit log
- input dirty/regeneration warning state
- autosave status

The visible workspace has three main columns:

- left: structured input
- center: graph canvas
- right: inspector/review/lifecycle/manual edit/AI interop/workspace tools

The AI Chat console sits above the workspace. It can use current project context, but its responses do not mutate the graph.

### Persistence

Workspace persistence is local browser persistence plus explicit JSON import/export.

`src/lib/workspacePersistence.ts` stores current workspace snapshots in:

```text
localStorage key: eflow.workspace.v0.3.current
```

The workspace document includes:

- structured input
- graph or null
- selected node/edge
- optional audit log

Workspace import validates shape before accepting data.

Language preference also uses local browser storage and is UI-only.

OpenAI API keys are different. They must not be stored in `localStorage`. The chat console keeps them in React state, with optional `sessionStorage` persistence only. The legacy `localStorage` key is cleaned up by the component.

## AI Boundaries

AI is allowed to assist, but not to silently become truth.

### AI Chat

AI Chat is optional and draft-only.

Frontend file:

- `src/components/aiChat/AIChatConsole.tsx`

Backend route:

- `api/chat-with-files.ts`

Request path:

```text
AIChatConsole -> FormData -> /api/chat-with-files -> OpenAI Files API -> OpenAI Responses API
```

Supported attachment types:

- `.json`
- `.txt`
- `.md`
- `.pdf`
- `.png`

Both frontend and backend enforce the allowed extensions and a 20MB per-file limit.

Text and files are sent as `multipart/form-data` to `/api/chat-with-files`. The frontend must not call OpenAI directly.

The backend:

- reads `apiKey` from form data first
- falls back to `process.env.OPENAI_API_KEY`
- rejects with `400 Missing API key` when neither exists
- uploads JSON/TXT/MD/PDF as OpenAI files with `purpose="user_data"`
- uploads PNG as OpenAI files with `purpose="vision"`
- calls OpenAI Responses API with `input_text`, `input_file`, and `input_image`
- redacts sensitive provider error content before returning errors

API keys must not be logged, returned, committed, exported, or included in error messages.

### AI Context Attachment

Chat context mode can attach:

- no context
- compact summary
- full `eflow-context/v0.1`

Any attached context is read-only context for reasoning. It must not imply that chat output changed the graph.

### AI Commands

AI-generated commands are drafts until they pass:

```text
Validate -> Dry Run -> Apply
```

The command path is intentionally local and manual. There is no autonomous agent execution.

## Architecture Boundaries

Current implementation boundaries:

- No database.
- No auth.
- No cloud workspace sync.
- No MCP server.
- No CLI.
- No repo analyzer.
- No autonomous agent execution.
- No automatic graph mutation from chat.
- No signed or tamper-proof audit log.

The only backend-like code currently present is the Vercel-style `api/chat-with-files.ts` route for optional AI chat. Do not infer a broader backend platform from this route.

This repository is a Vite/React app, not a Next.js app.

## Important Flows

### Owner Workflow

```text
Intake -> Generate -> Review Gate -> Milestone -> Handoff -> Sync Back
```

The owner fills structured input, generates the graph, reviews claims, marks lifecycle state, exports AI context, and later syncs verified implementation progress back into EFlow.

### Regenerate Graph

If structured input changes after graph generation, the UI marks the graph as dirty relative to input. Regeneration can replace the graph and may remove manual graph edits. The app asks for confirmation before replacement.

### AI Handoff

The preferred handoff artifact is `eflow-context/v0.1`, not a screenshot and not Workspace JSON.

A good handoff tells the downstream agent:

- the repo path
- the small milestone
- what to do
- what not to do
- what validation commands to run
- that it must not commit or push unless asked

### Sync Back

Codex or another agent may report progress. That report is not automatically accepted. It should be reviewed and translated into lifecycle or review updates through manual UI changes or validated `eflow-command/v0.1`.

## Constraints For Future Work

Future changes should preserve:

- `EngineeringFlowGraph` as canonical truth
- canvas as rendering only
- review status and lifecycle status separation
- provenance on AI-originated changes
- local-first workspace behavior
- Traditional Chinese UI copy for user-facing text
- AI chat as draft-only
- OpenAI calls behind `/api/chat-with-files`
- API key input and model field
- no `localStorage` API-key persistence
- manual Validate -> Dry Run -> Apply workflow for AI commands

Avoid broad chat rewrites, broad schema rewrites, or adding cloud/backend assumptions without explicit user scope.

## Current Implementation Status

Implemented:

- Structured input editor.
- Deterministic graph generation.
- Graph canvas rendering.
- Inspector for selected node/edge/project.
- Review queue and progress summary.
- Lifecycle status tracking for nodes and edges.
- Manual graph node and edge creation.
- Compact local audit log.
- Workspace JSON backup/restore.
- Full AI context import for workspace restore.
- `eflow-context/v0.1` AI-native export.
- `eflow-command/v0.1` validation, dry-run, and apply path.
- Optional AI Chat console with prompt modes and context modes.
- Previous response ID continuation support.
- Chat file attachments through `/api/chat-with-files`.
- OpenAI Files API and Responses API integration in the serverless route.
- Tutorial route and tutorial mode.
- UI language foundation for `zh-TW` and `en`.

Not implemented:

- Database persistence.
- Multi-user collaboration.
- Cloud sync.
- Auth.
- Repo analysis.
- Autonomous AI execution.
- MCP server.
- CLI.
- Undo/replay engine.
- Signed audit trail.
- Standalone decision/question record stores for `addDecision` and `addQuestion`.

## Known Architectural Debt

### Legacy `status` Field

The internal graph still uses legacy `node.status` and `edge.status` for review state. The formal AI-facing schema uses `reviewStatus`. The mapping is explicit, but this remains a conceptual mismatch and a migration candidate.

### Command Schema Is Wider Than Current Graph

`eflow-command/v0.1` supports more node types, relationship types, and operations than the current `EngineeringFlowGraph` can represent. Apply rejects unsupported graph-compatible operations. This is intentional future compatibility, but it requires careful documentation and validation.

### No Standalone Decision Or Question Stores

`addDecision` and `addQuestion` validate at the command schema level but cannot currently mutate the graph because the current graph model has no standalone decision/question record stores.

### Audit Is Compact History Only

Audit events help the owner understand recent local changes. They are not undo data, conflict resolution, replay logs, collaborative history, or signed compliance records.

### Local Storage Is Convenience Persistence

Workspace autosave is best-effort local browser persistence. It is not durable cloud storage and not cross-device sync.

### AI Route Depends On Serverless Runtime

The frontend is Vite. The AI chat backend is a Vercel-style `api/` route. A plain Vite dev server does not execute that route. End-to-end local AI chat route testing needs a suitable serverless runtime such as Vercel dev or a local wrapper.

### Some Documentation May Lag Implementation

Older docs may still describe AI Chat as a direct-browser provider call. Current implementation routes OpenAI calls through `/api/chat-with-files`. Treat source code and this overview as the current boundary.

### Test Coverage Is Script-Based

`npm run validate:example` exercises the built-in example, graph generation, AI context export, command validation/apply behavior, manual graph editing helpers, workspace validation, lifecycle summaries, review summaries, and audit log validation. It is valuable but not a full browser or serverless integration test suite.

## Maintainer Checklist

Before architecture-sensitive changes:

```bash
npm run validate:example
npm run build
git diff --check
git status -sb
git diff --stat
git diff --name-only
```

Before changing AI Chat:

- Preserve the API key input.
- Preserve the model field.
- Do not store API keys in `localStorage`.
- Do not call OpenAI from frontend code.
- Keep `/api/chat-with-files` as the OpenAI boundary unless the user explicitly changes architecture.
- Keep text-only chat working.
- Keep attachment validation on both frontend and backend.

Before changing graph semantics:

- Preserve review/lifecycle separation.
- Preserve provenance.
- Preserve dry-run behavior.
- Preserve rejection of unsupported graph types and unsafe edges.
- Update AI context export and command interface descriptors when compatibility changes.

