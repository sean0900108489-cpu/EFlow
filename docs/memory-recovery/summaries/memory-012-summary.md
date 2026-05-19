# Memory Recovery Intake Summary

## 1. Source file

- Raw file: `docs/memory-recovery/raw/memory-012.txt`

## 2. Conversation date/range if known

- Date or range: 舊對話；片段只顯示下午。
- Confidence: 低

## 3. Main topic

- Topic: `AI Collaboration Console v0`。

## 4. Product decisions

- Decision: AI Collaboration Console 是 top-level full-width workspace card，不可塞進 narrow right-side AI Interop panel。
- Evidence: critical layout correction。
- Confidence: 高

- Decision: Chat responses are drafts only；不可 mutate graph、不可 auto-apply commands；任何 generated `eflow-command` 仍需 Local Command Import `Validate -> Dry Run -> Apply`。
- Evidence: product context 與 safety copy。
- Confidence: 高

- Decision: Console 是 personal-use BYOK direct-browser LLM panel；使用者接受 capped API project 風險，不設計成 public SaaS。
- Evidence: why/goal section。
- Confidence: 高

## 5. Architecture decisions

- Decision: 新增 `AIChatConsole`、`buildAIChatPrompt`，放在 `App.tsx` main workspace grid 之前。
- Evidence: 完成報告。
- Confidence: 高

- Decision: API key 預設存在 React state；勾選 remember 時存 localStorage key `eflow.aiChat.apiKey`；不進 workspace/export。
- Evidence: API key behavior。
- Confidence: 高

- Decision: Direct provider request 使用 OpenAI Responses-style `{ model, input }`，non-streaming fetch。
- Evidence: completion report。
- Confidence: 高

- Decision: 支援六種 prompt modes：Free chat、Generate Codex milestone prompt、Convert Codex report to eflow-command、Raw idea to EngineeringFlowInput JSON、Progress/handoff summary、Strategic architecture consultation。
- Evidence: prompt requirements 與完成報告。
- Confidence: 高

## 6. Workflow decisions

- Decision: 如果沒有真 API key，可用 local mock CORS provider 測 direct call path，並報告 real external API call 未測。
- Evidence: completion report。
- Confidence: 高

## 7. AI/Codex operating rules

- Rule: Prompt construction 必須清楚提醒 `reviewStatus` vs `lifecycleStatus`，且 command conversion mode 只產生 safe `eflow-command/v0.1` JSON。
- Evidence: `buildAIChatPrompt` requirements。
- Confidence: 高

- Rule: Chat history only local React state，不 persist 到 workspace，不記 audit events。
- Evidence: scope 與 completion report。
- Confidence: 高

## 8. Safety boundaries

- Boundary: 不新增 backend/proxy/database/auth/cloud/MCP/REST/CLI，不自動 parse/apply response，不把 API key 存 workspace。
- Evidence: Not allowed 與 known limitations。
- Confidence: 高

## 9. Completed items

- Item: AI Collaboration Console v0 completed and committed/pushed as `d21c7a2 Add embedded AI collaboration console`。
- Evidence: raw commit/push report。
- Confirmed in current repo: 是；current repo 有 `src/components/aiChat/AIChatConsole.tsx`。

- Item: Validation coverage added for prompt modes/metadata。
- Evidence: completion report。
- Confirmed in current repo: 是。

## 10. Future ideas

- Future idea: Demand Compiler Schema Foundation。
- Evidence: next recommended milestone in HANDOFF requirement。
- Notes: current repo 是否已做 Demand Compiler 未確認；current repo truth 未顯示相關功能。

## 11. Deferred ideas

- Deferred idea: Streaming、automatic command import/apply、chat persistence、chat audit events、MCP/REST/CLI。
- Reason deferred: v0 console 保持 local-first personal chat。
- Evidence: known limitations。

## 12. Rejected ideas

- Rejected idea: 把 chat console 放在 right-panel AI Interop。
- Reason rejected: cramped，不符合產品 split。
- Evidence: critical layout correction。

## 13. Conflicts with current repo truth

- Old-chat claim: README/v1 docs earlier說 no real AI API。
- Current repo truth: AIChatConsole direct-browser provider call exists；仍無 backend/proxy/cloud AI service。
- Resolution: future memory 應寫成「無內建後端 AI 服務；有 optional personal BYOK browser call」。

## 14. Recommended project-memory entries

- Target section: Safety rules
- Distilled entry: AI chat responses are draft-only and read-only with respect to graph state; generated commands must be manually validated/dry-run/applied through Local Command Import。
- Source summary: `memory-012-summary.md`
- Promotion recommendation: 推薦

- Target section: Architecture decisions
- Distilled entry: AI Collaboration Console is a full-width top-level workspace module; right-panel AI Interop remains JSON export/import tooling。
- Source summary: `memory-012-summary.md`
- Promotion recommendation: 推薦

