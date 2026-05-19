# Project Memory Promotion Proposal

本文件只是一份 promotion proposal，尚未修改 `docs/project-memory.md`。

依據來源：

- `docs/memory-recovery/summaries/` 的 15 份 memory summary。
- 目前 repo truth：`README.md`、current source files、current git history。

基本原則：

- Current repo truth wins over old chat。
- 不 promote raw transcript 或舊對話大段內容。
- 只 promote distilled decisions。
- future ideas 必須標記為 future，不可寫成 current behavior。
- code/schema names 保持 English。

## 1. Core product philosophy to promote

- EFlow 是 local-first、schema-first 的 AI-to-AI Communication & Architecture Sync Hub，不是 generic flowchart tool、generic todo app，或 autonomous AI agent platform。
- `EngineeringFlowGraph` 是 app 的 structured source of truth；canvas 只是 graph 的 visual rendering，不應存在 visual-only diagram state。
- EFlow 的核心價值是把 project intent 轉成 deterministic、reviewable、editable、AI-readable / AI-writable structured context。
- Human review 和 human confirmation 是 trust boundary；AI-generated suggestions 不能自動變成 project truth。
- Manual graph editing 是 schema-aware local editing，不是 canvas-only drawing；manual items 必須帶 `provenance.sourceType = "manual_edit"` 並自然進入 canvas、inspectors、exports、workspace。
- AI Collaboration Console 是 top-level collaboration workspace；right-side AI Interop 仍是 JSON export/import tooling。
- Approved visual direction 是 City OS / luxury skyscraper intelligence interface，但它是 presentation layer；不可改變 product behavior 或 schema/data/model semantics。
- UI localization 是 display-label only；raw schema/internal values 仍是 stable machine-readable contract。

## 2. Architecture decisions to promote

- `node.status` / `edge.status` 是 legacy review/confirmation state；formal AI-facing `reviewStatus` 與 implementation `lifecycleStatus` 必須分離。
- `lifecycleStatus` 可為 `draft`, `planned`, `ready`, `developing`, `completed`, `blocked`, `needs_refactor`, `deprecated`；implementation progress 永遠寫入 `lifecycleStatus`，不可寫進 `status`。
- Missing node/edge `lifecycleStatus` 在 display/export/filter/summary 層視為 `planned`，但不寫回 graph data。
- `EngineeringFlowInput`, `EngineeringFlowGraph`, graph node/edge types, and related contracts must remain centralized and schema-driven。
- `eflow-context/v0.1` 是 preferred AI-readable export；應包含 graph、review/progress summaries、dependency index、blocking questions、Mermaid text、lifecycle/confirmation policies、`commandInterface` metadata。
- `eflow-command/v0.1` 是 current AI-writable command format；current supported operations are `updateNode`, `transitionNode`, `upsertNode`, `updateEdge`, `transitionEdge`, `upsertEdge`。
- `addDecision` and `addQuestion` are schema concepts / schema-only for now; current graph apply rejects them because there are no standalone decision/question stores。
- `command.reviewStatus` maps to legacy graph `status` where representable；graph `status` maps back to context `reviewStatus`；`lifecycleStatus` remains separate。
- Manual graph editing goes through `createManualNode`, `createManualEdge`, `insertManualNode`, `insertManualEdge`; insert helpers must return immutable graph updates and reject invalid graph mutations.
- Manual nodes/edges default to review `status: "confirmed"`, `lifecycleStatus: "planned"`, `confidence: 1`, and `manual_edit` provenance unless UI selections override.
- Manual Context Summary identifies manual items solely by `provenance.sourceType === "manual_edit"` and summarizes them separately from lifecycle progress.
- `eflow-audit/v0.1` stores compact local workspace history in `auditLog`; it is not undo, replay, conflict resolution, collaboration history, or signed/tamper-proof audit。
- `auditLog` belongs to workspace document persistence; old workspaces without `auditLog` remain valid and restore as empty audit history.
- Workspace validation must accept missing `lifecycleStatus` / missing `auditLog`, but reject invalid `lifecycleStatus` values and malformed `auditLog` events。
- EFlow Context export should not include `auditLog` unless intentionally redesigned; AI context is project context, not full workspace history。
- Canvas lifecycle badges and filters derive from `node.lifecycleStatus ?? "planned"` and never mutate graph data。
- Lifecycle canvas filters are display-only UI state; they are not persisted and not audited.
- Right panel `CollapsibleSection` organization is UI-only and must not change workspace schema or graph state。
- AI Collaboration Console uses a direct-browser personal BYOK path; API key stays in React state unless remembered in browser `localStorage` key `eflow.aiChat.apiKey` and must not enter workspace JSON or exports。

## 3. Workflow decisions to promote

- Before implementation, run repo state checks such as `pwd`, `git status -sb`, recent `git log`, `npm run validate:example`, and `npm run build`; stop if the requested checkpoint assumptions do not match.
- After implementation, run `npm run validate:example`, `npm run build`, `git diff --check`, `git status -sb`, and relevant diff summaries before reporting.
- Browser smoke checks are required for UI/visual/user-facing text milestones; docs-only or headless-helper milestones may skip browser smoke if validation/build pass and the reason is reported.
- For browser smoke involving existing local workspace state, clear localStorage or use a clean session before verifying example behavior when stale local data could affect results.
- Commit/push only when explicitly instructed; implementation milestones generally stop with a report and suggested commit message.
- Commit scripts should stage only expected files, run cached diff checks, and stop on unexpected changed files.
- Destructive cleanup such as `git reset --hard HEAD` and `git clean -fd` should be used only when the user explicitly requests discarding current uncommitted work.
- Documentation milestones must remain docs-only and still pass validation/build/diff-check before commit.
- Memory recovery workflow is: raw local-only transcripts -> concise reviewed summaries -> optional distilled project-memory promotion.
- Current code/latest commit override old chat; old chat is evidence, not automatic truth.

## 4. AI/Codex operating rules to promote

- Never confuse review status with `lifecycleStatus`; values like `completed`, `blocked`, `developing`, `planned`, or `deprecated` must not be written to `node.status` or `edge.status`.
- `node.lifecycleStatus ?? "planned"` is a display/export/filter default only; do not mutate graph data merely to fill missing lifecycle defaults.
- Local AI command workflow is always `Validate -> Dry Run -> Apply`; dry-run must not mutate graph and failed operations must not partially apply.
- Generated `eflow-command/v0.1` from chat or downstream agents is draft output until manually pasted into Local Command Import and validated/dry-run/applied.
- AI chat responses are draft-only and read-only with respect to graph state; chat must not auto-apply commands or mutate `EngineeringFlowGraph`.
- Unsupported node types, relationship types, missing references, self-edges, and duplicate exact edges must be rejected safely during graph apply/manual insert.
- Audit event creation should avoid duplicate paths; review queue actions should flow through audited graph update handlers when possible.
- Audit event payloads should be compact metadata, not full graph snapshots or large imported command/context payloads.
- Localization must never translate schema versions, JSON keys, TypeScript type names, enum/status values, command operation names, IDs, import paths, CSS class names, or localStorage keys.
- Prompt construction for AI chat modes must preserve the `reviewStatus` / `lifecycleStatus` distinction and warn that commands remain drafts.
- When old browser localStorage may contain stale Simplified Chinese or old workspace data, report that the user may need to clear local workspace or reload the example.

## 5. Safety rules to promote

- Raw transcripts in `docs/memory-recovery/raw/` remain local-only and must not be committed.
- Promote only reviewed distilled decisions, not long chat excerpts or transcript chunks.
- Current repo truth wins over old chat; conflicts must be recorded before promotion.
- Do not modify app code, schemas, workspace persistence, command apply behavior, graph generation, or AI context semantics during docs/memory recovery work.
- Workspace import must reject invalid `lifecycleStatus` and malformed `auditLog`, while accepting old workspaces that omit those optional fields.
- Manual graph mutation helpers must preserve graph integrity: reject duplicate node IDs, missing source/target, self-edges, duplicate exact edges, and helper failures without crashing UI.
- API keys for AI Collaboration Console must never be committed, exported, or stored in workspace JSON; remembered keys are personal browser-local storage only.
- EFlow remains frontend-only/local-first: no backend, database, auth, cloud sync, MCP server, REST API, CLI, repo analyzer, or autonomous agent execution unless explicitly designed as a future milestone.
- Visual redesigns must be CSS-first where possible and must not alter behavior, data model, schemas, graph generation, command/apply, workspace, audit, or React Flow semantics.
- UI/view state such as right-panel collapse state and lifecycle filters should not be promoted to workspace truth unless intentionally redesigned.

## 6. Future product directions to promote

這些應標記為 future，不是 current behavior：

- Edge lifecycle badges and edge lifecycle filters。
- Live demo URL / deployment link update in README and GitHub repo About。
- Future protocol surfaces after local-first baseline: MCP, CLI, REST, or API surfaces。
- Future real AI integration beyond the current personal direct-browser BYOK console, if explicitly designed with privacy/safety boundaries。
- Repo analysis / repo analyzer capability。
- Agent execution or downstream implementation automation。
- Demand Compiler Schema Foundation is mentioned as a possible next milestone in old chat, but current repo truth does not confirm it exists; promote only as a future candidate if still desired.
- Streaming support for AI Collaboration Console。
- Chat history persistence and optional chat audit events, if a later product decision says chat should become workspace history。
- Automatic command parsing/import from chat remains future and should preserve Validate -> Dry Run -> Apply boundaries.

## 7. Deferred ideas

- Canvas direct editing。
- Drag-to-create graph editing。
- Full visual graph editor。
- Undo/redo。
- Command replay。
- Conflict resolution。
- Signed or tamper-proof audit trail。
- Backend/database/auth/cloud sync/multi-user collaboration。
- Team collaboration and cloud multi-project workspace。
- Edge lifecycle badges and filters, unless prioritized as a small UI milestone。
- Translating raw schema/internal values for localization。
- Persisting lifecycle filter state in workspace JSON。

## 8. Rejected/stale ideas

- Rejected: visual-only graph state or canvas-only diagram truth。
- Rejected: treating `auditLog` as command replay or undo history。
- Rejected: accepting invalid workspace lifecycle/audit data silently。
- Rejected: translating enum/status/schema values during localization。
- Rejected: putting AI Collaboration Console inside the narrow right-side AI Interop panel。
- Rejected: keeping dirty visual experiments after the user explicitly requested discard。
- Stale: old claims that Manual Graph Editing was not implemented; current repo has manual node/edge helpers and UI。
- Stale: old claims that audit log was not implemented; current repo has `eflow-audit/v0.1`, audit helpers, and Change History UI。
- Stale: old claims that canvas lifecycle badges/filters were not implemented; current repo has node lifecycle badges and node lifecycle filters. Edge lifecycle badges/filters are still not implemented。
- Stale: old branch ahead/behind and latest-commit reports; treat them as historical execution logs only。

## 9. Conflicts with current repo truth

- Old summaries and README-era docs repeatedly say "no real AI API"。Current source includes `AIChatConsole` with direct-browser `fetch` to an editable Responses-style `baseUrl` and optional remembered API key. Recommended promotion wording: "No backend/proxy/cloud AI service is implemented; a personal BYOK direct-browser AI chat path exists and remains draft-only/read-only."
- Old milestone notes list manual graph editing, audit log, lifecycle badges, lifecycle filters, right panel organization, README polish, localization, and memory recovery workspace as future or not implemented. Current repo has these features; do not promote old "not implemented" claims except where still true for edge lifecycle badges/filters, canvas direct editing, drag-to-create, undo/replay, and cloud/backend work。
- Old docs mention final regression / v1 tag as pending; current history includes `fcfb128 Record final regression pass` and `v1.0-local` according to the recovered summaries, while README still says live demo URL pending. Promote final regression/tag as historical if needed; keep live demo URL as pending unless current repo changes.
- Old visual-design experiments include warm gray / graphite directions. Current approved direction is City OS after the explicit discard/re-run flow. Promote City OS only, not superseded experiments。
- Old "no i18n framework/language switcher" boundary from the Traditional Chinese content pass was superseded by later i18n/tutorial work. Current repo has `zh-TW` / `en` language foundation; promote "display-label only localization" rather than "no language switcher"。

## 10. Duplicate themes that can be merged

- Graph source of truth: appears in memory-01, memory-011, memory-012, and visual/UI milestones. Merge into one Product Philosophy entry。
- `status` / `reviewStatus` / `lifecycleStatus` separation: appears across lifecycle, command interop, README, AI chat, localization, and audit summaries. Merge into one Architecture Decision plus one AI/Codex rule。
- Missing `lifecycleStatus` defaults to `planned`: appears in lifecycle summary, badges, filters, workspace hardening, README. Merge into one Architecture Decision。
- Manual graph editing provenance: appears in helper, node UI, edge UI, manual context summary. Merge into one Architecture Decision。
- Manual mutation safety: duplicate ID, missing source/target, self-edge, duplicate exact edge appear across helper/UI/command safety. Merge into one Safety Rule。
- Audit log scope: foundation, coverage polish, workspace hardening all repeat "compact local history, not undo/replay." Merge into one Architecture Decision plus Deferred Ideas。
- Local-first/no backend/cloud/API/MCP/REST/CLI: repeated in nearly every milestone. Merge into one Safety/Boundary entry, with nuance for direct-browser BYOK AI chat。
- Validate/build/diff-check workflow: repeated across commits and milestones. Merge into one Workflow Decision。
- Browser smoke/localStorage cleanup: repeated across UI/lifecycle/localization milestones. Merge into one Workflow Decision。
- Localization stability: Traditional Chinese content pass and i18n pass both say raw schema/internal values must stay stable. Merge into one Safety Rule。
- Memory recovery process: memory-015 and current workflow repeat raw-local-only -> summary -> project-memory. Merge into one Workflow/Safety entry。

## 11. Recommended final docs/project-memory.md outline

建議保留現有 `docs/project-memory.md` 大章節，但把內容整理成可維護的短條目。

```md
# Project Memory

## Purpose

## Source of Truth Hierarchy

## Product Philosophy

- EFlow identity: local-first, schema-first AI-to-AI Communication & Architecture Sync Hub.
- `EngineeringFlowGraph` as source of truth; canvas as rendering.
- Human review/confirmation as trust boundary.
- Manual graph editing as schema-aware local editing.
- AI Collaboration Console as draft-only top-level workspace module.
- City OS visual direction as presentation-only layer.

## Architecture Decisions

- Status model: legacy `status`, AI-facing `reviewStatus`, and implementation `lifecycleStatus`.
- Missing lifecycle defaults to `planned` in display/export/filter/summary only.
- `eflow-context/v0.1` AI-readable export contract and `commandInterface`.
- `eflow-command/v0.1` supported operations and schema-only operations.
- Manual graph editing helpers and `manual_edit` provenance.
- Manual Context Summary and lifecycle summaries derive from graph.
- `eflow-audit/v0.1` as compact local workspace history.
- Workspace compatibility/validation for `auditLog` and `lifecycleStatus`.
- Localization display-label architecture.
- AI Collaboration Console BYOK storage and draft-only architecture.

## Workflow Decisions

- Preflight and validation workflow for coding milestones.
- Browser smoke requirements for UI/visual/user-facing text changes.
- Docs-only/headless milestone validation expectations.
- Commit/push only on explicit instruction.
- Destructive cleanup only on explicit user request.
- Memory recovery workflow.

## AI/Codex Operating Rules

- Never confuse review status with `lifecycleStatus`.
- Commands must go through Validate -> Dry Run -> Apply.
- AI chat outputs are drafts and cannot mutate graph.
- Unsupported graph/command shapes must be rejected safely.
- Audit events should be compact and non-duplicative.
- Localization must preserve raw schema/internal values.

## Safety Rules

- Raw transcripts stay ignored/local-only.
- No backend/database/auth/cloud sync/MCP/REST/CLI/repo analyzer/agent execution unless explicitly scoped.
- API keys must never enter repo/workspace/export.
- Workspace import validation must reject invalid lifecycle/audit data.
- Visual redesign must not alter behavior or schema/model state.

## Future Product Directions

- Edge lifecycle badges/filters.
- Live demo URL / deployment docs update.
- MCP/CLI/REST/API surfaces after local-first baseline.
- Repo analyzer / agent execution as future protocol work.
- Demand Compiler Schema Foundation, if still desired.
- Streaming/chat persistence/chat audit events for AI Collaboration Console.

## Deferred Ideas

- Canvas direct editing.
- Drag-to-create.
- Full visual graph editor.
- Undo/redo and command replay.
- Conflict resolution and signed audit trail.
- Backend/cloud/team collaboration.

## Rejected Ideas

- Visual-only graph truth.
- Audit log as replay/undo system.
- Silent acceptance of invalid workspace lifecycle/audit data.
- Translating schema/enum/status/internal values.
- AI console inside narrow right-side AI Interop.
- Superseded warm gray/graphite visual directions.

## Open Questions

- 是否仍要做 `Demand Compiler Schema Foundation`？
- Edge lifecycle badges/filters 是否仍是近期優先？
- AI chat 是否要 streaming、chat persistence、或 audit events？
- 未來 MCP/CLI/REST/API surfaces 的順序與邊界？
- Live demo URL 何時加入 README/GitHub About？

## Decision Log

### 2026-05-19 - Recover project memory from old summaries

- Category:
- Decision:
- Rationale:
- Source summary:
- Current repo check:
- Status:
```

