# MUN Prep Companion

## Stack

- **Vite + React 18 + TypeScript + Tailwind CSS** SPA. All data in Supabase.
- **Netlify Functions** (`netlify/functions/`) as DeepSeek API proxy. `openai` package is in root `package.json`, NOT a separate functions `package.json`.
- **Supabase** for auth (email/password) + data (4 tables: `conferences`, `documents`, `debate_qa`, `research_chat_messages`). RLS on all tables scoped to `auth.uid()`.
- **TipTap** (ProseMirror) for rich text, **React Router v6**, **lucide-react** for icons.

## Commands

| Command | What |
|---|---|
| `npm run dev` | Frontend dev server on `:5173` |
| `npm run build` | `tsc -b && vite build` |
| `npx netlify dev` | Full stack (frontend + functions) on `:8888` |
| `npm run test:unit` | Vitest (was 26 tests, old tests may be stale after revamp) |
| `npm run test:e2e` | Playwright (14 tests, needs preview on `:4174`, **all broken** — target old app) |

## Architecture

- **Path alias**: `@/` → `src/` (both `vite.config.ts` and `tsconfig.json`)
- **Auth flow**: `AuthProvider` (Supabase `onAuthStateChange`) → `AuthGuard` redirects to `/login` → logged-in routes wrapped in `ConferenceProvider`.
- **Data flow**: `supabase` client → `useConference` context (fetches on `user` change) → components.
- **API proxy**: `vite.config.ts` proxies `/api/*` → `localhost:8888` for local Netlify Functions.
- **Design system**: Anthropic-style cream/coral/navy palette. `tailwind.config.js` defines custom colors (`canvas`, `ink`, `primary`, `body`, `surface-card`, etc.) and component classes in `src/index.css` (`.btn-primary`, `.card`, `.input`, `.badge`).
- **5 Netlify functions** — all use `deepseek-v4-pro` via OpenAI SDK (`shared.ts` client), respond JSON via `ok()/error()` helpers.

## Gotchas

- **`noUnusedLocals: true`, `noUnusedParameters: true`** — unused imports/vars break the build.
- **Netlify env vars**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in Netlify (baked at build time by Vite). `DEEPSEEK_API_KEY` is runtime for functions.
- **SPA routing**: `netlify.toml` has `/* → /index.html` catch-all redirect AFTER the `/api/*` rule. Order matters.
- **`index.css` font import order**: Google Fonts `@import` sits after `@tailwind` directives — produces a PostCSS warning but works. Move it above `@tailwind` to fix.
- **E2E tests stale**: `e2e.mjs` targets old localStorage/Gemini app. All 14 tests will fail on current code.
- **Old test directories deleted**: `src/hooks/__tests__`, `src/components/__tests__`, `src/lib/__tests__` were removed during revamp. Old unit tests used the old localStorage types.

## Key files

| Path | Responsibility |
|---|---|
| `src/lib/supabase.ts` | Supabase client singleton (throws if VITE_ vars missing) |
| `src/lib/api.ts` | 5 typed API wrappers (generateCheatSheet, generateResearch, researchChat, documentAi, generateQuestion, evaluateAnswer) |
| `src/hooks/useAuth.tsx` | Auth context — signIn, signUp, signOut |
| `src/hooks/useConference.tsx` | Supabase-backed conference CRUD context |
| `src/hooks/useAutoSave.ts` | Debounced save (2s, skips first render, async callback) |
| `src/pages/Dashboard.tsx` | Conference CRUD, search, create modal |
| `src/pages/ConferenceWorkspace.tsx` | 4-tab layout (Cheat Sheet/Research/Debate/Documents) |
| `src/modules/cheat-sheet/CheatSheet.tsx` | Read-only, 7 tabs, AI-generated |
| `src/modules/research/ResearchTab.tsx` | AI briefing + ResearchChat.tsx (bubble UI) |
| `src/modules/documents/DocumentWorkshop.tsx` | Multi-doc manager with TipTap + AI actions |
| `src/modules/debate/DebateSimulator.tsx` | Q&A practice with 5 roles + SpeechPractice.tsx |
| `netlify/functions/shared.ts` | DeepSeek OpenAI client + ok/error helpers |
| `src/types/index.ts` | All interfaces (Conference, CheatSheetJson, Document, DebateQA, etc.) |
