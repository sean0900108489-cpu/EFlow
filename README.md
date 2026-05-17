# Engineering Flow Intake v0 / EFlow

Engineering Flow Intake v0 is a local-first, schema-first AI-to-AI Communication & Architecture Sync Hub.

EFlow turns structured project intent into a deterministic, editable engineering flow graph. The canvas is a rendering layer; the structured graph and exports are the source of truth.

## Core Workflow

1. Edit, load, or import an `EngineeringFlowInput`.
2. Generate a deterministic `EngineeringFlowGraph`.
3. Inspect, review, and manually add missing graph context.
4. Track implementation lifecycle state across nodes and edges.
5. Export AI-readable JSON for downstream coding agents.
6. Import local AI command JSON to validate, dry-run, and apply progress or architecture updates.

## AI Read Contract

The preferred AI-readable export is `eflow-context/v0.1`.

It includes project identity, graph nodes and edges, review summaries, lifecycle progress summaries, dependency indexes, blocking questions, Mermaid-compatible graph text, and a `commandInterface` descriptor for AI command interoperability.

The context export advertises accepted command schemas, preferred supported operations, schema-only operations, local workflow guidance, safety rules, status mapping, lifecycle defaulting, audit behavior, and current graph compatibility limits.

## AI Write Contract

The current AI-writable command format is `eflow-command/v0.1`.

The supported local workflow is:

```text
Validate -> Dry Run -> Apply
```

Current graph-supported command operations are:

- `updateNode`
- `transitionNode`
- `upsertNode`
- `updateEdge`
- `transitionEdge`
- `upsertEdge`

`addDecision` and `addQuestion` are schema concepts, but the current graph apply helper rejects them because there is not yet a standalone decision or question record store.

## Status Model

Keep these fields distinct:

- `node.status` / `edge.status` are legacy graph review/confirmation status fields.
- `reviewStatus` is the formal AI-facing review/confirmation status used in command and context schemas.
- `lifecycleStatus` is implementation progress state.

Command `reviewStatus` maps to legacy graph `status` when the graph can represent it. Legacy graph `status` maps back to context `reviewStatus` during AI context export. `lifecycleStatus` remains separate and must not be used as review status.

Missing node or edge `lifecycleStatus` is treated as `planned` in context exports, canvas display, filters, and summaries without writing that default back to graph data.

## Local Workspace And Audit

EFlow is currently front-end-only and local-first. Workspace JSON export/import preserves the current input, graph, selected items, manual nodes and edges, lifecycle state, and local audit history.

The audit log is compact local workspace history. It records important local UI actions such as graph generation, workspace import, manual node/edge creation, inspector status changes, and successful AI command apply events. It is not undo, replay, conflict resolution, or a tamper-proof event store.

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
- `src/types/eflowCommand.ts`
- `src/types/eflowContext.ts`
- `src/lib/generateEngineeringFlow.ts`
- `src/lib/buildEflowContextExport.ts`
- `src/lib/applyEflowCommand.ts`
- `src/lib/eflowCommandValidation.ts`
- `src/components/graph/EngineeringFlowCanvas.tsx`
- `src/components/export/EFlowContextExportPanel.tsx`
- `src/components/command/LocalCommandImportPanel.tsx`
- `scripts/validateExample.ts`

## Current Limitations

EFlow intentionally does not include a backend, database, login/auth, cloud sync, real AI API, MCP server, REST API, CLI, repo analyzer, autonomous agent execution, payments, team collaboration, undo/replay, signed audit trails, or a heavy graph layout engine.

Keep the UI calm, spacious, rounded, readable, and low noise.
