# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-011.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期一。
- Confidence: 低

## 3. Main topic

- Topic: right panel collapsible sections、README / release documentation final polish、stop/report 狀態。

## 4. Product decisions

- Decision: 右側工具整理成 collapsible sections：Selected Item、Review、Implementation Progress、Manual Editing、Change History、AI Interop、Workspace / Export。
- Evidence: commit script sanity markers。
- Confidence: 高

- Decision: README 應準確描述 local-first v1：AI-to-AI sync hub、graph source of truth、AI-readable/writable JSON、manual editing、audit、workspace、limitations。
- Evidence: README polish requirements。
- Confidence: 高

## 5. Architecture decisions

- Decision: `CollapsibleSection` 是 UI organization，不應改 workspace schema 或 behavior。
- Evidence: right-panel organization task只改 UI files。
- Confidence: 高

- Decision: Documentation 必須明確區分 legacy graph `status`、AI-facing `reviewStatus`、`lifecycleStatus`。
- Evidence: README requirements。
- Confidence: 高

## 6. Workflow decisions

- Decision: docs-only milestone 可不跑 browser smoke；仍跑 validate/build/diff-check。
- Evidence: final report 說 browser smoke not required because docs-only。
- Confidence: 高

- Decision: 若使用者要求停止，只報 `git status`, latest commit, clean state, changed-in-session。
- Evidence: raw 最後 stop prompt/report。
- Confidence: 中

## 7. AI/Codex operating rules

- Rule: Commit scripts 先 verify latest checkpoint、只 stage expected files、跑 cached diff check。
- Evidence: right panel與 README commit scripts。
- Confidence: 高

## 8. Safety boundaries

- Boundary: README polish 不改 code/schema/command/workspace behavior、不新增 backend/cloud/API/MCP/REST/CLI。
- Evidence: Not allowed。
- Confidence: 高

## 9. Completed items

- Item: `b2073c3 Organize right panel with collapsible sections` committed/pushed。
- Evidence: raw report。
- Confirmed in current repo: 是。

- Item: `2c12a83 Polish README for local-first v1` committed/pushed。
- Evidence: raw report。
- Confirmed in current repo: 是。

## 10. Future ideas

- Future idea: Deployment / GitHub Website Link、final regression pass、v1 tag。
- Evidence: README roadmap requirements。
- Notes: final regression/tag 後續已完成；live demo URL 可能仍 pending。

## 11. Deferred ideas

- Deferred idea: backend/cloud/API/MCP/agent execution。
- Reason deferred: local-first v1 scope。
- Evidence: known limitations。

## 12. Rejected ideas

- Rejected idea: README/release docs milestone 做 product features。
- Reason rejected: docs-only polish。
- Evidence: Not allowed。

## 13. Conflicts with current repo truth

- Old-chat claim: latest commit/status 在片段中一度不一致（例如 `fcfb128` 或 uncommitted Traditional Chinese conversion）。
- Current repo truth: current latest before this task is `d841167 Add memory recovery workspace`，working tree clean before summaries。
- Resolution: current repo truth wins；舊狀態只當歷史。

## 14. Recommended project-memory entries

- Target section: Product philosophy
- Distilled entry: EFlow’s right panel groups product tools into collapsible sections; section open/closed state is UI-only and not workspace truth。
- Source summary: `memory-011-summary.md`
- Promotion recommendation: 可推薦

- Target section: Workflow decisions
- Distilled entry: Documentation milestones should remain docs-only and still pass validate/build/diff-check before commit。
- Source summary: `memory-011-summary.md`
- Promotion recommendation: 可推薦

