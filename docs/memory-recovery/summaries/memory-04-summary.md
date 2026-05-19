# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-04.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期日。
- Confidence: 低

## 3. Main topic

- Topic: `Manual Editing Integration Polish`。

## 4. Product decisions

- Decision: 右側 stack 增加 `Manual Context` summary，顯示 manual node/relationship count，讓人類看見手動補充的 context。
- Evidence: milestone requirements 與完成報告。
- Confidence: 高

- Decision: Review Queue 可以更 manual-aware，但不改 review semantics。
- Evidence: prompt 允許 small manual badge/reason copy，禁止深度 refactor。
- Confidence: 高

## 5. Architecture decisions

- Decision: 新增 `buildManualEditSummary`，以 `item.provenance?.sourceType === "manual_edit"` 判斷 manual items。
- Evidence: 完成報告。
- Confidence: 高

- Decision: Manual counts by review status 使用 legacy graph `status`，不是 `lifecycleStatus`。
- Evidence: requirements 明確要求不要用 lifecycle 作 review status。
- Confidence: 高

## 6. Workflow decisions

- Decision: Browser smoke 需驗證 manual summary、manual badges、exports、refresh restore、existing panels。
- Evidence: smoke checklist 與完成報告。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: 不要讓 manual context polish 擴大成 full graph editor。
- Evidence: Not allowed 禁止新增 graph editing feature、canvas direct editing。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 不做 command history/audit log、canvas badges/filters、drag-to-create。
- Evidence: Not allowed 清單。
- Confidence: 高

## 9. Completed items

- Item: `Manual Context Summary` 完成，顯示 manual node/relationship counts 與 compact review-status buckets。
- Evidence: 完成報告。
- Confirmed in current repo: 是；current repo 有 `ManualContextSummary.tsx` 與 `buildManualEditSummary.ts`。

- Item: Review Queue 增加 manual badges/reason copy。
- Evidence: 完成報告。
- Confirmed in current repo: 是。

## 10. Future ideas

- Future idea: `Command History / Audit Log foundation`。
- Evidence: next recommended milestone。
- Notes: current repo 已完成。

## 11. Deferred ideas

- Deferred idea: Canvas direct editing、drag-to-create、canvas lifecycle badges、lifecycle filters。
- Reason deferred: manual integration polish 只做 summary/review UI。
- Evidence: known limitations。

## 12. Rejected ideas

- Rejected idea: manual integration polish 改變 Add Manual Node/Edge 行為。
- Reason rejected: scope 要保持小，不改已完成手動建立流程。
- Evidence: Not allowed。

## 13. Conflicts with current repo truth

- Old-chat claim: canvas lifecycle badges / lifecycle filters 尚未實作。
- Current repo truth: current repo 已有 canvas node lifecycle badges 與 lifecycle canvas filters；edge lifecycle badges/filters 仍未完成。
- Resolution: 只保留為當時限制。

## 14. Recommended project-memory entries

- Target section: Architecture decisions
- Distilled entry: Manual context is identified solely by `provenance.sourceType === "manual_edit"` and summarized separately from lifecycle progress。
- Source summary: `memory-04-summary.md`
- Promotion recommendation: 推薦

