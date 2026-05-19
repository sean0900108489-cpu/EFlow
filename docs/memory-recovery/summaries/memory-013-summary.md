# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-013.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示下午。
- Confidence: 低

## 3. Main topic

- Topic: visual redesign experiments and approved `City OS Interface Redesign Pass`。

## 4. Product decisions

- Decision: 使用者 approved City OS visual direction；freeze 後只修 build/validation/diff/obvious breakage。
- Evidence: user prompt「current City OS visual direction is approved」。
- Confidence: 高

- Decision: Visual metaphor 為 Luxury City Operating System / Skyscraper Intelligence Interface：left/right panels = glass skyscraper towers，center canvas = sky-well/city void。
- Evidence: redesign prompt。
- Confidence: 高

## 5. Architecture decisions

- Decision: City OS redesign 應 CSS-first；不可改 product behavior、schema/data/model、graph generation、command/apply/workspace/audit。
- Evidence: strict scope。
- Confidence: 高

- Decision: Redesign 最終只改 `src/styles/global.css`, `src/styles/layout.css`, `src/styles/components.css`。
- Evidence: final report and commit report。
- Confidence: 高

## 6. Workflow decisions

- Decision: 當使用者明確要求 discard dirty design work 時，才可使用 `git reset --hard HEAD` 與 `git clean -fd`。
- Evidence: user explicit destructive cleanup prompt。
- Confidence: 高

- Decision: Approved visual pass freeze 後 commit locally，但不要 push unless instructed。
- Evidence: freeze prompt/final report。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: 視覺 redesign 不可更改 schema/status/lifecycle semantics 或 React Flow behavior。
- Evidence: multiple design prompts。
- Confidence: 高

- Rule: Browser smoke 必須清 localStorage 再載入 example，確認 panels/canvas/nodes/edges/controls/readability。
- Evidence: smoke checklist。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 不新增 image assets、literal person/avatar、3D libraries、animation libraries、backend/cloud。
- Evidence: visual direction prompt。
- Confidence: 高

## 9. Completed items

- Item: Approved City OS redesign CSS-only committed as `437aa96 Apply City OS interface redesign`。
- Evidence: freeze final report。
- Confirmed in current repo: 是；current git log includes `437aa96`。

- Item: Earlier warm gray/graphite dirty experiments were discarded or superseded。
- Evidence: raw starts with dirty CSS work, then user explicitly discards and reruns City OS。
- Confirmed in current repo: current CSS reflects latest City OS plus later localization; current repo truth wins。

## 10. Future ideas

- Future idea: Push approved City OS commit when ready。
- Evidence: final report suggested `git push`。
- Notes: current repo later includes pushed commits, so this is historical。

## 11. Deferred ideas

- Deferred idea: Broad visual redesign after approval。
- Reason deferred: user said do not redesign further。
- Evidence: freeze prompt。

## 12. Rejected ideas

- Rejected idea: Dirty previous style direction kept without cleanup。
- Reason rejected: user explicitly instructed discard all uncommitted work。
- Evidence: destructive cleanup prompt。

## 13. Conflicts with current repo truth

- Old-chat claim: branch ahead 1 / unpushed after `437aa96`。
- Current repo truth: current branch is aligned with origin/main at latest memory recovery commit before this task。
- Resolution: treat old git state as historical only。

## 14. Recommended project-memory entries

- Target section: Product philosophy
- Distilled entry: The approved visual direction is City OS / luxury skyscraper intelligence interface, but it must remain CSS-first and never alter product behavior or schema/data/model semantics。
- Source summary: `memory-013-summary.md`
- Promotion recommendation: 可推薦

