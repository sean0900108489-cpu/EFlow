# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-05.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期日。
- Confidence: 低

## 3. Main topic

- Topic: `Command History / Audit Log foundation`。

## 4. Product decisions

- Decision: Audit log 是 local-first workspace history，不是 undo/replay/conflict resolution/signed event store。
- Evidence: milestone scope 與 known limitations。
- Confidence: 高

- Decision: Change History panel 放在右側 inspector stack，靠近 Manual Context / Implementation Progress。
- Evidence: 完成報告。
- Confidence: 高

## 5. Architecture decisions

- Decision: 新增 `eflow-audit/v0.1` event schema/type。
- Evidence: 完成報告指出 `src/types/eflowAudit.ts`。
- Confidence: 高

- Decision: `auditLog` 屬於 workspace document；missing `auditLog` 對舊 workspace default `[]`。
- Evidence: persistence/restore requirements 與完成報告。
- Confidence: 高

- Decision: Audit helpers 包含 `createAuditEvent`, `appendAuditEvent`, `trimAuditLog`, `buildAuditLogSummary`，append immutable，history capped。
- Evidence: prompt 與完成報告。
- Confidence: 高

## 6. Workflow decisions

- Decision: UI apply path 才記錄 `ai_command_applied`；headless apply helper 不應偷偷追加 audit event。
- Evidence: README/current docs 也確認 successful UI apply records audit event。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: Audit event payload 要 compact，不存 full graph snapshots 或大型 command。
- Evidence: audit schema requirements。
- Confidence: 高

- Rule: Inspector review/lifecycle edits 若有 audited，legacy `status` 記為 review status，不可當 lifecycle。
- Evidence: 完成報告。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 不做 undo/redo、command replay、conflict resolution、signed audit、backend/cloud sync。
- Evidence: Not allowed 與 known limitations。
- Confidence: 高

## 9. Completed items

- Item: Audit schema/types、helpers、workspace persistence/validation、`AuditLogPanel` 完成。
- Evidence: 完成報告列出 files changed 與 browser smoke。
- Confirmed in current repo: 是；current repo 有 `src/types/eflowAudit.ts`, `src/lib/auditLog.ts`, `src/components/audit/AuditLogPanel.tsx`。

- Item: 初始 event coverage 包含 manual node/edge creation、AI command apply、node/edge review/lifecycle edits。
- Evidence: 完成報告。
- Confirmed in current repo: 是。

## 10. Future ideas

- Future idea: `Audit Coverage Polish`。
- Evidence: next recommended milestone。
- Notes: current repo 已完成。

## 11. Deferred ideas

- Deferred idea: undo/replay/conflict/signed audit。
- Reason deferred: audit log 只作 compact local history。
- Evidence: known limitations。

## 12. Rejected ideas

- Rejected idea: 將 audit log 設計為可 replay 的 command history。
- Reason rejected: milestone 明確不是 replay/undo。
- Evidence: Not allowed。

## 13. Conflicts with current repo truth

- Old-chat claim: canvas lifecycle badges/filter 未實作。
- Current repo truth: node lifecycle badges 與 node lifecycle filters 已完成；edge lifecycle badges/filters 仍未完成。
- Resolution: current repo truth wins。

## 14. Recommended project-memory entries

- Target section: Architecture decisions
- Distilled entry: `auditLog` is compact local workspace history under `eflow-audit/v0.1`; it is not undo, replay, conflict resolution, or a signed audit trail。
- Source summary: `memory-05-summary.md`
- Promotion recommendation: 推薦

