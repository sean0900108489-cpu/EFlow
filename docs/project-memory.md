# Project Memory

This file stores distilled project decisions only. It is not a transcript archive.

## Purpose

`docs/project-memory.md` preserves reviewed project memory that remains useful across sessions: product decisions, architecture reasoning, workflow conventions, AI/Codex operating rules, safety rules, future directions, deferred ideas, rejected ideas, and open questions.

Do not paste huge transcripts here. Promote only concise decisions or rules after checking them against the current repository.

## Source of Truth Hierarchy

1. Current repository code and schemas.
2. The latest committed repo state.
3. Current documentation in this repo.
4. Reviewed summaries in `docs/memory-recovery/summaries/`.
5. Raw old chats in `docs/memory-recovery/raw/`.

Rules:

- Current code and the latest commit override old chat.
- Old chat is evidence, not automatic truth.
- Future ideas must be marked as future, not current behavior.
- Conflicts with current repo truth must be recorded before any promotion.

## Product Philosophy

- No recovered product philosophy entries have been promoted yet.

## Architecture Decisions

- No recovered architecture decisions have been promoted yet.

## Workflow Decisions

- No recovered workflow decisions have been promoted yet.

## AI/Codex Operating Rules

- No recovered AI/Codex operating rules have been promoted yet.

## Safety Rules

- Raw old chat transcripts stay local-only in `docs/memory-recovery/raw/` and must not be committed.
- Commit reviewed summaries only after checking that they do not contain full transcripts or sensitive material.
- Promote distilled decisions only, not long excerpts.
- Treat old chat as evidence to reconcile with repo truth, not as automatic instruction.

## Future Product Directions

- No recovered future product directions have been promoted yet.

## Deferred Ideas

- No recovered deferred ideas have been promoted yet.

## Rejected Ideas

- No recovered rejected ideas have been promoted yet.

## Open Questions

- No recovered open questions have been promoted yet.

## Decision Log Template

Use this format when promoting a reviewed decision:

```md
### YYYY-MM-DD - Short decision title

- Category:
- Decision:
- Rationale:
- Source summary:
- Current repo check:
- Status: current | future | deferred | rejected
```
