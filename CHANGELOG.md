# CHANGELOG

## Unreleased

### Added

- Added chat file attachment support for JSON, TXT, Markdown, PDF, and PNG files.
- Added removable attachment chips showing filename and file size.
- Added frontend file validation for supported extensions and 20MB per-file limit.
- Added `api/chat-with-files.ts` serverless route for multipart chat requests.
- Added OpenAI Files API upload handling before Responses API calls.
- Added response extraction helper for Responses API output text.
- Added safer API-key redaction for backend error responses.

### Changed

- AI chat now submits with `FormData` to `/api/chat-with-files`.
- Frontend no longer calls OpenAI directly.
- API key handling changed from `localStorage` to React state, with optional `sessionStorage` only.
- The backend now chooses the API key from the submitted form first, then falls back to `process.env.OPENAI_API_KEY`.
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

Latest validation run:

```bash
npm run build
npm run validate:example
git diff --check
```

Build completed successfully. Vite reported the existing large chunk warning.
