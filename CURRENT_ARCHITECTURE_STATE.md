# Current Architecture State

## Project Identity

EFlow is a local-first, schema-first, graph-oriented engineering cognition
system.

It is not a generic React app, not just a flowchart tool, and not an
autonomous coding agent. Its purpose is to turn structured project intent into
trustworthy, reviewable, AI-readable engineering graph context.

The active repo is:

```text
/Users/sean/Documents/CodexWorkspace/EFlow
```

This repo contains both the current source tree and restored architecture
governance documents. Source verification has begun. The first and second
source-level architecture gap passes are complete, but the whole architecture
is not yet fully source-verified. Do not infer backend, auth, cloud sync, MCP,
REST API, repo analyzer, autonomous execution, or remote infrastructure without
source evidence.

## Core Architecture Philosophy

- `EngineeringFlowGraph` is canonical architecture truth for graph state where
  source behavior confirms it.
- Canvas/UI is derived rendering.
- AI output is draft, suggestion, command candidate, or evidence; it is not
  truth.
- Human review is the trust boundary.
- Provenance and audit context must survive important changes.
- `reviewStatus` and `lifecycleStatus` must remain separate.
- Implementation behavior must not be called source-verified unless current
  source code proves it.

## Current Governance Documents

### Constitution / Architecture Law

| Document | Purpose | Authority level | Verification status | Future AI edit policy |
| --- | --- | --- | --- | --- |
| `SYSTEM_OVERVIEW.md` | System identity and conceptual map. | Document-authoritative and present. | Document-authoritative; not fully source-verified. | Draft changes only; human review required. |
| `INVARIANT_REGISTRY.md` | Architectural law registry. | Document-authoritative and present. | Document-authoritative; some listed graph/command invariants now have partial source verification from the first gap pass. | Draft changes only; human review required. |
| `ARCHITECTURE_DECISIONS.md` | Intentional tradeoff record. | Document-authoritative and present. | Document-authoritative; implementation claims still require source-specific verification. | Draft decision updates only; human review required. |
| `STATE_OWNERSHIP.md` | State authority and derived-state law. | Document-authoritative and present. | Document-authoritative; command lifecycle default behavior now has partial source verification. | Draft changes only; human review required. |
| `MUTATION_RULES.md` | Graph mutation safety law. | Document-authoritative and present. | Document-authoritative; workspace import, command update, and owner UI edge edit paths now have partial source verification. | Draft changes only; human review required. |
| `AGENTS.md` | AI coding agent guardrails derived from constitution docs. | Document-authoritative and present. | Document-authoritative; source verification remains ongoing. | Do not overwrite directly; propose patches with rationale. |

### Navigation / Orientation

| Document | Purpose | Authority level | Verification status | Future AI edit policy |
| --- | --- | --- | --- | --- |
| `CONTEXT_MANIFEST.md` | Master cognition map for document authority, presence, verification, and read order. | Document-authoritative and present. | Updated to note partial source verification, `CURRENT_STATUS.md`, and `src/lib/graphIntegrity.ts`. | Edit carefully when docs/source availability changes. |
| `CURRENT_ARCHITECTURE_STATE.md` | Compact handoff state for future AI/Codex sessions. | Document-authoritative and present. | This file reflects the current source tree and first/second source verification/fix passes. | Edit carefully when current reality changes. |
| `CURRENT_STATUS.md` | Current repo status snapshot for maturity, verification, validation, and active limitations. | Document-authoritative and present. | Read after `CONTEXT_MANIFEST.md` and this file when the latest checkpoint state is needed. | Update with factual checkpoint changes only. |
| `ENTRYPOINTS.md` | Map of safe runtime and command entrypoints. | Document-authoritative and present. | Still needs broader source verification against runtime entrypoints. | Patch only after source verification. |
| `MODULE_BOUNDARIES.md` | Boundary map and dependency direction. | Document-authoritative as provisional guidance. | Still needs broader source verification against real source paths, imports, and mutation boundaries. | Draft/patch updates only after source inspection. |

### Operational / Notes

| Document | Purpose | Authority level | Verification status | Future AI edit policy |
| --- | --- | --- | --- | --- |
| `PROJECT_NOTES.md` | Project notes and working context. | Document-authoritative and present. | Updated to note first architecture gap pass and verification results. | Update with factual operational notes. |
| `CHANGELOG.md` | Governance/project change history. | Document-authoritative and present. | Updated with first source-level architecture gap pass changes. | Update after material changes. |

### Missing / Deferred

| Document | Purpose | Status | Future AI edit policy |
| --- | --- | --- | --- |
| `ARCHITECTURE_DEBT.md` | Known debt, erosion risks, hotspots, and cleanup priorities. | Missing. | Consider only after more source-level risks are found. |
| `FUTURE_ARCHITECTURE.md` | Future-state direction and target modularization. | Missing / aspirational. | Do not generate yet; avoid speculative future docs. |

## Verified vs Provisional

Document-authoritative claims:

- The restored constitution docs are present and may guide future work:
  `SYSTEM_OVERVIEW.md`, `INVARIANT_REGISTRY.md`,
  `ARCHITECTURE_DECISIONS.md`, `STATE_OWNERSHIP.md`, `MUTATION_RULES.md`,
  and `AGENTS.md`.
- The navigation, context, changelog, and notes docs are present and
  document-authoritative for governance orientation.

Source-verified claims from the first and second architecture gap passes:

- `src/lib/workspaceValidation.ts` rejects duplicate node IDs, duplicate edge
  IDs, self-edges, and duplicate exact relationships during workspace graph
  validation.
- `src/lib/workspaceValidation.ts` rejects missing or invalid trust fields:
  `confidence`, `provenance`, provenance `sourceType`, `sourceInputIds`, and
  evidence shape.
- `src/lib/graphIntegrity.ts` provides shared exact-edge relationship helpers.
- `src/lib/applyEflowCommand.ts` does not write default lifecycle status during
  `updateNode` or `updateEdge` when `lifecycleStatus` is omitted.
- `src/lib/eflowCommandValidation.ts` enum-validates command provenance
  `sourceType`.
- `src/lib/applyEflowCommand.ts` no longer silently normalizes unknown
  provenance source types to `ai_command`.
- Owner UI edge relationship edits are guarded through `src/App.tsx` and
  `src/components/inspector/EdgeInspector.tsx`.
- Owner UI metadata edits record compact audit events with changed fields,
  before/after snapshots, target id, and `manual_ui` source.
- `src/lib/manualGraphEditing.ts` uses the shared duplicate exact relationship
  helper for manual edge insertion.
- `scripts/validateExample.ts` includes checks for the new invariants.

Claims still requiring broader source verification:

- Whether every claimed module boundary in `MODULE_BOUNDARIES.md` matches real
  imports and ownership boundaries.
- Whether every runtime entrypoint in `ENTRYPOINTS.md` matches actual commands,
  app routes, and scripts.
- Whether all graph mutation, persistence, import/export, prompt, audit, and UI
  paths preserve the constitution-level invariants.
- Whether any backend, auth, cloud sync, MCP, REST API, repo analyzer, CLI, or
  autonomous execution exists beyond source evidence.

`MODULE_BOUNDARIES.md` must remain provisional until broader source inspection
verifies real source paths, imports, and mutation boundaries.

## Source Verification Progress

Source verification is active in `/Users/sean/Documents/CodexWorkspace/EFlow`.

Completed so far:

- Inspected the source paths involved in the first and second architecture gap
  passes.
- Implemented source-level fixes for graph import validation, shared exact-edge
  relationship checks, command lifecycle update behavior, command provenance
  source type validation, owner UI duplicate relationship prevention, workspace
  trust-field validation, and owner UI metadata edit audit events.
- Extended `scripts/validateExample.ts` with checks for the fixed invariants.

Latest verification after the source fix passes:

```bash
npm run validate:example
npm run build
git diff --check
```

Results:

- `npm run validate:example` passed.
- `npm run build` passed with the existing Vite chunk-size warning.
- `git diff --check` passed.

Full architecture verification is still ongoing. Product roadmap and feature
work are still evolving and are not blocked by this governance pass.

## First Architecture Gap Pass

Fixed in source:

- Workspace import graph validation now rejects duplicate node IDs, duplicate
  edge IDs, self-edges, and duplicate exact relationships.
- Shared graph integrity helpers were added in `src/lib/graphIntegrity.ts`.
- Command `updateNode` and `updateEdge` no longer persist derived default
  lifecycle status when `lifecycleStatus` is omitted.
- Command provenance `sourceType` is validated against the allowed enum.
- Unknown provenance source types are rejected instead of silently normalized to
  `ai_command`.
- Owner UI edge edits are guarded against creating duplicate exact
  relationships.
- `validateExample` now checks these source-level invariants.

The fixed files are source-verified for these specific behaviors only. This
does not imply full verification of every architectural claim.

## Current Risks

Fixed in first pass:

- Workspace import graph validation could admit duplicate node IDs, duplicate
  edge IDs, self-edges, or duplicate exact relationships.
- Command update operations could persist derived lifecycle defaults during
  review-only or metadata-only updates.
- Command provenance `sourceType` could accept unknown values and then be
  silently rewritten to `ai_command`.
- Owner UI edge edits could create duplicate exact edge relationships.

Fixed in second pass:

- Workspace import graph validation could admit nodes/edges with missing or
  malformed trust fields.
- Owner UI metadata edits could mutate canonical graph state without a compact
  audit event.

Ongoing watch items:

- Context entropy from many governance docs with different authority levels.
- Architecture drift under AI-assisted development.
- Proposed architecture being mistaken for existing implementation.
- `App.tsx` authority concentration risk if it owns orchestration,
  persistence, graph mutation, or AI flows beyond approved boundaries.
- Duplicated canonical state risk outside the fixed graph relationship paths.
- Stale context risk.
- AI bypassing mutation boundaries.
- Confusion between `reviewStatus` and `lifecycleStatus` in future changes.
- Generated summaries or AI drafts being treated as canonical truth.

## Immediate Next Steps

1. Run additional source verification passes only as needed, focusing on
   remaining graph mutation, persistence, import/export, prompt, and UI
   ownership paths.
2. Verify `ENTRYPOINTS.md` against real source paths, package scripts, runtime
   routes, and app entrypoints.
3. Verify `MODULE_BOUNDARIES.md` against real source paths, imports, and
   mutation boundaries.
4. Read `CURRENT_STATUS.md` after this file when the latest checkpoint state,
   validation status, and active watch items are needed.
5. Consider creating `ARCHITECTURE_DEBT.md` only after more source-level risks
   are found.
6. Do not generate speculative `FUTURE_ARCHITECTURE.md` yet.
7. Keep roadmap and feature work moving; it is not blocked by this governance
   pass.

## Rules For Future AI Agents

- Read `CONTEXT_MANIFEST.md` first.
- Read `CURRENT_ARCHITECTURE_STATE.md` second.
- Read `CURRENT_STATUS.md` third when current checkpoint state matters.
- Read constitution docs before architecture-affecting changes.
- Do not overwrite constitution docs directly.
- Draft changes and explain tradeoffs.
- Never treat AI output as canonical truth.
- Never claim implementation verification without source evidence.
- Preserve the distinction between document-authoritative and source-verified.
- Preserve the distinction between lifecycle state and review state.
- Treat proposed modules as provisional until source inspection proves them.

## Handoff Summary

EFlow is a local-first, schema-first, graph-oriented engineering cognition
system in `/Users/sean/Documents/CodexWorkspace/EFlow`. The restored
constitution docs are present and document-authoritative. The source tree is
available, source verification has begun, and the first and second architecture
gap passes have been fixed and verified for specific graph import, trust-field,
command lifecycle, provenance, owner UI edit/audit, and validation-script
behaviors. The full architecture is not yet fully source-verified. Read
`CONTEXT_MANIFEST.md`, then this file, then `CURRENT_STATUS.md` for the latest
checkpoint state, then `SYSTEM_OVERVIEW.md`, `INVARIANT_REGISTRY.md`,
`STATE_OWNERSHIP.md`, `MUTATION_RULES.md`, `ARCHITECTURE_DECISIONS.md`,
`AGENTS.md`, `ENTRYPOINTS.md`, and `MODULE_BOUNDARIES.md`. Do not assume
backend, auth, cloud sync, MCP, REST API, repo analyzer, autonomous agents, or
additional implementation modules without source evidence.
