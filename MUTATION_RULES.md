# MUTATION RULES

This document defines graph mutation governance for EFlow. It is about
preserving graph integrity and trust semantics, not generic React state advice.

The central rule:

```text
EngineeringFlowGraph is canonical architecture truth.
Every mutation must enter through an approved boundary.
```

Any change that creates, replaces, patches, imports, or transitions graph nodes
or graph edges must preserve:

- graph referential integrity
- directed typed edge semantics
- review status vs lifecycle status separation
- provenance and command provenance
- dry-run and failed-apply immutability
- local-first, owner-reviewed trust boundaries

## Authoritative Mutation Modules

These modules define the current mutation mechanics:

- `src/App.tsx`: live workspace owner and UI mutation callback boundary.
- `src/lib/generateEngineeringFlow.ts`: deterministic graph generation.
- `src/lib/manualGraphEditing.ts`: manual node and edge creation/insertion.
- `src/lib/eflowCommandValidation.ts`: command envelope schema validation.
- `src/lib/applyEflowCommand.ts`: command dry-run and apply semantics.
- `src/lib/workspaceValidation.ts`: workspace/import graph validation.
- `src/lib/workspacePersistence.ts`: workspace snapshot construction and local persistence.
- `src/lib/auditLog.ts`: compact local audit event creation and trimming.

Related constitutional rules live in `INVARIANT_REGISTRY.md`, especially:

- `INV-001`: `EngineeringFlowGraph` is canonical architecture truth.
- `INV-006`: human review is the trust boundary.
- `INV-007`: review state and lifecycle state must never collapse.
- `INV-010`: graph mutations must preserve referential integrity.
- `INV-011`: AI command intake is Validate -> Dry Run -> Apply.
- `INV-012`: dry-run and failed apply must not mutate or partially apply.
- `INV-014`: AI chat is draft-only and cannot mutate graph state.
- `INV-021`: manual edits are first-class graph data with manual provenance.
- `INV-022`: provenance must survive mutations, imports, and exports.

## Allowed Mutation Entrypoints

Only these entrypoints may create, replace, or patch `EngineeringFlowGraph`.

| Entrypoint | Owner | Allowed mutation | Required safety behavior |
| --- | --- | --- | --- |
| Deterministic generation | `generateEngineeringFlow` via `App.tsx` `replaceGraph` | Replace the current graph with a generated graph from `EngineeringFlowInput` | Generated nodes and edges start as `suggested`; provenance and generation rules are set; dirty input replacement must require owner confirmation when graph already exists. |
| Workspace JSON import | `WorkspacePersistencePanel` -> `workspaceValidation` -> `App.tsx` | Replace live input, graph, selection, and audit log from a valid workspace document | Must validate schema, graph shape, lifecycle values, selection shape, and audit log shape before replacing state. |
| Full AI Context import | `WorkspacePersistencePanel` -> `isFullAIContext` -> `App.tsx` | Restore input and graph only | Must validate as `engineering-flow-full-context/v0`; does not restore audit history from the artifact. |
| Engineering input import | `WorkspacePersistencePanel` -> `isEngineeringFlowInput` -> `App.tsx` | Replace input and clear graph/selection | Must validate input shape; graph is cleared because imported input is not automatically graph truth. |
| Manual node insertion | `AddManualNodePanel` -> `createManualNode` -> `insertManualNode` | Add one node to graph | Must reject duplicate node ids; must set `provenance.sourceType = "manual_edit"`; must return a new graph on success and original graph on failure. |
| Manual edge insertion | `AddManualEdgePanel` -> `createManualEdge` -> `insertManualEdge` | Add one edge to graph | Must reject duplicate edge ids, missing endpoints, self-edges, and duplicate exact relationships; must set `provenance.sourceType = "manual_edit"`. |
| Owner UI node patch | Inspector/review/canvas callback -> `App.tsx` `updateNode` | Patch an existing node by id | Must be owner-initiated UI mutation; must update graph immutably; review/lifecycle changes must append compact audit events through UI path. |
| Owner UI edge patch | Inspector/review callback -> `App.tsx` `updateEdge` | Patch an existing edge by id | Must be owner-initiated UI mutation; must update graph immutably; review/lifecycle changes must append compact audit events through UI path. |
| Local command dry-run | `LocalCommandImportPanel` -> `dryRunEFlowCommandOnGraph` | Preview command compatibility | Must validate command first; must return the original graph object; must not write graph state or audit events. |
| Local command apply | `LocalCommandImportPanel` -> `applyEFlowCommandToGraph` -> `onApplyGraph` | Replace graph with successful apply result | Must validate, graph-check, reject unsupported mappings/types, append command provenance, and return a changed graph only when every operation succeeds. |

No other graph mutation entrypoint is valid without updating this document,
`STATE_OWNERSHIP.md`, `INVARIANT_REGISTRY.md`, and the relevant ADR.

## Forbidden Direct Mutations

### AI Must Never Mutate Directly

AI output, AI chat, downstream agent reports, and provider response state must
never directly mutate:

- `EngineeringFlowGraph`
- `EngineeringNode[]`
- `EngineeringEdge[]`
- `node.status`
- `edge.status`
- `node.lifecycleStatus`
- `edge.lifecycleStatus`
- `node.provenance`
- `edge.provenance`
- `commandProvenance`
- `implementation`
- `auditLog`
- Workspace JSON or localStorage snapshots
- selection ids
- generated export summaries or dependency indexes

AI may only propose graph changes as:

- natural-language draft evidence for owner review
- `eflow-command/v0.1` JSON that still goes through Validate -> Dry Run -> Apply
- imported context that still goes through explicit import validation

AI chat responses are not graph patches. AI chat messages are not audit events.
Provider response ids are not graph revisions.

### UI Components Must Never Mutate Directly

UI components must not directly:

- mutate `graph.nodes` or `graph.edges` in place
- push, splice, sort, or edit canonical graph arrays directly
- keep a second canonical graph copy in component state
- treat React Flow nodes or edges as domain graph data
- persist review queues, lifecycle summaries, dependency indexes, Mermaid text,
  or export objects as graph truth
- write missing `lifecycleStatus: "planned"` merely because display code used a default
- turn canvas filters, review filters, panel state, chat state, or form drafts into graph state
- change graph data from chat output or attached context

UI components may request graph changes only through approved callbacks from
`App.tsx` or through approved helper results that are handed back to `App.tsx`.

### Persistence Must Never Mutate Domain State

Autosave and export code must not:

- generate a graph
- normalize graph items
- migrate live graph data
- repair graph references
- write derived summaries back into graph fields
- store API keys, chat transcripts, command text, UI filters, or panel state

Persistence stores snapshots. It is not a domain mutation engine.

## What Must Go Through Command Validation

Any graph update that originates from AI or another external implementation
system must enter as `eflow-command/v0.1` and pass command validation before any
graph compatibility checks.

This includes:

- AI progress sync
- Codex report converted to graph updates
- external architecture update proposals
- AI-suggested lifecycle transitions
- AI-suggested review-state changes
- AI-suggested node or edge upserts
- future CLI, MCP, REST, or tool-based graph writes

The following must not bypass command validation:

- `reviewStatus` patches from AI
- `lifecycleStatus` transitions from AI
- new AI-originated nodes
- new AI-originated edges
- implementation evidence from AI reports
- command provenance or progress-sync provenance

Owner UI changes may use local UI callbacks. AI-originated changes may not.

## What Is Allowed Only Through Deterministic Generation

The following are generation-owned unless a separate explicit mutation path is
implemented and documented:

- initial graph creation from `EngineeringFlowInput`
- source-input-to-node mapping
- source-input-to-edge mapping
- generated node positions by graph section
- generated `generationRule` values
- generated question nodes from `unknowns`
- generated `leads_to` edges from ordered flow steps
- generated `depends_on`, `uses`, `contains`, `serves`, `needs_confirmation`,
  `produces`, and `relates_to` relationships from structured input fields

Structured input edits do not partially mutate an existing graph. Once a graph
exists, input can become dirty relative to graph. Regeneration is a replacement
operation and may discard manual edits, so it requires owner confirmation when
dirty input would replace an existing graph.

## Command Application Flow

Current local command flow:

```text
Parse JSON -> Validate envelope -> Clone graph -> Apply operations to clone
-> If any graph error, return original graph -> If apply mode, return changed graph
-> UI replaces graph only when result.ok && result.mode === "apply"
```

Detailed order:

1. Parse command JSON in `LocalCommandImportPanel`.
2. Validate the envelope with `validateEFlowCommandEnvelope`.
3. Reject immediately if command validation has errors.
4. For dry-run, call `dryRunEFlowCommandOnGraph`.
5. For apply, call `applyEFlowCommandToGraph`.
6. `applyEflowCommand.ts` clones the input graph before operation checks.
7. Operations are processed in order against the clone.
8. If any operation produces a graph-compatibility error, processing stops.
9. On error, the result returns `ok: false`, `changes: []`, and the original graph.
10. On dry-run success, the result returns `ok: true`, `mode: "dry_run"`, and the original graph.
11. On apply success, the clone receives an updated `updatedAt` and is returned.
12. The UI calls `onApplyGraph(result.graph)` only for successful apply mode.
13. The UI records a compact `ai_command_applied` audit event only after successful apply mode.

Headless apply helpers do not append audit events by themselves.

## Validation Order

Validation must be layered. Do not perform graph mutation before earlier layers
have passed.

1. JSON parse validation:
   - command/import payload must parse before schema checks.
2. Command envelope validation:
   - `schemaVersion`
   - `commandId`
   - `projectId`
   - `createdAt`
   - actor shape
   - intent
   - optional mode
   - operation array
   - operation-specific field shape
   - review status enum
   - lifecycle status enum
   - provenance presence for upsert node/edge
   - evidence shape
3. Graph compatibility validation:
   - target node or edge exists for updates and transitions
   - graph-supported node type
   - graph-supported relationship type
   - edge source and target exist
   - no self-edge
   - no duplicate exact edge
   - legacy review-status mapping is representable
   - lifecycle `from` guard matches current displayed lifecycle when provided
4. Apply-mode write:
   - only after all validation and compatibility checks pass
   - return changed graph object
   - append command provenance to affected items
   - append implementation state history for lifecycle transitions
5. UI audit:
   - only after successful apply mode
   - compact event only, not full graph or full command payload

## Dry-Run Behavior

Dry-run is a compatibility check, not a preview graph.

Rules:

- Dry-run must validate the command envelope.
- Dry-run must perform the same graph compatibility checks as apply.
- Dry-run must not mutate the input graph.
- Dry-run must return the original graph object.
- Dry-run may return change summaries.
- Dry-run must not append audit events.
- Dry-run result must never replace `EngineeringFlowGraph`.
- A command with `mode: "dry_run"` must not apply even if the user presses Apply;
  `applyEFlowCommandToGraph` returns dry-run mode for that command.

## Supported Command Operations

Current graph-supported operations:

- `updateNode`
- `transitionNode`
- `upsertNode`
- `updateEdge`
- `transitionEdge`
- `upsertEdge`

Schema-valid but graph-unsupported operations:

- `addDecision`
- `addQuestion`

Unsupported operations must fail graph apply with
`command.operation_unsupported_for_graph`. They must not be smuggled into
generic metadata or fake graph nodes.

## Supported Graph Types

Current graph-supported node types:

- `intent`
- `user`
- `screen`
- `feature`
- `flow_step`
- `data_object`
- `ai_task`
- `question`

Current graph-supported relationship types:

- `serves`
- `uses`
- `leads_to`
- `contains`
- `depends_on`
- `produces`
- `needs_confirmation`
- `relates_to`

Command schema may define additional future node or relationship types. Current
graph apply must reject schema-valid types outside the current graph model.

## Provenance Requirements

Every graph node and edge must carry provenance.

Generation provenance:

- Generated nodes must include `sourceType`, source input section/id when
  available, and `generationRule`.
- Generated edges must include source input ids when available and
  `generationRule`.
- Generated graph data starts as review `suggested`.

Manual provenance:

- Manual nodes and edges must use `provenance.sourceType = "manual_edit"`.
- Manual nodes use `generationRule = "human_added_node"`.
- Manual edges use `generationRule = "human_added_edge"`.
- Manual provenance means human-added, not objectively verified.

Command provenance:

- AI command apply must append `commandProvenance` to affected items.
- `commandProvenance.sourceType` is:
  - `ai_progress_sync` when command intent is `progress_sync`
  - `ai_command` otherwise
- Command provenance should preserve:
  - `commandId`
  - actor id
  - project id
  - command creation time
  - mutation update time
  - operation reason
  - operation evidence
  - operation metadata
- If command patch/upsert provides graph provenance, it must be converted into
  graph-compatible node/edge provenance and should preserve reason and evidence.

Provenance must not be casually overwritten. Broad object replacement that drops
`provenance`, `commandProvenance`, `implementation`, or `evidence` violates
mutation governance.

## Lifecycle Transition Rules

Lifecycle status answers:

```text
Where is this item in implementation?
```

Allowed lifecycle values:

- `draft`
- `planned`
- `ready`
- `developing`
- `completed`
- `blocked`
- `needs_refactor`
- `deprecated`

Rules:

- Lifecycle state lives only in `lifecycleStatus`.
- Lifecycle values must never be written into `node.status` or `edge.status`.
- Missing `lifecycleStatus` is treated as `planned` for display, summaries,
  filters, exports, and command transition comparisons.
- Missing `lifecycleStatus` must not be written back merely to normalize data.
- `transitionNode` and `transitionEdge` may include `from`.
- If `from` is provided, it must equal the current lifecycle, where missing
  current lifecycle counts as `planned`.
- If `from` does not match, apply must fail with
  `graph.lifecycle_transition_conflict`.
- A lifecycle transition does not imply review confirmation.
- `completed` does not imply `confirmed`.
- `confirmed` does not imply `completed`.
- Command lifecycle changes should append implementation `stateHistory`.
- AI-reported lifecycle changes remain reviewable evidence unless applied
  through valid command flow.

## Review-Status Transition Rules

Review status answers:

```text
Can this architecture claim be trusted?
```

Legacy graph review fields:

- `EngineeringNode.status`: `suggested | confirmed | needs_review`
- `EngineeringEdge.status`: `suggested | confirmed | rejected`

Formal AI-facing review status:

- `reviewStatus`: `suggested | confirmed | needs_review | rejected`

Mapping rules:

- Command node `reviewStatus: "suggested"` maps to `node.status = "suggested"`.
- Command node `reviewStatus: "confirmed"` maps to `node.status = "confirmed"`.
- Command node `reviewStatus: "needs_review"` maps to `node.status = "needs_review"`.
- Command node `reviewStatus: "rejected"` is unsupported and must be rejected.
- Command edge `reviewStatus: "suggested"` maps to `edge.status = "suggested"`.
- Command edge `reviewStatus: "confirmed"` maps to `edge.status = "confirmed"`.
- Command edge `reviewStatus: "rejected"` maps to `edge.status = "rejected"`.
- Command edge `reviewStatus: "needs_review"` is unsupported and must be rejected.

Rules:

- Do not store both `status` and `reviewStatus` on graph nodes or edges.
- Do not use lifecycle state as review state.
- Do not infer review confirmation from implementation progress.
- UI review actions may update legacy graph status through `App.tsx` callbacks.
- AI review-status changes must go through command validation and graph apply.

## Graph Consistency Invariants

Every valid `EngineeringFlowGraph` must preserve these invariants:

- `schemaVersion` is `engineering-flow-graph/v0`.
- `nodes` is an array.
- `edges` is an array.
- Every node has:
  - non-empty `id`
  - supported `type`
  - non-empty `title`
  - valid legacy review `status`
  - non-empty `aiReadableSummary`
  - numeric `position.x`
  - numeric `position.y`
  - provenance
  - optional valid `lifecycleStatus`
- Every edge has:
  - non-empty `id`
  - existing `source` node id
  - existing `target` node id
  - supported `relationshipType`
  - valid legacy review `status`
  - string `description`
  - provenance
  - optional valid `lifecycleStatus`
- Graph updates must refresh `updatedAt` when a graph change is applied.
- Failed mutation helpers return the original graph.
- Successful mutation helpers return a new graph object.

## Edge Validation Rules

Edges are directed typed relationships:

```text
source --relationshipType--> target
```

Rules:

- Edge source must reference an existing node.
- Edge target must reference an existing node.
- Edge source and target must not be the same node.
- Edge relationship type must be supported by the current graph.
- Edge direction must preserve semantic meaning, not visual convenience.
- `A depends_on B` means A depends on B and B blocks A in dependency export.
- `flow_step_1 leads_to flow_step_2` means sequence direction.
- `feature uses data_object` means feature reads or uses that data object.
- `ai_task needs_confirmation feature/screen` means AI work requires human confirmation for the target.

Manual and command edge insertion must enforce these rules before returning a
changed graph.

## Duplicate Prevention Rules

Duplicate prevention is part of graph integrity.

Rules:

- Manual node insertion must reject duplicate node ids with `graph.duplicate_node`.
- Manual edge insertion must reject duplicate edge ids with `graph.duplicate_edge`.
- Manual edge insertion must reject duplicate exact relationships with
  `graph.duplicate_exact_edge`.
- Command edge upsert/update must reject duplicate exact relationships with
  `graph.duplicate_exact_edge`.
- A duplicate exact relationship is another edge with the same:
  - `source`
  - `target`
  - `relationshipType`
- For command edge update/upsert, the current edge id is excluded from exact
  duplicate comparison.
- Opposite-direction edges are not exact duplicates, but they must still be
  semantically justified.
- Two edges with the same source and target but different relationship types are
  not exact duplicates, but they must still carry meaningful distinct semantics.

## Mutation Source Matrix

| Source | May mutate graph directly? | Required path |
| --- | --- | --- |
| Deterministic generation | Yes, by replacement only | `generateEngineeringFlow` -> `App.tsx` `replaceGraph` |
| Owner inspector edit | Yes, via callback only | `NodeInspector`/`EdgeInspector` -> `App.tsx` `updateNode`/`updateEdge` |
| Owner review action | Yes, via callback only | `ReviewPanel` -> `App.tsx` `updateNode`/`updateEdge` |
| Canvas drag | Only `node.position` | `EngineeringFlowCanvas` -> `App.tsx` `updateNodePosition` |
| Manual node form | Yes, after helper success | `createManualNode` -> `insertManualNode` -> `onApplyGraph` |
| Manual edge form | Yes, after helper success | `createManualEdge` -> `insertManualEdge` -> `onApplyGraph` |
| Workspace import | Yes, after validation | `validateEFlowWorkspaceDocument` -> `App.tsx` import |
| Full AI Context import | Yes, after validation | `isFullAIContext` -> workspace import path |
| AI chat | No | Draft only; optional command text must be imported manually |
| Codex report | No | Owner review or valid `eflow-command/v0.1` |
| AI command JSON | Not until applied | Validate -> Dry Run -> Apply |
| Export builder | No | Derived read-only artifact |
| Autosave | No | Snapshot side effect only |
| Serverless chat route | No | Provider request boundary only |

## Audit Requirements For Mutations

Audit is compact local history, not graph truth.

Rules:

- UI graph generation/replacement should record `graph_generated` or `graph_replaced`.
- Workspace import should record `workspace_imported`.
- Full AI Context import should record `full_ai_context_imported`.
- Engineering input import should record `engineering_input_imported`.
- Manual node creation should record `manual_node_created`.
- Manual edge creation should record `manual_edge_created`.
- Successful AI command apply should record `ai_command_applied`.
- UI review status changes should record node/edge review audit events.
- UI lifecycle status changes should record node/edge lifecycle audit events.
- Headless command helpers must not append audit events by themselves.
- Failed commands and dry-runs must not record applied-command audit events.
- Audit payloads must remain compact and must not contain full graph snapshots,
  full imported command payloads, API keys, chat transcripts, or provider state.

## Mutation Governance Checklist

Before adding or changing a graph mutation path:

1. Identify whether the source is owner UI, deterministic generation, import, or AI command.
2. Confirm the mutation enters through an allowed entrypoint.
3. Preserve `EngineeringFlowGraph` as the only architecture graph authority.
4. Validate schema before accepting imported or command data.
5. Validate graph compatibility before returning changed graph data.
6. Preserve review status and lifecycle status separation.
7. Preserve node and edge provenance.
8. Append command provenance for AI-command mutations.
9. Reject missing endpoints, self-edges, unsupported types, and duplicate exact edges.
10. Preserve dry-run and failed-apply immutability.
11. Update audit behavior for UI mutation paths.
12. Update `eflow-context/v0.1` command interface metadata if command support changes.
13. Update `INVARIANT_REGISTRY.md`, `STATE_OWNERSHIP.md`, and ADRs if ownership changes.

## Absolute Non-Negotiables

- AI chat must never mutate graph state.
- Dry-run must never mutate graph state.
- Failed apply must never partially mutate graph state.
- Lifecycle values must never be written into legacy review `status`.
- Review confirmation must never be inferred from implementation progress.
- Implementation completion must never be inferred from review confirmation.
- Edges must never point to missing nodes.
- Self-edges must never be accepted.
- Duplicate exact edges must never be accepted.
- Unsupported command types must never be hidden in generic metadata as if supported.
- Provenance must never be stripped from graph items.
- Workspace persistence must never become a mutation or migration layer.
