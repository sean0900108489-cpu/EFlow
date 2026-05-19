# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-09.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示星期一。
- Confidence: 低

## 3. Main topic

- Topic: `AI Context / Command Interop Polish`。

## 4. Product decisions

- Decision: EFlow 的 AI-read / AI-write contract 要更 self-documenting，方便 downstream AI agents 使用。
- Evidence: milestone goal。
- Confidence: 高

- Decision: Local AI command workflow 固定描述為 `Validate -> Dry Run -> Apply`。
- Evidence: commandInterface/UI guidance requirements。
- Confidence: 高

## 5. Architecture decisions

- Decision: `eflow-context/v0.1` export 的 `commandInterface` 加入 accepted schema、preferred operations、schema-only operations、workflow、safety rules、status mapping、defaulting rules、audit behavior、graph compatibility。
- Evidence: 完成報告。
- Confidence: 高

- Decision: `eflow-context/v0.1` 與 `eflow-command/v0.1` schemaVersion 不變。
- Evidence: 完成報告。
- Confidence: 高

- Decision: Supported operations: `updateNode`, `transitionNode`, `upsertNode`, `updateEdge`, `transitionEdge`, `upsertEdge`；`addDecision`, `addQuestion` schema-only / unsupported by current graph apply。
- Evidence: 完成報告。
- Confidence: 高

## 6. Workflow decisions

- Decision: AI-Native Context Export 與 Local Command Import UI 顯示 compact guidance，不 redesign。
- Evidence: UI guidance changes。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: `command.reviewStatus` maps to legacy graph `status` where representable；graph `status` maps back to context `reviewStatus`；`lifecycleStatus` remains separate。
- Evidence: statusMapping in completion report。
- Confidence: 高

- Rule: Unsupported graph node/relationship types must be rejected during apply and documented for agents。
- Evidence: graphCompatibility metadata。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 不新增 MCP、REST API、CLI、backend/database/auth/cloud sync、real AI API、repo analyzer、agent execution。
- Evidence: Not allowed 與 known limitations。
- Confidence: 高

## 9. Completed items

- Item: AI interop metadata polish 完成。
- Evidence: 完成報告與 validation/browser smoke。
- Confirmed in current repo: 是；current `README.md` 描述 commandInterface 與 workflow。

- Item: README/HANDOFF 更新 AI read/write contracts。
- Evidence: 完成報告。
- Confirmed in current repo: 是。

## 10. Future ideas

- Future idea: UI Right Panel Organization / Collapsible Sections。
- Evidence: 後續 memory-011 的 milestone。
- Notes: current repo 已完成。

## 11. Deferred ideas

- Deferred idea: MCP/REST/CLI/API surfaces、repo analyzer、agent execution。
- Reason deferred: local-first AI interop polish 只整理既有 JSON contract。
- Evidence: Not allowed。

## 12. Rejected ideas

- Rejected idea: 為了 interop polish 改 schemaVersion 或新增 backend/API。
- Reason rejected: scope 與 compatibility。
- Evidence: requirements。

## 13. Conflicts with current repo truth

- Old-chat claim: no real AI API。
- Current repo truth: AI Collaboration Console 後來加入 direct-browser BYOK provider call；仍沒有 backend/proxy/MCP/REST/CLI。
- Resolution: AI interop metadata 不等於 backend API；current repo truth wins。

## 14. Recommended project-memory entries

- Target section: Architecture decisions
- Distilled entry: `eflow-context/v0.1` must document the accepted `eflow-command/v0.1` workflow, supported operations, schema-only operations, safety rules, and status/lifecycle mapping for downstream AI agents。
- Source summary: `memory-09-summary.md`
- Promotion recommendation: 推薦

