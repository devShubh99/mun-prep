# MUN Prep Companion

A personal MUN (Model United Nations) preparation web app. Helps delegates research countries, practice debate, and write documents. Built with React + TypeScript + Supabase + OpenRouter AI.

## Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (auth + database)
- **AI**: OpenRouter API (proxies `deepseek-v4-flash`)
- **Editor**: TipTap (ProseMirror) for rich text
- **Hosting**: Netlify (SPA + serverless functions)

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in credentials:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

3. Run locally:

   ```
   npm run dev          # Frontend only on :5173
   npx netlify dev      # Full stack on :8888
   ```

4. Build for production:

   ```
   npm run build
   ```

## Database

Create a Supabase project and run `supabase-migration.sql` in the SQL Editor. This creates 4 tables with Row Level Security:

| Table | Purpose |
|---|---|
| `conferences` | MUN conferences with country, committee, topic |
| `documents` | TipTap-rich documents per conference |
| `debate_qa` | Q&A practice history with AI evaluations |
| `research_chat_messages` | Follow-up chat on research briefings |

Enable **Email/Password** auth in Supabase dashboard → Authentication → Providers.

## Features

- **Dashboard**: Create and manage conferences with search
- **Cheat Sheet**: AI-generated 7-tab briefing (Mandate, Core Demands, Red Lines, Allies & Opponents, Voting Record, Draft Clauses, Strategy & Q&A). Read-only; regenerate if conference details change.
- **Research**: AI-generated briefing document with follow-up chat. Copy to documents.
- **Debate Simulator**: Q&A practice with 5 roles (UfC, G4, Chair, Swing, Journalist). AI asks questions and evaluates answers.
- **Document Workshop**: Multi-document rich text editor with AI actions (Polish, Shorten, Brainstorm, Insert Clause). Tabbed interface with archive and rename.

## Design System

Anthropic-inspired cream/coral/navy palette:

- `bg-canvas` (#faf9f5) — warm cream page background
- `bg-surface-card` (#efe9de) — card backgrounds
- `bg-surface-dark` (#181715) — dark surfaces for code/terminal
- `text-primary` (#cc785c) — coral accent for CTAs
- `text-ink` (#141413) — warm dark text

Typography: Cormorant Garamond (headlines) + Inter (body) + JetBrains Mono (code). Component classes (`btn-primary`, `.card`, `.input`, `.badge`) defined in `src/index.css`.

## Netlify Functions

6 functions in `netlify/functions/` that proxy AI requests through OpenRouter:

| Endpoint | Action |
|---|---|
| `/api/generate-cheatsheet` | Generates structured CheatSheetJson |
| `/api/generate-research` | Generates research briefing (HTML) |
| `/api/research-chat` | Answers follow-up questions |
| `/api/document-ai` | Polish/shorten/brainstorm/insert-clause |
| `/api/generate-question` | Generates debate question |
| `/api/evaluate-answer` | Scores answer + feedback |

All use `shared.ts` (OpenAI SDK → OpenRouter) with model `deepseek-v4-flash`. Requires `OPENROUTER_API_KEY` in Netlify env vars.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Build | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Build | Supabase anonymous key |
| `OPENROUTER_API_KEY` | Runtime | OpenRouter API key for AI features |

`VITE_` vars are baked at build time by Vite. `OPENROUTER_API_KEY` is runtime for Netlify Functions.

## Deployment

1. Connect the GitHub repo to Netlify
2. Set environment variables in Netlify dashboard
3. Netlify auto-detects build settings from `netlify.toml`

SPA routing is handled by `netlify.toml` — `/*` → `/index.html` catch-all after `/api/*` proxy rule.
