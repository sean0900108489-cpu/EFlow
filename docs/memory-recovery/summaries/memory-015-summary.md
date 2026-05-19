# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-015.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示下午。
- Confidence: 低

## 3. Main topic

- Topic: 建立 memory recovery workspace。

## 4. Product decisions

- Decision: 舊 ChatGPT project conversations 要透過 `docs/memory-recovery/` 安全恢復，不把 raw transcripts commit，也不 bloating `HANDOFF.md`。
- Evidence: user goal。
- Confidence: 高

- Decision: `docs/project-memory.md` 只放 distilled decisions，不放 full transcripts；promotion 必須 review。
- Evidence: project-memory requirements。
- Confidence: 高

## 5. Architecture decisions

- Decision: 建立 `docs/memory-recovery/raw/.gitignore`，忽略 raw transcripts，只保留 `.gitignore`。
- Evidence: requirements and final report。
- Confidence: 高

- Decision: 每個 raw conversation 先產出 summary 到 `docs/memory-recovery/summaries/`，再由 index 追蹤 promotion。
- Evidence: README/intake/index requirements。
- Confidence: 高

## 6. Workflow decisions

- Decision: Summary intake template 包含 source、date、topic、decisions、rules、boundaries、completed/future/deferred/rejected、conflicts、recommended project-memory entries。
- Evidence: template requirements。
- Confidence: 高

- Decision: Current code/latest commit override old chat；old chat is evidence, not automatic truth。
- Evidence: project-memory/recovery rules。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: Raw transcripts local-only；summaries 可在 review 後 commit；不要把 raw transcript promote 到 project-memory。
- Evidence: README requirements。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 此 workspace 建立 task 不改 app code、不改 schemas、不 commit/push，直到使用者後續明確要求。
- Evidence: prompt 與 final report。
- Confidence: 高

## 9. Completed items

- Item: `docs/memory-recovery/README.md`, `intake-template.md`, `recovered-memory-index.md`, `raw/.gitignore`, `summaries/.gitkeep`, `docs/project-memory.md` created。
- Evidence: final report。
- Confirmed in current repo: 是。

- Item: Memory recovery workspace committed/pushed as `d841167 Add memory recovery workspace`。
- Evidence: raw commit/push reports。
- Confirmed in current repo: 是；current latest before this summarization task is `d841167`。

## 10. Future ideas

- Future idea: Batch summarize raw memory files into `docs/memory-recovery/summaries/`。
- Evidence: implied next step after workspace creation。
- Notes: 本次任務正在執行。

## 11. Deferred ideas

- Deferred idea: Promote distilled decisions into `docs/project-memory.md`。
- Reason deferred: 使用者要求先 review summaries，不要立刻 promote。
- Evidence: prompt。

## 12. Rejected ideas

- Rejected idea: Commit raw transcripts。
- Reason rejected: privacy/local-only boundary。
- Evidence: raw `.gitignore` and README rules。

## 13. Conflicts with current repo truth

- Old-chat claim: none significant。
- Current repo truth: raw files are ignored; summaries now being added as commit-eligible docs。
- Resolution: current repo truth wins。

## 14. Recommended project-memory entries

- Target section: Source of truth hierarchy
- Distilled entry: Current code and latest commit override old chat; old chat is evidence, not automatic truth。
- Source summary: `memory-015-summary.md`
- Promotion recommendation: 推薦

- Target section: Workflow decisions
- Distilled entry: Memory recovery flow is raw local-only transcripts -> concise reviewed summaries -> optional distilled project-memory promotion。
- Source summary: `memory-015-summary.md`
- Promotion recommendation: 推薦

