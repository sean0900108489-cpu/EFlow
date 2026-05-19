# Memory Recovery Workspace

This workspace is for safely recovering useful project knowledge from old ChatGPT project conversations without bloating `HANDOFF.md` or committing raw transcripts.

## Raw Conversation Intake

Put old conversation exports as Markdown or text files in:

```text
docs/memory-recovery/raw/
```

Use one file per old chat window. Suggested names:

```text
memory-01.md
memory-02.md
...
memory-15.md
```

Raw files are local-only and ignored by git. Do not commit raw transcripts.

## Summary Workflow

1. Export or paste each old conversation into one file under `docs/memory-recovery/raw/`.
2. Create a concise reviewed summary for each raw file under `docs/memory-recovery/summaries/`.
3. Use `docs/memory-recovery/intake-template.md` as the required summary format.
4. Track progress in `docs/memory-recovery/recovered-memory-index.md`.
5. Promote only distilled decisions into `docs/project-memory.md`.

Summaries may be committed after review. They should capture high-value decisions, operating rules, prompts, architecture reasoning, completed work, and future ideas without reproducing full transcripts.

## Promotion Rules

- Current code and the latest commit override old chat.
- Old chat is evidence, not automatic truth.
- Future ideas must be marked as future, not current behavior.
- Do not paste huge transcripts into `docs/project-memory.md`.
- Store distilled decisions only.
- If a recovered idea conflicts with current repo truth, document the conflict in the summary and do not promote it as fact.
