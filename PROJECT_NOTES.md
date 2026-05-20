# PROJECT NOTES

## Project Summary

EFlow is a local-first, schema-first AI-to-AI Communication & Architecture Sync Hub.

The app turns structured project intent into a deterministic, reviewable, editable engineering graph. The `EngineeringFlowGraph` is the source of truth; the canvas is only a rendering of that graph.

Core product principles:

- UI copy should use Traditional Chinese where user-facing text is added or changed.
- Keep the workspace local-first unless a feature is explicitly scoped to leave the browser.
- Human review is the trust boundary for graph changes.
- AI chat output is draft-only and must not mutate the graph automatically.
- Avoid broad rewrites or architectural churn unless the user explicitly asks for it.

## Current Architecture

- Frontend: Vite, React, TypeScript, plain CSS, `@xyflow/react`.
- Workspace persistence: browser `localStorage` for workspace data.
- AI chat frontend: `src/components/aiChat/AIChatConsole.tsx`.
- AI chat backend route: `api/chat-with-files.ts`.
- AI chat request format: `multipart/form-data` sent to `/api/chat-with-files`.
- OpenAI calls must happen in the backend route, not in browser code.

This repository is not a Next.js app. The backend route is a Vercel-style serverless function under `api/`.

## Architecture Source Status

Source tree verification has begun. The first architecture gap pass is complete
for workspace graph import validation, shared graph integrity checks, command
lifecycle update behavior, command provenance source type validation, owner UI
duplicate edge relationship prevention, and the matching `validateExample`
invariant checks.

The specific source artifacts verified for this pass include
`src/lib/workspaceValidation.ts`, `src/lib/graphIntegrity.ts`,
`src/lib/applyEflowCommand.ts`, `src/lib/eflowCommandValidation.ts`,
`src/App.tsx`, `src/components/inspector/EdgeInspector.tsx`, and
`scripts/validateExample.ts`.

Remaining source verification is still ongoing; do not treat the whole
architecture as fully source-verified. The pass completed with
`npm run validate:example`, `npm run build`, and `git diff --check` passing;
the build retained the existing Vite large chunk warning. Remaining roadmap and
feature work is not blocked by this governance pass.

## Chat Attachment Feature

The AI Collaboration Console supports file attachments for:

- `.json`
- `.txt`
- `.md`
- `.pdf`
- `.png`

Frontend behavior:

- The composer has an attachment button and hidden `input type="file"`.
- Multiple files are allowed.
- Accepted extensions are limited to `.json,.txt,.md,.pdf,.png`.
- Single-file size limit is 20MB.
- Attached files are shown as removable chips with filename and size.
- Sending uses `FormData`, including message, model, apiKey, context/history fields, and `files`.
- Plain text chat without attachments must continue to work.
- On successful send, the message input and attachments are cleared.
- Backend errors should render in the chat UI and must not crash the app.

Backend behavior:

- Parses `multipart/form-data`.
- Validates allowed extensions and 20MB per-file limit.
- Requires at least one of `message` or `files`.
- Chooses API key from `formData.apiKey` first, then `process.env.OPENAI_API_KEY`.
- Returns `400 Missing API key` if neither key exists.
- Uploads `.json`, `.txt`, `.md`, `.pdf` files to OpenAI Files API with `purpose="user_data"`.
- Uploads `.png` files to OpenAI Files API with `purpose="vision"`.
- Calls OpenAI Responses API with `input_text`, `input_file`, and `input_image` content.
- Returns `outputText`, `responseId`, and `uploadedFiles`.

## Security Rules

- Preserve the OpenAI API Key input field.
- Preserve the model field.
- API keys must not be stored in `localStorage`.
- API keys may live in React state; if persistence is necessary, use `sessionStorage` at most.
- API keys must not be written to Workspace JSON, EFlow Context JSON, docs, commits, console output, or error messages.
- Frontend code must not call OpenAI APIs directly.
- Do not log API keys.
- Do not return API keys to the frontend.
- Sanitize provider/OpenAI error messages before returning them.
- `.env.local` must never be committed.

## Features That Must Not Be Broken

- Existing API key input.
- Existing model field.
- Existing prompt mode selector.
- Existing context mode selector.
- Previous response ID continuation UI.
- Text-only chat flow.
- EFlow graph generation and review workflow.
- Workspace JSON import/export.
- Local Command Import validation, dry-run, and apply flow.
- Traditional Chinese UI foundation.

## Development Notes

Before modifying AI chat again:

- Inspect `AIChatConsole.tsx` and `api/chat-with-files.ts` first.
- Keep changes narrowly scoped.
- Do not perform a large-scale chat refactor unless explicitly requested.
- Run validation after changes:

```bash
npm run build
npm run validate:example
git diff --check
```
