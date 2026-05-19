# EFlow / Engineering Flow Intake

EFlow 是 local-first、schema-first 的 AI-to-AI Communication & Architecture Sync Hub。

EFlow 會把 structured project intent 轉成 deterministic、reviewable、editable 的 engineering graph。它不是 generic flowchart tool：`EngineeringFlowGraph` 是 source of truth，canvas 只是 structured graph 的 visual rendering。Human review 是 trust boundary；AI-generated suggestions 在 owner review 前不是 final project truth。

## 目前狀態

EFlow 目前是 frontend-only local-first app：

- 使用 Vite、React、TypeScript、`@xyflow/react`、plain CSS 和 browser `localStorage`。
- Workspace state 儲存在 browser。
- 支援 Structured Input、deterministic graph generation、manual graph editing、review queue、lifecycle tracking、audit log、Workspace JSON export/import。
- 支援 `eflow-context/v0.1` AI-native context export。
- 支援 `eflow-command/v0.1` Local Command Import，workflow 是 Validate -> Dry Run -> Apply。
- 包含 optional AI Collaboration Console，使用 personal BYOK direct-browser request path。
- 沒有 backend、database、auth、cloud sync、backend/proxy/cloud AI service、MCP server、REST API、CLI、repo analyzer 或 autonomous agent execution。

AI Chat 是 optional，而且 draft-only。Local-first 不代表你選擇附加的 Full EFlow Context 永遠不會離開 browser；在 AI Console 選 Summary 或 Full context 並送出時，context 會送到你設定的 provider。

## Owner Workflow

非程式背景 owner 請先讀：

- [docs/owner-workflow.md](docs/owner-workflow.md)

核心流程：

```text
Intake → Generate → Review Gate → Milestone → Handoff → Sync Back
```

簡短版：

1. 在 Structured Input 填 `EngineeringFlowInput`。
2. Generate `EngineeringFlowGraph`。
3. 用 Canvas / Inspector / Review / Lifecycle 做人工 quality gate。
4. 定義小 milestone，避免一次交付過大 scope。
5. 匯出 `eflow-context/v0.1` 給 Codex handoff。
6. Codex 回報後先 review/validate，再同步 `lifecycleStatus`。

Codex report 不是 automatically truth；只有 owner review、validation、必要的 manual verification 完成後，才把項目標成 `completed`。

## Quick Start

```bash
npm install
npm run dev
```

驗證與 build：

```bash
npm run validate:example
npm run build
```

## 資料模型摘要

- `EngineeringFlowInput`：structured project intent，包括 users、screens、functions、flows、data objects、AI roles、unknowns。
- `EngineeringFlowGraph`：generated 或 manually edited architecture graph。這是 app 的 structured source of truth。
- `EngineeringNode`：graph item，例如 intent、user、screen、feature、flow step、data object、AI task、question。
- `EngineeringEdge`：graph nodes 之間的 typed relationship。
- `EFlowWorkspaceDocument`：local workspace snapshot，包含 input、graph、selection、optional audit log。
- `EFlowAuditEvent`：compact local history event，不是 undo/replay data。

## Status Model

Review/confirmation state 和 implementation progress 必須分開。

Legacy graph fields：

- `node.status`：legacy node review/confirmation status，值為 `suggested`、`confirmed` 或 `needs_review`。
- `edge.status`：legacy edge review/confirmation status，值為 `suggested`、`confirmed` 或 `rejected`。

Formal AI-facing review status：

- `reviewStatus`：`suggested`、`confirmed`、`needs_review` 或 `rejected`。

Implementation lifecycle status：

- `lifecycleStatus`：`draft`、`planned`、`ready`、`developing`、`completed`、`blocked`、`needs_refactor` 或 `deprecated`。

Mapping rules：

- Command `reviewStatus` 會在 current graph 可表示時 map 到 legacy `node.status` / `edge.status`。
- Legacy graph `status` 會在 AI-native context export 時 map 回 context `reviewStatus`。
- `lifecycleStatus` 永遠維持 separate implementation progress state，不可當作 review status。
- Missing node/edge `lifecycleStatus` 在 context exports、canvas badges、filters、summaries 中視為 `planned`，但不寫回 graph data。
- Current graph compatibility 不能表示 node `reviewStatus: "rejected"` 或 edge `reviewStatus: "needs_review"`，graph apply 會 reject 這些 mapping。

## 使用 App

左側 Structured Input 編輯專案意圖。中間 canvas 渲染 current graph。右側 panel 組織 product tools：

- Selected Item：node、edge 或 project inspector。
- Review：review progress、filters、confirm/reject actions。
- Implementation Progress：lifecycle counts 和 manual context summary。
- Manual Editing：Add Manual Node 和 Add Manual Edge。
- Change History：local audit log。
- AI Interop：Local Command Import 和 AI-Native Context Export。
- Workspace / Export：Workspace JSON 和 legacy JSON handoff exports。

Section open/closed state 是 local UI state，不會 persist 到 Workspace JSON。

## AI-Native Context Export

Preferred AI-readable export 是 `eflow-context/v0.1`。

使用 AI-Native Context Export panel 複製或下載 EFlow Context JSON。這是給 downstream coding agents，例如 Codex、Claude、Cursor 或其他 implementation system。

Export 包含：

- Project identity and intent。
- Typed graph nodes and edges。
- `reviewSummary`。
- `progressSummary`。
- `dependencyIndex`。
- Blocking questions。
- Next development target recommendations。
- Mermaid-compatible graph text。
- Confirmation and lifecycle policies。
- `commandInterface` metadata。

Workspace JSON 是 backup/restore；EFlow Context JSON 是 AI/Codex handoff。

## AI-Writable Command Import

Current AI-writable command format 是 `eflow-command/v0.1`。

Local workflow：

```text
Validate -> Dry Run -> Apply
```

Supported graph operations：

- `updateNode`
- `transitionNode`
- `upsertNode`
- `updateEdge`
- `transitionEdge`
- `upsertEdge`

Schema-only 或目前 graph apply 不支援的 operations：

- `addDecision`
- `addQuestion`

`addDecision` 和 `addQuestion` 目前 validate as schema concepts，但 current graph apply 會 reject，因為 EFlow 尚無 standalone decision 或 question record stores。

## Manual Graph Editing

Manual graph editing 是 local-first、schema-aware editing。

- Add Manual Node 建立 `provenance.sourceType = "manual_edit"` 的 graph node。
- Add Manual Edge 建立 `provenance.sourceType = "manual_edit"` 的 graph edge。
- Manual items 預設 review `status: "confirmed"` 和 `lifecycleStatus: "planned"`，除非 UI selection 改成其他 supported value。
- `manual_edit` provenance 只表示來源是人工新增，不代表內容已被證實。
- Manual nodes/edges 會出現在 canvas、inspectors、review queues、lifecycle/manual summaries、Workspace JSON、Full AI Context JSON 和 `eflow-context/v0.1`。

## Workspace Persistence

EFlow 使用 local browser persistence 和 explicit JSON workspace files。

- Current workspace autosaves to `localStorage`。
- Workspace JSON export/import preserves input、graph、selected item、manual graph edits、lifecycle state 和 `auditLog`。
- 缺少 `auditLog` 的舊 workspace 仍 valid，restore 時會使用空的 local audit history。
- Workspace import 會 validate graph shape、lifecycle status values 和 audit log shape。
- Full AI Context import 可以 restore input and graph，但 Full AI Context 不攜帶 workspace audit history。

## Tutorial And Language UI

EFlow 包含 lightweight tutorial mode 與 owner workflow tutorial：

- `/` runs the normal app。
- `/?tour=1` runs the normal app with tutorial annotations enabled。
- `/tutorial` opens a standalone owner workflow guide inside the Vite SPA, covering Intake -> Generate -> Review Gate -> Milestone -> Handoff -> Sync Back。

UI language foundation 支援 `zh-TW` and `en`。Language preference 只存在 browser `localStorage` 的 `eflow.ui.locale`，不會寫進 workspace 或 graph schema。

## Built-In Example

Built-in Todo Thought Universe example 目前 validates to：

- 52 graph nodes。
- 93 graph edges。
- 3 blocking questions。

Run：

```bash
npm run validate:example
```

## Validation

使用 package scripts：

```bash
npm run validate:example
npm run build
```

`validate:example` 會檢查 built-in example、graph generation、AI context export、command validation/apply behavior、manual graph editing helpers、workspace validation、lifecycle summaries、review summaries 和 audit log validation。

## Deployment

EFlow 目前可作為 static Vite app deployment。`npm run build` 會執行 TypeScript build 和 Vite production build，產生 `dist/`。

Deployment notes：

- 適合 Vercel、Netlify 或 GitHub Pages static hosting。
- Current app 不需要 backend、database、auth service、cloud sync、backend AI service、MCP server、REST API 或 CLI。
- 目前 frontend-only build 不需要 backend environment variables。
- Workspace data 會儲存在 browser `localStorage`。
- 部署成 static site 後，workspace data 仍是 browser-local，不會跨 browsers、devices 或 users sync。
- Live demo URL：pending。

Live site 可用後，再把 deployed URL 加到 GitHub repo About -> Website。

## Important Files

- `docs/owner-workflow.md`
- `src/types/engineeringFlow.ts`
- `src/types/eflowCommand.ts`
- `src/types/eflowContext.ts`
- `src/types/eflowAudit.ts`
- `src/lib/generateEngineeringFlow.ts`
- `src/lib/buildEflowContextExport.ts`
- `src/lib/applyEflowCommand.ts`
- `src/lib/eflowCommandValidation.ts`
- `src/lib/workspacePersistence.ts`
- `src/lib/workspaceValidation.ts`
- `src/lib/manualGraphEditing.ts`
