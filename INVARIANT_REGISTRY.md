# INVARIANT REGISTRY

This registry is the constitutional law layer for EFlow. It defines operational
architecture invariants that must survive AI-generated patches, refactors,
feature additions, UI rewrites, persistence migrations, and import/export
evolution.

These are not style rules. They are trust, graph, persistence, mutation, review,
provenance, and AI-governance laws. A change that violates an invariant is not
architecturally complete until the invariant is preserved, intentionally amended,
or replaced with a reviewed architecture decision.

## Severity Scale

- `constitutional`: breaking this changes what EFlow is.
- `critical`: breaking this can corrupt trust, graph truth, persistence, AI
  boundaries, or user safety.
- `high`: breaking this creates drift, stale state, unsafe handoff, or
  hard-to-debug synchronization behavior.

## Category Index

- Canonical Truth
- Graph Integrity
- Trust Boundary
- State Ownership
- AI Governance
- Persistence
- Export
- Mutation Safety
- Review Semantics
- Provenance
- Privacy
- Architecture Evolution

---

## INV-001: EngineeringFlowGraph Is Canonical Architecture Truth

- invariantId: `INV-001`
- title: `EngineeringFlowGraph Is Canonical Architecture Truth`
- category: `Canonical Truth`
- severity: `constitutional`
- description: `EngineeringFlowGraph` is the canonical in-app architecture graph after generation or import. It owns graph nodes, edges, review state, lifecycle state, provenance, graph positions, relationships, command provenance, implementation metadata, and timestamps.
- rationale: EFlow is an engineering graph system, not a diagramming app or chat transcript. All review, lifecycle, export, command, and handoff behavior must converge on one structured graph.
- violation consequences: Architecture truth splits across UI, exports, chat, or local stores; downstream AI receives stale or conflicting context; owner review no longer has a single object to inspect.
- common accidental violations:
  - Treating React Flow nodes or edges as domain truth.
  - Treating Workspace JSON, Full AI Context, or `eflow-context/v0.1` as a live shadow graph.
  - Storing graph-derived summaries as persisted architecture facts.
  - Letting AI chat responses rewrite graph truth directly.
- enforcement points:
  - `src/types/engineeringFlow.ts`
  - `src/App.tsx`
  - `src/lib/generateEngineeringFlow.ts`
  - `src/lib/manualGraphEditing.ts`
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/workspaceValidation.ts`
- related modules:
  - `src/types/engineeringFlow.ts`
  - `src/components/graph/EngineeringFlowCanvas.tsx`
  - `src/components/inspector/InspectorPanel.tsx`
  - `src/components/command/LocalCommandImportPanel.tsx`
- related documents:
  - `README.md`
  - `SYSTEM_OVERVIEW.md`
  - `STATE_OWNERSHIP.md`
  - `docs/project-memory.md`
- related prompts:
  - `AGENTS.md` Project Identity and Strategic Architecture Update
  - `src/lib/buildAIChatPrompt.ts` system prompt
  - `src/lib/buildAIChatPrompt.ts` `progress_handoff_summary`
- related architecture decisions:
  - `ADR 002: EngineeringFlowGraph Is Canonical Architecture Truth`
  - `ADR 003: Canvas Is A Derived Rendering Layer`
  - `ADR 018: Hidden State Ownership Is An Architecture Risk`

## INV-002: Canvas Is Rendering, Not Graph Ownership

- invariantId: `INV-002`
- title: `Canvas Is Rendering, Not Graph Ownership`
- category: `State Ownership`
- severity: `constitutional`
- description: React Flow canvas state must be derived from `EngineeringFlowGraph`. Canvas filtering, selection styling, and layout behavior may affect display; only intentional node position updates may write back to the graph through `App.tsx`.
- rationale: The canvas is a view over structured graph data. EFlow must remain AI-readable and schema-first even if the visual layer is rewritten.
- violation consequences: Visual state becomes a second graph store; exports and review panels drift from what the owner sees; canvas filters may appear to delete or rewrite project truth.
- common accidental violations:
  - Introducing `useNodesState` or `useEdgesState` as canonical graph state.
  - Persisting filtered canvas nodes or visible edge sets.
  - Updating edge semantics from visual connector state.
  - Treating hidden-by-filter nodes as deleted.
- enforcement points:
  - `src/lib/graphAdapters.ts`
  - `src/components/graph/EngineeringFlowCanvas.tsx`
  - `src/App.tsx` `updateNodePosition`
- related modules:
  - `src/lib/graphAdapters.ts`
  - `src/components/graph/EngineeringFlowCanvas.tsx`
  - `src/components/graph/EngineeringNodeCard.tsx`
- related documents:
  - `SYSTEM_OVERVIEW.md`
  - `STATE_OWNERSHIP.md`
  - `ARCHITECTURE_DECISIONS.md`
- related prompts:
  - `AGENTS.md` Strategic Architecture Update
  - `src/lib/buildAIChatPrompt.ts` system prompt
- related architecture decisions:
  - `ADR 003: Canvas Is A Derived Rendering Layer`
  - `ADR 018: Hidden State Ownership Is An Architecture Risk`

## INV-003: App Owns Live Workspace State

- invariantId: `INV-003`
- title: `App Owns Live Workspace State`
- category: `State Ownership`
- severity: `critical`
- description: `src/App.tsx` owns the live in-memory workspace snapshot: `EngineeringFlowInput`, `EngineeringFlowGraph | null`, selection ids, audit log, dirty-regeneration warning state, and autosave status. Child components may mutate domain state only through callbacks supplied by `App.tsx`.
- rationale: A single live owner prevents child panels, canvas, import forms, and AI tooling from creating competing state authorities.
- violation consequences: Imported data, inspector edits, review actions, command apply, and autosave can overwrite each other or become stale.
- common accidental violations:
  - Adding a global store without updating the ownership model.
  - Letting a child component keep a graph copy and synchronize it with effects.
  - Letting export/import panels retain imported JSON as shadow state after import.
  - Branching domain logic on localized autosave status text.
- enforcement points:
  - `src/App.tsx`
  - `src/components/inspector/InspectorPanel.tsx`
  - `src/components/export/WorkspacePersistencePanel.tsx`
- related modules:
  - `src/App.tsx`
  - `src/components/layout/Workspace.tsx`
  - `src/components/inspector/InspectorPanel.tsx`
- related documents:
  - `STATE_OWNERSHIP.md`
  - `SYSTEM_OVERVIEW.md`
- related prompts:
  - `AGENTS.md` Current Core Product Principles
  - `AI_HANDOFF.md` Before Making Changes
- related architecture decisions:
  - `ADR 001: Local-First Workspace Is The Runtime Boundary`
  - `ADR 018: Hidden State Ownership Is An Architecture Risk`

## INV-004: Schemas Are Product Contracts

- invariantId: `INV-004`
- title: `Schemas Are Product Contracts`
- category: `Canonical Truth`
- severity: `constitutional`
- description: Core EFlow concepts must remain explicit TypeScript schemas and versioned JSON contracts. New persisted or AI-facing fields require validation, persistence behavior, import/export behavior, command compatibility, provenance behavior, and documentation.
- rationale: EFlow exists to make project context machine-readable and reviewable. Freeform notes, screenshots, UI-only objects, or untyped metadata cannot carry architectural authority.
- violation consequences: AI handoff becomes ambiguous; commands cannot be safely validated; old workspaces may be accepted incorrectly; schema drift becomes invisible.
- common accidental violations:
  - Adding fields to graph items without validation.
  - Hiding new domain concepts in `metadata`.
  - Adding command support without updating `eflow-context/v0.1` command metadata.
  - Changing enum values to match localized UI labels.
- enforcement points:
  - `src/types/engineeringFlow.ts`
  - `src/types/eflowCommand.ts`
  - `src/types/eflowContext.ts`
  - `src/types/eflowAudit.ts`
  - `src/lib/workspaceValidation.ts`
  - `src/lib/eflowCommandValidation.ts`
- related modules:
  - `src/types/*`
  - `src/lib/workspaceValidation.ts`
  - `src/lib/buildEflowContextExport.ts`
- related documents:
  - `README.md`
  - `SYSTEM_OVERVIEW.md`
  - `STATE_OWNERSHIP.md`
  - `CONTEXT_MANIFEST.md`
- related prompts:
  - `AGENTS.md` Core Mechanism 1
  - `AGENTS.md` Core Mechanism 2
  - `src/lib/buildAIChatPrompt.ts` `raw_idea_to_input`
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
- related architecture decisions:
  - `ADR 004: Schema-First Design Over Freeform Notes`
  - `ADR 013: Command Schema May Be Wider Than Current Graph Support`
  - `ADR 022: Architecture Evolution Must Preserve Explicit Compatibility`

## INV-005: Deterministic Generation Creates Suggestions, Not Truth

- invariantId: `INV-005`
- title: `Deterministic Generation Creates Suggestions, Not Truth`
- category: `Trust Boundary`
- severity: `critical`
- description: `generateEngineeringFlow` must deterministically transform `EngineeringFlowInput` into graph nodes and edges. Generated nodes and edges begin as review suggestions and must not be treated as confirmed truth merely because generation succeeded.
- rationale: Deterministic generation preserves explainability and prevents hidden AI inference from becoming trusted architecture.
- violation consequences: Plausible generated claims may be exported as trusted architecture; blocking unknowns may be hidden; downstream agents may implement unreviewed assumptions.
- common accidental violations:
  - Introducing LLM generation into the trusted graph path.
  - Setting generated nodes or edges to `confirmed` by default.
  - Dropping provenance generation rules.
  - Silently converting unknowns into architecture decisions.
- enforcement points:
  - `src/lib/generateEngineeringFlow.ts`
  - `scripts/validateExample.ts`
  - `src/lib/trustSummary.ts`
  - `src/lib/buildReviewQueue.ts`
- related modules:
  - `src/data/todoThoughtUniverseExample.ts`
  - `src/data/emptyEngineeringFlowInput.ts`
  - `src/lib/generateEngineeringFlow.ts`
- related documents:
  - `README.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/owner-workflow.md`
- related prompts:
  - `src/lib/buildAIChatPrompt.ts` `raw_idea_to_input`
  - `AGENTS.md` Current Core Product Principles
- related architecture decisions:
  - `ADR 005: Graph Generation Is Deterministic And Reviewable`
  - `ADR 006: Human Review Is The Trust Boundary`

## INV-006: Human Review Is The Trust Boundary

- invariantId: `INV-006`
- title: `Human Review Is The Trust Boundary`
- category: `Trust Boundary`
- severity: `constitutional`
- description: Generated, imported, AI-suggested, and Codex-reported information is evidence until a human owner reviews it and updates graph review or lifecycle state through an approved path.
- rationale: EFlow is built to prevent AI plausibility from becoming project truth without owner review.
- violation consequences: AI output can silently become architecture truth; lifecycle completion can be trusted without verification; owner review queues lose meaning.
- common accidental violations:
  - Treating Codex completion reports as automatic `completed` state.
  - Auto-confirming imported or AI-command items.
  - Letting chat responses mutate graph state.
  - Marking manual edits trusted solely because they were human-added.
- enforcement points:
  - `src/lib/buildReviewQueue.ts`
  - `src/components/review/ReviewPanel.tsx`
  - `src/components/inspector/NodeInspector.tsx`
  - `src/components/inspector/EdgeInspector.tsx`
  - `src/components/command/LocalCommandImportPanel.tsx`
- related modules:
  - `src/lib/buildReviewQueue.ts`
  - `src/lib/trustSummary.ts`
  - `src/lib/buildAIChatPrompt.ts`
- related documents:
  - `README.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/owner-workflow.md`
  - `docs/project-memory.md`
- related prompts:
  - `AGENTS.md` AI / Codex operating rules
  - `AI_HANDOFF.md` Critical Rules
  - `src/lib/buildAIChatPrompt.ts` system prompt
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
- related architecture decisions:
  - `ADR 006: Human Review Is The Trust Boundary`
  - `ADR 016: AI Chat Is Draft-Only And Does Not Own Graph State`
  - `ADR 021: Autonomous AI Mutation Is Forbidden By Default`

## INV-007: Review State And Lifecycle State Must Never Collapse

- invariantId: `INV-007`
- title: `Review State And Lifecycle State Must Never Collapse`
- category: `Review Semantics`
- severity: `constitutional`
- description: Review status answers whether an architecture claim is trusted. Lifecycle status answers where the item is in implementation. Legacy graph `node.status` and `edge.status` remain review fields; implementation progress belongs only in `lifecycleStatus`.
- rationale: A confirmed claim can be unimplemented, and a completed implementation can still require architecture review.
- violation consequences: Exports mislead downstream AI; review queues and lifecycle summaries become false; commands may write incompatible states into legacy fields.
- common accidental violations:
  - Writing `completed`, `blocked`, `developing`, `ready`, or `planned` into `status`.
  - Treating `confirmed` as implemented.
  - Treating `completed` as confirmed.
  - Migrating to `reviewStatus` in only one layer.
- enforcement points:
  - `src/types/engineeringFlow.ts`
  - `src/types/eflowCommand.ts`
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/buildEflowContextExport.ts`
  - `src/lib/buildLifecycleSummary.ts`
  - `src/lib/buildReviewQueue.ts`
- related modules:
  - `src/components/inspector/NodeInspector.tsx`
  - `src/components/inspector/EdgeInspector.tsx`
  - `src/components/review/ReviewPanel.tsx`
  - `src/components/lifecycle/LifecycleProgressSummary.tsx`
- related documents:
  - `README.md`
  - `STATE_OWNERSHIP.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/owner-workflow.md`
- related prompts:
  - `AGENTS.md` Core Mechanism 3
  - `src/lib/buildAIChatPrompt.ts` system prompt
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
  - `HANDOFF.md` Status Model Rules
- related architecture decisions:
  - `ADR 007: Review State And Lifecycle State Are Separate`
  - `ADR 022: Architecture Evolution Must Preserve Explicit Compatibility`

## INV-008: Missing Lifecycle Defaults Are Derived Only

- invariantId: `INV-008`
- title: `Missing Lifecycle Defaults Are Derived Only`
- category: `Review Semantics`
- severity: `critical`
- description: Missing node or edge `lifecycleStatus` is displayed, summarized, filtered, and exported as `planned`, but this default must not be written back to graph data unless a user action, manual creation, or successful command explicitly mutates lifecycle state.
- rationale: Defaulting is compatibility behavior, not a data migration. Writing defaults everywhere creates noisy churn and hides whether lifecycle was intentionally set.
- violation consequences: Workspaces receive false implementation metadata; command diffs become noisy; future migrations cannot distinguish absent legacy data from explicit planning state.
- common accidental violations:
  - Normalizing every graph item to `lifecycleStatus: "planned"` during autosave or export.
  - Writing display defaults back from lifecycle summaries or canvas filters.
  - Importing old workspaces and mutating live graph data during validation.
- enforcement points:
  - `src/lib/buildLifecycleSummary.ts`
  - `src/lib/buildEflowContextExport.ts`
  - `src/components/graph/EngineeringFlowCanvas.tsx`
  - `src/lib/workspaceValidation.ts`
  - `scripts/validateExample.ts`
- related modules:
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/manualGraphEditing.ts`
  - `src/components/lifecycle/LifecycleProgressSummary.tsx`
- related documents:
  - `README.md`
  - `STATE_OWNERSHIP.md`
  - `docs/project-memory.md`
- related prompts:
  - `AGENTS.md` AI / Codex operating rules
  - `HANDOFF.md` Status Model Rules
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
- related architecture decisions:
  - `ADR 007: Review State And Lifecycle State Are Separate`
  - `ADR 014: Persistence Is Snapshot Ownership, Not Domain Mutation`

## INV-009: Directed Typed Edges Define Relationship Semantics

- invariantId: `INV-009`
- title: `Directed Typed Edges Define Relationship Semantics`
- category: `Graph Integrity`
- severity: `critical`
- description: Every edge is directed and must use a supported `relationshipType`. Edge direction is semantic: `source --relationshipType--> target`. For dependency export, `A depends_on B` means A depends on B and B blocks A.
- rationale: Edges are not decorative lines. They drive dependency indexes, blocking analysis, review prioritization, Mermaid exports, and AI handoff.
- violation consequences: Dependencies invert; blockers are wrong; AI handoff recommends unsafe targets; review queue prioritization becomes misleading.
- common accidental violations:
  - Treating relationships as bidirectional.
  - Adding freeform relationship strings.
  - Swapping `source` and `target` for visual layout convenience.
  - Allowing unsupported command relationship types into graph data.
- enforcement points:
  - `src/types/engineeringFlow.ts`
  - `src/lib/generateEngineeringFlow.ts`
  - `src/lib/manualGraphEditing.ts`
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/buildEflowContextExport.ts`
- related modules:
  - `src/components/inspector/EdgeInspector.tsx`
  - `src/components/graphEditing/AddManualEdgePanel.tsx`
  - `src/lib/graphAdapters.ts`
- related documents:
  - `SYSTEM_OVERVIEW.md`
  - `docs/owner-workflow.md`
  - `ARCHITECTURE_DECISIONS.md`
- related prompts:
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
  - `AGENTS.md` Core Mechanism 2
- related architecture decisions:
  - `ADR 008: Directed Typed Edges Carry Architecture Semantics`
  - `ADR 013: Command Schema May Be Wider Than Current Graph Support`

## INV-010: Graph Mutations Must Preserve Referential Integrity

- invariantId: `INV-010`
- title: `Graph Mutations Must Preserve Referential Integrity`
- category: `Graph Integrity`
- severity: `critical`
- description: All graph mutation paths must reject duplicate node ids, duplicate edge ids, missing edge source or target nodes, self-edges, exact duplicate `source`/`target`/`relationshipType` edges, unsupported node types, unsupported relationship types, and unsupported review-status mappings.
- rationale: A graph that cannot be trusted structurally cannot be trusted architecturally.
- violation consequences: Canvas rendering can fail; dependency export becomes invalid; commands can create ambiguous or impossible architecture; review queues can reference missing items.
- common accidental violations:
  - Letting upsert operations bypass edge duplicate checks.
  - Adding manual edge UI validation but not helper-level validation.
  - Accepting schema-wide command types that current graph cannot represent.
  - Replacing nodes or edges with partial objects that drop required fields.
- enforcement points:
  - `src/lib/manualGraphEditing.ts`
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/workspaceValidation.ts`
  - `src/lib/eflowCommandValidation.ts`
  - `scripts/validateExample.ts`
- related modules:
  - `src/components/graphEditing/AddManualNodePanel.tsx`
  - `src/components/graphEditing/AddManualEdgePanel.tsx`
  - `src/components/command/LocalCommandImportPanel.tsx`
- related documents:
  - `STATE_OWNERSHIP.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/project-memory.md`
- related prompts:
  - `AGENTS.md` AI / Codex operating rules
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
- related architecture decisions:
  - `ADR 008: Directed Typed Edges Carry Architecture Semantics`
  - `ADR 012: Command Intake Uses Validate -> Dry Run -> Apply`
  - `ADR 019: Manual Graph Editing Produces First-Class Graph Data`

## INV-011: AI Command Intake Is Validate -> Dry Run -> Apply

- invariantId: `INV-011`
- title: `AI Command Intake Is Validate -> Dry Run -> Apply`
- category: `Mutation Safety`
- severity: `constitutional`
- description: `eflow-command/v0.1` commands are drafts until they pass schema validation, graph-compatible dry-run, and explicit local apply. Only apply mode may replace the current graph.
- rationale: EFlow is AI-writable only through a local, inspectable, owner-controlled command path.
- violation consequences: AI output becomes an unauthorized graph writer; unsafe commands can mutate state before compatibility checks; owner loses the chance to inspect failures.
- common accidental violations:
  - Auto-applying command JSON from chat.
  - Treating validation as enough to mutate the graph.
  - Letting dry-run output replace the current graph.
  - Adding a remote write API that bypasses the local import panel.
- enforcement points:
  - `src/components/command/LocalCommandImportPanel.tsx`
  - `src/lib/eflowCommandValidation.ts`
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/buildEflowContextExport.ts` command interface descriptor
- related modules:
  - `src/types/eflowCommand.ts`
  - `src/lib/buildAIChatPrompt.ts`
  - `src/components/aiChat/AIChatConsole.tsx`
- related documents:
  - `README.md`
  - `SYSTEM_OVERVIEW.md`
  - `AGENTS.md`
  - `docs/owner-workflow.md`
- related prompts:
  - `src/lib/buildAIChatPrompt.ts` system prompt
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
  - `AGENTS.md` Core Mechanism 1
- related architecture decisions:
  - `ADR 012: Command Intake Uses Validate -> Dry Run -> Apply`
  - `ADR 021: Autonomous AI Mutation Is Forbidden By Default`

## INV-012: Dry Run And Failed Apply Must Not Mutate Or Partially Apply

- invariantId: `INV-012`
- title: `Dry Run And Failed Apply Must Not Mutate Or Partially Apply`
- category: `Mutation Safety`
- severity: `critical`
- description: Dry-run must return the original graph object. Apply must clone before mutation and return a changed graph only if every operation succeeds. Any failed operation must leave the original graph unchanged and return no partial graph changes.
- rationale: Command intake is only safe if preview and failure paths are side-effect free.
- violation consequences: Dry-run becomes a hidden mutation path; failed multi-operation commands can corrupt graph state; audit events may claim a command applied when only part of it did.
- common accidental violations:
  - Mutating the passed graph before all operations are validated.
  - Returning the working graph on failure.
  - Appending audit events for failed commands.
  - Sharing nested provenance or implementation objects without cloning.
- enforcement points:
  - `src/lib/applyEflowCommand.ts`
  - `src/components/command/LocalCommandImportPanel.tsx`
  - `scripts/validateExample.ts`
- related modules:
  - `src/lib/auditLog.ts`
  - `src/types/eflowCommand.ts`
- related documents:
  - `STATE_OWNERSHIP.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/project-memory.md`
- related prompts:
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
  - `AGENTS.md` AI / Codex operating rules
- related architecture decisions:
  - `ADR 012: Command Intake Uses Validate -> Dry Run -> Apply`
  - `ADR 013: Command Schema May Be Wider Than Current Graph Support`

## INV-013: Command Schema May Be Wider Than Current Graph Support

- invariantId: `INV-013`
- title: `Command Schema May Be Wider Than Current Graph Support`
- category: `Architecture Evolution`
- severity: `high`
- description: The formal command schema may define future concepts that current `EngineeringFlowGraph` cannot represent. Schema-valid but unsupported operations or types must be rejected by graph apply and advertised in `eflow-context/v0.1` command compatibility metadata.
- rationale: Future-compatible schemas are useful only if current runtime support is explicit.
- violation consequences: Unsupported concepts get smuggled into metadata or fake graph nodes; downstream AI thinks a capability exists; future migrations inherit ambiguous data.
- common accidental violations:
  - Implementing `addDecision` or `addQuestion` as generic metadata.
  - Accepting `api_endpoint`, `service`, `blocks`, or other schema-wide types without graph-store support.
  - Forgetting to update command interface descriptors when support changes.
- enforcement points:
  - `src/types/eflowCommand.ts`
  - `src/lib/eflowCommandValidation.ts`
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/buildEflowContextExport.ts`
- related modules:
  - `src/components/command/LocalCommandImportPanel.tsx`
  - `scripts/validateExample.ts`
- related documents:
  - `ARCHITECTURE_DECISIONS.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/project-memory.md`
- related prompts:
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
  - `AGENTS.md` Core Mechanism 1
- related architecture decisions:
  - `ADR 013: Command Schema May Be Wider Than Current Graph Support`
  - `ADR 022: Architecture Evolution Must Preserve Explicit Compatibility`

## INV-014: AI Chat Is Draft-Only And Cannot Mutate Graph State

- invariantId: `INV-014`
- title: `AI Chat Is Draft-Only And Cannot Mutate Graph State`
- category: `AI Governance`
- severity: `constitutional`
- description: AI chat may reason over no context, summary context, or full `eflow-context/v0.1` context, but it must not mutate `EngineeringFlowGraph`, auto-apply commands, create audit events as truth, or silently sync lifecycle progress.
- rationale: Chat is collaboration space, not graph authority.
- violation consequences: The highest-risk AI drift path opens: plausible chat output silently rewrites project truth.
- common accidental violations:
  - Parsing assistant messages for commands and applying them automatically.
  - Treating chat history as audit history.
  - Treating provider response ids as graph revisions.
  - Persisting chat messages into workspace snapshots.
- enforcement points:
  - `src/components/aiChat/AIChatConsole.tsx`
  - `src/lib/buildAIChatPrompt.ts`
  - `src/components/command/LocalCommandImportPanel.tsx`
- related modules:
  - `api/chat-with-files.ts`
  - `src/lib/buildEflowContextExport.ts`
  - `src/lib/buildAIChatPrompt.ts`
- related documents:
  - `README.md`
  - `AI_HANDOFF.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/owner-workflow.md`
- related prompts:
  - `src/lib/buildAIChatPrompt.ts` system prompt
  - `src/lib/buildAIChatPrompt.ts` `free_chat`
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
  - `AI_HANDOFF.md` Critical Rules
- related architecture decisions:
  - `ADR 016: AI Chat Is Draft-Only And Does Not Own Graph State`
  - `ADR 021: Autonomous AI Mutation Is Forbidden By Default`

## INV-015: OpenAI Boundary Stays Behind The Chat Route

- invariantId: `INV-015`
- title: `OpenAI Boundary Stays Behind The Chat Route`
- category: `AI Governance`
- severity: `critical`
- description: Frontend code must send chat requests to `/api/chat-with-files`. OpenAI Files and Responses API calls belong in `api/chat-with-files.ts`. The route is an optional AI boundary, not a workspace backend or source of graph truth.
- rationale: Provider calls, file uploads, and sensitive error handling need one controlled boundary.
- violation consequences: API keys and provider details can leak into browser code; chat route may grow into an unreviewed backend authority; local-first assumptions become false.
- common accidental violations:
  - Calling OpenAI APIs directly from React components.
  - Adding persistent server-side workspace state to `api/chat-with-files.ts`.
  - Returning raw provider error payloads to the frontend.
  - Inferring database/auth/cloud architecture from the presence of `api/`.
- enforcement points:
  - `src/components/aiChat/AIChatConsole.tsx`
  - `api/chat-with-files.ts`
  - `AI_HANDOFF.md`
- related modules:
  - `api/chat-with-files.ts`
  - `src/lib/buildAIChatPrompt.ts`
- related documents:
  - `README.md`
  - `AI_HANDOFF.md`
  - `SYSTEM_OVERVIEW.md`
  - `PROJECT_NOTES.md`
- related prompts:
  - `AI_HANDOFF.md` Critical Rules
  - `src/lib/buildAIChatPrompt.ts` system prompt
- related architecture decisions:
  - `ADR 016: AI Chat Is Draft-Only And Does Not Own Graph State`
  - `ADR 020: Backend Assumptions Are Explicitly Avoided`

## INV-016: API Keys Are Never Workspace Or Export State

- invariantId: `INV-016`
- title: `API Keys Are Never Workspace Or Export State`
- category: `Privacy`
- severity: `critical`
- description: AI chat API keys must not be stored in Workspace JSON, graph data, AI context exports, audit events, source files, logs, or error messages. Current code may keep the key in React state and optional `sessionStorage` only, while cleaning the legacy `localStorage` key.
- rationale: API keys are personal provider credentials, not project architecture.
- violation consequences: Workspace exports become unsafe to share; secrets leak to docs, commits, provider errors, or downstream AI; local-first trust is broken.
- common accidental violations:
  - Persisting chat settings in workspace snapshots.
  - Including API key fields in audit metadata or context exports.
  - Logging `FormData` or provider request headers.
  - Reintroducing `localStorage` API-key persistence.
- enforcement points:
  - `src/components/aiChat/AIChatConsole.tsx`
  - `api/chat-with-files.ts`
  - `src/lib/workspacePersistence.ts`
  - `src/lib/buildEflowContextExport.ts`
- related modules:
  - `src/components/export/WorkspacePersistencePanel.tsx`
  - `src/lib/auditLog.ts`
- related documents:
  - `README.md`
  - `AI_HANDOFF.md`
  - `PROJECT_NOTES.md`
  - `STATE_OWNERSHIP.md`
- related prompts:
  - `AI_HANDOFF.md` Critical Rules
  - `AGENTS.md` Safety rules
- related architecture decisions:
  - `ADR 017: API Keys And Provider State Are Not Workspace State`
  - `ADR 014: Persistence Is Snapshot Ownership, Not Domain Mutation`

## INV-017: Workspace Persistence Is Snapshot Backup/Restore

- invariantId: `INV-017`
- title: `Workspace Persistence Is Snapshot Backup/Restore`
- category: `Persistence`
- severity: `critical`
- description: Workspace persistence stores snapshots of live state under `eflow.workspace.v0.3.current` and via explicit Workspace JSON. Persistence must not generate graphs, normalize live graph data, repair domain inconsistencies, or become a second authority.
- rationale: Local persistence is convenience durability, not a database, migration engine, or collaboration service.
- violation consequences: Autosave can silently rewrite graph truth; invalid data can become trusted; localStorage restore may override current state with unreviewed transformations.
- common accidental violations:
  - Running graph generation during autosave.
  - Mutating missing lifecycle fields during save/load.
  - Persisting UI filters, panel state, chat history, API keys, or command scratch state.
  - Treating localStorage as cross-device or multi-user truth.
- enforcement points:
  - `src/lib/workspacePersistence.ts`
  - `src/lib/workspaceValidation.ts`
  - `src/App.tsx` autosave effect
  - `src/components/export/WorkspacePersistencePanel.tsx`
- related modules:
  - `src/types/engineeringFlow.ts`
  - `src/lib/auditLog.ts`
- related documents:
  - `STATE_OWNERSHIP.md`
  - `SYSTEM_OVERVIEW.md`
  - `README.md`
- related prompts:
  - `AGENTS.md` Current Core Product Principles
  - `HANDOFF.md` Current Boundaries
- related architecture decisions:
  - `ADR 001: Local-First Workspace Is The Runtime Boundary`
  - `ADR 014: Persistence Is Snapshot Ownership, Not Domain Mutation`

## INV-018: Imports Must Validate Before Replacing Live State

- invariantId: `INV-018`
- title: `Imports Must Validate Before Replacing Live State`
- category: `Persistence`
- severity: `critical`
- description: Workspace JSON, Full AI Context, and EngineeringFlowInput imports must parse and validate their schema before replacing live state. Workspace import must validate graph shape, lifecycle values, selection shape, and audit log shape.
- rationale: Imports are trust-boundary crossings from arbitrary JSON into canonical local state.
- violation consequences: Malformed graph references, invalid lifecycle statuses, fake audit logs, or unsupported schema versions can become live workspace truth.
- common accidental violations:
  - Casting parsed JSON directly to workspace types.
  - Accepting malformed `auditLog`.
  - Preserving invalid selection ids after graph import.
  - Importing `eflow-context/v0.1` as workspace state without a designed importer.
- enforcement points:
  - `src/lib/workspaceValidation.ts`
  - `src/components/export/WorkspacePersistencePanel.tsx`
  - `src/App.tsx` `importWorkspaceDocument`
  - `scripts/validateExample.ts`
- related modules:
  - `src/lib/workspacePersistence.ts`
  - `src/lib/exportContext.ts`
  - `src/types/engineeringFlow.ts`
- related documents:
  - `README.md`
  - `STATE_OWNERSHIP.md`
  - `docs/owner-workflow.md`
- related prompts:
  - `AGENTS.md` Safety rules
  - `HANDOFF.md` Validation Guidance
- related architecture decisions:
  - `ADR 014: Persistence Is Snapshot Ownership, Not Domain Mutation`
  - `ADR 015: Import And Export Formats Have Separate Purposes`

## INV-019: Export Artifacts Are Derived, Purpose-Specific Contracts

- invariantId: `INV-019`
- title: `Export Artifacts Are Derived, Purpose-Specific Contracts`
- category: `Export`
- severity: `critical`
- description: Workspace JSON is backup/restore. Full AI Context is legacy derived context that can restore input/graph but not audit history. `eflow-context/v0.1` is the preferred AI-readable handoff export. Export summaries, dependency indexes, Mermaid text, and command descriptors must be recomputed from canonical input/graph and not persisted back as graph truth.
- rationale: Different JSON artifacts have different consumers and authority levels.
- violation consequences: Downstream agents receive the wrong artifact; backup files are treated as prompts; derived summaries become stale canonical data.
- common accidental violations:
  - Sending Workspace JSON as the primary Codex handoff.
  - Persisting `reviewSummary` or `dependencyIndex` into graph items.
  - Importing `eflow-context/v0.1` as workspace state without an importer.
  - Treating Full AI Context as carrying audit history.
- enforcement points:
  - `src/lib/buildEflowContextExport.ts`
  - `src/lib/exportContext.ts`
  - `src/components/export/EFlowContextExportPanel.tsx`
  - `src/components/export/WorkspacePersistencePanel.tsx`
  - `src/components/export/JsonExportPanel.tsx`
- related modules:
  - `src/types/eflowContext.ts`
  - `src/types/engineeringFlow.ts`
  - `src/lib/buildAIChatPrompt.ts`
- related documents:
  - `README.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/owner-workflow.md`
  - `STATE_OWNERSHIP.md`
- related prompts:
  - `AGENTS.md` Core Mechanism 2
  - `src/lib/buildAIChatPrompt.ts` `codex_milestone_prompt`
  - `src/lib/buildAIChatPrompt.ts` `progress_handoff_summary`
- related architecture decisions:
  - `ADR 011: AI-Native Export Is Deterministic Derived Context`
  - `ADR 015: Import And Export Formats Have Separate Purposes`

## INV-020: AI-Native Export Must Advertise Command Compatibility

- invariantId: `INV-020`
- title: `AI-Native Export Must Advertise Command Compatibility`
- category: `Export`
- severity: `high`
- description: `eflow-context/v0.1` must include `commandInterface` metadata that truthfully describes accepted command schema versions, preferred operations, schema-only operations, local workflow, safety rules, status mapping, defaulting rules, audit behavior, and graph compatibility.
- rationale: Downstream AI needs machine-readable write boundaries, not implicit knowledge from docs.
- violation consequences: AI may generate commands that validate but cannot apply; unsupported statuses or types can be proposed as if current graph supports them.
- common accidental violations:
  - Adding command operations without updating `commandInterface`.
  - Changing unsupported mappings without updating export metadata.
  - Forgetting to document that dry-run is non-mutating.
  - Omitting defaulting behavior for missing lifecycle status.
- enforcement points:
  - `src/lib/buildEflowContextExport.ts`
  - `src/types/eflowContext.ts`
  - `scripts/validateExample.ts`
- related modules:
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/eflowCommandValidation.ts`
- related documents:
  - `SYSTEM_OVERVIEW.md`
  - `ARCHITECTURE_DECISIONS.md`
  - `AGENTS.md`
- related prompts:
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
  - `AGENTS.md` Core Mechanism 1
- related architecture decisions:
  - `ADR 011: AI-Native Export Is Deterministic Derived Context`
  - `ADR 012: Command Intake Uses Validate -> Dry Run -> Apply`
  - `ADR 022: Architecture Evolution Must Preserve Explicit Compatibility`

## INV-021: Manual Edits Are First-Class Graph Data With Manual Provenance

- invariantId: `INV-021`
- title: `Manual Edits Are First-Class Graph Data With Manual Provenance`
- category: `Provenance`
- severity: `critical`
- description: Manual nodes and edges must be inserted through schema-aware helpers, carry `provenance.sourceType = "manual_edit"`, preserve graph integrity, and participate in canvas, inspectors, review queues, lifecycle summaries, manual summaries, Workspace JSON, Full AI Context, and `eflow-context/v0.1`.
- rationale: Manual context fills gaps left by deterministic generation without creating side notes or canvas-only overlays.
- violation consequences: Human-added context disappears from exports or review; manual graph edits become untracked UI decoration; downstream AI misses critical context.
- common accidental violations:
  - Storing manual edits outside `EngineeringFlowGraph`.
  - Treating `manual_edit` as objective proof of truth.
  - Bypassing duplicate id or edge integrity checks.
  - Forgetting manual edits in export builders.
- enforcement points:
  - `src/lib/manualGraphEditing.ts`
  - `src/components/graphEditing/AddManualNodePanel.tsx`
  - `src/components/graphEditing/AddManualEdgePanel.tsx`
  - `src/lib/buildManualEditSummary.ts`
  - `scripts/validateExample.ts`
- related modules:
  - `src/components/graphEditing/ManualContextSummary.tsx`
  - `src/lib/buildEflowContextExport.ts`
  - `src/lib/workspacePersistence.ts`
- related documents:
  - `README.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/owner-workflow.md`
  - `docs/project-memory.md`
- related prompts:
  - `AGENTS.md` Provenance and Actor Metadata
  - `src/lib/buildAIChatPrompt.ts` system prompt
- related architecture decisions:
  - `ADR 019: Manual Graph Editing Produces First-Class Graph Data`
  - `ADR 009: Provenance Is Part Of Graph Truth`

## INV-022: Provenance Must Survive Mutations, Imports, And Exports

- invariantId: `INV-022`
- title: `Provenance Must Survive Mutations, Imports, And Exports`
- category: `Provenance`
- severity: `critical`
- description: Every graph node and edge must preserve source provenance. AI command changes must append command provenance where possible, including command id, actor, project, reason, timestamps, and evidence. Source types must distinguish generated, manual, imported, AI-command, and AI-progress-sync changes.
- rationale: Trust in EFlow depends on knowing where each architecture claim came from and why it changed.
- violation consequences: AI-originated changes become anonymous; owner cannot review sync-back evidence; exports flatten trust cues; future migrations lose auditability.
- common accidental violations:
  - Replacing graph items and dropping optional `commandProvenance`.
  - Overwriting `manual_edit` or `context_import` source types during patching.
  - Storing AI-originated progress as `manual_edit`.
  - Dropping evidence arrays during clones or exports.
- enforcement points:
  - `src/types/engineeringFlow.ts`
  - `src/types/eflowCommand.ts`
  - `src/lib/applyEflowCommand.ts`
  - `src/lib/buildEflowContextExport.ts`
  - `src/lib/manualGraphEditing.ts`
- related modules:
  - `src/lib/workspacePersistence.ts`
  - `src/lib/workspaceValidation.ts`
  - `src/components/command/LocalCommandImportPanel.tsx`
- related documents:
  - `AGENTS.md`
  - `STATE_OWNERSHIP.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/project-memory.md`
- related prompts:
  - `AGENTS.md` Provenance and Actor Metadata
  - `src/lib/buildAIChatPrompt.ts` `codex_report_to_command`
- related architecture decisions:
  - `ADR 009: Provenance Is Part Of Graph Truth`
  - `ADR 012: Command Intake Uses Validate -> Dry Run -> Apply`

## INV-023: Audit Log Is Compact Local History, Not Replay

- invariantId: `INV-023`
- title: `Audit Log Is Compact Local History, Not Replay`
- category: `Provenance`
- severity: `high`
- description: `EFlowAuditEvent` records compact local history for important UI mutation paths. Audit is not undo, replay, event sourcing, conflict resolution, collaboration history, signed history, or graph truth.
- rationale: Owners need local visibility without pretending EFlow has a tamper-proof event system.
- violation consequences: Restore logic may rely on incomplete events; audit payloads may grow into snapshots; false compliance or conflict-resolution assumptions appear.
- common accidental violations:
  - Storing full graph snapshots or large command payloads in audit events.
  - Building undo/redo from audit events.
  - Treating chat messages as audit history.
  - Appending audit events without the corresponding graph mutation.
- enforcement points:
  - `src/types/eflowAudit.ts`
  - `src/lib/auditLog.ts`
  - `src/App.tsx` audit event builders
  - `src/components/audit/AuditLogPanel.tsx`
  - `src/components/command/LocalCommandImportPanel.tsx`
- related modules:
  - `src/lib/workspacePersistence.ts`
  - `src/lib/workspaceValidation.ts`
  - `scripts/validateExample.ts`
- related documents:
  - `STATE_OWNERSHIP.md`
  - `SYSTEM_OVERVIEW.md`
  - `docs/owner-workflow.md`
  - `docs/project-memory.md`
- related prompts:
  - `AGENTS.md` AI / Codex operating rules
  - `HANDOFF.md` Current Boundaries
- related architecture decisions:
  - `ADR 010: Audit Log Is Compact Local History, Not Replay`

## INV-024: Derived State Must Not Become Workspace Truth

- invariantId: `INV-024`
- title: `Derived State Must Not Become Workspace Truth`
- category: `State Ownership`
- severity: `critical`
- description: Review queues, progress percentages, lifecycle summaries, trust summaries, manual summaries, dependency indexes, blocking question lists, next development targets, Mermaid text, AI chat summaries, React Flow models, and export objects must be recomputed from canonical input/graph state when needed.
- rationale: Persisted projections become stale and create synchronization bugs.
- violation consequences: The app displays conflicting counts; exports diverge from graph state; hidden stores override owner changes.
- common accidental violations:
  - Persisting lifecycle count buckets for speed.
  - Storing review queue items separately from graph node/edge status.
  - Writing dependency indexes back into graph metadata.
  - Caching `eflow-context/v0.1` as workspace truth.
- enforcement points:
  - `src/lib/buildReviewQueue.ts`
  - `src/lib/buildLifecycleSummary.ts`
  - `src/lib/trustSummary.ts`
  - `src/lib/buildManualEditSummary.ts`
  - `src/lib/buildEflowContextExport.ts`
  - `src/lib/graphAdapters.ts`
- related modules:
  - `src/components/review/ReviewPanel.tsx`
  - `src/components/lifecycle/LifecycleProgressSummary.tsx`
  - `src/components/export/EFlowContextExportPanel.tsx`
  - `src/components/aiChat/AIChatConsole.tsx`
- related documents:
  - `STATE_OWNERSHIP.md`
  - `ARCHITECTURE_DECISIONS.md`
- related prompts:
  - `AGENTS.md` Current Core Product Principles
  - `src/lib/buildAIChatPrompt.ts` system prompt
- related architecture decisions:
  - `ADR 018: Hidden State Ownership Is An Architecture Risk`
  - `ADR 011: AI-Native Export Is Deterministic Derived Context`

## INV-025: Selection Is ID-Only Workspace Navigation

- invariantId: `INV-025`
- title: `Selection Is ID-Only Workspace Navigation`
- category: `State Ownership`
- severity: `high`
- description: Workspace selection is stored only as `selectedNodeId` or `selectedEdgeId`; they are mutually exclusive and must be validated against the current graph on restore/import. Selected node or edge objects are always derived by lookup.
- rationale: Selection helps restore owner working context but is not domain truth.
- violation consequences: Selected objects become stale after graph mutation; inspector edits can patch old copies; invalid imports can reference missing items.
- common accidental violations:
  - Adding `selectedNode` or `selectedEdge` object state.
  - Persisting both selected node and selected edge as active.
  - Exporting selection as AI context truth.
  - Treating filter-cleared selection as graph deletion.
- enforcement points:
  - `src/App.tsx` selection state and `getValidWorkspaceSelection`
  - `src/components/inspector/InspectorPanel.tsx`
  - `src/components/graph/EngineeringFlowCanvas.tsx`
  - `src/lib/workspaceValidation.ts`
- related modules:
  - `src/components/review/ReviewPanel.tsx`
  - `src/lib/workspacePersistence.ts`
- related documents:
  - `STATE_OWNERSHIP.md`
- related prompts:
  - `AGENTS.md` Current Core Product Principles
- related architecture decisions:
  - `ADR 018: Hidden State Ownership Is An Architecture Risk`
  - `ADR 003: Canvas Is A Derived Rendering Layer`

## INV-026: Regeneration Is A Replacement Operation With Owner Warning

- invariantId: `INV-026`
- title: `Regeneration Is A Replacement Operation With Owner Warning`
- category: `Mutation Safety`
- severity: `high`
- description: If structured input changes after a graph exists, the app must mark the graph dirty relative to input and require explicit confirmation before regeneration replaces the graph. Regeneration may discard manual graph edits.
- rationale: Deterministic generation is not incremental reconciliation in the current architecture.
- violation consequences: Owner-added manual context can disappear; review/lifecycle work can be overwritten; input changes silently invalidate current graph.
- common accidental violations:
  - Auto-regenerating graph on every input change.
  - Merging regenerated graph into existing manual graph without a designed reconciliation model.
  - Removing the regeneration confirmation guard.
  - Persisting dirty-regeneration UI state as workspace truth.
- enforcement points:
  - `src/App.tsx` `inputDirtySinceGeneration`
  - `src/App.tsx` `showRegenerationConfirm`
  - `src/components/layout/TopBar.tsx`
  - `src/lib/generateEngineeringFlow.ts`
- related modules:
  - `src/components/input/StructuredInputPanel.tsx`
  - `src/lib/manualGraphEditing.ts`
- related documents:
  - `README.md`
  - `STATE_OWNERSHIP.md`
  - `docs/owner-workflow.md`
- related prompts:
  - `AGENTS.md` Current Core Product Principles
  - `HANDOFF.md` Owner Workflow
- related architecture decisions:
  - `ADR 005: Graph Generation Is Deterministic And Reviewable`
  - `ADR 002: EngineeringFlowGraph Is Canonical Architecture Truth`

## INV-027: Backend, Cloud, Auth, Repo Analysis, And Autonomous Execution Are Absent Unless Redesigned

- invariantId: `INV-027`
- title: `Backend, Cloud, Auth, Repo Analysis, And Autonomous Execution Are Absent Unless Redesigned`
- category: `AI Governance`
- severity: `constitutional`
- description: EFlow is currently a Vite/React local-first app with one optional Vercel-style AI chat route. It does not currently have database persistence, auth, cloud workspace sync, MCP server, REST workspace API, CLI, repo analyzer, job system, autonomous agent execution, undo/replay, conflict resolution, or signed audit history.
- rationale: Adding any of these creates new trust, identity, persistence, mutation, privacy, or source-of-truth boundaries.
- violation consequences: Local-first guarantees become false; graph ownership splits; AI may gain unreviewed write authority; user data may leave the browser without explicit design.
- common accidental violations:
  - Expanding `api/chat-with-files.ts` into workspace storage.
  - Adding cloud sync without conflict and identity rules.
  - Adding autonomous command execution from chat.
  - Introducing repo analysis as if current EFlow can verify implementation truth.
- enforcement points:
  - `SYSTEM_OVERVIEW.md`
  - `ARCHITECTURE_DECISIONS.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `api/chat-with-files.ts`
- related modules:
  - `api/chat-with-files.ts`
  - `src/components/aiChat/AIChatConsole.tsx`
  - `src/lib/workspacePersistence.ts`
- related documents:
  - `HANDOFF.md`
  - `PROJECT_NOTES.md`
  - `docs/project-memory.md`
  - `docs/owner-workflow.md`
- related prompts:
  - `AGENTS.md` Current Core Product Principles
  - `src/lib/buildAIChatPrompt.ts` `codex_milestone_prompt`
  - `HANDOFF.md` Current Boundaries
- related architecture decisions:
  - `ADR 001: Local-First Workspace Is The Runtime Boundary`
  - `ADR 020: Backend Assumptions Are Explicitly Avoided`
  - `ADR 021: Autonomous AI Mutation Is Forbidden By Default`

## INV-028: Localization Is Display-Only For Schema Values

- invariantId: `INV-028`
- title: `Localization Is Display-Only For Schema Values`
- category: `Architecture Evolution`
- severity: `high`
- description: UI localization may translate display labels, but raw schema values, enum values, command operation names, ids, paths, CSS class names, storage keys, and JSON contract fields must remain stable machine-readable values.
- rationale: EFlow is an AI-readable and AI-writable contract system; localization must not change the machine protocol.
- violation consequences: Imports, exports, command validation, localStorage restore, CSS selectors, and downstream AI prompts break across locales.
- common accidental violations:
  - Translating `lifecycleStatus` or `reviewStatus` enum values in JSON.
  - Writing localized labels into graph `type` or `relationshipType`.
  - Changing `eflow.ui.locale` or workspace storage keys during copy updates.
  - Letting localized UI text drive domain logic.
- enforcement points:
  - `src/lib/i18n/translations.ts`
  - `src/lib/i18n/types.ts`
  - `src/lib/i18n/display-labels.ts`
  - `src/types/engineeringFlow.ts`
  - `src/types/eflowCommand.ts`
  - `scripts/validateExample.ts`
- related modules:
  - `src/components/language/LanguageSwitcher.tsx`
  - `src/lib/i18n/language-context.tsx`
- related documents:
  - `README.md`
  - `docs/project-memory.md`
  - `HANDOFF.md`
- related prompts:
  - `AGENTS.md` Current Core Product Principles
  - `AGENTS.md` AI / Codex operating rules
- related architecture decisions:
  - `ADR 004: Schema-First Design Over Freeform Notes`
  - `ADR 022: Architecture Evolution Must Preserve Explicit Compatibility`

---

## Registry Maintenance Rules

Before changing architecture-sensitive behavior, identify:

1. Which invariant is affected.
2. Which module owns the canonical state.
3. Which validation path accepts the data.
4. Which import/export artifacts change.
5. Whether AI can only suggest or can mutate.
6. Whether provenance and audit semantics still hold.
7. Which ADR, prompt, and owner-facing document must be updated.

Before adding a new invariant, include every required registry field and point
to at least one enforcement module. Before removing or weakening an invariant,
add or update an ADR first.
