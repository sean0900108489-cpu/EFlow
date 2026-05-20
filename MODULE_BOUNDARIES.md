# MODULE BOUNDARIES

This document defines architectural module boundaries and dependency direction
for EFlow. It is about responsibility and authority, not folder layout.

EFlow is a local-first, schema-first, graph-oriented engineering cognition
system. Module boundaries should preserve these facts:

- `EngineeringFlowGraph` is canonical architecture truth after generation or
  import.
- UI renders and mutates through explicit callbacks; it must not become a
  second graph owner.
- Persistence stores workspace snapshots; it must not normalize, generate, or
  repair domain state.
- Export formats are derived read models.
- AI chat is draft-only.
- AI command import is the only AI-writable graph path, and it is manual:
  Validate -> Dry Run -> Apply.

## Dependency Direction

Preferred direction:

```text
types
  <- pure domain/read-model libs
  <- persistence and validation libs
  <- UI components
  <- App workspace coordinator

types
  <- serverless AI route
```

More explicitly:

```text
src/types/*
  <- src/lib/* pure graph, review, lifecycle, export, command, audit helpers
  <- src/components/* UI shells and panels
  <- src/App.tsx state coordinator
```

The serverless AI route is intentionally separate:

```text
api/chat-with-files.ts -> OpenAI HTTP APIs
```

It must not import workspace state, graph mutation helpers, or UI modules.

## Boundary Rules

- Schema modules may define product concepts but must not perform browser,
  network, storage, or UI work.
- Pure domain libraries may transform or validate typed data but must not read
  browser storage, call OpenAI, render UI, or create React state.
- Persistence libraries may serialize, validate, load, and save snapshots but
  must not mutate graph semantics.
- UI components may own transient UI state and call approved mutation callbacks,
  but must not keep canonical graph copies.
- `App.tsx` owns live workspace state and wires mutation paths together.
- AI chat may build prompts and send requests but must not mutate graph state.
- The API route may call OpenAI but must not become a workspace backend.

## Module Map

### Schema And Type Contracts

Representative modules:

- `src/types/engineeringFlow.ts`
- `src/types/eflowCommand.ts`
- `src/types/eflowContext.ts`
- `src/types/eflowAudit.ts`

Responsibility:

Define the meaning of EFlow data: structured input, graph, nodes, edges,
workspace documents, command envelopes, AI-native context export, provenance,
review status, lifecycle status, implementation state, and audit events.

Allowed dependencies:

- Other schema/type modules.
- Type-only imports needed to avoid duplicate definitions.

Forbidden dependencies:

- React or React Flow.
- `src/components/*`.
- Browser APIs such as `window`, `localStorage`, `sessionStorage`, clipboard,
  or DOM APIs.
- Network APIs and OpenAI APIs.
- Persistence helpers, export builders, graph mutation helpers, or validators.

Exported concepts:

- `EngineeringFlowInput`
- `EngineeringFlowGraph`
- `EngineeringNode`
- `EngineeringEdge`
- `EFlowWorkspaceDocument`
- `EFlowCommandEnvelope`
- `EFlowContextExport`
- `EFlowAuditEvent`
- enum-like constant arrays for formal command/context status values.

Internal-only concepts:

- None by design. Types are shared contracts. If a concept is not meant to be
  shared, it should not live in `src/types/*`.

Side effects:

- None.

Persistence access:

- None. Types describe persisted shapes but do not read or write persistence.

Graph access:

- Shape definition only.

AI interaction responsibilities:

- Define the AI-facing command and context contracts. Do not perform AI
  interaction.

Boundary notes:

- `engineeringFlow.ts` imports type definitions from `eflowCommand.ts` and
  `eflowAudit.ts`. This is acceptable today because the internal graph embeds
  command provenance, lifecycle, implementation, metadata, and audit-bearing
  workspace shape. The risk is that formal AI command concepts can leak back
  into the internal graph before the graph can represent them.

### Deterministic Graph Generation

Representative module:

- `src/lib/generateEngineeringFlow.ts`

Responsibility:

Transform `EngineeringFlowInput` into an `EngineeringFlowGraph`
deterministically. Encode the current generation rules from structured intake
sections to graph node types and typed relationships.

Allowed dependencies:

- `src/types/engineeringFlow.ts`
- small pure utilities such as `src/lib/dates.ts` and `src/lib/ids.ts`.

Forbidden dependencies:

- React, React Flow, and UI components.
- Workspace persistence.
- Import/export panels.
- AI chat or OpenAI APIs.
- Audit logging.
- Browser storage.

Exported concepts:

- `generateEngineeringFlow(input)`.

Internal-only concepts:

- Column layout defaults.
- Row spacing.
- generation rule strings.
- node/edge factory helpers.
- source input id maps.

Side effects:

- Calls `nowIso()` to stamp generated graph timestamps. No storage or network
  side effects.

Persistence access:

- None.

Graph access:

- Creates a replacement graph. It does not patch or reconcile an existing graph.

AI interaction responsibilities:

- None. Generation must remain non-LLM and reviewable.

Boundary risks:

- Because generation also assigns default positions, future layout logic may be
  tempted to treat generation as a visual-layout engine. Keep layout defaults
  simple unless a dedicated layout boundary is introduced.

### Graph Mutation Helpers

Representative modules:

- `src/lib/manualGraphEditing.ts`
- `src/lib/applyEflowCommand.ts`

Responsibility:

Provide approved graph mutation mechanics outside React components.

Manual editing creates graph-native nodes and edges with
`provenance.sourceType = "manual_edit"` and validates graph integrity.

Command apply validates an `eflow-command/v0.1` envelope, performs graph
compatibility checks, supports dry-run, applies supported node/edge operations,
rejects unsupported command-schema-only operations, and appends command
provenance.

Allowed dependencies:

- schema/type modules.
- `src/lib/dates.ts`.
- `src/lib/eflowCommandValidation.ts` for command validation.

Forbidden dependencies:

- React, UI components, and i18n display copy.
- Workspace persistence.
- Audit log append ownership.
- AI chat or OpenAI APIs.
- Browser storage.

Exported concepts:

- manual node/edge creation and insertion helpers.
- command apply and dry-run helpers.
- command apply result and change summaries.
- default command lifecycle status.

Internal-only concepts:

- clone helpers.
- review-status compatibility mappings.
- supported current graph node/relationship lists.
- provenance conversion helpers.
- duplicate/self-edge checks.

Side effects:

- No storage, network, or UI side effects. Helpers return graph results.
- They do stamp timestamps through `nowIso()`.

Persistence access:

- None.

Graph access:

- Accept a graph value and return either the original graph or a changed graph.
- Must not mutate the caller-owned graph on failed apply or dry-run.

AI interaction responsibilities:

- Enforce the AI command safety boundary.
- Treat AI commands as proposed mutations, not authority.
- Preserve actor, command id, reason, evidence, and command provenance where
  possible.

Boundary risks:

- `applyEflowCommand.ts` and `buildEflowContextExport.ts` both maintain current
  graph compatibility lists. If supported node types, relationship types, or
  operations change, both modules must be updated together until a shared
  compatibility descriptor exists.
- Command apply intentionally does not append audit events. The UI path must
  continue to record audit after successful apply.

### Command Schema Validation

Representative module:

- `src/lib/eflowCommandValidation.ts`

Responsibility:

Validate the JSON shape of `eflow-command/v0.1` envelopes and operations before
graph compatibility checks.

Allowed dependencies:

- `src/types/eflowCommand.ts`.

Forbidden dependencies:

- `EngineeringFlowGraph` mutation logic.
- UI components.
- persistence.
- audit logging.
- AI chat.
- browser or network APIs.

Exported concepts:

- command validation result and issue shape.
- `validateEFlowCommandEnvelope`.
- status type guards.
- `isEFlowCommandEnvelope`.

Internal-only concepts:

- JSON path strings.
- per-operation shape checks.
- evidence/provenance/actor validators.

Side effects:

- None.

Persistence access:

- None.

Graph access:

- None. This module validates command schema only. It must not check whether
  node ids exist in a particular graph.

AI interaction responsibilities:

- Provide the first gate for AI-generated command drafts.

Boundary risks:

- Validation permits schema concepts wider than the current graph supports.
  This is intentional. Do not "fix" this by narrowing the formal schema to the
  current graph.

### Derived Graph Read Models

Representative modules:

- `src/lib/buildReviewQueue.ts`
- `src/lib/buildLifecycleSummary.ts`
- `src/lib/trustSummary.ts`
- `src/lib/buildManualEditSummary.ts`

Responsibility:

Compute derived read models from the current graph: review queue, lifecycle
counts, trust summary, blocking question recognition, and manual edit summary.

Allowed dependencies:

- graph and command/lifecycle types.
- other pure read-model helpers when needed.
- i18n type keys for UI-facing reason metadata.

Forbidden dependencies:

- React state.
- browser storage.
- workspace persistence.
- graph mutation helpers.
- AI chat or OpenAI APIs.
- DOM/clipboard/file APIs.

Exported concepts:

- derived summary builders.
- summary/result types.
- review queue item types.
- blocking-question predicate.

Internal-only concepts:

- queue sorting heuristics.
- priority rules.
- progress score calculation.
- display-default lifecycle bucketing.

Side effects:

- None.

Persistence access:

- None. Derived summaries must not be persisted as workspace truth.

Graph access:

- Read-only.

AI interaction responsibilities:

- Indirect only. Summaries can feed AI context builders, but these modules do
  not talk to AI.

Boundary risks:

- `buildReviewQueue.ts` imports i18n type names for translation metadata. That
  is a mild coupling from domain read-model logic toward UI language concerns.
  It is currently type-level and acceptable, but if queue logic starts importing
  actual translated copy, split presentation metadata out.
- `src/lib/i18n/display-labels.ts` imports review queue types. That creates a
  small cross-link between i18n display configuration and review read-model
  types. Keep it type-only.

### Export And Handoff Builders

Representative modules:

- `src/lib/exportContext.ts`
- `src/lib/buildEflowContextExport.ts`
- `src/lib/buildAIChatPrompt.ts`

Responsibility:

Build derived artifacts for AI or user handoff:

- legacy Full AI Context.
- preferred `eflow-context/v0.1`.
- prompt text and context summaries for AI chat.

Allowed dependencies:

- schema/type modules.
- pure read-model helpers such as trust summary.
- pure date helpers.

Forbidden dependencies:

- graph mutation helpers.
- workspace persistence writes.
- React components.
- browser storage.
- OpenAI/API route calls.
- audit append behavior.

Exported concepts:

- `buildFullAIContext`.
- `buildEFlowContextExport`.
- AI chat prompt mode descriptors.
- context attachment mode descriptors.
- `buildAIChatPrompt`.
- `buildAIChatContextSummary`.

Internal-only concepts:

- Mermaid string construction.
- dependency index construction.
- next development target heuristics.
- command interface descriptors.
- prompt instruction templates.

Side effects:

- Derived builders should be pure except timestamp defaults in export creation.
- No persistence or network side effects.

Persistence access:

- None.

Graph access:

- Read-only.
- Maps legacy graph `status` to formal `reviewStatus` where representable.
- Defaults missing lifecycle status to `planned` for export/display without
  writing it back.

AI interaction responsibilities:

- Package current graph/input state as read-only AI context.
- State AI command compatibility and safety rules.
- Prompt chat models to treat output as draft-only.

Boundary risks:

- `buildEflowContextExport.ts` encodes command compatibility in parallel with
  `applyEflowCommand.ts`. This is the highest current duplication risk in pure
  libraries.
- `buildAIChatPrompt.ts` carries product workflow instructions and references
  i18n label keys. It is useful as a prompt boundary, but it should not grow
  into chat state management.

### Workspace Persistence And Validation

Representative modules:

- `src/lib/workspacePersistence.ts`
- `src/lib/workspaceValidation.ts`
- `src/lib/auditLog.ts`

Responsibility:

Construct, validate, load, save, clear, trim, and summarize local workspace and
audit state.

Allowed dependencies:

- schema/type modules.
- pure helpers such as `nowIso()`.
- validation helpers.
- browser `localStorage` only inside persistence modules that explicitly own it.

Forbidden dependencies:

- React components.
- graph generation.
- graph mutation helpers.
- export builders, except through callers.
- AI chat or OpenAI APIs.
- UI routing.

Exported concepts:

- workspace storage key and app version.
- workspace document constructor.
- localStorage load/save/clear helpers.
- workspace/input/full-context/graph validators.
- audit event creation, append, trim, validation, and summary helpers.

Internal-only concepts:

- storage availability checks.
- filename sanitization.
- audit id sequence.
- clone helpers.
- event sorting and count aggregation.

Side effects:

- `workspacePersistence.ts` reads/writes/removes browser `localStorage`.
- `auditLog.ts` creates timestamped ids but does not write storage.
- validation is side-effect free.

Persistence access:

- `workspacePersistence.ts` is the only normal owner of workspace
  localStorage.
- `auditLog.ts` does not persist by itself.

Graph access:

- Validation reads graph structure and checks node/edge references.
- Persistence stores/restores graph snapshots but does not own graph mutation.

AI interaction responsibilities:

- Validate legacy Full AI Context import shape.
- No provider calls.

Boundary risks:

- `workspaceValidation.ts` validates graph shape but does not deeply validate
  every optional provenance/implementation/metadata field. If those become
  trust-critical, validation must deepen before import support expands.
- Audit and persistence are adjacent but distinct. Do not make audit replay
  drive workspace restore.

### App Workspace Coordinator

Representative module:

- `src/App.tsx`

Responsibility:

Own the live workspace snapshot and route approved mutations between UI,
domain helpers, persistence, audit, generation, import/export, and selection.

Allowed dependencies:

- UI shell/components.
- data seeds.
- schema types.
- graph generation.
- persistence helpers.
- audit helpers.
- date helper.
- i18n hook for UI status text.

Forbidden dependencies:

- OpenAI provider APIs.
- serverless request parsing.
- React Flow internals beyond passing props to canvas.
- direct command compatibility logic that belongs in command helpers.
- direct export-format construction except through export components/helpers.

Exported concepts:

- default app component.

Internal-only concepts:

- route/tutorial mode reader.
- live workspace state.
- dirty-regeneration flags.
- autosave status state.
- selection validation.
- audit event builders for App-owned mutation paths.

Side effects:

- Loads workspace snapshot during initial state setup.
- Autosaves workspace snapshots to localStorage.
- Clears local workspace after user confirmation.
- Updates React state.

Persistence access:

- Uses `workspacePersistence.ts`.
- Should not manually call `window.localStorage` for workspace state.

Graph access:

- Owns canonical graph state.
- Replaces graph through generation, import, manual edit results, or command
  apply results.
- Patches nodes and edges by id.

AI interaction responsibilities:

- None directly. It passes graph/input to `AIChatConsole` and exposes command
  import through inspector UI, but does not call AI providers.

Boundary risks:

- `App.tsx` is oversized: it owns state, autosave, import application, graph
  generation, selection, audit event construction, and mutation callbacks. This
  is acceptable at current scale but is the main future extraction candidate.
- Audit event construction is split between `App.tsx`, manual edit panels, and
  command import UI. If audit semantics grow, centralize event creation or add a
  graph mutation service boundary.

### Structured Input UI

Representative modules:

- `src/components/input/*`

Responsibility:

Render and edit `EngineeringFlowInput` through controlled props and callbacks.
Keep form drafts local where needed. Import raw input JSON through validation.

Allowed dependencies:

- React.
- input schema types.
- id helper.
- i18n hook.
- `workspaceValidation.ts` for input import validation.
- small sibling editor components.

Forbidden dependencies:

- `EngineeringFlowGraph` mutation helpers.
- graph generation.
- workspace persistence writes.
- audit append behavior.
- AI chat or command apply.
- React Flow.

Exported concepts:

- structured input panel and section editors.

Internal-only concepts:

- row editing UI.
- list editing helpers.
- local input import textarea and messages.

Side effects:

- UI state only. Import panel parses JSON locally and calls parent import
  callback on valid input.

Persistence access:

- None directly.

Graph access:

- None. Input editors must not inspect or mutate graph state.

AI interaction responsibilities:

- None. Raw idea to input conversion may be prompted by AI chat, but input
  import remains local and explicit.

Boundary risks:

- Input editors know relationship id fields such as related screen/function/data
  ids. Keep these as intake schema edits; do not make editors derive graph
  edges directly.

### Canvas Rendering UI

Representative modules:

- `src/components/graph/EngineeringFlowCanvas.tsx`
- `src/components/graph/EngineeringNodeCard.tsx`
- `src/lib/graphAdapters.ts`

Responsibility:

Render the current graph through React Flow, filter visible nodes/edges, show
node cards, and send user selection/position changes back through callbacks.

Allowed dependencies:

- React and React Flow.
- graph types.
- lifecycle status constants for display filters.
- `graphAdapters.ts`.
- i18n display labels and language hook.

Forbidden dependencies:

- workspace persistence.
- graph generation or command apply.
- AI chat.
- audit append behavior.
- localStorage.
- canonical graph copies in React Flow state.

Exported concepts:

- canvas component.
- graph adapter functions and React Flow data types.
- node card component.

Internal-only concepts:

- canvas filters.
- lifecycle filters.
- visible node id set.
- filtered graph projection.
- React Flow selected flags.

Side effects:

- UI-only React state.
- Calls `onNodePositionChange` when React Flow reports a node position change.
- May call `onClearSelection` when filters hide selected items.

Persistence access:

- None directly. Position persistence happens because the callback patches the
  canonical graph.

Graph access:

- Read graph from props.
- May request position patch only.
- Must not mutate graph directly.

AI interaction responsibilities:

- None.

Boundary risks:

- `graphAdapters.ts` lives under `src/lib` but imports `@xyflow/react` types.
  Treat it as a UI adapter, not a pure domain lib.
- Canvas filtering constructs a temporary filtered graph object. It must remain
  a projection and never be passed as canonical replacement state.

### Inspector, Review, Lifecycle, And Manual Editing UI

Representative modules:

- `src/components/inspector/*`
- `src/components/review/*`
- `src/components/lifecycle/*`
- `src/components/graphEditing/*`
- `src/components/audit/*`

Responsibility:

Provide the right-side workbench for selected item editing, review queue,
lifecycle summary, manual graph edits, audit display, AI command import, and
workspace/export tools.

Allowed dependencies:

- React.
- graph/input/audit/command types.
- pure read-model builders.
- manual graph editing helpers.
- command import component.
- export/persistence panels.
- audit event helper for UI-originated audit events.
- i18n hook.

Forbidden dependencies:

- direct workspace localStorage calls.
- OpenAI provider calls.
- autonomous graph mutation.
- child-owned graph stores.
- direct import of `App.tsx`.

Exported concepts:

- inspector panel.
- selected node/edge inspectors.
- empty/project inspector.
- review panel/cards/progress/filter controls.
- lifecycle summary.
- manual edit panels and summary.
- audit log panel.

Internal-only concepts:

- collapsible section composition.
- selected item lookup.
- review filter state.
- compact review limits.
- manual form drafts.
- manual edit messages.

Side effects:

- UI state.
- Manual edit panels call approved graph helper functions and then parent
  callbacks to apply graph and record audit.
- Review and inspector actions patch node/edge status or lifecycle through
  parent callbacks.

Persistence access:

- None directly, except export/workspace panels included inside inspector.

Graph access:

- Read graph from props.
- Mutate only through parent callbacks or graph helper result callbacks.

AI interaction responsibilities:

- Hosts Local Command Import. Does not call providers.

Boundary risks:

- `InspectorPanel.tsx` is an oversized composition hub. It imports audit,
  command, export, manual editing, lifecycle, review, layout, and selected-item
  inspector modules. It is useful as a workbench coordinator, but future growth
  should split project tools, graph item inspector, and interop tools before
  adding more responsibilities.
- Manual edit panels create audit events directly. This keeps App smaller for
  those actions, but duplicates audit semantics outside the state owner.

### Export, Import, And Workspace UI

Representative modules:

- `src/components/export/*`
- `src/components/command/LocalCommandImportPanel.tsx`

Responsibility:

Expose user-driven copy/download/import workflows and local command import.
Keep JSON text, parse results, validation results, dry-run results, copy
messages, and download messages local to the UI.

Allowed dependencies:

- React.
- export builders.
- workspace document builder and filename helper.
- workspace validation helpers.
- command validation/apply helpers.
- audit event creation for command apply.
- i18n hook.
- clipboard and browser download APIs.

Forbidden dependencies:

- canonical graph ownership.
- direct localStorage writes for workspace import/export.
- AI provider calls.
- treating export artifacts as persisted state.
- auto-apply of command text from AI chat.

Exported concepts:

- copy JSON button.
- JSON export panel.
- AI-native context export panel.
- workspace persistence panel.
- local command import panel.

Internal-only concepts:

- import textarea state.
- command textarea state.
- validation/apply result display state.
- download/copy messages.
- exported JSON blob URLs.

Side effects:

- Clipboard writes through `navigator.clipboard`.
- Browser downloads through `Blob` and temporary object URLs.
- Successful workspace/input/full-context import calls parent callbacks.
- Successful command apply calls parent graph replacement callback and records
  compact audit event.

Persistence access:

- Workspace import/export panels do not write localStorage directly; they call
  parent import handlers or use workspace helpers for document construction and
  filenames.

Graph access:

- Read graph/input from props.
- Local command import may apply a command to the current graph through
  `applyEFlowCommandToGraph`, then delegates replacement to parent callback.

AI interaction responsibilities:

- Command import is the local manual graph-write boundary for AI-generated
  command JSON.
- Export panels prepare AI-readable context but do not send it to AI.

Boundary risks:

- `LocalCommandImportPanel` coordinates parse, validation, dry-run, apply,
  audit event creation, and UI display. It is a candidate for a small command
  workflow controller hook or service if command workflows expand.
- `JsonExportPanel` builds Full AI Context and Workspace documents during
  render. This is acceptable because builders are derived, but any future
  expensive export should move behind memoization.

### AI Chat Frontend

Representative module:

- `src/components/aiChat/AIChatConsole.tsx`

Responsibility:

Provide draft-only AI collaboration UI, prompt composition, optional context
attachment, attachment validation, chat history display, API key entry, model
selection, and request dispatch to `/api/chat-with-files`.

Allowed dependencies:

- React.
- AI prompt/context builders.
- `buildEFlowContextExport` for full context attachment.
- graph/input types.
- i18n hook.
- browser `sessionStorage` for API key only.
- browser file APIs and `fetch` to the local chat endpoint.

Forbidden dependencies:

- graph mutation helpers.
- command apply helpers.
- workspace persistence.
- audit append behavior.
- direct OpenAI provider URLs from frontend code.
- `localStorage` API-key persistence.

Exported concepts:

- `AIChatConsole`.

Internal-only concepts:

- API key state.
- remember-key flag.
- model field.
- prompt mode.
- context attachment mode.
- draft message.
- transient chat history.
- file attachments.
- previous/latest provider response ids.
- response parsing helpers.

Side effects:

- Writes API key to `sessionStorage` only when requested.
- Removes legacy API key from `localStorage`.
- Sends multipart requests to `/api/chat-with-files`.
- Uses clipboard for response/prompt copying.

Persistence access:

- `sessionStorage` for `eflow.aiChat.apiKey` only.
- `localStorage` only to remove the legacy API key.
- No workspace persistence.

Graph access:

- Read-only input and graph props.
- Builds context strings from current graph/input.

AI interaction responsibilities:

- Compose prompts that remind AI output is draft-only.
- Send chat requests to the local API route.
- Never treat assistant responses as graph truth.

Boundary risks:

- `AIChatConsole.tsx` is large and currently combines UI, prompt preview,
  attachment validation, API key storage, request construction, response
  extraction, and clipboard behavior. If AI features expand, split request
  transport, storage, and parsing from the component.
- Full context attachment duplicates export-builder usage from export panels.
  This is acceptable because context is derived, but it couples chat cost and
  payload behavior to the export format.

### AI Chat Serverless Boundary

Representative module:

- `api/chat-with-files.ts`

Responsibility:

Accept multipart chat requests, validate attachment type/size, upload files to
OpenAI, call the OpenAI Responses API, extract response text/id, and return
redacted errors.

Allowed dependencies:

- Node HTTP types.
- `busboy`.
- platform-provided `fetch`, `FormData`, `Blob`, and environment variables.

Forbidden dependencies:

- React or frontend components.
- workspace persistence.
- graph generation/mutation/export helpers.
- browser storage.
- audit logging.
- local file system workspace state.

Exported concepts:

- default serverless handler.
- Vercel body parser config.
- response text/id extraction helpers where exported.

Internal-only concepts:

- multipart parsing.
- allowed extension/mime maps.
- OpenAI file upload payloads.
- Responses API request payloads.
- safe error redaction.

Side effects:

- Reads request body.
- Uploads files to OpenAI Files API.
- Calls OpenAI Responses API.
- Reads `process.env.OPENAI_API_KEY` fallback.
- Writes HTTP JSON responses.

Persistence access:

- None for EFlow workspace. OpenAI files exist outside EFlow persistence.

Graph access:

- None.

AI interaction responsibilities:

- This is the only current OpenAI network boundary.
- It must redact API keys and avoid returning sensitive provider details.

Boundary risks:

- The route lives in `api/`, but the application is Vite/React rather than
  Next.js. Local end-to-end route testing needs a serverless runtime such as
  Vercel dev or a wrapper.
- Do not infer database, auth, cloud sync, repo analysis, or autonomous agent
  execution from this route.

### i18n And Display Labels

Representative modules:

- `src/lib/i18n/*`
- `src/components/language/LanguageSwitcher.tsx`

Responsibility:

Own locale selection, translation keys, translations, display labels, and the
language context used by UI components.

Allowed dependencies:

- React in `language-context.tsx` and `LanguageSwitcher`.
- i18n type modules.
- type-only imports for display label typing.
- browser `localStorage` for UI locale only.

Forbidden dependencies:

- graph mutation helpers.
- workspace persistence.
- AI chat transport.
- command apply.
- OpenAI APIs.

Exported concepts:

- `LanguageProvider`.
- `useLanguage`.
- locale constants and storage key.
- translation function and dictionaries.
- display label key maps.

Internal-only concepts:

- translation fallback behavior.
- locale storage read/write.
- document language update.

Side effects:

- Writes `eflow.ui.locale` to `localStorage`.
- Updates `document.documentElement.lang`.

Persistence access:

- UI locale localStorage only. Never workspace documents.

Graph access:

- None except type-only label maps keyed by graph or command enum types.

AI interaction responsibilities:

- None.

Boundary risks:

- i18n display labels import review queue types for labels. Keep those imports
  type-only and avoid letting i18n modules depend on review algorithms.

### Layout, Tutorial, Data Seeds, And Validation Script

Representative modules:

- `src/components/layout/*`
- `src/components/tutorial/TutorialPage.tsx`
- `src/data/*`
- `scripts/validateExample.ts`

Responsibility:

Provide structural UI shells, tutorial content, built-in seed input, empty input
state, and a script-based architectural smoke test.

Allowed dependencies:

- Layout may depend on React and i18n.
- Tutorial may depend on language switching and translations.
- Data seeds may depend on types and simple date/id helpers.
- Validation script may import public module APIs to exercise expected flows.

Forbidden dependencies:

- Layout and tutorial must not mutate graph or persistence directly.
- Data seeds must not import UI, persistence, or AI modules.
- Validation script must not become production runtime logic.

Exported concepts:

- app shell/layout components.
- tutorial page.
- example and empty inputs.
- validation script command.

Internal-only concepts:

- tutorial display structure.
- layout slots.
- seed object details.
- assertion sequencing.

Side effects:

- Tutorial/layout: UI only.
- Data seeds: none, except empty input uses timestamp helper.
- Validation script: process-time assertions when run by `npm run
  validate:example`.

Persistence access:

- Layout/tutorial/data: none.
- Validation script constructs workspace documents but does not write browser
  localStorage.

Graph access:

- Data seeds provide input, not graph truth.
- Validation script generates and inspects graphs.

AI interaction responsibilities:

- Validation script checks AI context export and command compatibility but does
  not call AI providers.

## Current Boundary Violations

These are not necessarily bugs, but they are places where current boundaries are
already a little soft:

- `src/lib/graphAdapters.ts` is under `src/lib` but depends on React Flow
  types. Treat it as a UI adapter, not a pure domain library.
- `InspectorPanel.tsx` is a broad workbench composition root. It imports
  selected-item inspectors, review, lifecycle, manual editing, audit, command
  import, export, workspace persistence UI, and layout sections.
- `App.tsx` combines live state ownership, autosave, import application,
  graph generation, selection, and audit event construction.
- `LocalCommandImportPanel.tsx` combines parsing, validation, dry-run, apply,
  audit event construction, and result rendering.
- `AIChatConsole.tsx` combines chat UI, request transport, API key storage,
  prompt preview, context serialization, response parsing, and file validation.
- `buildEflowContextExport.ts` and `applyEflowCommand.ts` duplicate supported
  graph node types, relationship types, and operation compatibility knowledge.
- `src/lib/i18n/display-labels.ts` imports review queue types. This is a small
  type-level coupling from display copy to review read-model definitions.

## Oversized Modules

Current oversized modules:

- `src/App.tsx`: acceptable state coordinator today, but future state growth
  should extract workspace import/apply, audit event builders, or graph action
  orchestration.
- `src/components/inspector/InspectorPanel.tsx`: likely should split into
  selected-item inspector, graph operations workbench, and import/export
  workbench if more panels are added.
- `src/components/aiChat/AIChatConsole.tsx`: should split if chat transport,
  attachment handling, response parsing, or API key storage grows.
- `src/components/command/LocalCommandImportPanel.tsx`: should split if command
  workflows gain history, batch operations, saved drafts, or external inputs.
- `src/lib/buildEflowContextExport.ts`: dense but coherent as an export builder.
  Extract shared graph compatibility metadata before adding more command
  interface logic.

## Coupling Risks

- Graph compatibility is encoded in more than one place. A schema expansion can
  accidentally update export metadata without updating command apply, or the
  reverse.
- Audit semantics are spread across App, manual edit panels, and command import
  UI. A future audit policy change could miss one mutation path.
- UI panels can call graph replacement callbacks. This is necessary today, but
  it makes callback names and prop boundaries important. Do not pass raw state
  setters deeper into the tree.
- Workspace import/export UI and AI context export sit near each other. Keep
  Workspace JSON as backup/restore and `eflow-context/v0.1` as AI handoff.
- AI Chat can attach full context, but responses remain drafts. Do not add a
  convenience bridge from latest chat response to command apply without an
  explicit validation/import step.
- The formal command schema is wider than the current graph. Avoid accepting
  unsupported graph concepts into `metadata` merely to make commands pass.

## Future Scaling Risks

- Adding a database or cloud sync would create a new state owner. It must define
  conflict handling, identity, persistence priority, audit semantics, and
  offline behavior before implementation.
- Adding a CLI, MCP server, REST API, or agent tool would create a new mutation
  entrypoint. It must reuse command validation/apply semantics and preserve
  manual review unless the architecture explicitly changes.
- Adding standalone decision/question stores requires schema, validation,
  persistence, AI context export, command apply, audit, and UI ownership.
- Migrating legacy graph `status` to formal `reviewStatus` cannot happen in one
  module only. It affects graph types, validation, inspectors, review queue,
  export mapping, command apply, workspace import, and docs.
- Adding undo/replay would require event semantics different from the current
  compact audit log.
- Adding repo analysis must remain evidence-producing unless a human or
  validated command path promotes findings into graph truth.
- Adding persistent chat history must keep it out of workspace truth unless a
  separate chat transcript schema and privacy boundary are designed.

## Maintainer Checklist

Before adding or changing a module:

1. Name the state or concept it owns.
2. Identify whether it is canonical, derived, UI-only, or request-time only.
3. Check whether it needs graph read access, graph mutation access, persistence
   access, or AI provider access.
4. Use existing pure helpers instead of duplicating graph compatibility or
   status mapping rules.
5. Keep storage and network effects at explicit boundaries.
6. Do not import UI modules into schema, graph, validation, persistence, or
   export builders.
7. Update this file if a new module becomes a state owner, persistence owner,
   graph mutation path, export format, or AI boundary.
