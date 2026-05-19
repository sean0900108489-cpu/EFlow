# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-010.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期一/上午。
- Confidence: 低

## 3. Main topic

- Topic: final regression / v1 tag 操作，以及使用者可見簡體中文轉繁體中文。

## 4. Product decisions

- Decision: `v1.0-local` tag 代表 EFlow local-first v1 checkpoint，指向 final regression pass commit。
- Evidence: tag script/report 顯示 `v1.0-local` message `EFlow local-first v1`。
- Confidence: 高

- Decision: 使用者可見中文要轉為繁體中文，偏 zh-Hant-TW / Taiwan-style wording。
- Evidence: conversion prompt。
- Confidence: 高

## 5. Architecture decisions

- Decision: 中文轉換不得改 schemaVersion、JSON keys、type names、enum/status values、operation names、IDs、file paths、CSS class names、localStorage keys 或 behavior。
- Evidence: conversion scope 明確列出禁止項。
- Confidence: 高

- Decision: Example validation counts 必須維持 `52 nodes`, `93 edges`, `3 blocking questions`。
- Evidence: conversion prompt 與 final validation。
- Confidence: 高

## 6. Workflow decisions

- Decision: final regression commit/tag scripts 要檢查 clean working tree、latest commit subject、validate/build/diff-check，再 commit/tag/push。
- Evidence: raw 中多段 guard scripts。
- Confidence: 高

- Decision: 若 script 預期 latest commit 不符，應停止，不 stage/commit/push。
- Evidence: 第二次 final regression script 因 latest commit 已是 `Record final regression pass` 而停止。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: 翻譯要人工檢查，不盲目轉換 code semantics。
- Evidence: conversion prompt。
- Confidence: 高

- Rule: 完成中文轉換後要提醒舊 browser localStorage 可能仍含簡體資料。
- Evidence: conversion final report。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 中文轉換不可新增 i18n framework、language switcher、改 graph generation/command/workspace/schema。
- Evidence: conversion scope。
- Confidence: 高

## 9. Completed items

- Item: `fcfb128 Record final regression pass` committed/pushed，`v1.0-local` tag created/pushed。
- Evidence: raw reports。
- Confirmed in current repo: 是；current git log/tag history includes these commits/tags if tags fetched locally。

- Item: `src/data/todoThoughtUniverseExample.ts` user-facing Chinese converted to Traditional Chinese。
- Evidence: final report。
- Confirmed in current repo: 是；current repo 有 commit `2afa6e8 Localize example content to Traditional Chinese`。

## 10. Future ideas

- Future idea: 若 localStorage 含舊簡體 workspace，使用者需 clear localStorage 或 reload example。
- Evidence: final report note。
- Notes: 這是操作提醒，不是 product feature。

## 11. Deferred ideas

- Deferred idea: 加 i18n framework/language switcher。
- Reason deferred: 這次只是 content polish。
- Evidence: Not allowed。

## 12. Rejected ideas

- Rejected idea: 翻譯 enum/status/schema 值。
- Reason rejected: 會破壞 schema/command semantics。
- Evidence: conversion prompt。

## 13. Conflicts with current repo truth

- Old-chat claim: conversion final report 顯示未 commit。
- Current repo truth: current git log 有 `2afa6e8 Localize example content to Traditional Chinese`，代表後續已 commit。
- Resolution: current repo truth wins。

## 14. Recommended project-memory entries

- Target section: Safety rules
- Distilled entry: Localization/content polish may translate user-facing copy, but must never translate schema versions, JSON keys, enum/status values, command operation names, IDs, paths, CSS class names, or localStorage keys。
- Source summary: `memory-010-summary.md`
- Promotion recommendation: 推薦

