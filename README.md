# MUN Prep Companion

A personal MUN (Model United Nations) preparation web app. Helps delegates research countries, practice debate, and write documents. All data stored in browser localStorage.

## Setup

1. Install dependencies:

   ```
   npm install
   cd netlify/functions && npm install && cd ../..
   ```

2. Add your Gemini API key:
   - Copy `.env.example` to `.env` (for local development, Netlify Functions use Netlify dashboard env vars in production)
   - Set `GEMINI_API_KEY` in Netlify dashboard when deploying

3. Run locally:

   ```
   npm run dev        # Frontend on :5173
   npx netlify dev    # Frontend + Functions on :8888
   ```

4. Build for production:

   ```
   npm run build
   ```

## Deployment

Deploy to Netlify:
- Connect your repository to Netlify
- Set `GEMINI_API_KEY` in Netlify dashboard → Environment variables
- Netlify auto-detects the build command and publish directory from `netlify.toml`

## Features

- **Dashboard**: Manage multiple conferences with deadlines
- **Cheat Sheet**: Country research with inline editing, Sierra Leone template, print view
- **Debate Simulator**: AI-powered Q&A practice with 5 roles and scored feedback
- **Document Workshop**: Rich text editor with AI polish/shorten/brainstorm/insert-clause
- **Settings**: Export/import data as JSON, clear all, load demo data
