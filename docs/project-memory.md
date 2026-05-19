# Project Memory

此檔案只保存已審閱、已萃取的專案決策。它不是 transcript archive。

## Purpose

`docs/project-memory.md` 用來保存跨 session 仍有價值的長期專案記憶：產品哲學、架構理由、工作流程慣例、AI/Codex 操作規則、安全邊界、目前能力、已知限制、未來方向、延後項目、過時項目與開放問題。

不要在此貼 raw transcript 或舊對話大段內容。任何 promoted entry 都必須先和目前 repo truth 對齊。

## Source of truth hierarchy

1. 目前 repository code 與 schemas。
2. 最新 committed repo state。
3. 目前 repo 內的文件。
4. 已審閱的 `docs/memory-recovery/summaries/`。
5. Local-only 的 `docs/memory-recovery/raw/`。

規則：

- Current code 與 latest commit 勝過 old chat。
- Old chat 是 evidence，不是 automatic truth。
- Future ideas 必須標示為 future，不可寫成 current behavior。
- Stale 或 superseded old-chat ideas 必須省略，或明確標示為 stale。
- `docs/memory-recovery/raw/` 內的 raw transcripts 必須保持 local-only，不可 commit。

## Product philosophy

- EFlow 是 local-first、schema-first 的 AI-to-AI Communication & Architecture Sync Hub。
- EFlow 不是 generic flowchart tool、generic todo app，或 autonomous AI agent platform。
- EFlow 的核心價值是把 structured project intent 轉成 deterministic、reviewable、editable、AI-readable 與 AI-writable 的 project context。
- `EngineeringFlowGraph` 是 structured source of truth；canvas 只是 graph 的 visual rendering。
- Human review 與 human confirmation 是 trust boundary。AI-generated suggestions 經人類確認前，不是 final project truth。
- Manual graph editing 是 schema-aware local editing，不是 canvas-only drawing。
- Manual items 必須帶 `provenance.sourceType = "manual_edit"`，並自然出現在 canvas、inspectors、review queues、lifecycle/manual summaries、workspace JSON、Full AI Context JSON 與 `eflow-context/v0.1`。
- AI Collaboration Console 是 top-level collaboration workspace；right-side AI Interop 仍是 JSON export/import tooling。
- AI chat responses 是 drafts；它們不可 mutate graph state，也不可 auto-apply commands。
- 已 approved 的視覺方向是 City OS / luxury skyscraper intelligence interface；這是 presentation layer，不可改變 product behavior 或 schema/data/model semantics。
- Localization 是 display-label only；raw schema/internal values 必須維持 stable machine-readable contract。

## Architecture decisions

- Review state 與 implementation progress 是不同概念。
- `node.status` 與 `edge.status` 是 legacy graph review/confirmation fields。
- Formal AI-facing `reviewStatus` 用於 AI context 與 command contracts。
- `lifecycleStatus` 是 implementation lifecycle progress，絕不可被併入 `status` 或 `reviewStatus`。
- Valid `lifecycleStatus` values 是 `draft`, `planned`, `ready`, `developing`, `completed`, `blocked`, `needs_refactor`, `deprecated`。
- Missing node/edge `lifecycleStatus` 在 display、export、filter、summary layers 視為 `planned`，但不可把這個 default 寫回 graph data。
- `EngineeringFlowInput`, `EngineeringFlowGraph`, graph node/edge types 與 AI-facing contracts 應維持 schema-driven、explicit。
- Lifecycle Progress Summary、Canvas Node Lifecycle Badges、Lifecycle Canvas Filters 都從 graph state derive，不可 mutate graph data。
- Lifecycle Canvas Filters 是 display-only UI state，不 persist 到 workspace JSON，也不 audit。
- Edge lifecycle badges 與 edge lifecycle filters 目前尚未實作。
- Manual graph editing 走 `createManualNode`, `createManualEdge`, `insertManualNode`, `insertManualEdge` 等 helper paths。
- Manual graph insert helpers 必須回傳 immutable graph updates，並安全拒絕 invalid graph mutations。
- Manual nodes/edges 預設 review `status: "confirmed"`, `lifecycleStatus: "planned"`, `confidence: 1`, 並帶 `manual_edit` provenance；除非 UI 明確選擇其他 supported value。
- Manual Context Summary 只以 `provenance.sourceType === "manual_edit"` 識別 manual items，並與 lifecycle progress 分開 summarize。
- `auditLog` 屬於 workspace document。舊 workspace 若缺少 `auditLog` 仍 valid，restore 後使用 empty audit history。
- `eflow-audit/v0.1` 是 compact local workspace history，不是 undo、replay、conflict resolution、collaboration history，或 signed/tamper-proof audit trail。
- Audit event payloads 應保持 compact，不存 full graph snapshots 或大型 imported command/context payloads。
- Review Queue actions 應避免 duplicate audit paths，並盡可能流經已 audited 的 graph update handlers。
- Right-panel `CollapsibleSection` organization 是 UI-only，不可改變 workspace schema 或 graph state。
- Tutorial markers 與 language preference 是 UI-only；tutorial state 不改 graph data、workspace JSON、audit history、commands 或 AI context exports。
- AI Collaboration Console 使用 personal BYOK direct-browser path。API key 預設存在 React state；若 remember，才存於 browser `localStorage` key `eflow.aiChat.apiKey`；不可進入 workspace JSON 或 exports。

## Data model / contract decisions

- Preferred AI-readable export 是 `eflow-context/v0.1`。
- `eflow-context/v0.1` 應包含 project identity、graph nodes/edges、`reviewSummary`、`progressSummary`、`dependencyIndex`、blocking questions、next development targets、Mermaid-compatible graph text、lifecycle/confirmation policies 與 `commandInterface` metadata。
- Current AI-writable command format 是 `eflow-command/v0.1`。
- Current command apply 支援的 graph operations 是 `updateNode`, `transitionNode`, `upsertNode`, `updateEdge`, `transitionEdge`, `upsertEdge`。
- `addDecision` 與 `addQuestion` 目前是 schema concepts / schema-only operations。Current graph apply 會 reject，因為 EFlow 尚無 standalone decision 或 question stores。
- `command.reviewStatus` 會在 current graph 可表示時 map 到 legacy graph `status`。
- Legacy graph `status` 在 AI-native context export 時 map 回 context `reviewStatus`。
- Current graph compatibility 不能表示 node `reviewStatus: "rejected"` 或 edge `reviewStatus: "needs_review"`，因此 graph apply 會 reject 這些 mapping。
- `lifecycleStatus` 在 graph data、commands、exports、summaries、filters、badges 中都維持 separate implementation progress state。
- EFlow Context export 不應包含 `auditLog`，除非未來明確重新設計；AI context 是 project context，不是 full workspace history。
- Workspace JSON export/import 會 preserve input、graph、selected item、manual graph edits、lifecycle state 與 `auditLog`。
- Workspace import 接受 missing `auditLog` 與 missing `lifecycleStatus`，但 reject malformed `auditLog` 與 invalid `lifecycleStatus`。
- Full AI Context import 可 restore input 與 graph，但不攜帶 workspace audit history。
- Localization display maps 可以翻譯 labels；但 schema values、enum values、command operation names、IDs、paths、CSS class names 與 localStorage keys 必須保持不變。

## Workflow decisions

- Implementation 前先檢查 repo state，例如 `pwd`, `git status -sb`, recent `git log`, `npm run validate:example`, `npm run build`。
- 若 requested checkpoint assumptions 與目前 repo state 不符，先停止並報告，不要硬做。
- Implementation 後執行 `npm run validate:example`, `npm run build`, `git diff --check`, `git status -sb` 與 relevant diff summaries，再回報。
- UI、visual、browser behavior、user-facing text changes 必須做 browser smoke check。
- Docs-only 與 headless-helper milestones 可在 validation/build passed 且說明原因時不做 browser smoke。
- Browser smoke 若可能受舊 local workspace 影響，應 clear localStorage 或使用 clean session。
- 只有使用者明確要求時才 commit 或 push。
- Commit scripts 應只 stage expected files，跑 cached diff checks，遇到 unexpected changed files 就停止。
- `git reset --hard HEAD` 與 `git clean -fd` 等 destructive cleanup 只能在使用者明確要求丟棄 uncommitted work 時使用。
- Documentation milestones 應保持 docs-only，且仍須通過 validation/build/diff-check。
- Memory recovery workflow 是 raw local-only transcripts -> concise reviewed summaries -> optional distilled project-memory promotion。

## AI / Codex operating rules

- 絕不可混淆 review status 與 `lifecycleStatus`。
- `completed`, `blocked`, `developing`, `planned`, `deprecated` 等 lifecycle values 不可寫進 `node.status` 或 `edge.status`。
- `node.lifecycleStatus ?? "planned"` 與 `edge.lifecycleStatus ?? "planned"` 只是 display/export/filter defaults；不可為了補 default 而 mutate graph data。
- Local AI command workflow 永遠是 Validate -> Dry Run -> Apply。
- Dry-run 不可 mutate graph state。
- Failed command operations 不可 partial apply。
- AI chat 或 downstream agents 產生的 `eflow-command/v0.1` 是 draft output；必須經 Local Command Import validate、dry-run、apply 後才會改 graph。
- AI chat responses 對 graph state 是 draft-only、read-only。
- AI chat 不可 auto-apply commands、不可自動 parse commands into graph mutation，也不可 mutate `EngineeringFlowGraph`。
- Unsupported node types、relationship types、missing references、self-edges、duplicate exact edges 必須在 graph apply/manual insert 時安全 reject。
- AI chat prompt construction 必須保留 `reviewStatus` / `lifecycleStatus` distinction，並提醒 generated commands 仍是 drafts。
- Audit event creation 應避免 duplicate paths。
- Audit event payloads 使用 compact metadata，不存 full snapshots。
- Localization 必須保留 state、form values、graph/workspace/command data、AI context exports 裡的 raw schema/internal values。
- 若舊 browser localStorage 可能含 stale Simplified Chinese 或 old workspace data，回報時應提醒使用者 clear local workspace 或 reload example。

## Safety rules

- Raw old chat transcripts 必須留在 `docs/memory-recovery/raw/` local-only，不可 commit。
- Reviewed summaries commit 前必須確認沒有 full transcripts 或敏感內容。
- 只 promote distilled decisions，不 promote long excerpts。
- Old chat 是用來和 repo truth reconcile 的 evidence，不是 automatic instruction。
- Docs/memory recovery 工作不可修改 app code、schemas、workspace persistence、command apply behavior、graph generation 或 AI context semantics。
- Workspace import 必須 reject invalid `lifecycleStatus` 與 malformed `auditLog`，同時接受缺少這些 optional fields 的 old workspaces。
- Manual graph mutation helpers 必須 preserve graph integrity：reject duplicate node IDs、missing source/target、self-edges、duplicate exact edges 與 helper failures，且 UI 不可 crash。
- AI Collaboration Console API keys 不可 commit、export，或存入 workspace JSON。
- Remembered AI keys 只屬於 personal browser-local storage。
- EFlow 預設保持 frontend-only/local-first。除非明確設計成 future milestone，不可 incidental 加入 backend、database、auth、cloud sync、MCP server、REST API、CLI、repo analyzer 或 autonomous agent execution。
- Visual redesign 應盡可能 CSS-first，不可改變 behavior、data model、schemas、graph generation、command/apply、workspace、audit 或 React Flow semantics。
- UI/view state（例如 right-panel collapse state、lifecycle filters）不可變成 workspace truth，除非未來明確重新設計。

## Current completed capabilities

- Vite + React + TypeScript frontend app，使用 `@xyflow/react`、plain CSS 與 browser `localStorage`。
- Structured `EngineeringFlowInput` editing 與 deterministic `EngineeringFlowGraph` generation。
- Canvas rendering backed by graph data，支援 selectable nodes and edges。
- NodeInspector / EdgeInspector 可編輯 review/status fields 與 `lifecycleStatus`。
- Lifecycle Progress Summary。
- Canvas node lifecycle badges。
- Lifecycle Canvas Filters for node lifecycle state。
- Review workflow 與 review queue。
- Manual node 與 manual edge creation UI。
- Manual provenance badges 與 Manual Context Summary。
- Workspace autosave、Workspace JSON export、Workspace JSON import。
- AI-Native Context Export for `eflow-context/v0.1`。
- Local Command Import for `eflow-command/v0.1`，workflow 為 Validate -> Dry Run -> Apply。
- `eflow-audit/v0.1` Change History / Audit Log panel。
- Workspace validation for lifecycle state and audit log shape。
- AI Collaboration Console，具 personal BYOK direct-browser request path 與 prompt modes。
- Lightweight tutorial mode 與 `zh-TW` / `en` language UI foundation。
- Traditional Chinese user-facing example content 與 display-label localization。
- City OS visual direction 已以 CSS-first UI styling 套用。
- Memory recovery workspace 位於 `docs/memory-recovery/`。

## Known limitations

- 沒有 backend、database、auth、cloud sync，或 multi-project cloud workspace。
- 沒有 MCP server、REST API、CLI、repo analyzer，或 autonomous agent execution。
- 沒有 backend/proxy/cloud AI service。目前 AI chat 是 personal direct-browser BYOK path，可能受 provider CORS behavior 影響。
- 沒有 undo/redo。
- 沒有 command replay。
- 沒有 conflict resolution。
- 沒有 signed 或 tamper-proof audit trail。
- 沒有 canvas direct editing。
- 沒有 drag-to-create。
- 沒有 full visual graph editor。
- Edge lifecycle badges 尚未實作。
- Edge lifecycle filters 尚未實作。
- Lifecycle filter state 不 persist。
- Chat streaming 尚未實作。
- Chat history 不 persist 到 workspace。
- Chat messages 不是 audit events。
- Live demo URL 仍 pending，除非未來 README/GitHub About 已更新。

## Future product directions

以下是 future directions，不是 current behavior：

- Edge lifecycle badges 與 edge lifecycle filters。
- Live demo URL / deployment link update in README and GitHub repo About。
- Local-first baseline 穩定後，探索 MCP、CLI、REST 或 API surfaces。
- 在明確 privacy/safety boundaries 下，探索 current personal direct-browser BYOK console 之外的 real AI integration。
- Repo analyzer capability。
- Agent execution 或 downstream implementation automation。
- Demand Compiler Schema Foundation（若仍然需要）；current repo truth 尚未確認它存在。
- AI Collaboration Console streaming support。
- 若未來把 chat 設計成 workspace history，再考慮 chat history persistence 與 optional chat audit events。
- Automatic command parsing/import from chat，但必須保留 Validate -> Dry Run -> Apply boundaries。

## Deferred ideas

- Canvas direct editing。
- Drag-to-create graph editing。
- Full visual graph editor。
- Undo/redo。
- Command replay。
- Conflict resolution。
- Signed 或 tamper-proof audit trail。
- Backend/database/auth/cloud sync/multi-user collaboration。
- Team collaboration 與 cloud multi-project workspace。
- Edge lifecycle badges and filters，除非被排為小型 UI milestone。
- Translating raw schema/internal values for localization。
- Persisting lifecycle filter state in workspace JSON。

## Stale / superseded ideas

- Stale: Manual Graph Editing 未實作。Current repo 已有 manual node/edge helpers 與 UI。
- Stale: Audit log 未實作。Current repo 已有 `eflow-audit/v0.1`、audit helpers 與 Change History UI。
- Stale: Canvas node lifecycle badges 與 lifecycle filters 未實作。Current repo 已有 node lifecycle badges 與 node lifecycle filters；edge lifecycle badges/filters 仍未實作。
- Stale: 「沒有 real AI API」作為絕對陳述。Current repo 有 personal BYOK direct-browser AI chat path，但仍沒有 backend/proxy/cloud AI service。
- Stale: 早期 Traditional Chinese content pass 中的「不新增 i18n framework/language switcher」邊界。Current repo 已有 `zh-TW` / `en` language UI foundation。
- Superseded: Warm gray / graphite visual experiments。Current approved visual direction 是 City OS。
- Historical only: recovery summaries 中舊的 branch ahead/behind 與 latest-commit reports。

## Open questions

- `Demand Compiler Schema Foundation` 是否仍是 future milestone？
- Edge lifecycle badges 與 edge lifecycle filters 是否是近期優先？
- AI Collaboration Console 是否要加 streaming？
- Chat history 是否應成為 workspace-persisted data？
- Chat messages 是否應成為 audit events？
- MCP、CLI、REST、API surfaces 的理想順序與邊界是什麼？
- 何時要把 live demo URL 加進 README 與 GitHub repo About？
- 是否要做 automatic command extraction from chat？若要，如何維持 Validate -> Dry Run -> Apply？

## Decision log template

未來 promoted reviewed decisions 時，使用這個格式：

```md
### YYYY-MM-DD - Short decision title

- Category:
- Decision:
- Rationale:
- Source summary:
- Current repo check:
- Status: current | future | deferred | rejected | stale
```
