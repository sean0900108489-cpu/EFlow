# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-02.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期日，沒有年月日。
- Confidence: 低

## 3. Main topic

- Topic: `Lifecycle Progress Summary` 與 `Manual Graph Editing Headless Helpers`。

## 4. Product decisions

- Decision: `Implementation Progress` 是人類可讀的 lifecycle summary，不是新的 persistence/export layer。
- Evidence: prompt 要求由 current graph state derive counts，不新增 persistence。
- Confidence: 高

- Decision: Manual graph editing 先做 headless helpers，再做 UI。
- Evidence: milestone 明確禁止 Add Node UI/Add Edge UI，只建立 helper functions。
- Confidence: 高

## 5. Architecture decisions

- Decision: `buildLifecycleSummary` 從 `EngineeringFlowGraph` derive node/edge lifecycle counts；missing `lifecycleStatus` 視為 `planned`，但不寫回 graph。
- Evidence: 完成報告描述 nodeCounts/edgeCounts 與 ID buckets。
- Confidence: 高

- Decision: `manualGraphEditing.ts` 提供 `createManualNode`, `createManualEdge`, `insertManualNode`, `insertManualEdge`。
- Evidence: 完成報告列出 helper functions。
- Confidence: 高

- Decision: manual nodes/edges default `status: "confirmed"`, `lifecycleStatus: "planned"`, `provenance.sourceType: "manual_edit"`。
- Evidence: 完成報告明確列出 defaults。
- Confidence: 高

## 6. Workflow decisions

- Decision: 對 headless helper 的 smoke check 可以不跑 browser，但必須 build/validate/diff-check。
- Evidence: headless milestone final report 說 browser smoke not run because headless-only。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: helper insert 必須 immutable，失敗時不可 mutate original graph。
- Evidence: prompt 與完成報告皆列為 insert behavior。
- Confidence: 高

- Rule: duplicate node id、missing source/target、self-edge、duplicate exact edge 都要安全拒絕。
- Evidence: `insertManualNode` / `insertManualEdge` requirements 與完成報告。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 此階段不可做 manual UI、canvas badges、lifecycle filters、backend/API/agent execution。
- Evidence: Not allowed 清單。
- Confidence: 高

## 9. Completed items

- Item: `Lifecycle Progress Summary` 完成，右側 inspector stack 顯示 node/edge lifecycle counts。
- Evidence: 完成報告顯示 validation/build/diff/browser smoke passed。
- Confirmed in current repo: 是；current repo 有 `src/lib/buildLifecycleSummary.ts` 與 `src/components/lifecycle/LifecycleProgressSummary.tsx`。

- Item: `Manual Graph Editing Headless Helpers` 完成。
- Evidence: 完成報告列出 helper files 與 validation。
- Confirmed in current repo: 是；current repo 有 `src/lib/manualGraphEditing.ts`。

## 10. Future ideas

- Future idea: Add Manual Node UI。
- Evidence: headless helper milestone 的 next recommended milestone。
- Notes: current repo 已完成。

## 11. Deferred ideas

- Deferred idea: Manual node UI、manual edge UI、canvas editing、canvas lifecycle badges、lifecycle filters。
- Reason deferred: helper milestone 只建立 headless mutation foundation。
- Evidence: known limitations。

## 12. Rejected ideas

- Rejected idea: 把 manual graph editing 做成 UI-only dead end。
- Reason rejected: helpers 要作為 schema-aware graph mutation foundation。
- Evidence: milestone 要求使用 helper 並自然進入 exports/workspace。

## 13. Conflicts with current repo truth

- Old-chat claim: Manual Graph Editing UI 尚未實作。
- Current repo truth: manual node/edge UI 已存在。
- Resolution: 舊 claim 只代表當時 milestone 邊界；current repo truth wins。

## 14. Recommended project-memory entries

- Target section: Architecture decisions
- Distilled entry: lifecycle summary/display layers treat missing `lifecycleStatus` as `planned` without mutating graph data。
- Source summary: `memory-02-summary.md`
- Promotion recommendation: 推薦

- Target section: Architecture decisions
- Distilled entry: manual graph editing uses helper functions that return immutable graph updates and mark provenance as `manual_edit`。
- Source summary: `memory-02-summary.md`
- Promotion recommendation: 推薦

