# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-07.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期一。
- Confidence: 低

## 3. Main topic

- Topic: `Canvas Node Lifecycle Badges` 與 `Lifecycle Canvas Filters`。

## 4. Product decisions

- Decision: Canvas node cards 顯示 compact lifecycle badge/dot/pill，display-only。
- Evidence: first milestone requirements。
- Confidence: 高

- Decision: Lifecycle filters 是 view-only UI state，不存 workspace、不 audit。
- Evidence: filter milestone requirements。
- Confidence: 高

## 5. Architecture decisions

- Decision: Node badge render 在 custom React Flow node card `EngineeringNodeCard`；missing `lifecycleStatus` 顯示 `planned`，不 mutate graph。
- Evidence: 完成報告。
- Confidence: 高

- Decision: Lifecycle filter 在 `EngineeringFlowCanvas` 結合既有 graph filter；single-select，default `All`。
- Evidence: 完成報告。
- Confidence: 高

- Decision: node hidden 時只顯示 source/target 都可見的 edges，避免 dangling edges。
- Evidence: filter requirements 與完成報告。
- Confidence: 高

## 6. Workflow decisions

- Decision: Browser smoke 要測 NodeInspector、Local Command Import、manual node default、refresh restore 與 filters selection clearing。
- Evidence: smoke checklist 與完成報告。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: `node.lifecycleStatus ?? "planned"` 只用於 display/filter，不寫回 graph。
- Evidence: 兩個 milestone 都明確要求。
- Confidence: 高

- Rule: 若 selected node/edge 被 filter 隱藏，使用既有 `onClearSelection` 安全清除 selection。
- Evidence: filter 完成報告。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 不做 edge lifecycle badges/filters、canvas direct editing、drag-to-create、graph generation/command/audit behavior changes。
- Evidence: Not allowed 清單。
- Confidence: 高

## 9. Completed items

- Item: Canvas node lifecycle badges 完成。
- Evidence: 完成報告與 commit `8350c9c Add canvas node lifecycle badges`。
- Confirmed in current repo: 是。

- Item: Lifecycle Canvas Filters 完成。
- Evidence: 完成報告與 commit `efe73ec Add lifecycle canvas filters`。
- Confirmed in current repo: 是。

## 10. Future ideas

- Future idea: Workspace / Import / Audit Hardening。
- Evidence: lifecycle filters next recommended milestone。
- Notes: current repo 已完成。

## 11. Deferred ideas

- Deferred idea: Edge lifecycle badges、edge lifecycle filters、canvas direct editing、drag-to-create。
- Reason deferred: node lifecycle UI/filter milestone scope。
- Evidence: known limitations。

## 12. Rejected ideas

- Rejected idea: Filtering graph by mutating `graph.nodes` / `graph.edges`。
- Reason rejected: filters are display-only。
- Evidence: prompt explicitly says do not mutate graph。

## 13. Conflicts with current repo truth

- Old-chat claim: Workspace hardening 尚未完成。
- Current repo truth: current repo 已有 workspace/import/audit hardening。
- Resolution: old next-step 不代表現況。

## 14. Recommended project-memory entries

- Target section: Architecture decisions
- Distilled entry: Canvas lifecycle badges and filters derive from `node.lifecycleStatus ?? "planned"` and never write defaults into graph data。
- Source summary: `memory-07-summary.md`
- Promotion recommendation: 推薦

