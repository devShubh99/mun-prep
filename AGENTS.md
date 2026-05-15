# MUN Prep Companion

## Stack

- **Vite + React 18 + TypeScript + Tailwind CSS** SPA. All data in browser `localStorage`.
- **Netlify Functions** (`netlify/functions/`) as Gemini API proxy — has own `package.json` and needs separate `npm install`.
- **TipTap** (ProseMirror) for rich text editing, **React Router v6** for routing, **lucide-react** for icons.

## Commands

| Command | What |
|---|---|
| `npm run dev` | Frontend dev server on `:5173` |
| `npm run build` | `tsc -b && vite build` (note: `-b` flag) |
| `npm test` | **Unit tests then E2E** (`vitest run && node e2e.mjs`). Requires preview server running or use `test:unit` / `test:e2e` separately |
| `npm run test:unit` | Vitest only (26 tests, no server needed) |
| `npm run test:e2e` | Playwright only (14 tests, needs preview server on `:4174`) |
| `npx netlify dev` | Full stack (frontend + functions) on `:8888` |

**Netlify functions need their own `npm install`** in `netlify/functions/`. AI features need `GEMINI_API_KEY` set in Netlify env.

## Architecture

- **Path alias**: `@/` → `src/` (both `vite.config.ts` and `tsconfig.json`)
- **localStorage key**: `mun_prep_app_data` stores `AppData { conferences: Conference[], activeConferenceId: string | null }`
- **React Context** (`useConference`) wraps entire app — provides `conference`, `updateConference`, `allConferences`. Context value is memoized with `useMemo`.
- **Data flow**: `useLocalStorage<T>` hook for CRUD → `useConference` context → components read via `useConference()`. All state flows through the hook stack.
- **API proxy**: `vite.config.ts` proxies `/api/*` → `localhost:8888` (for local dev with Netlify functions)

## Gotchas

- **`noUnusedLocals: true`, `noUnusedParameters: true`** — unused imports/vars break the build.
- **RichTextEditor** `key` prop: using `key={content.length}` destroys the editor on every keystroke (cursor lost). Only use `key={activeTab}` for tab switching. The editor captures `onChange` on mount via `onUpdate` closure.
- **Modal rendering**: `ConferenceFormModal` must be in the same JSX tree as its trigger. A React early return before the modal element silently swallows it. The modal is stored in a `const modal` variable shared across empty-state and dashboard return paths.
- **E2E input targeting**: When the search bar is present, `input.first()` selects the search bar, not the modal's name input. Use `input[required]` to target the modal input.
- **`useLayoutEffect`** in ConferenceWorkspace sets `activeConferenceId` on route entry (avoids race with `<Navigate>`).
- **Vitest config** lives in `vite.config.ts` (`/// <reference types="vitest/config" />`) with `jsdom` env and `setupFiles: ['./src/test-setup.ts']`. Tests use `@testing-library/react` + `@testing-library/user-event`.

## Key files

| Path | Responsibility |
|---|---|
| `src/types/index.ts` | Interfaces, constants arrays, `STORAGE_KEY` |
| `src/hooks/useConference.tsx` | Context provider + hook (memoized) |
| `src/hooks/useLocalStorage.ts` | Generic localStorage CRUD |
| `src/hooks/useAutoSave.ts` | Debounced auto-save (2s, skips first render) |
| `src/hooks/useSettings.ts` | Settings page handler logic |
| `src/pages/Dashboard.tsx` | Conference CRUD, search, modal |
| `src/pages/ConferenceWorkspace.tsx` | 3-tab layout (Cheat Sheet/Debate/Documents) |
| `src/modules/documents/AiActionButtons.tsx` | AI action buttons row (Polish/Shorten/Brainstorm/Insert Clause) |
| `src/modules/debate/QuestionDisplay.tsx` | Question card + answer textarea + submit |
| `src/components/ToolbarButton.tsx` | Reusable TipTap toolbar button |
| `netlify/functions/generate-question.ts` | Gemini: generate debate question |
| `netlify/functions/evaluate-answer.ts` | Gemini: score answer + feedback |
| `netlify/functions/document-ai.ts` | Gemini: polish/shorten/brainstorm |
| `src/lib/api.ts` | Typed `ApiError` class + fetch wrappers |
| `src/lib/constants.ts` | Sierra Leone template, default documents |
