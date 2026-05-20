# STATE OWNERSHIP

This document defines canonical state ownership for EFlow. It is intentionally
specific to this repository.

EFlow is local-first and schema-first. The canvas, review panels, lifecycle
summaries, AI chat, imports, exports, and command tooling are projections or
mutation paths around one central product fact:

```text
EngineeringFlowGraph is the canonical architecture graph.
```

`src/App.tsx` owns the live workspace snapshot in React state. The graph itself
owns architecture structure, review state, lifecycle state, provenance, graph
positions, and graph relationships. Persistence stores snapshots of that state;
it does not become a second authority.

## Ownership Hierarchy

1. `src/types/*` owns schema meaning.
2. `src/App.tsx` owns the live in-memory workspace state.
3. `EngineeringFlowGraph` owns graph/domain truth after generation or import.
4. `src/lib/workspacePersistence.ts` owns local workspace snapshot persistence.
5. `src/lib/generateEngineeringFlow.ts`, `src/lib/manualGraphEditing.ts`, and
   `src/lib/applyEflowCommand.ts` own allowed graph mutation mechanics.
6. UI components own only transient UI controls, filters, messages, and form
   drafts unless explicitly passed mutation callbacks from `App.tsx`.
7. Export builders own derived handoff artifacts. Export artifacts are never a
   shadow source of truth while the app is running.
8. AI chat owns temporary conversation state only. AI output is draft evidence,
   not graph truth.

## Canonical vs Derived

Canonical state is state that may be persisted and later restored as live
workspace state. Only the input and graph are domain truth. `auditLog` is
persisted local history, and selection ids are persisted workspace navigation;
neither is architecture truth.

Derived state must be recomputed from canonical state and should not be stored
back into the workspace unless it is deliberately promoted through an approved
mutation path.

Canonical state:

- `EngineeringFlowInput`
- `EngineeringFlowGraph | null`
- graph node and edge fields, including `status`, `lifecycleStatus`,
  `position`, `provenance`, `commandProvenance`, `implementation`, and
  `metadata`
- `auditLog` as compact local history
- `selectedNodeId` and `selectedEdgeId` as persisted workspace navigation state

Derived state:

- React Flow node and edge models
- filtered graph views
- review queues and progress percentages
- lifecycle summaries and lifecycle counts
- trust summaries
- manual edit summaries
- dependency indexes
- blocking question summaries
- next development target recommendations
- Mermaid text
- AI chat context summaries
- `eflow-context/v0.1`
- `engineering-flow-full-context/v0`
- workspace filenames and export status messages

UI-only state:

- panel open/closed state
- canvas filters
- review filters
- form drafts and validation messages
- AI chat draft text, attachments, history, provider response ids, and collapse
  state
- autosave status text
- locale preference, persisted as a UI preference rather than workspace state
- route/tutorial mode

## Important State Inventory

| State | Owner | Persistence behavior | Mutation rules | Derived consumers | Synchronization risks |
| --- | --- | --- | --- | --- | --- |
| `EngineeringFlowInput` | `App.tsx` live state; schema in `src/types/engineeringFlow.ts`; editors under `src/components/input/*` | Stored in workspace autosave, Workspace JSON, Full AI Context, and input JSON import/export | Mutate only through `updateInput`, `importEngineeringFlowInput`, workspace import, or Full AI Context import. Updates refresh `updatedAt`. Example seed changes become `manual_edit`. | graph generation, AI chat summaries, export builders, workspace name | Input can drift from an existing graph. `inputDirtySinceGeneration` tracks this; do not silently regenerate or partially sync generated graph nodes back to input. |
| `inputDirtySinceGeneration` | `App.tsx` | Not persisted | Set when input changes after graph exists. Reset on graph generation/import/example load | Top bar regeneration warning | Dangerous if moved into graph or workspace. It is only a local warning that current graph may be stale relative to input. |
| `showRegenerationConfirm` | `App.tsx` | Not persisted | Set only when generating over dirty input; reset on cancel, replace, import, or example load | Top bar confirmation UI | Regeneration replaces the graph and may drop manual edits. Do not bypass this guard. |
| `EngineeringFlowGraph` | `App.tsx` live state; schema in `src/types/engineeringFlow.ts` | Stored in workspace autosave and Workspace JSON. Included in Full AI Context and AI-native context exports. May be null before generation. | Replace through deterministic generation, workspace/full-context import, manual graph edit helpers, or validated command apply. Patch nodes/edges through `updateNode` and `updateEdge`. | canvas, inspector, review, lifecycle, manual summaries, audit, exports, AI chat context | Never keep a second graph copy in a child component. Never mutate in place. Failed command apply and dry-run must not alter it. |
| `EngineeringNode[]` | `EngineeringFlowGraph.nodes` | Persisted as part of graph | Add through generation, manual node insertion, or command upsert. Patch by id. Node ids must stay stable. | canvas cards, node inspector, review queue, lifecycle summary, dependency exports | Duplicating selected node objects or storing node lists in panels causes stale title/status/lifecycle data. |
| `EngineeringEdge[]` | `EngineeringFlowGraph.edges` | Persisted as part of graph | Add through generation, manual edge insertion, or command upsert. Patch by id. Edge source/target must reference existing node ids. Exact duplicate `source`/`target`/`relationshipType` edges are forbidden. | canvas edges, edge inspector, review queue, dependency index, Mermaid export | Do not keep a separate adjacency list or dependency graph as state. Build indexes from edges. |
| `node.position` | `EngineeringNode.position` | Persisted as part of graph and workspace | React Flow position changes call `onNodePositionChange`, which patches the canonical node | canvas layout | Position is graph state, not React Flow-only state. If a layout engine is added, it must write intentional node position patches or remain a temporary preview. |
| Node review state | Legacy `EngineeringNode.status` | Persisted as part of graph | Allowed current values: `suggested`, `confirmed`, `needs_review`. Updated by inspector, review panel, manual creation defaults, or command mapping | review queue, trust summary, context export, AI prompt policy | Formal `reviewStatus: "rejected"` cannot currently map to node `status`; command apply must reject it. Do not store both `status` and `reviewStatus` on graph nodes. |
| Edge review state | Legacy `EngineeringEdge.status` | Persisted as part of graph | Allowed current values: `suggested`, `confirmed`, `rejected`. Updated by inspector, review panel, manual creation defaults, or command mapping | review queue, trust summary, context export, AI prompt policy | Formal `reviewStatus: "needs_review"` cannot currently map to edge `status`; command apply must reject it. |
| `lifecycleStatus` | Optional field on nodes and edges | Persisted only when explicitly present. Missing means derived display default `planned` | Updated by inspector, manual creation, or command transitions/patches. `transitionNode` and `transitionEdge` may enforce `from` conflict checks | lifecycle summary, canvas lifecycle filters, progress summary, next targets, AI context | Do not normalize missing values by writing `planned` everywhere just because a summary displayed `planned`. Defaulting is derived unless a user or command explicitly mutates lifecycle. |
| `provenance` | Each node/edge | Persisted as part of graph | Set by generation, manual editing, command import, or context import. Should be updated when source meaning changes | inspectors, review reasons, context export, AI trust policy | Provenance must not be overwritten casually. AI-originated changes need `ai_command` or `ai_progress_sync` trace, not `manual_edit`. |
| `commandProvenance` | Each node/edge, appended by command apply | Persisted as part of graph | Append through `applyEflowCommand.ts`; do not replace existing history unless performing explicit migration | context export metadata, implementation history | Losing command provenance makes AI sync unreviewable. Beware broad object replacement that drops optional arrays. |
| `implementation` | Each node/edge | Persisted as part of graph | Command apply may append lifecycle transition history. Manual UI currently changes lifecycle status and audit events, not detailed implementation history | AI context export, future progress reporting | Do not infer implementation truth from AI chat text. Implementation evidence must be deliberately attached through command/import design. |
| `metadata` | Each node/edge | Persisted as part of graph | Optional extension field. Use only for structured compatibility data | AI context export and future tools | Avoid using metadata as an untyped dumping ground for state that deserves first-class schema or derived recomputation. |
| `auditLog` | `App.tsx`; helpers in `src/lib/auditLog.ts` | Stored in workspace autosave and Workspace JSON. Missing legacy audit log restores as empty. Trimmed to `MAX_AUDIT_LOG_EVENTS` | Append compact events through UI mutation paths. Imports append import events. Headless command apply does not append by itself | audit panel, workspace export | Audit is not undo, replay, conflict resolution, or signed history. Do not build restoration logic from audit entries. |
| `selectedNodeId` / `selectedEdgeId` | `App.tsx` | Stored in workspace autosave and Workspace JSON | Mutually exclusive. Set by canvas, review panel, manual edit success, inspector navigation. Cleared on graph replacement or invalid restore | inspector selection, review selection note, canvas selected style | Store ids only, never selected objects. Restored selection must be validated against current graph. Filters may clear hidden selections. |
| `autosaveStatus` / displayed autosave text | `App.tsx` | Not in workspace document | Updated after localStorage restore/save/import/clear. Derived text via translation | top bar and workspace panel | It is UI feedback, not persistence truth. Never branch domain logic on the localized text. |
| Workspace localStorage snapshot | `src/lib/workspacePersistence.ts` | Key: `eflow.workspace.v0.3.current`; best-effort browser localStorage | Built via `buildWorkspaceDocument`; loaded only if `isEFlowWorkspaceDocument` validates; save failures are swallowed | startup restore, autosave, clear local workspace | localStorage is convenience persistence, not a database, cloud sync, or cross-device source. Do not treat old localStorage data as more authoritative than current live state. |
| Workspace JSON | `WorkspacePersistencePanel` export/import plus `workspacePersistence.ts` | Explicit copy/download/import. Includes input, graph, selection, audit log | Import must validate workspace schema, graph shape, lifecycle values, and audit shape before calling `App.tsx` import | backup/restore only | Workspace JSON is not the preferred AI handoff. Avoid sending it to downstream AI as if it were `eflow-context/v0.1`. |
| Full AI Context | `src/lib/exportContext.ts` | Copy/export only. Import can restore input and graph but not audit history | Built from current input/graph. Import path builds a workspace document with null selection and new import audit event | legacy handoff and restore | It is a derived artifact. If imported, it becomes source data only after validation and workspace import handling. |
| `eflow-context/v0.1` | `src/lib/buildEflowContextExport.ts` and `EFlowContextExportPanel` | Copy/download only. Not stored in workspace. Full context can be attached to chat request when user chooses it | Recomputed from graph and input. Contains command interface descriptors and derived summaries | downstream AI handoff, AI chat full-context attachment | Do not import it as workspace state without an explicit importer. Do not persist its summaries back into the graph. |
| React Flow nodes/edges | `src/lib/graphAdapters.ts` and `EngineeringFlowCanvas` | Not persisted | Recomputed from filtered graph on render. User drag writes back only `node.position` through `App.tsx` | React Flow canvas | Forbidden as duplicated state. Do not introduce independent `useNodesState` or `useEdgesState` as a second graph owner. |
| Canvas filters and lifecycle filter | `EngineeringFlowCanvas` | Not persisted | Local UI controls only | filtered graph, visible counts | Filters must not delete graph items. Clearing selection because it is hidden is UI navigation, not graph mutation. |
| Review queue and review progress | `src/lib/buildReviewQueue.ts`; `ReviewPanel` | Not persisted | Recomputed from graph. Review actions patch canonical node/edge statuses | review panel, progress bar | Do not store queue item status separately. Queue priority and progress are derived heuristics. |
| Review filter | `ReviewPanel` | Not persisted | Local UI control only | visible review items | Do not confuse hidden review items with reviewed items. |
| Lifecycle summary | `src/lib/buildLifecycleSummary.ts` | Not persisted | Recomputed from graph. Missing lifecycle defaults to `planned` for display | lifecycle panel, context export pattern | Counts are derived. Never sync count buckets back into graph. |
| Trust summary | `src/lib/trustSummary.ts` | Not persisted | Recomputed from graph status fields and blocking question generation rule | AI chat summary, Full AI Context confirmation summary | Blocking-question status is inferred from node type/rule. Do not duplicate a separate blocking flag on graph nodes without migration. |
| Manual edit summary | `src/lib/buildManualEditSummary.ts` | Not persisted | Recomputed from provenance `sourceType === "manual_edit"` | manual context panel | Manual count buckets are derived. Manual provenance means "human-added", not automatically "true". |
| Manual node form state | `AddManualNodePanel` | Not persisted | Local form draft. Creates canonical node only after validation and `insertManualNode` succeeds | manual node creation UI | Do not autosave half-filled manual node drafts into workspace unless a deliberate draft schema is added. |
| Manual edge form state | `AddManualEdgePanel` | Not persisted | Local form draft. Creates canonical edge only after validation and `insertManualEdge` succeeds | manual edge creation UI | Source/target options derive from graph. If graph changes, form selections must be revalidated. |
| Local command text and results | `LocalCommandImportPanel` | Not persisted | Text, validation result, dry-run/apply result, and messages are temporary. Apply mutates graph only through `applyEFlowCommandToGraph` and `onApplyGraph` | command import UI | Do not auto-apply chat output. Do not let dry-run result replace graph. Do not persist stale validation result as truth. |
| AI chat API key | `AIChatConsole` | Session storage only under `eflow.aiChat.apiKey` when "remember" is checked. Legacy localStorage key is cleared. Never exported. | User entry only. Frontend sends to `/api/chat-with-files`; backend may fall back to `OPENAI_API_KEY` | AI chat request | Forbidden in localStorage, workspace JSON, exported context, logs, or error messages. |
| AI chat model and prompt modes | `AIChatConsole` | Not persisted | Local controls only | chat request composition | Model choice and prompt mode do not change graph state. |
| AI chat messages, draft, attachments, previous/latest response ids | `AIChatConsole`; backend route for request-time files | Not persisted in workspace | Local temporary state. Files are validated client-side and server-side. Provider response id is for continuation only | chat display and request payload | Chat history is not audit history. Attached context is read-only. Provider ids are not graph revisions. |
| AI chat selected context text | `AIChatConsole` plus `buildAIChatPrompt.ts` | Not persisted | Derived from current input/graph when user chooses summary/full context | chat request | Sending full context means it leaves the browser via `/api/chat-with-files`. It still must not mutate graph. |
| Serverless chat request fields/files/uploads | `api/chat-with-files.ts` | Request-time only; OpenAI file uploads happen outside workspace persistence | Parse multipart, validate file extensions and size, upload to OpenAI, call Responses API, return redacted output | AI chat response | Do not add persistent server-side workspace state here. This route is an AI boundary, not a backend datastore. |
| Locale | `src/lib/i18n/language-context.tsx` | Browser localStorage key `eflow.ui.locale` | UI preference only. Updates document language | all translated UI | Locale is not workspace/project state and must not be included in graph or workspace documents. |
| Collapsible section open state | `CollapsibleSection` | Not persisted | Local `isOpen` only | right-panel layout | Section open/closed state is explicitly not workspace state. |
| Route and tutorial mode | `App.tsx` route reader | Browser location only | `popstate` updates route. `/tutorial` renders tutorial page; `?tour=1` annotates app | tutorial UI | Tutorial state must not alter graph or workspace state. |
| Import textarea/message state | `WorkspacePersistencePanel` | Not persisted | Local parse/validation UI only. Successful import delegates to `App.tsx` | workspace import UI | Do not keep imported JSON as shadow state after import. |
| Export download/copy messages | Export panel components | Not persisted | Local UI feedback only | export UI | Export status must not be interpreted as save status. |

## Persistence Ownership

Persistence is snapshot-based.

`buildWorkspaceDocument` is the only normal constructor for workspace snapshots.
It includes:

- `engineeringFlowInput`
- `engineeringFlowGraph`
- `selectedNodeId`
- `selectedEdgeId`
- `auditLog`
- workspace metadata such as `schemaVersion`, `appVersion`, `savedAt`, and
  `workspaceName`

Autosave is owned by `App.tsx`. It debounces for 250ms and writes through
`saveWorkspaceToLocalStorage`. Autosave must never mutate canonical state. It is
a persistence side effect only.

Workspace import is owned by `WorkspacePersistencePanel` for parsing and schema
selection, then by `App.tsx` for applying state. Import must validate before it
can replace live state. Import also resets dirty/regeneration UI state and
records an import audit event.

Full AI Context import can restore input and graph but cannot restore workspace
audit history because that artifact does not carry it.

`eflow-context/v0.1` is not a workspace restore format. It is the preferred
AI-readable handoff format.

## Graph Ownership

The graph owns:

- node identity, type, title, description, summary, confidence, position,
  provenance, review state, lifecycle state, command provenance,
  implementation state, and metadata
- edge identity, source, target, relationship type, description, confidence,
  provenance, review state, lifecycle state, command provenance,
  implementation state, and metadata
- graph identity, title, source input id, creation time, and update time

The graph does not own:

- React Flow node/edge instances
- canvas filters
- review queues
- lifecycle buckets
- dependency indexes
- Mermaid text
- AI chat responses
- workspace autosave status

Allowed graph creation/replacement paths:

- deterministic generation from `EngineeringFlowInput`
- validated Workspace JSON import
- validated Full AI Context import
- manual graph edit helper results
- successful `eflow-command/v0.1` apply result

Allowed graph patch paths:

- `updateNode`
- `updateEdge`
- manual insertion helpers
- command apply helpers

Graph apply safety rules:

- missing node or edge targets are rejected
- edge source and target must exist
- self-edges are rejected
- exact duplicate source/target/relationship edges are rejected
- unsupported graph node types and relationship types are rejected
- unsupported review-status mappings are rejected
- dry-run returns the original graph
- failed operations do not partially apply

## Review and Lifecycle Ownership

Review state answers: "Can this architecture claim be trusted?"

Lifecycle state answers: "Where is this item in implementation?"

These must remain separate.

Current internal graph compatibility:

- node review state lives in legacy `node.status`
- edge review state lives in legacy `edge.status`
- formal command/context review state is `reviewStatus`
- implementation progress lives in `lifecycleStatus`

Rules:

- Never put lifecycle values such as `completed`, `blocked`, `developing`,
  `ready`, or `planned` into graph `status`.
- Never infer `confirmed` from `completed`.
- Never infer `completed` from `confirmed`.
- Missing `lifecycleStatus` displays as `planned`, but this default is
  derived-only until explicitly written by a user action, manual creation, or
  command.
- Node `reviewStatus: "rejected"` cannot currently be represented by
  `node.status`; command apply must reject it.
- Edge `reviewStatus: "needs_review"` cannot currently be represented by
  `edge.status`; command apply must reject it.

## Selection Ownership

Selection is workspace navigation state, not domain truth.

`App.tsx` stores:

- `selectedNodeId`
- `selectedEdgeId`

The two fields are mutually exclusive. The selected node/edge objects are
derived by lookup in `InspectorPanel`.

Selection is persisted in Workspace JSON because it helps restore local working
context. It is not exported as AI context truth. On restore, selection must be
validated against the imported graph. If a canvas filter hides the selected
item, the canvas may clear selection; that does not mutate the graph.

Forbidden pattern:

```text
const [selectedNode, setSelectedNode] = useState<EngineeringNode | null>(...)
```

Store ids, then derive objects from the current graph.

## Autosave Ownership

Autosave belongs to the workspace layer, not the domain layer.

The autosave effect in `App.tsx` watches:

- input
- graph
- selection ids
- audit log

It builds a workspace document and writes it to localStorage. The write is
best-effort and catches storage errors.

Rules:

- Autosave must not validate, normalize, or migrate live graph data.
- Autosave must not generate graph data from input.
- Autosave must not repair selection except through restore/import validation.
- Autosave status is display-only.
- Autosave must not store API keys, chat transcripts, form drafts, canvas
  filters, panel open state, or command import scratch state.

## Import and Export Ownership

Workspace backup/restore:

- owned by `WorkspacePersistencePanel`, `workspacePersistence.ts`, and
  `workspaceValidation.ts`
- canonical after successful import because it replaces live `App.tsx` state
- includes audit log when present

AI-native handoff:

- owned by `buildEflowContextExport.ts`
- derived from graph/input
- includes derived review summary, progress summary, dependency index, blocking
  questions, next development targets, Mermaid text, and command interface
  metadata
- not canonical workspace state

Legacy Full AI Context:

- owned by `exportContext.ts`
- derived from graph/input
- can be imported as a restore source for input/graph
- does not carry audit log

Command import:

- owned by `LocalCommandImportPanel`, `eflowCommandValidation.ts`, and
  `applyEflowCommand.ts`
- command JSON is temporary until validated, dry-run, and applied
- successful apply can replace the graph and append an audit event through the
  UI path
- headless apply helpers do not append audit events by themselves

Engineering input import:

- owned by `WorkspacePersistencePanel` and `App.tsx`
- replaces input, clears graph, clears selection, resets dirty state, and writes
  an import audit event

## AI-Generated Temporary State

AI-generated content has no authority until it enters one of the explicit review
paths.

AI chat state is draft-only:

- assistant messages do not mutate graph
- attached context is read-only
- response ids are provider continuation ids, not graph revisions
- files are request attachments, not workspace files
- chat history is not audit history

AI command state is draft-only until applied:

- command text is scratch state
- validation result is scratch state
- dry-run result is scratch state
- apply result becomes canonical only when `result.ok` and `result.mode ===
  "apply"` and `onApplyGraph(result.graph)` runs

AI progress sync must remain reviewable:

- commands should carry actor, command id, reason, and evidence when available
- graph changes should append command provenance
- lifecycle changes from AI reports should not imply review confirmation

## Forbidden Duplicated State

Do not add persistent or semi-persistent copies of:

- React Flow nodes or edges
- selected node or selected edge objects
- review queues
- review progress percentages
- lifecycle summaries
- trust summaries
- manual edit summaries
- dependency indexes
- blocking question lists
- next development targets
- Mermaid exports
- AI chat context summaries
- `eflow-context/v0.1` export objects
- Full AI Context export objects
- graph adjacency lists
- lifecycle count buckets
- review count buckets
- API keys in workspace or localStorage
- chat transcripts in workspace
- command import textarea contents in workspace
- panel open/closed state in workspace
- canvas/review filters in workspace

Do not introduce a second canonical store such as a reducer, Zustand store,
IndexedDB database, server workspace document, or cloud workspace record unless
the ownership model is updated in this document first.

## Derived-Only State

These values must be recomputed from current input/graph when needed:

- `toReactFlowNodes(graph)`
- `toReactFlowEdges(graph)`
- filtered canvas graph
- visible node id set
- lifecycle filter counts
- `buildReviewQueue(graph)`
- `filterReviewItems(queue, activeFilter)`
- `buildLifecycleSummary(graph)`
- `buildGraphTrustSummary(graph)`
- `buildManualEditSummary(graph)`
- `buildAIChatContextSummary({ input, graph })`
- `buildFullAIContext(input, graph)`
- `buildEFlowContextExport({ engineeringFlowInput, engineeringFlowGraph })`
- context dependency index
- context review summary
- context progress summary
- context blocking questions
- context next development targets
- context Mermaid strings
- workspace filename
- translated autosave status text

If any of these are expensive later, memoize them. Do not persist them as
workspace truth.

## Dangerous Synchronization Patterns

Avoid these patterns:

1. Mirroring graph state in a child component and trying to sync it with
   `useEffect`.
2. Using React Flow internal state as the graph authority.
3. Writing missing `lifecycleStatus: "planned"` to every item just because a
   display helper defaulted it.
4. Treating localStorage restore as a migration engine that rewrites live graph
   data.
5. Updating graph state without appending required audit events on UI mutation
   paths.
6. Appending audit events without changing graph state and then treating audit
   as truth.
7. Letting command dry-run return or display a changed graph as if it were
   applied.
8. Applying AI chat output directly to graph state.
9. Converting `reviewStatus` to `status` without checking unsupported legacy
   mappings.
10. Recomputing graph generation automatically when input changes.
11. Regenerating graph without warning when manual edits may be lost.
12. Persisting UI filters and then hiding graph data on restore in a way that
   looks like deletion.
13. Storing API keys in localStorage or workspace JSON.
14. Treating `eflow-context/v0.1` summaries as fields to sync back into graph.
15. Adding standalone decision/question command support without adding
   canonical stores, validation, persistence, import/export, and ownership
   rules.

## Future AI-Maintenance Risks

AI coding agents are likely to make the following mistakes unless explicitly
guarded:

- Treating the canvas as the source of truth because it is visually central.
- Treating `status` as generic implementation status.
- Marking nodes `completed` by writing to `status` instead of
  `lifecycleStatus`.
- Treating `completed` work as automatically `confirmed`.
- Treating `confirmed` graph claims as implemented.
- Persisting review queues, lifecycle counts, dependency indexes, or Mermaid
  output because they appear in exports.
- Adding `useState` copies for selected node objects or React Flow nodes.
- Making AI chat auto-apply suggestions for convenience.
- Saving chat history or API keys into workspace autosave.
- Expanding `/api/chat-with-files` into a hidden backend workspace authority.
- Assuming Workspace JSON is the AI handoff format instead of
  `eflow-context/v0.1`.
- Widening `eflow-command/v0.1` support without updating graph compatibility,
  validation, command interface descriptors, and this document.
- Adding a database, auth, cloud sync, MCP server, repo analyzer, or autonomous
  execution path and accidentally creating another source of truth.
- Migrating legacy `status` to formal `reviewStatus` in only one layer.
- Treating audit log entries as undo/replay data.

## Maintainer Rules

Before changing state behavior:

1. Identify the canonical owner.
2. Identify whether the value is persisted, derived, or UI-only.
3. Define the only mutation path.
4. Check import/export behavior.
5. Check autosave behavior.
6. Check AI handoff and command behavior.
7. Update validation before accepting persisted data.
8. Update this document if ownership changes.

Before adding new persisted state:

- add it to the relevant type
- add validation
- add workspace import/export behavior
- decide whether AI context should include it
- decide whether command import can mutate it
- decide audit behavior
- document synchronization risks

Before adding new derived state:

- keep it as a function or memoized projection
- name its canonical inputs
- avoid persisting it
- avoid syncing it back through effects

## Short Version

The graph is truth. The workspace is a snapshot. The canvas is a view. Review
state and lifecycle state are separate. AI chat is draft-only. AI commands are
drafts until Validate -> Dry Run -> Apply succeeds. Exports are derived. UI
state stays UI-only unless this document says otherwise.
