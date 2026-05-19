# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-03.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期日，沒有年月日。
- Confidence: 低

## 3. Main topic

- Topic: `Add Manual Node UI`、`Add Manual Edge UI`、manual provenance badges。

## 4. Product decisions

- Decision: Manual Node/Edge UI 放在右側 inspector/workspace stack，不做 canvas direct editing。
- Evidence: prompts 指定 placement near lifecycle/manual panels，並禁止 drag-to-create。
- Confidence: 高

- Decision: manual items 應自然出現在 canvas、inspectors、exports、workspace restore，不建獨立 persistence path。
- Evidence: manual node/edge UI requirements。
- Confidence: 高

## 5. Architecture decisions

- Decision: Add Manual Node UI 使用 `createManualNode` + `insertManualNode`，成功後 immutable replace graph state 並選取新 node。
- Evidence: 完成報告。
- Confidence: 高

- Decision: Add Manual Edge UI 使用 `createManualEdge` + `insertManualEdge`，source/target 從 `graph.nodes` select，`relationshipType` 限於 graph-supported values。
- Evidence: 完成報告。
- Confidence: 高

- Decision: NodeInspector/EdgeInspector 只在 `provenance.sourceType === "manual_edit"` 顯示 visual-only badge。
- Evidence: manual provenance polish requirements。
- Confidence: 高

## 6. Workflow decisions

- Decision: Manual UI 的 browser smoke 必須驗證 add/select/export/refresh restore 與 duplicate/self-edge rejection。
- Evidence: smoke checklist 與完成報告。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: UI validation errors 要 friendly，不丟 uncaught errors。
- Evidence: manual edge invalid handling requirements。
- Confidence: 高

- Rule: review status controls 與 lifecycle controls 不因 provenance badge 而改變 semantics。
- Evidence: final report 確認既有 controls unchanged。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 不做 canvas direct editing、drag-to-create、full visual graph editor、audit log、backend/cloud/AI API。
- Evidence: Not allowed 清單。
- Confidence: 高

## 9. Completed items

- Item: Add Manual Node UI 完成，default type `feature`, review `confirmed`, lifecycle `planned`。
- Evidence: 完成報告列出 defaults 與 smoke passed。
- Confirmed in current repo: 是；current repo 有 `src/components/graphEditing/AddManualNodePanel.tsx`。

- Item: Add Manual Edge UI 完成，default relationship `relates_to`, review `confirmed`, lifecycle `planned`。
- Evidence: 完成報告列出 defaults 與 export/restore smoke。
- Confirmed in current repo: 是；current repo 有 `src/components/graphEditing/AddManualEdgePanel.tsx`。

- Item: Manual context / relationship badges 完成。
- Evidence: 完成報告指出 NodeInspector/EdgeInspector badge 行為。
- Confirmed in current repo: 是。

## 10. Future ideas

- Future idea: Manual Editing Integration Polish。
- Evidence: Add Manual Edge UI checkpoint 的 next recommended milestone。
- Notes: current repo 已完成。

## 11. Deferred ideas

- Deferred idea: Canvas direct editing、drag-to-create、canvas lifecycle badges、lifecycle filters、command history/audit log。
- Reason deferred: manual UI milestone 控制 scope。
- Evidence: known limitations。

## 12. Rejected ideas

- Rejected idea: 手動建立 edge 時允許 self-edge 或 duplicate exact edge。
- Reason rejected: graph integrity。
- Evidence: UI 必須安全拒絕。

## 13. Conflicts with current repo truth

- Old-chat claim: command history/audit log 未完成。
- Current repo truth: current repo 已有 `eflow-audit/v0.1` 與 `AuditLogPanel`。
- Resolution: 不提升為現況；只作為當時限制。

## 14. Recommended project-memory entries

- Target section: Product philosophy
- Distilled entry: Manual graph editing is schema-aware local editing, not canvas-only drawing; manual items carry `manual_edit` provenance and flow through exports/workspace。
- Source summary: `memory-03-summary.md`
- Promotion recommendation: 推薦

