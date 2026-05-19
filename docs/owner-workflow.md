# EFlow Owner Workflow Guide

本指南是給非程式背景 owner 使用的安全工作流。目標是把「想法」整理成可 review、可交給 Codex 的 project context，並在 Codex 回報後同步回 EFlow。

核心流程：

```text
Intake → Generate → Review Gate → Milestone → Handoff → Sync Back
```

請把 EFlow 當成 local-first、schema-first 的專案地圖工具。`EngineeringFlowGraph` 是 source of truth；canvas 只是視覺呈現。AI Chat、Codex report、外部模型回覆都只是草稿或證據來源，必須經過 owner review 和 validation 才能變成專案事實。

## 1. 10-minute quick start

第 0 到 2 分鐘：在左側 Structured Input 寫下專案意圖。先填 `projectName`、`projectIntent`，再補 `userTypes`、`mainScreens`、`coreFunctions`、`flowSteps`、`dataObjects`、`aiRoles`、`unknowns`。不確定的事不要硬猜，放進 `unknowns`。

第 2 到 3 分鐘：按「產生工程流程圖」。EFlow 會從 `EngineeringFlowInput` deterministic 產生 `EngineeringFlowGraph`。

第 3 到 6 分鐘：看 Canvas 和 Inspector。確認每個 node 是否真的代表專案內容，每條 edge 方向是否正確。把錯誤、不確定、缺上下文的項目標成 `needs_review` 或補 manual context。

第 6 到 8 分鐘：做 Review Gate。檢查 Review queue、Lifecycle 摘要、blocking questions、manual context。不要因為圖看起來漂亮就交給 Codex。

第 8 到 9 分鐘：定義小 milestone。選出本次要做的 nodes，通常把可交付的項目設成 `ready`，不做的保留 `planned`，卡住的設成 `blocked`。

第 9 到 10 分鐘：從 AI-Native Context Export 複製或下載 `eflow-context/v0.1`。用它寫 Codex handoff prompt，並明確要求 Codex 先檢查 repo、只做本 milestone、跑 validation/build、不要 commit、不要 push。

## 2. API key is optional

API key 只影響 AI Collaboration Console。沒有 API key 也可以完整使用 EFlow 的核心功能：

- 編輯 Structured Input。
- 產生、review、手動補 graph。
- 使用 Workspace JSON backup/restore。
- 匯出 `eflow-context/v0.1` 給 Codex 或其他 AI 工具。
- 匯入 `eflow-command/v0.1` 並手動 Validate -> Dry Run -> Apply。

AI Chat 是 optional，而且是 draft-only。它不會自動修改 graph，也不會自動套用 command。

## 3. AI Console privacy warning

EFlow 是 local-first，但這不等於 Full context 永遠不會離開瀏覽器。

在 AI Collaboration Console 裡，如果 Context mode 選「摘要 context」或「完整 EFlow Context」，你送出的訊息會附帶對應 context，並透過瀏覽器直接送到你設定的 provider `Base URL`。選「完整 EFlow Context」時，每則訊息都會送出完整 `eflow-context/v0.1` JSON。

API key 預設只存在本次 browser session；如果勾選「在此瀏覽器記住 key」，它會存到 browser `localStorage` 的 `eflow.aiChat.apiKey`。API key 不會寫進 Workspace JSON 或 EFlow Context JSON，但 provider 仍會收到你送出的 prompt 和你選擇附加的 context。

使用原則：

- 不要把 secrets、private customer data、未授權內容放進 AI Chat。
- 只有在你願意讓 provider 看到目前 graph snapshot 時，才選 Summary 或 Full context。
- Provider 可能因 CORS 阻擋 browser direct request；這不是 EFlow backend 問題，因為目前沒有 backend/proxy/cloud AI service。
- AI 回覆是草稿，不是 EFlow truth。

## 4. Structured Input workflow

Structured Input 是 Intake 的地方，不是自由筆記區。請用 owner 語言描述專案，但保持結構清楚。

建議順序：

1. `projectIntent`：一句話寫清楚產品要解決什麼。
2. `userTypes`：誰會用，目標是什麼。
3. `mainScreens`：使用者看得到的主要畫面。
4. `coreFunctions`：產品必須做的功能，並用 `must_have`、`should_have`、`later` 分優先級。
5. `flowSteps`：主要流程步驟，按順序填 `step`。
6. `dataObjects`：功能會讀寫的資料物件。
7. `aiRoles`：AI 可以協助的任務，以及是否需要 human confirmation。
8. `unknowns`：所有不確定、會阻塞設計或實作的問題。

不要在 Structured Input 裡發明 backend、auth、cloud sync、payment、agent execution，除非這些是產品需求本身。

## 5. Generate Graph workflow

按「產生工程流程圖」後，EFlow 會從 `EngineeringFlowInput` 建立 `EngineeringFlowGraph`：

- nodes 來自 intent、users、screens、features、flow steps、data objects、AI tasks、questions。
- edges 來自輸入欄位之間的關聯，例如 feature related screen、flow step order、data usage、AI task confirmation。
- generated nodes 和 edges 初始 review 狀態通常是 `suggested`。
- 缺少 `lifecycleStatus` 的項目在 display/export/summary 會當成 `planned`，但 EFlow 不會為了補 default 而寫回 graph data。

Generate 後不要直接 handoff。先進 Review Gate。

## 6. Regenerate Graph warning

如果 Structured Input 已變更，重新產生 graph 會替換目前 graph，並可能移除目前 graph 裡的 manual graph edits。

在按「替換圖譜」前先問自己：

- 我需要保留目前 manual nodes 或 manual edges 嗎？
- 我是否已下載 Workspace JSON 當備份？
- 我是否其實只需要在 Inspector 或 Manual Editing 補一個小修正？
- 目前 graph 是否已交給 Codex，並等待 Sync Back？

如果答案不確定，先下載 Workspace JSON。

## 7. Canvas / Inspector / Review / Lifecycle explanation

Canvas：顯示目前 `EngineeringFlowGraph`。它不是獨立 diagram truth。你看到的 node 和 edge 來自 graph data。

Inspector：選取 node 或 edge 後，檢查 title、description、type、relationshipType、review 狀態、`lifecycleStatus`、provenance。這是 owner 做細節判斷的主要地方。

Review：確認 generated nodes 和 relationships 是否可信。Review answers the question: "這個架構 claim 可以被信任嗎？"

Lifecycle：追蹤 implementation progress。Lifecycle answers the question: "這個項目目前做到哪裡？"

Change History / Audit Log：本機 compact history，不是 undo、replay、collaboration history，也不是 signed/tamper-proof audit trail。

AI Interop：匯出 `eflow-context/v0.1`，或匯入 `eflow-command/v0.1`。Command 必須手動 Validate -> Dry Run -> Apply。

Workspace / Export：管理 Workspace JSON backup/restore，以及 legacy JSON handoff exports。

## 8. Edge direction convention

請用這個 convention 讀每條 edge：

```text
source --relationshipType--> target
```

例子：

- `feature_a --uses--> data_user` 表示 feature 使用 user data。
- `flow_step_2 --depends_on--> feature_login` 表示 flow step 2 依賴 login feature。
- 在 dependency index 裡，`A depends_on B` 代表 A depends on B，B blocks A。
- `flow_step_1 --leads_to--> flow_step_2` 表示流程從 step 1 到 step 2。

新增 manual edge 時，先用一句話把關係唸出來。若句子聽起來反了，就交換 source/target。

## 9. Manual provenance is not confirmed

`provenance.sourceType = "manual_edit"` 只表示這個 node 或 edge 是人手動新增的來源記錄。它不等於「內容已經被證實」。

目前 manual nodes/edges 預設可能是 review `confirmed`、`lifecycleStatus = "planned"`，除非 UI 選擇其他 supported value。這是 workflow default，不是客觀證明。Owner 仍要檢查：

- manual item 是否描述清楚。
- edge 方向是否正確。
- 是否有 evidence 或 owner decision 支撐。
- 是否應該改成 `needs_review` 或 `suggested`。

## 10. Review Status vs Lifecycle Status

Review status 和 lifecycle status 永遠分開。

Review status 表示 architecture claim 的可信度：

- `suggested`：產生或匯入，但尚未 human-confirmed。
- `confirmed`：owner 已確認，可作為較高信任 context。
- `needs_review`：還需要人工 review。
- `rejected`：已拒絕，不應作為有效 project context。

Lifecycle status 表示實作進度：

- `draft`：早期草稿。
- `planned`：已規劃，尚未開始。
- `ready`：可交給實作。
- `developing`：實作中。
- `completed`：目前 scope 已完成。
- `blocked`：被阻塞。
- `needs_refactor`：已做或已設計，但需要整理或重構。
- `deprecated`：不再建議投入。

不要把 `completed`、`blocked`、`developing`、`planned` 這類 lifecycle values 寫成 review status。也不要用 `confirmed` 表示功能已做完。

## 11. Graph Quality Gate manual checklist

這是人工 checklist，不是目前 app 裡的自動 gate 功能。

Handoff 前請確認：

- `projectIntent` 能讓外部工程師理解產品目標。
- 主要 users、screens、features、flow steps、data objects 沒有明顯缺漏。
- Blocking `unknowns` 已保留為 question nodes，不被硬猜成架構。
- Review queue 中，本次 milestone scope 沒有未處理的 critical/needs-review 項目。
- 每個要交給 Codex 的 node 都有清楚 title、description、AI-readable summary 或足夠 context。
- `depends_on`、`leads_to`、`uses` 等 edge 方向已人工檢查。
- Manual nodes/edges 已檢查，不只因為 `manual_edit` 就當成真。
- `reviewStatus` 和 `lifecycleStatus` 沒有混用。
- 要做的項目通常是 `confirmed` + `ready` 或 `confirmed` + `planned`。
- 不做、未決、被阻塞的項目有清楚標成 `planned`、`blocked`、`needs_review` 或保留 question。
- 已下載 Workspace JSON 備份。
- 已匯出最新 `eflow-context/v0.1` 給 handoff。

## 12. Non-goals and acceptance criteria

Non-goals：

- EFlow 不會自動跑 Codex。
- EFlow 不會讀 repo 並證明 Codex 真的完成工作。
- AI Chat 不會自動修改 graph。
- Codex report 不會自動變成 truth。
- Workspace JSON 不是給 AI/Codex 的主要 handoff 格式。
- Audit Log 不是 undo、replay、conflict resolution 或 signed audit trail。

Owner acceptance criteria：

- 本次 milestone scope 很小，Codex 可以在一次工作中完成。
- Handoff prompt 有明確 do/do-not-do 邊界。
- Validation commands 寫清楚，例如 `npm run validate:example`、`npm run build`、`git diff --check`、`git status -sb`。
- Codex 必須回報 files changed、validation result、limitations、git status、suggested commit message，並確認 no commit/push。
- Owner 在 Sync Back 前已讀 Codex diff/report，並用 validation 或人工操作確認。

## 13. Workspace JSON vs EFlow Context JSON

Workspace JSON 是給 EFlow 自己 backup/restore 用的。

- schemaVersion: `eflow-workspace/v0.3`
- 用途：保留 editing/review state、selected item、manual graph edits、lifecycle state、`auditLog`。
- 適合：換瀏覽器前備份、回復工作狀態、保存 owner review 狀態。
- 不適合：直接當 Codex 主要 prompt。

EFlow Context JSON 是給 AI/Codex handoff 用的。

- schemaVersion: `eflow-context/v0.1`
- 用途：machine-readable project context，包括 graph、reviewSummary、progressSummary、dependencyIndex、blockingQuestions、nextDevelopmentTargets、Mermaid text、policies、commandInterface。
- 適合：交給 Codex、Claude、Cursor 或其他 downstream implementation agent。
- 不包含：完整 workspace audit history。

請記住：Workspace JSON 是 backup/restore；EFlow Context JSON 是 AI/Codex handoff。

## 14. Codex handoff workflow

建議 handoff prompt 包含：

```text
Repo path:
/absolute/path/to/repo

Use attached EFlow Context JSON:
schemaVersion: eflow-context/v0.1

Milestone:
<只寫本次要完成的小範圍>

Do:
- Read project docs and relevant source first.
- Implement only this milestone.
- Preserve reviewStatus vs lifecycleStatus semantics.
- Run validation/build/diff checks.

Do not:
- Modify unrelated app code.
- Modify schemas unless explicitly requested.
- Change command validation/apply behavior unless explicitly requested.
- Change AI context export semantics unless explicitly requested.
- Commit.
- Push.

Final report:
- files changed
- validation result
- limitations
- git status
- suggested commit message
- confirm no commit/push
```

如果使用 AI Collaboration Console 產生 Codex prompt，請把它當草稿。送給 Codex 前仍要人工刪掉過大的 scope、補 repo path、補 validation commands、補 do-not-do 邊界。

## 15. Codex completion verification before marking completed

Codex report 不是 automatically truth。即使 Codex 說完成了，也要 owner review and validate。

Sync Back 前請做：

1. 讀 Codex final report，確認 files changed 沒有超出 scope。
2. 看 validation 是否真的通過；若失敗，不能標 `completed`。
3. 檢查 Codex 是否有 commit/push；若有違反 handoff，要先處理 repo state。
4. 檢查功能或文件是否符合 acceptance criteria。
5. 必要時請 Codex 修正，或把相關 node 設成 `needs_refactor`、`blocked`、`developing`。
6. 只有在 owner 已確認並完成必要 validation 後，才把對應 nodes/edges 的 `lifecycleStatus` 改成 `completed`。
7. 如果 Codex 產生 `eflow-command/v0.1`，先貼到 Local Command Import，按 Validate，再 Dry Run，確認 changes 合理後才 Apply。

## 16. Common mistakes

- 把 `confirmed` 當成已實作。`confirmed` 只是 review trust，不是 progress。
- 把 `completed` 寫進 review status。`completed` 只能是 `lifecycleStatus`。
- 重新 Generate 前沒有下載 Workspace JSON，導致 manual graph edits 被替換。
- 把 Workspace JSON 貼給 Codex，卻忘了匯出 `eflow-context/v0.1`。
- 在 AI Chat 選 Full EFlow Context 後，忘了每則訊息都會送出完整 context。
- 把 AI Chat 回覆直接當成架構決策。
- 把 Codex report 直接當成完成證明。
- 手動新增 edge 時 source/target 反了。
- 因為看到 `manual_edit` 就以為內容已被證實。
- 一次 handoff 太多 nodes，讓 Codex scope 失控。
- 沒有在 handoff prompt 寫 no commit/no push。

## 17. UI label / schema enum mapping

UI 會翻譯 display labels，但 schema names、enum values、IDs、operation names 必須保持 English。

Node type：

| UI label | schema enum |
| --- | --- |
| 意圖 | `intent` |
| 使用者 | `user` |
| 畫面 | `screen` |
| 功能 | `feature` |
| 流程步驟 | `flow_step` |
| 資料物件 | `data_object` |
| AI 任務 | `ai_task` |
| 問題 | `question` |

Relationship type：

| UI label | schema enum |
| --- | --- |
| 服務 | `serves` |
| 使用 | `uses` |
| 導向 | `leads_to` |
| 包含 | `contains` |
| 依賴 | `depends_on` |
| 產生 | `produces` |
| 需要確認 | `needs_confirmation` |
| 相關 | `relates_to` |

Review status：

| UI label | schema enum |
| --- | --- |
| 建議 | `suggested` |
| 已確認 | `confirmed` |
| 待 review | `needs_review` |
| 已拒絕 | `rejected` |

Graph compatibility note：legacy `node.status` 可表示 `suggested`、`confirmed`、`needs_review`；legacy `edge.status` 可表示 `suggested`、`confirmed`、`rejected`。Formal `reviewStatus` 有四個值，但目前 graph apply 不能把 node `reviewStatus: "rejected"` 或 edge `reviewStatus: "needs_review"` 寫進 legacy graph field。

Lifecycle status：

| UI label | schema enum |
| --- | --- |
| 草稿 | `draft` |
| 已規劃 | `planned` |
| 可實作 | `ready` |
| 實作中 | `developing` |
| 已完成 | `completed` |
| 受阻 | `blocked` |
| 需要重構 | `needs_refactor` |
| 已棄用 | `deprecated` |

AI Chat prompt modes：

| UI label | internal id |
| --- | --- |
| 自由對話 | `free_chat` |
| 產生 Codex milestone prompt | `codex_milestone_prompt` |
| 將 Codex report 轉成 eflow-command | `codex_report_to_command` |
| Raw idea 轉 EngineeringFlowInput JSON | `raw_idea_to_input` |
| 進度 / handoff 摘要 | `progress_handoff_summary` |
| 策略架構諮詢 | `strategic_architecture_consultation` |

AI Chat context modes：

| UI label | internal id |
| --- | --- |
| 不附加 context | `none` |
| 摘要 context | `summary` |
| 完整 EFlow Context | `full` |

Command workflow：

| UI step | meaning |
| --- | --- |
| Validate | validate `eflow-command/v0.1` envelope |
| Dry Run | run graph checks without mutation |
| Apply Command | apply to current local graph only after success |

## 18. Future product directions, clearly marked as future only

以下都是 future only，不是 current behavior：

- Edge lifecycle badges 和 edge lifecycle filters。
- Live demo URL / deployment link update in README and GitHub repo About。
- MCP、CLI、REST 或 API surfaces。
- Repo analyzer。
- Autonomous agent execution 或 downstream implementation automation。
- AI Collaboration Console streaming support。
- Chat history persistence 或 chat audit events。
- Automatic command extraction/import from AI Chat，但仍必須保留 Validate -> Dry Run -> Apply。
- Canvas direct editing、drag-to-create、full visual graph editor。
- Undo/redo、command replay、conflict resolution。
- Backend、database、auth、cloud sync、multi-user collaboration。
- Signed 或 tamper-proof audit trail。

在這些 future directions 真的實作前，不要在 handoff prompt 或 docs 裡把它們寫成 current capability。
