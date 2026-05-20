# ENTRYPOINTS

This document helps future AI agents navigate EFlow quickly without treating it
as a generic frontend app. Start here when you need to understand where state,
schemas, graph truth, persistence, exports, AI boundaries, review logic, and
validation live.

Dependency terms:

- Upstream means callers, owners, or user flows that enter this module.
- Downstream means modules, schemas, APIs, or helpers this module depends on.

## Quick Start For Agents

Read in this order for architecture-sensitive work:

1. `src/types/engineeringFlow.ts`
2. `src/App.tsx`
3. `src/lib/generateEngineeringFlow.ts`
4. `src/lib/buildEflowContextExport.ts`
5. `src/lib/applyEflowCommand.ts`
6. `src/lib/workspacePersistence.ts`
7. `scripts/validateExample.ts`

Then inspect the relevant UI or API entrypoint for the change you are making.

## App Bootstrap Entrypoints

### `index.html`

Purpose:

Browser HTML shell. Provides the `#root` element and loads `/src/main.tsx`.

Why it matters:

This confirms the app is a Vite browser app. It does not imply a server-rendered
framework or backend workspace owner.

Upstream dependencies:

- Browser loading the Vite app.

Downstream dependencies:

- `/src/main.tsx`.

### `src/main.tsx`

Purpose:

React bootstrap. Mounts `App` inside `StrictMode` and `LanguageProvider`, and
loads global/layout/component/tutorial styles.

Why it matters:

This is the real frontend runtime entrypoint. Locale context is established
above the app, but workspace state is not owned here.

Upstream dependencies:

- `index.html`.

Downstream dependencies:

- `src/App.tsx`
- `src/lib/i18n/language-context.tsx`
- CSS files under `src/styles/*`.

### `src/App.tsx`

Purpose:

Main workspace coordinator. Owns live workspace state: structured input, graph,
audit log, selection ids, dirty-regeneration guard, route/tutorial mode, and
autosave status.

Why it matters:

This is the central state container. Graph mutation callbacks, import
application, graph generation, autosave, selection, and audit event recording
all converge here.

Upstream dependencies:

- `src/main.tsx`
- browser route state.

Downstream dependencies:

- UI workbench components.
- `src/lib/generateEngineeringFlow.ts`
- `src/lib/workspacePersistence.ts`
- `src/lib/auditLog.ts`
- `src/lib/dates.ts`
- seed data in `src/data/*`.

## Major State Containers

### `src/App.tsx`

Purpose:

Canonical in-memory workspace owner.

Why it matters:

If a future agent needs to know who owns graph/input/audit/selection state, the
answer starts here. Child components receive graph/input as props and mutate
through callbacks rather than owning separate stores.

Upstream dependencies:

- frontend bootstrap.
- user actions from top bar, canvas, inspector, import/export panels, review
  tools, manual edit tools, and command import.

Downstream dependencies:

- graph generation.
- workspace persistence.
- audit helpers.
- all major UI panels.

### `src/components/aiChat/AIChatConsole.tsx`

Purpose:

Temporary AI chat state container: API key entry, model, prompt mode, context
mode, draft message, attachments, chat messages, response ids, and send status.

Why it matters:

This module is intentionally draft-only. It can read graph/input and attach
derived context, but it must not mutate the graph.

Upstream dependencies:

- `src/App.tsx`, which passes current input and graph.

Downstream dependencies:

- `src/lib/buildAIChatPrompt.ts`
- `src/lib/buildEflowContextExport.ts`
- `/api/chat-with-files`
- browser `sessionStorage`, clipboard, file APIs, and `fetch`.

### `src/lib/i18n/language-context.tsx`

Purpose:

Locale state owner and translation context provider.

Why it matters:

Locale is UI preference state, not workspace or graph state. It uses
`eflow.ui.locale` localStorage and updates `document.documentElement.lang`.

Upstream dependencies:

- `src/main.tsx`
- UI components using `useLanguage`.

Downstream dependencies:

- `src/lib/i18n/translate.ts`
- `src/lib/i18n/types.ts`
- browser localStorage and document APIs.

## Canonical Schema Definitions

### `src/types/engineeringFlow.ts`

Purpose:

Current app schema for structured input, canonical graph, graph nodes/edges,
Full AI Context, and workspace documents.

Why it matters:

This file defines the internal graph truth model. `EngineeringFlowGraph` owns
node/edge identity, review status, lifecycle status, positions, relationships,
confidence, provenance, command provenance, implementation metadata, and graph
timestamps.

Upstream dependencies:

- nearly all graph, persistence, UI, export, and validation modules.

Downstream dependencies:

- type-only references to `src/types/eflowCommand.ts`
- type-only references to `src/types/eflowAudit.ts`.

### `src/types/eflowCommand.ts`

Purpose:

Formal AI-writable command schema and AI-facing graph concepts.

Why it matters:

This is the schema downstream agents should use when proposing changes. It
separates `reviewStatus` from `lifecycleStatus` and defines actor, evidence,
provenance, operation, decision, and question concepts.

Upstream dependencies:

- command validation.
- command apply.
- AI context export.
- validation script.
- graph types for lifecycle/provenance fields.

Downstream dependencies:

- none beyond TypeScript.

### `src/types/eflowContext.ts`

Purpose:

Preferred AI-readable export schema: `eflow-context/v0.1`.

Why it matters:

This is the main handoff format for downstream coding agents. It includes graph
data plus derived review/progress summaries, dependency index, blocking
questions, next targets, Mermaid text, and command interface metadata.

Upstream dependencies:

- `src/lib/buildEflowContextExport.ts`
- export UI.
- AI chat full-context attachment.
- validation script.

Downstream dependencies:

- type-only references to command schema concepts.

### `src/types/eflowAudit.ts`

Purpose:

Compact local audit event schema.

Why it matters:

Audit records local change history but is not undo, replay, or compliance
history. It travels inside Workspace JSON when present.

Upstream dependencies:

- audit helpers.
- App mutation paths.
- manual edit panels.
- command import panel.
- workspace validation.

Downstream dependencies:

- none beyond TypeScript.

## Persistence Layer

### `src/lib/workspacePersistence.ts`

Purpose:

Constructs workspace snapshots and owns browser localStorage load/save/clear
for `eflow.workspace.v0.3.current`.

Why it matters:

This is persistence ownership. It stores snapshots only; it must not generate,
repair, normalize, or migrate graph truth.

Upstream dependencies:

- `src/App.tsx`
- `src/components/export/JsonExportPanel.tsx`
- `src/components/export/WorkspacePersistencePanel.tsx`
- validation script.

Downstream dependencies:

- `src/types/engineeringFlow.ts`
- `src/types/eflowAudit.ts`
- `src/lib/dates.ts`
- `src/lib/workspaceValidation.ts`
- browser localStorage.

### `src/lib/workspaceValidation.ts`

Purpose:

Validates imported workspace, graph, input, and legacy Full AI Context shapes.

Why it matters:

This is the import safety gate for persisted or pasted JSON. It validates graph
node/edge references, allowed statuses, lifecycle values, workspace metadata,
and audit logs.

Upstream dependencies:

- workspace persistence.
- workspace import UI.
- input import UI.
- validation script.

Downstream dependencies:

- schema types.
- lifecycle constants from `src/types/eflowCommand.ts`.
- `src/lib/auditLog.ts`.

### `src/lib/auditLog.ts`

Purpose:

Creates, appends, trims, summarizes, and validates compact local audit events.

Why it matters:

This module defines audit mechanics. It intentionally does not write storage
or replay events.

Upstream dependencies:

- `src/App.tsx`
- manual edit panels.
- command import panel.
- audit log panel.
- workspace validation.
- validation script.

Downstream dependencies:

- `src/types/eflowAudit.ts`
- `src/lib/dates.ts`.

## Export Pipeline

### `src/lib/exportContext.ts`

Purpose:

Builds legacy `engineering-flow-full-context/v0` from input and graph.

Why it matters:

Full AI Context still appears in UI copy/export and can be imported to restore
input/graph, but it is not the preferred AI handoff.

Upstream dependencies:

- top bar copy action.
- JSON export panel.
- workspace import flow for Full AI Context.
- validation script.

Downstream dependencies:

- `src/types/engineeringFlow.ts`
- `src/lib/dates.ts`
- `src/lib/trustSummary.ts`.

### `src/lib/buildEflowContextExport.ts`

Purpose:

Builds preferred `eflow-context/v0.1` export from current input and graph.

Why it matters:

This is the AI-native read model. It maps graph status into formal
`reviewStatus`, applies lifecycle defaulting without write-back, builds a
dependency index, progress summary, review summary, blocking questions,
development targets, Mermaid text, and command interface metadata.

Upstream dependencies:

- `EFlowContextExportPanel`.
- `AIChatConsole` full-context attachment.
- validation script.
- downstream AI handoff workflows.

Downstream dependencies:

- graph/input types.
- command/context types.
- `src/lib/trustSummary.ts`.

### `src/components/export/EFlowContextExportPanel.tsx`

Purpose:

UI entrypoint for copying/downloading `eflow-context/v0.1`.

Why it matters:

This is the preferred human-facing export path for AI handoff.

Upstream dependencies:

- `JsonExportPanel`
- inspector workbench.

Downstream dependencies:

- `src/lib/buildEflowContextExport.ts`
- `CopyJsonButton`
- browser Blob/object URL APIs.

### `src/components/export/WorkspacePersistencePanel.tsx`

Purpose:

UI entrypoint for Workspace JSON copy/download/import and input/full-context
import routing.

Why it matters:

This panel separates backup/restore formats from AI handoff formats. It parses
and validates JSON before delegating state application to App.

Upstream dependencies:

- `JsonExportPanel`
- inspector/empty inspector workspace tools.

Downstream dependencies:

- workspace validation helpers.
- workspace filename helper.
- parent import callbacks.
- browser Blob/object URL APIs.

## AI-Related Modules

### `src/components/aiChat/AIChatConsole.tsx`

Purpose:

AI chat UI and local request composer.

Why it matters:

This is the only frontend component that sends AI chat requests. It must send
requests through `/api/chat-with-files`, never directly to OpenAI.

Upstream dependencies:

- `src/App.tsx`.

Downstream dependencies:

- `src/lib/buildAIChatPrompt.ts`
- `src/lib/buildEflowContextExport.ts`
- `/api/chat-with-files`.

### `src/lib/buildAIChatPrompt.ts`

Purpose:

Builds AI chat system/user prompts, prompt modes, context attachment modes, and
compact context summaries.

Why it matters:

This module encodes AI behavior boundaries in prompt text: graph is truth,
attached context is read-only, chat is draft-only, and generated commands must
go through Validate -> Dry Run -> Apply.

Upstream dependencies:

- `AIChatConsole`
- validation script.

Downstream dependencies:

- command/context schema version constants.
- graph/input types.
- `src/lib/trustSummary.ts`.

### `api/chat-with-files.ts`

Purpose:

Serverless AI boundary. Parses multipart chat requests, validates attachments,
uploads files to OpenAI, calls the Responses API, extracts response text/id,
and redacts sensitive errors.

Why it matters:

This is the only current OpenAI network integration. It does not own workspace
state and must not become a hidden backend.

Upstream dependencies:

- frontend requests from `AIChatConsole`.
- serverless runtime such as Vercel.

Downstream dependencies:

- `busboy`.
- Node HTTP request/response types.
- OpenAI Files API.
- OpenAI Responses API.
- optional `OPENAI_API_KEY` environment variable.

### `src/components/command/LocalCommandImportPanel.tsx`

Purpose:

UI entrypoint for pasted `eflow-command/v0.1` command JSON.

Why it matters:

This is the local manual AI-write path. It validates, dry-runs, applies, and
records an audit event only after successful apply mode.

Upstream dependencies:

- `InspectorPanel`.

Downstream dependencies:

- `src/lib/eflowCommandValidation.ts`
- `src/lib/applyEflowCommand.ts`
- `src/lib/auditLog.ts`
- graph replacement and audit callbacks from App.

### `src/lib/eflowCommandValidation.ts`

Purpose:

Schema validation for AI command envelopes.

Why it matters:

This is the first gate for AI-generated graph changes. It checks command shape
but does not check current graph compatibility.

Upstream dependencies:

- `LocalCommandImportPanel`
- `applyEflowCommand.ts`
- validation script.

Downstream dependencies:

- `src/types/eflowCommand.ts`.

### `src/lib/applyEflowCommand.ts`

Purpose:

Dry-run/apply engine for graph-compatible command operations.

Why it matters:

This is the only headless command-to-graph mutation path. It enforces supported
types, missing reference checks, self-edge rejection, duplicate exact edge
rejection, lifecycle transition conflict checks, unsupported review-status
mappings, and command provenance append behavior.

Upstream dependencies:

- `LocalCommandImportPanel`
- validation script.

Downstream dependencies:

- command and graph types.
- command validation.
- `src/lib/dates.ts`.

## Review Lifecycle Logic

### `src/lib/buildReviewQueue.ts`

Purpose:

Builds review queue items, priorities, reasons, and review progress from graph
state.

Why it matters:

This is the trust-review read model. It decides which graph claims need human
attention and how review progress is summarized.

Upstream dependencies:

- `ReviewPanel`.
- validation script.

Downstream dependencies:

- graph types.
- i18n type keys.
- `src/lib/trustSummary.ts`.

### `src/components/review/ReviewPanel.tsx`

Purpose:

UI entrypoint for review workflow actions.

Why it matters:

This panel lets users confirm nodes/edges, mark nodes as needs-review, reject
edges, and select next unreviewed items. It mutates canonical graph review
state only through parent callbacks.

Upstream dependencies:

- `InspectorPanel`.

Downstream dependencies:

- `buildReviewQueue`.
- review card/progress/filter components.
- App callbacks for selection and graph patching.

### `src/lib/buildLifecycleSummary.ts`

Purpose:

Builds lifecycle status buckets and counts for graph nodes and edges.

Why it matters:

This is the implementation-progress read model. Missing lifecycle status is
treated as `planned` for summary purposes without writing back to graph data.

Upstream dependencies:

- lifecycle UI.
- export builder.
- validation script.

Downstream dependencies:

- lifecycle constants from command schema.
- graph types.

### `src/components/lifecycle/LifecycleProgressSummary.tsx`

Purpose:

UI entrypoint for lifecycle progress display.

Why it matters:

Shows implementation readiness/progress without conflating lifecycle status
with review trust.

Upstream dependencies:

- `InspectorPanel`.

Downstream dependencies:

- `buildLifecycleSummary`.
- lifecycle status label maps.

### `src/lib/trustSummary.ts`

Purpose:

Computes graph trust counts and identifies blocking question nodes.

Why it matters:

This is reused by Full AI Context, AI chat summaries, review logic, and
blocking question export behavior.

Upstream dependencies:

- `buildReviewQueue`
- `exportContext`
- `buildEflowContextExport`
- `buildAIChatPrompt`
- empty inspector.

Downstream dependencies:

- graph types.

## Graph Relationship Logic

### `src/lib/generateEngineeringFlow.ts`

Purpose:

Deterministically maps structured input into graph nodes and typed edges.

Why it matters:

This is where graph relationship semantics originate for generated graphs:
`serves`, `contains`, `leads_to`, `uses`, `depends_on`,
`needs_confirmation`, and `relates_to`.

Upstream dependencies:

- `src/App.tsx` graph generation.
- validation script.

Downstream dependencies:

- graph/input types.
- `src/lib/ids.ts`
- `src/lib/dates.ts`.

### `src/lib/manualGraphEditing.ts`

Purpose:

Creates and inserts manual graph nodes and edges.

Why it matters:

This is the manual graph extension path. It enforces existing node references,
no self-edges, no duplicate ids, and no duplicate exact source/target/type
relationships.

Upstream dependencies:

- manual node/edge panels.
- validation script.

Downstream dependencies:

- graph types.
- lifecycle type.
- `src/lib/dates.ts`.

### `src/lib/buildEflowContextExport.ts`

Purpose:

Builds dependency index and Mermaid relationship exports from graph edges.

Why it matters:

This is where edge direction becomes AI-readable dependency semantics. In the
export, `A depends_on B` means A depends on B and B blocks A.

Upstream dependencies:

- export UI.
- AI chat full-context attachment.
- validation script.

Downstream dependencies:

- graph/input types.
- command/context types.
- `trustSummary`.

### `src/lib/graphAdapters.ts`

Purpose:

Adapts `EngineeringFlowGraph` nodes/edges into React Flow node/edge models.

Why it matters:

This is the canvas boundary. React Flow state is derived rendering data and
must not become graph truth.

Upstream dependencies:

- `EngineeringFlowCanvas`.

Downstream dependencies:

- `@xyflow/react` types.
- graph types.

## Readiness And Evaluation Logic

### `scripts/validateExample.ts`

Purpose:

Repository smoke test for the built-in example and architecture-sensitive
helpers.

Why it matters:

This is the fastest confidence check for graph generation, context export,
command validation/apply, manual editing, workspace validation, lifecycle
summaries, review summaries, audit behavior, i18n coverage, and AI prompt
boundaries.

Upstream dependencies:

- `npm run validate:example`.

Downstream dependencies:

- seed data.
- graph generation.
- export builders.
- command validation/apply.
- manual graph editing.
- workspace persistence/validation.
- audit helpers.
- i18n translations.
- schema constants.

### `package.json`

Purpose:

Defines runnable project commands.

Why it matters:

For validation, agents usually need:

- `npm run validate:example`
- `npm run build`

Upstream dependencies:

- developer/agent terminal workflows.

Downstream dependencies:

- Vite.
- TypeScript build references.
- `scripts/validateExample.ts`.

### `src/lib/buildEflowContextExport.ts`

Purpose:

Computes handoff readiness signals: progress summary, review summary, blocking
questions, dependency index, and next development targets.

Why it matters:

Downstream agents use this export to understand what is confirmed, what is
planned/ready/completed, and what is blocked.

Upstream dependencies:

- export UI.
- AI chat full-context attachment.
- validation script.

Downstream dependencies:

- graph/input types.
- command/context types.
- trust summary.

### `src/lib/workspaceValidation.ts`

Purpose:

Evaluates whether imported JSON can safely become live workspace/input/graph
state.

Why it matters:

This prevents malformed imports from becoming canonical local state.

Upstream dependencies:

- workspace import UI.
- workspace persistence load.
- validation script.

Downstream dependencies:

- graph/input/workspace types.
- lifecycle constants.
- audit validation.

## Important Utility Layers

### `src/lib/ids.ts`

Purpose:

Creates simple ids for input rows, graphs, generated nodes, and generated
edges.

Why it matters:

Generated graph ids and edge ids are deterministic enough for stable graph
relationships and validation assumptions.

Upstream dependencies:

- structured input editors.
- graph generation.

Downstream dependencies:

- none.

### `src/lib/dates.ts`

Purpose:

Small timestamp helper returning current ISO strings.

Why it matters:

Used by generation, audit, persistence, command apply, manual editing, and
input updates to keep timestamp creation consistent.

Upstream dependencies:

- graph generation.
- audit helpers.
- workspace persistence.
- manual graph editing.
- command apply.
- App input updates.

Downstream dependencies:

- JavaScript `Date`.

### `src/lib/i18n/*`

Purpose:

Translation keys, translations, display label maps, translate helper, and
language context.

Why it matters:

User-facing copy is bilingual with default locale `zh-TW`. Locale state is UI
preference only and must not enter workspace or graph data.

Upstream dependencies:

- most UI components.
- validation script for translation coverage.

Downstream dependencies:

- locale constants.
- translation dictionaries.
- browser localStorage/document APIs in language context only.

### `src/data/emptyEngineeringFlowInput.ts`

Purpose:

Default blank input state.

Why it matters:

This seeds new local workspaces before a user imports or loads an example.

Upstream dependencies:

- `src/App.tsx`.

Downstream dependencies:

- input schema type.
- `nowIso()`.

### `src/data/todoThoughtUniverseExample.ts`

Purpose:

Built-in example structured input.

Why it matters:

This is the fixture used by the demo flow and validation script. It exercises
generation, review, export, command, manual edit, workspace, and audit
behavior.

Upstream dependencies:

- `src/App.tsx` load-example action.
- validation script.

Downstream dependencies:

- input schema type.

## Where Not To Start

Avoid starting with these unless the task is specifically visual or copy-only:

- `src/styles/*`: visual styling only.
- small field editors under `src/components/input/*`: they edit intake rows but
  do not define graph semantics.
- small review card/progress components: they render review data built
  elsewhere.
- `src/components/layout/*`: layout shell only, except `TopBar` exposes graph
  generation and Full AI Context copy actions through callbacks/builders.

## Maintainer Notes

- For graph truth, start with `src/types/engineeringFlow.ts`, then follow
  generation/mutation/export paths.
- For AI handoff, start with `src/lib/buildEflowContextExport.ts`.
- For AI write-back, start with `src/types/eflowCommand.ts`,
  `src/lib/eflowCommandValidation.ts`, and `src/lib/applyEflowCommand.ts`.
- For local persistence, start with `src/lib/workspacePersistence.ts` and
  `src/lib/workspaceValidation.ts`.
- For UI state ownership, start with `src/App.tsx` and cross-check
  `STATE_OWNERSHIP.md`.
- For module dependency safety, cross-check `MODULE_BOUNDARIES.md`.
