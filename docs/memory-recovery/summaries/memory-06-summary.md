# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-06.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期一。
- Confidence: 低

## 3. Main topic

- Topic: `Audit Coverage Polish` 與是否啟動 Canvas Node Lifecycle Badges 的狀態判斷。

## 4. Product decisions

- Decision: 先 polish audit coverage，再做較大的 canvas lifecycle badge work。
- Evidence: status report 指出 HANDOFF 建議 Audit Coverage Polish。
- Confidence: 中

- Decision: Audit Log panel 在 no-graph inspector stack 也要可見，讓 input import audit events 可被看到。
- Evidence: 完成報告。
- Confidence: 高

## 5. Architecture decisions

- Decision: 新增 audit event types：`graph_generated`, `graph_replaced`, `workspace_imported`, `engineering_input_imported`, `full_ai_context_imported`。
- Evidence: 完成報告。
- Confidence: 高

- Decision: Review Queue 不另加 duplicate audit path，因為 actions 已經走 audited `updateNode` / `updateEdge` handlers。
- Evidence: 完成報告。
- Confidence: 高

- Decision: Workspace import preserve imported `auditLog`，再 append `workspace_imported`。
- Evidence: 完成報告。
- Confidence: 高

## 6. Workflow decisions

- Decision: Clear workspace 不強制記 audit event，因為它只清 local storage saved copy，open workspace 不變。
- Evidence: 完成報告。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: 不 duplicate audit events；先 inspect existing audit wiring。
- Evidence: implementation requirements。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 保持 `eflow-audit/v0.1` schemaVersion，不做 undo/replay/backend/canvas features。
- Evidence: Not allowed 清單。
- Confidence: 高

## 9. Completed items

- Item: Audit coverage polish 完成，包含 graph generation/replacement 與 workspace/input/full-context import events。
- Evidence: 完成報告與 validation/browser smoke。
- Confirmed in current repo: 是。

- Item: Audit Log panel friendly labels/source labels 改善。
- Evidence: 完成報告。
- Confirmed in current repo: 是。

## 10. Future ideas

- Future idea: Canvas Node Lifecycle Badges。
- Evidence: next recommended milestone。
- Notes: current repo 已完成 node badges。

## 11. Deferred ideas

- Deferred idea: undo/redo、command replay、signed audit、backend/cloud sync、canvas lifecycle badges/filters。
- Reason deferred: audit coverage milestone 不做新 feature。
- Evidence: known limitations。

## 12. Rejected ideas

- Rejected idea: filter changes 作 audit event。
- Reason rejected: filter 是 view-only UI state，不是 graph truth。
- Evidence: 後續 lifecycle filter prompt 延續此原則。

## 13. Conflicts with current repo truth

- Old-chat claim: Canvas lifecycle badges / filters 尚未實作。
- Current repo truth: node lifecycle badges 與 node lifecycle filters 已完成。
- Resolution: 不 promoted 為現況。

## 14. Recommended project-memory entries

- Target section: Workflow decisions
- Distilled entry: Audit event coverage should avoid duplicate paths; review queue changes flow through audited graph update handlers。
- Source summary: `memory-06-summary.md`
- Promotion recommendation: 可推薦

