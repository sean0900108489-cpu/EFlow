# CHANGELOG

## Unreleased

### Added

- Added shared graph integrity helpers for exact edge relationship checks.
- Added `validateExample` checks for workspace graph import integrity, command lifecycle update behavior, and command provenance source type validation.
- Added chat file attachment support for JSON, TXT, Markdown, PDF, and PNG files.
- Added removable attachment chips showing filename and file size.
- Added frontend file validation for supported extensions and 20MB per-file limit.
- Added `api/chat-with-files.ts` serverless route for multipart chat requests.
- Added OpenAI Files API upload handling before Responses API calls.
- Added response extraction helper for Responses API output text.
- Added safer API-key redaction for backend error responses.
- Added recommended AI chat model selection with an advanced custom model ID option.
- Added a backend-powered AI chat model test action that checks the selected model without attachments or EFlow context.

### Changed

- Strengthened workspace graph import validation to reject duplicate node IDs, duplicate edge IDs, self-edges, and duplicate exact relationships.
- Command `updateNode` and `updateEdge` operations no longer write default lifecycle status when `lifecycleStatus` is omitted.
- Command provenance `sourceType` is now enum-validated and unknown values are rejected instead of silently normalized.
- Owner UI edge edits now prevent duplicate exact edge relationships.
- AI chat now submits with `FormData` to `/api/chat-with-files`.
- Frontend no longer calls OpenAI directly.
- API key handling changed from `localStorage` to React state, with optional `sessionStorage` only.
- The backend now chooses the API key from the submitted form first, then falls back to `process.env.OPENAI_API_KEY`.
- AI chat defaults to `gpt-5.5` and returns structured `INVALID_MODEL` errors when OpenAI rejects the selected model.
- README now documents that optional AI Chat uses a backend serverless route.

### Preserved

- OpenAI API Key input field remains in the AI Collaboration Console.
- Model field remains in the AI Collaboration Console.
- Text-only chat remains supported.
- Prompt mode, context mode, and previous response continuation controls remain supported.
- AI chat remains draft-only and does not mutate EFlow graph state.

### Security

- API keys must not be stored in `localStorage`.
- API keys must not be logged, committed, exported, or returned to the frontend.
- `.env.local` is ignored and must not be committed.
- OpenAI API calls must stay behind `/api/chat-with-files`.

### Validation

First source-level architecture gap pass verification:

- `npm run validate:example` passed.
- `npm run build` passed with the existing Vite large chunk warning.
- `git diff --check` passed.

Latest validation run:

```bash
npm run build
npm run validate:example
git diff --check
```

Build completed successfully. Vite reported the existing large chunk warning.
