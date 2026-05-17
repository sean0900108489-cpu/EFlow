# Engineering Flow Intake v0 / EFlow

This project is **Engineering Flow Intake v0 / EFlow**.

It is a front-end-only, AI-native engineering planning tool. It is not a generic todo app, not a generic flowchart tool, and not an AI agent platform.

## Core Workflow

Structured project input -> deterministic EngineeringFlowGraph -> editable graph canvas -> human confirmation -> AI-readable JSON export.

The visual graph must always be backed by structured data. Do not create visual-only diagrams or canvas state that diverges from `EngineeringFlowGraph`.

## Tech Stack

- Vite
- React
- TypeScript
- `@xyflow/react`
- Plain CSS

## Required Checks

Before ending any task, run:

```bash
npm run validate:example
npm run build
```

## Sean's Local Codex CLI Workflow

Sean keeps all local projects in:

```bash
/Users/sean/Documents/CodexWorkspace
```

This is a multi-project workspace. Each subproject is its own Git repo, such as `EFlow` or `New project`.

- Do not work directly from the workspace root unless Sean explicitly asks for a workspace-level overview.
- Start by changing into the requested subproject.
- Pull the latest changes before starting Codex.
- Do not tell Sean to reinstall Codex unless he explicitly says `codex` is not found or the Codex CLI is broken.

Standard startup flow:

```bash
cd "/Users/sean/Documents/CodexWorkspace/<subproject>"
git pull
codex
```

At the start of a Codex session:

- Read `README.md`, `AGENTS.md`, `HANDOFF.md`, `package.json`, and the most recent 5 git log entries.
- Do not modify code immediately.
- Confirm current project status, `git status`, real setup/run/validate commands, and whether `HANDOFF.md` next steps are still accurate.

Before ending a session:

- Run required validation.
- Update `HANDOFF.md` with the current state and next steps.
- Show a `git diff` summary.
- Do not commit or push until Sean confirms.

## Important Files

- `src/types/engineeringFlow.ts`
- `src/data/todoThoughtUniverseExample.ts`
- `src/lib/generateEngineeringFlow.ts`
- `src/lib/exportContext.ts`
- `src/components/graph/EngineeringFlowCanvas.tsx`
- `src/components/inspector/InspectorPanel.tsx`

## Product Boundaries

Do not add:

- Backend
- Database
- Login/auth
- Real AI API
- Repo upload
- Code analysis
- Payments
- Team collaboration
- Agent execution
- Heavy graph layout engine

## Product Rules

- All generated nodes and edges default to `suggested`.
- Do not silently overwrite manual graph edits.
- Regeneration after input changes must preserve the user’s ability to cancel replacement.
- UI should stay Apple-like: calm, spacious, rounded, readable, and low noise.
