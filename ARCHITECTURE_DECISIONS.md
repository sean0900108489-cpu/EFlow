# ARCHITECTURE DECISIONS

This document records intentional architecture decisions in EFlow. It is not a
generic frontend architecture note. EFlow is a local-first, schema-first,
graph-oriented engineering cognition system whose core job is to turn structured
project intent into a trustworthy, reviewable, AI-readable engineering graph.

These decisions are inferred from the current code, schemas, graph generation,
review/lifecycle behavior, persistence, import/export paths, provenance, command
validation, and audit semantics.

# ADR 001: Local-First Workspace Is The Runtime Boundary

## Status

active

## Context

EFlow needs to help a local owner structure project intent, generate a graph,
review it, export AI-readable context, and sync progress back without requiring
accounts, cloud sync, a database, or a remote collaboration service.

The current app has a Vite/React frontend and an optional Vercel-style
`api/chat-with-files.ts` route for AI chat. There is no database, auth, cloud
workspace sync, MCP server, CLI, repo analyzer, or autonomous execution service.

## Decision

The primary runtime boundary is the browser-local workspace. `src/App.tsx` owns
live workspace state, and `src/lib/workspacePersistence.ts` persists snapshots
to browser `localStorage` under `eflow.workspace.v0.3.current`.

Explicit Workspace JSON import/export is the durable user-controlled backup and
restore path.

## Consequences

This enables fast local use, simple deployment, and clear ownership of project
state. The app can operate without a backend except for optional AI chat.

It also means local persistence is best-effort. Data does not automatically sync
across browsers, devices, users, or deployments.

## Tradeoffs

The repository intentionally does not choose a database-backed workspace,
multi-user collaboration, auth, cloud sync, or server-owned project truth.
Future work may add those systems, but doing so must update the state ownership
model and define conflict, identity, persistence, and trust rules first.

# ADR 002: EngineeringFlowGraph Is Canonical Architecture Truth

## Status

active

## Context

The product needs a stable, AI-readable representation of architecture claims.
If truth lived in UI widgets, canvas nodes, chat messages, or exported files,
AI handoff and human review would drift quickly.

## Decision

`EngineeringFlowGraph` is the canonical in-app architecture truth after graph
generation or import. It owns graph nodes, edges, review state, lifecycle state,
relationships, positions, confidence, provenance, command provenance,
implementation metadata, and timestamps.

`EngineeringFlowInput` remains canonical intake state, but generated
architecture claims live in the graph.

## Consequences

This makes architecture review, export, command import, lifecycle summaries,
and AI handoff all converge on one data model.

It introduces a deliberate split between input and graph. Input can become dirty
relative to an existing graph; regeneration is a replacement operation and may
discard manual graph edits.

## Tradeoffs

The app does not treat `EngineeringFlowInput`, React Flow canvas state,
Workspace JSON, Full AI Context, or `eflow-context/v0.1` as independent
architecture truth while the app is running.

# ADR 003: Canvas Is A Derived Rendering Layer

## Status

active

## Context

The UI needs a graph canvas, but EFlow is not a generic flowchart tool. Visual
layout must not become the authority for architecture semantics.

## Decision

The canvas derives React Flow nodes and edges from `EngineeringFlowGraph` using
`src/lib/graphAdapters.ts`. `EngineeringFlowCanvas` owns only UI filters and
local rendering behavior.

Dragging a node writes back only the canonical `node.position` field through
`App.tsx`. Selection is stored as ids, not selected node/edge objects.

## Consequences

The graph can be exported, reviewed, imported, and command-mutated without
depending on visual canvas internals. Canvas filtering can hide items without
deleting them.

## Tradeoffs

The repository intentionally avoids React Flow as a domain store. It should not
introduce `useNodesState`, `useEdgesState`, canvas-local graph copies, or visual
edges as a second graph owner.

# ADR 004: Schema-First Design Over Freeform Notes

## Status

active

## Context

EFlow exists to create structured project context that humans and AI agents can
review and exchange. Freeform notes are useful for thinking, but they are weak
as an AI-to-AI sync protocol.

## Decision

Core concepts are explicit TypeScript schemas:

- `EngineeringFlowInput`
- `EngineeringFlowGraph`
- `EngineeringNode`
- `EngineeringEdge`
- `EFlowWorkspaceDocument`
- `EFlowContextExport`
- `EFlowCommandEnvelope`
- `EFlowAuditEvent`

The formal command/context schemas use explicit fields such as `reviewStatus`,
`lifecycleStatus`, `provenance`, `evidence`, `actor`, and typed operations.

## Consequences

The app can validate imports, generate deterministic exports, reject unsafe
commands, and communicate project state to downstream AI systems with less
ambiguity.

Schema changes now carry architectural weight. A new field is not just a UI
addition; it may need validation, persistence, import/export behavior, command
compatibility, provenance behavior, and documentation.

## Tradeoffs

The project intentionally does not model architecture as loosely structured
Markdown, screenshots, visual diagrams, or chat transcripts.

# ADR 005: Graph Generation Is Deterministic And Reviewable

## Status

active

## Context

Structured input needs to become an engineering graph. If generation were
opaque or AI-driven, users could not distinguish source facts from inferred
claims.

## Decision

`src/lib/generateEngineeringFlow.ts` deterministically transforms
`EngineeringFlowInput` into `EngineeringFlowGraph`.

Input sections map to node types:

- project intent -> `intent`
- user types -> `user`
- screens -> `screen`
- core functions -> `feature`
- flow steps -> `flow_step`
- data objects -> `data_object`
- AI roles -> `ai_task`
- unknowns -> `question`

Declared relationships generate typed edges. Generated nodes and edges start as
review suggestions, not confirmed truth.

## Consequences

The owner can regenerate, inspect, review, and explain where graph claims came
from. Provenance and generation rules preserve traceability.

Generation can replace the graph, so the app tracks dirty input and asks before
regenerating over an existing graph.

## Tradeoffs

The repository intentionally does not use hidden LLM inference to create
trusted graph data. It also does not attempt incremental graph reconciliation
between changed input and existing manual graph edits in the current milestone.

# ADR 006: Human Review Is The Trust Boundary

## Status

active

## Context

EFlow handles architecture claims that downstream coding agents may rely on.
Generated graph data, imported context, and AI output can be plausible without
being true.

## Decision

The human owner remains the authority for trusted project truth. Generated,
imported, and AI-suggested data is tentative until reviewed through explicit
graph state.

Review state lives on graph nodes and edges. The review queue is derived from
graph state and prioritizes blocking questions, needs-review nodes, important
product nodes, dependency/confirmation-sensitive edges, and low-confidence
relationships.

## Consequences

Downstream AI handoff can communicate which claims are confirmed, suggested,
need review, or rejected. Owner review becomes a first-class part of the
architecture workflow.

## Tradeoffs

The app intentionally avoids treating generated graph data, AI chat responses,
Codex reports, or imported commands as automatically true.

# ADR 007: Review State And Lifecycle State Are Separate

## Status

active

## Context

Architecture trust and implementation progress are different questions:

- "Is this claim trusted?"
- "Where is this item in implementation?"

Earlier graph fields use generic `status`, which can be misread as
implementation status.

## Decision

Review and lifecycle are modeled separately.

Current graph compatibility:

- `node.status` means legacy node review state:
  `suggested | confirmed | needs_review`
- `edge.status` means legacy edge review state:
  `suggested | confirmed | rejected`
- formal AI-facing schemas use `reviewStatus`
- implementation progress uses `lifecycleStatus`

Missing lifecycle status is displayed and exported as `planned` without
automatically writing it back to graph data.

## Consequences

The app can represent a confirmed feature that is not implemented, or a
completed implementation item whose architecture claim still needs review.

Command import must reject review-status mappings that the legacy graph cannot
represent: node `rejected` and edge `needs_review`.

## Tradeoffs

The repository intentionally does not use one generic status field for both
trust and implementation progress. It also does not silently migrate legacy
`status` to formal `reviewStatus` in only one layer.

# ADR 008: Directed Typed Edges Carry Architecture Semantics

## Status

active

## Context

EFlow needs more than visual lines between boxes. Relationships must be readable
by humans, exportable to AI, and meaningful for dependency reasoning.

## Decision

Graph edges are directed and typed. Current graph relationship types include:

- `serves`
- `uses`
- `leads_to`
- `contains`
- `depends_on`
- `produces`
- `needs_confirmation`
- `relates_to`

Edge direction matters. In dependency export, `A depends_on B` means A depends
on B and B blocks A.

## Consequences

The graph can support dependency indexes, blocking analysis, review
prioritization, AI context export, and Mermaid generation.

Edge mutation must preserve graph integrity: source and target nodes must exist,
self-edges are rejected, and exact duplicate source/target/relationship edges
are rejected.

## Tradeoffs

The app intentionally avoids generic untyped canvas connectors, bidirectional
relationship ambiguity, and freeform relationship strings as canonical edge
semantics.

# ADR 009: Provenance Is Part Of Graph Truth

## Status

active

## Context

Graph claims can come from user input, example seeds, deterministic generation,
manual edits, AI commands, progress sync, or context import. Future maintainers
and AI agents need to know why data exists before trusting or changing it.

## Decision

Nodes and edges carry provenance. Source types include:

- `user_input`
- `example_seed`
- `system_generated`
- `ai_suggested`
- `manual_edit`
- `ai_command`
- `ai_progress_sync`
- `context_import`

AI command changes append command provenance where possible, including command
id, actor, reason, timestamps, and evidence.

## Consequences

The app can distinguish generated claims from human-added context and
AI-originated sync. Exports can give downstream AI systems trust cues instead
of a flat graph dump.

## Tradeoffs

The repository intentionally avoids anonymous graph mutation. It also avoids
treating `manual_edit` as proof; manual provenance means a human added the item,
not that the claim is objectively confirmed.

# ADR 010: Audit Log Is Compact Local History, Not Replay

## Status

active

## Context

Owners need visibility into recent graph and workspace changes, but the app does
not currently implement undo, collaborative editing, event sourcing, or signed
compliance history.

## Decision

`EFlowAuditEvent` records compact local history for important UI mutation paths:
graph generation/replacement, imports, manual graph edits, AI command apply, and
review/lifecycle changes.

The audit log is stored in workspace documents when present and trimmed to a
bounded size by `src/lib/auditLog.ts`.

## Consequences

The owner can inspect recent local changes and imported history can be retained
when available.

Audit behavior remains simple and local. Headless command apply helpers return
changed graph data but do not append audit events by themselves; the UI path
records the audit event.

## Tradeoffs

The repository intentionally does not treat audit as undo data, replay data,
conflict resolution, multi-user history, or a tamper-proof record.

# ADR 011: AI-Native Export Is Deterministic Derived Context

## Status

active

## Context

EFlow's primary downstream value is giving coding agents structured project
context. A screenshot or raw workspace backup is insufficient for AI handoff.

## Decision

`src/lib/buildEflowContextExport.ts` builds deterministic
`eflow-context/v0.1` exports from current input and graph.

The export includes project identity, graph nodes and edges, confirmation and
lifecycle policies, dependency index, progress summary, review summary,
blocking questions, next development targets, Mermaid text, and command
interface metadata.

## Consequences

Downstream AI agents receive a compact, policy-aware, graph-oriented context
instead of reverse-engineering UI state.

Because the export is derived, it can be regenerated at any time from canonical
graph/input state.

## Tradeoffs

The app intentionally does not make Workspace JSON the primary AI handoff
format. It also does not persist export summaries back into the graph.

# ADR 012: Command Intake Uses Validate -> Dry Run -> Apply

## Status

evolving

## Context

EFlow is becoming an AI-to-AI communication and architecture sync hub. External
AI systems need a way to propose updates, but direct mutation would be unsafe.

## Decision

`eflow-command/v0.1` is the formal local command envelope. Local Command Import
uses:

```text
Validate -> Dry Run -> Apply
```

Validation checks schema shape. Dry-run checks graph compatibility and safety
without mutation. Apply returns a changed graph only after all checks pass.

Supported current graph operations are:

- `updateNode`
- `transitionNode`
- `upsertNode`
- `updateEdge`
- `transitionEdge`
- `upsertEdge`

## Consequences

AI-generated updates remain reviewable, inspectable, and locally controlled.
Dry-run can surface errors before graph mutation.

The command path is future-compatible with CLI, MCP, REST, or agent tool
interfaces without requiring those systems now.

## Tradeoffs

The repository intentionally does not expose a remote write API, autonomous
agent tool, or chat-to-graph auto-apply path.

# ADR 013: Command Schema May Be Wider Than Current Graph Support

## Status

evolving

## Context

The formal command schema anticipates future graph concepts such as broader
node types, relationship types, decisions, and standalone questions. The current
`EngineeringFlowGraph` model supports a smaller set.

## Decision

Schema-valid operations and types that current graph apply cannot represent are
validated at the schema level but rejected during graph application.

Current examples:

- `addDecision` validates as a command concept but graph mutation is not
  implemented.
- `addQuestion` validates as a command concept but there is no standalone
  question record store.
- unsupported node and relationship types are rejected during graph apply.

## Consequences

The schema can evolve without pretending current graph support exists.
Downstream AI receives explicit compatibility metadata in `eflow-context/v0.1`.

## Tradeoffs

The app intentionally does not smuggle unsupported concepts into generic
metadata or fake graph nodes. New command support requires canonical stores,
validation, persistence, import/export behavior, and ownership rules.

# ADR 014: Persistence Is Snapshot Ownership, Not Domain Mutation

## Status

active

## Context

The app needs autosave and explicit backup/restore, but persistence should not
become a hidden migration or normalization layer.

## Decision

Workspace persistence stores snapshots built by `buildWorkspaceDocument`.
Autosave writes input, graph, selection ids, and audit log to localStorage.
Import validates before replacing live state.

Persistence code catches storage failures because local persistence is a
convenience, not a required service.

## Consequences

Startup restore, autosave, JSON export, and JSON import share the same workspace
shape. The app can recover local work without server infrastructure.

## Tradeoffs

Autosave intentionally does not generate graphs, normalize missing lifecycle
fields, migrate live graph data, repair domain inconsistencies, persist chat
state, or store API keys.

# ADR 015: Import And Export Formats Have Separate Purposes

## Status

active

## Context

EFlow has multiple JSON artifacts with different consumers. Mixing their
purposes would create accidental authority and unsafe AI handoff.

## Decision

The repository separates formats by purpose:

- `EngineeringFlowInput` import replaces intake and clears graph state.
- Workspace JSON is EFlow backup/restore state.
- Full AI Context is legacy derived context and can restore input/graph but not
  audit history.
- `eflow-context/v0.1` is the preferred AI-readable handoff export.
- `eflow-command/v0.1` is the AI-writable local command format.

## Consequences

Each import/export path can validate and apply state according to its role.
Future agents can avoid treating every JSON blob as equivalent authority.

## Tradeoffs

The app intentionally does not use a single universal JSON file for all
workspace, handoff, command, and restore needs.

# ADR 016: AI Chat Is Draft-Only And Does Not Own Graph State

## Status

active

## Context

The optional AI Collaboration Console can help reason about the current project
and produce prompts or command drafts. Chat output is useful but not a safe
source of truth.

## Decision

AI chat state is temporary UI state in `AIChatConsole`. It can attach no
context, a compact summary, or full `eflow-context/v0.1` as read-only context.
Requests go through `/api/chat-with-files`; the frontend does not call OpenAI
directly.

Chat responses do not mutate the graph. If chat produces a command, that command
must still be pasted/imported into Local Command Import and pass Validate -> Dry
Run -> Apply.

## Consequences

The app can offer AI collaboration without weakening human review or graph
ownership. API key handling is isolated from workspace persistence.

## Tradeoffs

The repository intentionally does not make AI chat an autonomous editor,
background agent, command runner, or hidden state synchronization mechanism.

# ADR 017: API Keys And Provider State Are Not Workspace State

## Status

active

## Context

AI chat needs an API key and provider response ids, but those values are not
project architecture state and can be sensitive.

## Decision

AI chat API keys are kept in React state and optionally browser
`sessionStorage`. The legacy localStorage key is cleaned up. API keys are never
stored in Workspace JSON, graph data, AI context exports, audit log entries, or
error messages.

Provider response ids are local chat continuation state, not graph revisions.

## Consequences

Workspace export remains safe to share as project state, and provider state does
not pollute domain state.

## Tradeoffs

The app intentionally does not persist chat sessions, provider conversations, or
API credentials as part of project backup/restore.

# ADR 018: Hidden State Ownership Is An Architecture Risk

## Status

active

## Context

The app derives many useful views from graph state: review queues, lifecycle
counts, trust summaries, manual edit summaries, dependency indexes, Mermaid
text, React Flow nodes, and AI context summaries. Persisting these projections
would create synchronization bugs.

## Decision

Derived views are recomputed from canonical input/graph state. UI components own
only local controls, draft forms, filters, messages, and display state unless
they receive explicit mutation callbacks from `App.tsx`.

Selection is stored as ids. Selected objects are derived by lookup.

## Consequences

The system has fewer hidden stores and fewer stale projections. Exports and
panels can be reasoned about from graph/input state.

## Tradeoffs

The repository intentionally avoids child-owned graph copies, persisted derived
summaries, hidden reducers, standalone frontend stores, and UI effects that sync
derived state back into canonical state.

# ADR 019: Manual Graph Editing Produces First-Class Graph Data

## Status

active

## Context

Deterministic generation cannot capture all missing architecture context.
Owners need to add missing nodes and edges without breaking graph semantics.

## Decision

Manual node and edge creation uses `src/lib/manualGraphEditing.ts` and inserts
real graph nodes/edges with `provenance.sourceType = "manual_edit"`.

Manual edge insertion enforces graph consistency: existing source/target nodes,
no self-edges, no duplicate exact relationships.

## Consequences

Manual context participates in canvas rendering, review queues, lifecycle
summaries, workspace persistence, AI context export, and command handoff just
like generated graph data.

## Tradeoffs

Manual edits are not stored as side notes, annotations, or UI-only overlays.
Manual provenance also does not automatically prove truth; review state still
matters.

# ADR 020: Backend Assumptions Are Explicitly Avoided

## Status

active

## Context

The presence of an `api/` route for AI chat can tempt future maintainers or AI
agents to infer a broader backend architecture that does not exist.

## Decision

The repository remains a Vite/React local-first app with one optional
serverless chat route. The route parses multipart requests, uploads files to
OpenAI, calls Responses API, redacts sensitive errors, and returns response
text. It does not own workspace state.

## Consequences

Frontend deployment and local workspace behavior remain simple. AI chat can be
added or removed without changing graph ownership.

## Tradeoffs

The repository intentionally does not infer or introduce a backend platform,
REST workspace API, database, auth layer, job system, cloud sync, repo analyzer,
or agent execution environment from the existence of `api/chat-with-files.ts`.

# ADR 021: Autonomous AI Mutation Is Forbidden By Default

## Status

active

## Context

EFlow's purpose is to make AI-readable architecture safer, not to let AI
silently rewrite project truth. The highest-risk drift would be chat or a
downstream agent mutating graph state without owner review.

## Decision

AI-generated state remains draft-only until it passes an explicit local intake
path. The only AI-writable graph path is the validated command pipeline, and it
still requires local application.

AI reports are evidence. Lifecycle updates based on AI reports must be reviewed
and applied through manual UI changes or validated commands.

## Consequences

The trust boundary is operationally clear. The graph can be handed to AI
systems without granting them silent write authority.

## Tradeoffs

The repository intentionally does not choose convenience features such as
auto-apply chat suggestions, background AI sync, autonomous repo analysis,
automatic lifecycle completion, or agent-driven graph mutation.

# ADR 022: Architecture Evolution Must Preserve Explicit Compatibility

## Status

evolving

## Context

EFlow is already carrying legacy graph `status` fields while moving toward
formal AI-facing `reviewStatus` and `lifecycleStatus`. It also has future-ready
command schema concepts not fully implemented in the graph.

## Decision

Architecture evolution must be explicit about compatibility:

- legacy graph `status` remains review state until a full migration exists
- formal context export maps legacy status to `reviewStatus`
- command apply rejects unsupported mappings and unsupported graph types
- command interface metadata advertises current compatibility
- documentation must be updated when ownership or compatibility changes

## Consequences

Future work can evolve schemas without tricking maintainers or AI agents into
believing support exists where it does not.

## Tradeoffs

The repository intentionally avoids partial migrations, silent compatibility
shims, and "accept anything into metadata" shortcuts that would make graph state
harder to trust.

# Short Maintainer Guidance

Before changing architecture-sensitive code, identify:

1. What state is canonical.
2. What state is derived.
3. Who owns mutation.
4. What validates persisted or imported data.
5. What export/handoff behavior changes.
6. Whether AI can only suggest or can actually mutate.
7. Whether provenance and audit semantics still hold.

If a change creates a new source of truth, a new persistence layer, a new AI
write path, or a new graph concept, update this document before treating the
change as architecturally complete.
