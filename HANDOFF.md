# HANDOFF.md - EFlow Current Development State

## Current Strategic State

EFlow 是 local-first、schema-first 的 AI-to-AI Communication & Architecture Sync Hub。

它不是 generic flowchart tool，也不是 autonomous AI agent platform。`EngineeringFlowGraph` 是 canonical structured project map；canvas 只是 rendering layer。Humans and AI systems 透過 explicit JSON contracts read/write，human review 仍是 trust boundary。

## Current Product Capabilities

目前 repo 已包含：

- Structured `EngineeringFlowInput` editing。
- Deterministic `EngineeringFlowGraph` generation。
- Canvas rendering backed by graph data。
- Node/edge inspectors with review status and `lifecycleStatus` editing。
- Review queue and review progress。
- Manual node/edge creation with `provenance.sourceType = "manual_edit"`。
- Lifecycle progress summary and node lifecycle canvas filters。
- Workspace autosave plus Workspace JSON export/import。
- `eflow-context/v0.1` AI-native context export。
- `eflow-command/v0.1` Local Command Import with Validate -> Dry Run -> Apply。
- `eflow-audit/v0.1` compact local Change History。
- Optional AI Collaboration Console using personal BYOK direct-browser requests。
- Lightweight tutorial mode, `/tutorial` visual owner workflow playbook with CSS-only mini demos, and `zh-TW` / `en` display-label localization foundation。

AI Chat 是 optional and draft-only。它不會 mutate graph state，不會 auto-apply commands，也不應被當成 project truth。

## Current UI Checkpoint

Current checkpoint 是 `/tutorial` owner workflow playbook redesign。

Files intentionally updated in this checkpoint：

- `src/components/tutorial/TutorialPage.tsx`
- `src/lib/i18n/translations.ts`
- `src/lib/i18n/types.ts`
- `src/styles/tutorial.css`
- `README.md`
- `HANDOFF.md`

This checkpoint 不得 modify schemas、command validation/apply behavior、graph generation、workspace persistence 或 AI context export semantics。

## Owner Workflow

Owner-facing core workflow：

```text
Intake → Generate → Review Gate → Milestone → Handoff → Sync Back
```

Detailed guide 位於：

- `docs/owner-workflow.md`

Critical owner rules：

- API key 是 optional；EFlow core workflow 不需要 AI Chat。
- AI Chat 是 draft-only and optional。
- Local-first 不代表 Full EFlow Context 永遠不會離開 browser。如果 owner 在 AI Console 選 Summary/Full context 並送出訊息，selected context 會送到 configured provider。
- Workspace JSON 是 backup/restore 用。
- EFlow Context JSON，尤其是 `eflow-context/v0.1`，是 AI/Codex handoff 用。
- Codex report 在 owner review and validation 完成前，不是 automatically truth。
- 完成驗證前，不要把 nodes/edges 標成 `completed`。

## Status Model Rules

Review status 和 lifecycle status 必須保持分離：

- `node.status` and `edge.status` are legacy review/confirmation fields。
- AI-facing `reviewStatus` 回答 architecture claim 是否可信。
- `lifecycleStatus` 回答 item 在 implementation progress 的哪個階段。

Valid `lifecycleStatus` values：

- `draft`
- `planned`
- `ready`
- `developing`
- `completed`
- `blocked`
- `needs_refactor`
- `deprecated`

不要把 `completed`、`blocked`、`developing`、`planned` 這類 lifecycle values 寫進 review status fields。

Missing node/edge `lifecycleStatus` 在 display/export/filter/summary layers 會被視為 `planned`，但不得只為了補 default 就寫回 graph data。

## Current Boundaries

不要新增或暗示 current support for：

- backend
- database
- auth
- cloud sync
- backend/proxy/cloud AI service
- MCP server
- REST API
- CLI
- repo analyzer
- autonomous agent execution
- undo/redo
- command replay
- conflict resolution
- signed/tamper-proof audit trail
- canvas direct editing
- drag-to-create
- full visual graph editor

Future directions may mention these only when clearly marked as future-only。

## AI/Codex Handoff Rules

Implementation milestones 的 Codex prompts 應要求：

- inspect repo first
- keep scope small
- preserve local-first boundaries
- preserve `reviewStatus` / `lifecycleStatus` semantics
- do not modify schemas or command/context semantics unless explicitly scoped
- run `npm run validate:example`
- run `npm run build`
- run `git diff --check`
- run `git status -sb`
- report files changed, validation result, limitations, git status, suggested commit message
- do not commit
- do not push

Codex output 在 reviewed 前只應被視為 evidence/draft。如果 Codex 產生 `eflow-command/v0.1`，仍必須走 Local Command Import: Validate -> Dry Run -> Apply。

## Privacy Notes

AI Collaboration Console 會用 browser direct requests 呼叫 configured `Base URL`。

API key behavior：

- API key 預設存在 React state。
- 如果選擇 "remember key"，會存到 browser `localStorage` 的 `eflow.aiChat.apiKey`。
- API key 不得進入 Workspace JSON、EFlow Context JSON、source files、docs、commits 或 exports。

Context behavior：

- No context mode 只送 user message 和 prompt-mode instructions。
- Summary context 會送 compact project state。
- Full context 在 selected 期間，每則訊息都會送 complete `eflow-context/v0.1` JSON。

## Validation Guidance

Docs-only checkpoints 請 run：

```bash
npm run validate:example
npm run build
git diff --check
git status -sb
```

Docs-only changes 若 validation/build pass 且沒有 UI code changed，通常不需要 browser smoke check。

## Next Recommended Milestone

此 handoff 沒有開始任何 implementation milestone。

Possible future-only product directions remain：

- Edge lifecycle badges and edge lifecycle filters。
- AI Collaboration Console streaming。
- Optional chat history persistence and chat audit events, if explicitly designed later。
- Automatic command extraction/import from AI Chat while preserving Validate -> Dry Run -> Apply。
- MCP/CLI/REST/API surfaces after local-first baseline is stable。
- Repo analyzer or agent execution after explicit privacy/safety design。

Do not begin any future milestone without explicit owner request。
