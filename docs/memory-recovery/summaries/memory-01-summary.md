# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-01.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期日，沒有年月日。
- Confidence: 低

## 3. Main topic

- Topic: EFlow v0 初始產品規格、`Local AI Command Import UI` push/status 檢查，以及 `Lifecycle State Inspector Display`。

## 4. Product decisions

- Decision: EFlow 不是 generic todo app、generic flowchart tool 或 AI agent platform；核心是結構化工程規劃與 AI-readable JSON handoff。
- Evidence: 初始規格要求 `EngineeringFlowInput` 產生 `EngineeringFlowGraph`，使用者可檢視、確認、匯出 JSON。
- Confidence: 高

- Decision: Canvas 必須只是 `EngineeringFlowGraph` 的 rendering；graph data model 是 source of truth。
- Evidence: 多段 prompt 重複要求不要建立 visual-only diagram/state。
- Confidence: 高

- Decision: `node.status` / `edge.status` 是 review/confirmation 狀態，`lifecycleStatus` 是 implementation lifecycle。
- Evidence: `Lifecycle State Inspector Display` prompt 明確禁止把 completed/blocked 寫入 `status`。
- Confidence: 高

## 5. Architecture decisions

- Decision: v0 技術棧為 Vite + React + TypeScript + `@xyflow/react` + CSS，無 backend/database/auth。
- Evidence: 初始規格列出允許與禁止項目。
- Confidence: 高

- Decision: `EngineeringFlowInput`, `EngineeringFlowGraph`, `FullAIContext` 等型別集中於 `src/types/engineeringFlow.ts`。
- Evidence: 初始規格要求集中定義 schema/type。
- Confidence: 高

- Decision: `Lifecycle State Inspector Display` 只在 `NodeInspector` / `EdgeInspector` 加 `lifecycleStatus` UI，不改 graph generation 或 command import。
- Evidence: 完成報告列出只改 `NodeInspector.tsx`, `EdgeInspector.tsx`, `HANDOFF.md`。
- Confidence: 高

## 6. Workflow decisions

- Decision: 在 push 或 implementation 前先跑 `pwd`, `git status -sb`, `git log`, `npm run validate:example`, `npm run build`。
- Evidence: 多個 prompt 要求先檢查 repo state，狀態不符就停止。
- Confidence: 高

- Decision: 小 milestone 完成後先報告，不自動 commit/push，除非使用者明確要求。
- Evidence: `Lifecycle State Inspector Display` 明確要求 DO NOT COMMIT/DO NOT PUSH。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: 不可混淆 review status 與 `lifecycleStatus`；只在使用者改 dropdown 時寫入 `lifecycleStatus`。
- Evidence: prompt 反覆指出 `node.status` / `edge.status` 保持原 review semantics。
- Confidence: 高

- Rule: 若 localStorage 有舊 smoke 狀態，測試前清掉 local workspace。
- Evidence: lifecycle smoke check 提醒清理舊狀態。
- Confidence: 中

## 8. Safety boundaries

- Boundary: 當時邊界禁止 backend、database、auth、real AI API、repo upload、agent execution。
- Evidence: 初始規格與 lifecycle prompt 都列為禁止項。
- Confidence: 高

- Boundary: push 只在 working tree clean 且 ahead 1 commit 且 latest commit 符合預期時執行。
- Evidence: `Add local AI command import UI` push prompt。
- Confidence: 高

## 9. Completed items

- Item: `Add local AI command import UI` 被正常 push 到 `origin/main`。
- Evidence: 完成報告顯示 `7ac6c1c Add local AI command import UI` push 後 `main...origin/main`。
- Confirmed in current repo: 是；current git log 含 `7ac6c1c`。

- Item: `Lifecycle State Inspector Display` 完成，node/edge inspector 可顯示與編輯 `lifecycleStatus`。
- Evidence: 完成報告列出 lifecycle dropdown、validation/build/diff/browser smoke passed。
- Confirmed in current repo: 是；current repo 有 `NodeInspector` / `EdgeInspector` lifecycle controls。

## 10. Future ideas

- Future idea: 接續做 `Lifecycle Progress Summary`。
- Evidence: lifecycle checkpoint 的 next recommended milestone。
- Notes: current repo 已完成，舊 future idea 已成 current truth。

## 11. Deferred ideas

- Deferred idea: Canvas lifecycle badges、lifecycle dashboard、Manual Graph Editing。
- Reason deferred: lifecycle inspector milestone 有意保持小範圍。
- Evidence: Not allowed / known limitations。

## 12. Rejected ideas

- Rejected idea: visual-only graph state。
- Reason rejected: 與 graph-as-source-of-truth 原則衝突。
- Evidence: 初始規格與 canvas requirements。

## 13. Conflicts with current repo truth

- Old-chat claim: v0 禁止 real AI API。
- Current repo truth: current repo 有 `AIChatConsole` direct-browser BYOK provider call；但仍無 backend/proxy/cloud AI service。Current repo truth wins。
- Resolution: 記錄為「無後端 AI 服務」較精準，不應再絕對寫成沒有任何 direct browser provider call。

- Old-chat claim: Manual Graph Editing 尚未實作。
- Current repo truth: current repo 已有 manual node/edge UI 與 helpers。
- Resolution: 不把舊限制 promoted 為現況。

## 14. Recommended project-memory entries

- Target section: Product philosophy
- Distilled entry: `EngineeringFlowGraph` 是 source of truth；canvas 只是 rendering，不建立 visual-only diagram state。
- Source summary: `memory-01-summary.md`
- Promotion recommendation: 推薦

- Target section: Architecture decisions
- Distilled entry: `status` / `reviewStatus` 與 `lifecycleStatus` 必須分離；implementation progress 永遠寫入 `lifecycleStatus`。
- Source summary: `memory-01-summary.md`
- Promotion recommendation: 推薦

