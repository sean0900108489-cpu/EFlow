# Engineering Flow Intake v0 / EFlow

Engineering Flow Intake v0 is a front-end-only, AI-native engineering planning tool for turning structured project input into a deterministic, editable engineering flow graph.

Its purpose is to reduce AI guessing, preserve human confirmation, and export trustworthy structured context for future planning work.

## Core Workflow

1. Edit or load an `EngineeringFlowInput`.
2. Generate a deterministic `EngineeringFlowGraph`.
3. Inspect and edit the graph on the canvas.
4. Confirm or review generated nodes and edges.
5. Export AI-readable JSON, including Full AI Context.

The graph is always a rendering of structured data, not a visual-only diagram.

## Run

```bash
npm install
npm run dev
```

## Validate

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
- `scripts/validateExample.ts`

## Product Boundary

This project intentionally does not include:

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

Keep the UI calm, spacious, rounded, readable, and low noise.
