# MUN Prep Companion

A personal MUN (Model United Nations) preparation web app. Helps delegates research countries, practice debate, and write documents. Built with React + TypeScript + Supabase + DeepSeek AI.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Run locally:

   ```
   npm run dev        # Frontend on :5173
   npx netlify dev    # Frontend + Functions on :8888
   ```

4. Build for production:

   ```
   npm run build
   ```

## Database

Create a Supabase project and run `supabase-migration.sql` in the SQL Editor to create the required tables (`conferences`, `documents`, `debate_qa`, `research_chat_messages`) with Row Level Security.

Enable **Email/Password** auth in Supabase dashboard → Authentication → Providers.

## Deployment

Deploy to Netlify:

1. Connect your GitHub repository to Netlify
2. Set these environment variables:

   | Variable | Description |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
   | `DEEPSEEK_API_KEY` | DeepSeek API key (for AI features) |
   | `GOOGLE_STT_API_KEY` | Google Cloud STT key (for Speech Practice) |

3. Deploy — Netlify auto-detects the build command and settings from `netlify.toml`

## Features

- **Dashboard**: Manage multiple conferences, search, create
- **Cheat Sheet**: AI-generated country research with 7 tabs (Mandate, Core Demands, Red Lines, Allies & Opponents, Voting Record, Draft Clauses, Strategy & Q&A)
- **Research**: AI-generated briefing document with follow-up chat interface
- **Debate Simulator**: Q&A practice with 5 roles and scored feedback
- **Speech Practice**: Record or type speeches with AI evaluation
- **Document Workshop**: Multi-document editor with AI polish/shorten/brainstorm/insert-clause
