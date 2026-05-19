# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-014.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示下午。
- Confidence: 低

## 3. Main topic

- Topic: tutorial mode / AI chat chrome localization commit，與 canvas/inspector/review/lifecycle UI localization。

## 4. Product decisions

- Decision: UI localization 要保留 raw schema/internal values，只 localize display labels。
- Evidence: final review checklist。
- Confidence: 高

- Decision: `buildReviewQueue` 保持 backward compatible；原 `reason` 仍存在，新 translation metadata 是 optional UI-only。
- Evidence: final review report。
- Confidence: 高

## 5. Architecture decisions

- Decision: 新增 shared display-label key maps in `src/lib/i18n/display-labels.ts`，映射 raw type/status/lifecycle values 到 translation keys。
- Evidence: localization final report。
- Confidence: 高

- Decision: `zh-TW` 與 `en` 都要有新 translation keys；不得讓 UI 出現 missing translation fallback。
- Evidence: review checklist。
- Confidence: 高

## 6. Workflow decisions

- Decision: commit 前做 final review：檢查 protected files、schema/command/workspace/export semantics、translation completeness、validation/build/diff。
- Evidence: user review prompt。
- Confidence: 高

- Decision: commit localize pass with exact message, then separate push when instructed。
- Evidence: commit/push prompts。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: Localizing display labels 不可改 state/form values/graph data/workspace data/command data/AI context export semantics。
- Evidence: review report。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 不改 `src/types/*`、command validation/apply、workspace persistence/validation、AI context schema/payload semantics。
- Evidence: review checklist。
- Confidence: 高

## 9. Completed items

- Item: `c79c51f Add tutorial mode and localize AI chat chrome` committed/pushed。
- Evidence: raw reports。
- Confirmed in current repo: 是。

- Item: Canvas, inspector, review, lifecycle UI localization completed and pushed as `38e99a7 Localize canvas inspector review and lifecycle UI`。
- Evidence: raw commit/push reports。
- Confirmed in current repo: 是；current repo has i18n files and localized UI components。

## 10. Future ideas

- Future idea: Continue localization for remaining chrome/content if discovered。
- Evidence: implied by inventory/final review workflow。
- Notes: 未具體列出下一個 localization milestone。

## 11. Deferred ideas

- Deferred idea: Changing raw schema/internal values into localized strings。
- Reason deferred: would break data contracts。
- Evidence: explicit review requirement。

## 12. Rejected ideas

- Rejected idea: Translate raw enum/status/type values in graph/workspace/command/export。
- Reason rejected: schema stability。
- Evidence: final review checklist。

## 13. Conflicts with current repo truth

- Old-chat claim: none significant。
- Current repo truth: current repo includes these localization commits plus later memory recovery workspace。
- Resolution: current repo truth wins。

## 14. Recommended project-memory entries

- Target section: Safety rules
- Distilled entry: Localization must be display-label only; raw schema/internal values remain stable in state, form values, graph/workspace/command data, and AI context exports。
- Source summary: `memory-014-summary.md`
- Promotion recommendation: 推薦

