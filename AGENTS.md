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
