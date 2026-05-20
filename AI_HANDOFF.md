# AI HANDOFF

## Read This First

This project is EFlow, a local-first engineering graph app. Do not treat it as a generic chat app or a generic diagramming app.

The UI should remain in Traditional Chinese for user-facing additions and edits.

The current chat attachment implementation is intentionally small in scope. Do not rewrite the whole AI Collaboration Console unless the user explicitly asks for a larger refactor.

## Critical Rules

- Keep the OpenAI API Key input field.
- Keep the model field.
- Do not store API keys in `localStorage`.
- Do not log API keys.
- Do not return API keys to the frontend.
- Do not include API keys in error messages.
- Do not commit `.env.local`.
- Do not make frontend code call OpenAI directly.
- Route all OpenAI calls through `/api/chat-with-files`.
- Keep text-only chat working.
- Keep attachments working through `FormData`.
- Do not auto-apply AI chat output to the EFlow graph.

## Current AI Chat Flow

Frontend file:

- `src/components/aiChat/AIChatConsole.tsx`

Backend route:

- `api/chat-with-files.ts`

Request path:

```text
AIChatConsole -> FormData -> /api/chat-with-files -> OpenAI Files API -> OpenAI Responses API
```

FormData fields include:

- `message`
- `model`
- `apiKey`
- `systemPrompt`
- `projectState`
- `history`
- `conversation`
- `previousResponseId`
- `files`

Supported attachments:

- JSON
- TXT
- MD
- PDF
- PNG

Limits:

- Allowed extensions only: `.json`, `.txt`, `.md`, `.pdf`, `.png`.
- Single-file max size: 20MB.

OpenAI upload purposes:

- `.json`, `.txt`, `.md`, `.pdf`: `user_data`
- `.png`: `vision`

Responses API content:

- Text uses `type: "input_text"`.
- JSON/TXT/MD/PDF files use `type: "input_file"` with `file_id`.
- PNG files use `type: "input_image"` with `file_id`.

## API Key Behavior

Priority order:

1. `apiKey` from submitted `FormData`.
2. `process.env.OPENAI_API_KEY`.
3. Return `400 Missing API key`.

Storage rules:

- Default: React state only.
- Optional remember behavior: `sessionStorage` only.
- Legacy `localStorage` API key is cleaned up by the chat component.

## Do Not Break

- AI Collaboration Console layout and existing visual style.
- API key input.
- Model input.
- Prompt mode selector.
- Context mode selector.
- Previous response ID continuation.
- Copy latest response.
- Copy composed prompt preview.
- Clear chat.
- Clear API key.
- Plain text send path with no files.
- Graph generation and review workflow.
- Workspace persistence and import/export.
- Local Command Import.

## Before Making Changes

1. Inspect existing code before editing.
2. Keep edits minimal and local to the requested behavior.
3. Preserve Traditional Chinese UI copy.
4. Preserve security rules around API keys.
5. Avoid large-scale chat refactors.
6. Run:

```bash
npm run build
npm run validate:example
git diff --check
```

## Deployment Reminder

The app frontend is Vite. The chat backend is a Vercel-style `api/` route.

Local Vite dev server alone does not execute the API route. Use a suitable serverless runtime, such as Vercel dev, when testing `/api/chat-with-files` end to end.
