# MUN Prep — Complete Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Rewrite MUN Prep from a localStorage-backed Gemini app into a Supabase-backed DeepSeek app with auth, new design system, and new features (Research tab, multi-doc manager, Speech Practice, read-only AI-generated Cheat Sheet).

**Architecture:** Vite + React 18 SPA with Supabase auth + data, 7 Netlify functions proxying DeepSeek-V4-flash (OpenAI-compatible), TipTap rich text, Cormorant Garamond + Inter typography.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, Vite, Supabase JS, DeepSeek API (OpenAI SDK), TipTap, Google Cloud STT, Lucide icons.

---

## File Map

### New files to create:
- `src/lib/supabase.ts` — Supabase client singleton
- `src/hooks/useAuth.tsx` — Auth context provider
- `src/pages/LoginPage.tsx` — Login form
- `src/pages/SignupPage.tsx` — Signup form
- `src/components/AuthGuard.tsx` — Protected route wrapper
- `src/modules/research/ResearchTab.tsx` — Research generation + display
- `src/modules/research/ResearchChat.tsx` — Chat bubble UI
- `src/modules/debate/SpeechPractice.tsx` — Speech recording + evaluation
- `netlify/functions/generate-cheatsheet.ts` — DeepSeek cheat sheet generator
- `netlify/functions/generate-research.ts` — DeepSeek research generator
- `netlify/functions/research-chat.ts` — DeepSeek research Q&A
- `netlify/functions/evaluate-speech.ts` — DeepSeek speech evaluation
- `netlify/functions/stt-proxy.ts` — Google STT proxy
- `netlify/functions/shared.ts` — DeepSeek client wrapper

### Files to rewrite completely:
- `src/types/index.ts` — New types for all schemas
- `src/index.css` — New design system (cream/coral/navy)
- `tailwind.config.js` — New color palette + fonts
- `src/App.tsx` — New routing with auth
- `src/lib/api.ts` — 7 DeepSeek API endpoints
- `src/lib/constants.ts` — No Sierra Leone, no defaults
- `src/hooks/useConference.tsx` — Supabase-backed context
- `src/hooks/useAutoSave.ts` — Save to Supabase instead
- `src/pages/Dashboard.tsx` — Auth-aware, Supabase data
- `src/pages/ConferenceWorkspace.tsx` — 4 tabs + research
- `src/pages/Settings.tsx` — Logout + placeholder
- `src/components/Layout.tsx` — Auth-aware header
- `src/modules/cheat-sheet/CheatSheet.tsx` — Read-only, 7 tabs, AI-generated
- `src/modules/debate/DebateSimulator.tsx` — Add role column, Speech Practice
- `src/modules/documents/DocumentWorkshop.tsx` — Multi-doc manager
- `src/modules/documents/RichTextEditor.tsx` — Same but new api.ts
- `src/modules/documents/AiActionButtons.tsx` — Same but new api.ts
- `netlify/functions/generate-question.ts` — DeepSeek version
- `netlify/functions/evaluate-answer.ts` — DeepSeek version
- `netlify/functions/document-ai.ts` — DeepSeek version
- `netlify/functions/package.json` — @google/generative-ai → openai
- `netlify.toml` — No Gemini env, add DeepSeek/Supabase/Google env

### Files to delete:
- `src/hooks/useLocalStorage.ts` — Replaced by Supabase
- `src/hooks/useSettings.ts` — Logic moved inline

### Files to keep unchanged:
- `src/main.tsx` — No changes needed
- `src/vite-env.d.ts` — No changes
- `src/test-setup.ts` — No changes (unit tests will need updating later)
- `src/lib/utils.ts` — Keep utility functions
- `vite.config.ts` — Keep proxy config

---

## Task 1: Foundation — Supabase Client, Config, Types

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/supabase.ts`
- Modify: `src/types/index.ts` (rewrite)
- Modify: `netlify.toml`
- Modify: `netlify/functions/package.json`

- [ ] **Step 1: Install Supabase client**

Run:
```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create Supabase client**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 3: Rewrite types/index.ts with new schemas**

Read the current file first, then write the complete new version:

```typescript
export interface Conference {
  id: string
  user_id: string
  name: string
  assigned_country: string
  committee: string
  topic: string
  special_role: string | null
  deadline: string | null
  cheat_sheet_data: CheatSheetJson | null
  research_data: ResearchJson | null
  created_at: string
  updated_at: string
}

export interface CheatSheetJson {
  mandate: string
  coreDemands: string[]
  redLines: string[]
  keyArguments: string[]
  allies: string[]
  opponents: string[]
  votingRecord: string
  draftClauses: string[]
  bilateralRelations: string
  qaPairs: { question: string; answer: string }[]
  strategyNotes: string
}

export interface ResearchJson {
  content: string // HTML/markdown content
}

export interface Document {
  id: string
  conference_id: string
  title: string
  content: string // TipTap JSON string
  archived: boolean
  created_at: string
  updated_at: string
}

export interface DebateQA {
  id: string
  conference_id: string
  role: string
  question: string
  user_answer: string | null
  evaluation: DebateFeedback | null
  created_at: string
}

export interface DebateFeedback {
  argumentScore: number
  diplomacyScore: number
  compliment: string
  improvement: string
  modelRebuttal: string
}

export interface ResearchChatMessage {
  id: string
  conference_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface SpeechEvaluation {
  transcript: string
  evaluation: {
    clarity: { score: number; feedback: string }
    argumentStrength: { score: number; feedback: string }
    factualAccuracy: { score: number; feedback: string }
    tone: { score: number; feedback: string }
  }
  overallScore: number
  suggestedImprovements: string[]
  rebuttalReady: string
}

// Supabase table names
export const TABLES = {
  conferences: 'conferences',
  documents: 'documents',
  debateQa: 'debate_qa',
  researchChatMessages: 'research_chat_messages',
} as const
```

- [ ] **Step 4: Update netlify/functions/package.json**

Read current, then write:
```json
{
  "name": "netlify-functions",
  "version": "1.0.0",
  "dependencies": {
    "openai": "^4.80.0"
  }
}
```

- [ ] **Step 5: Update netlify.toml**

Read current, then add env vars:
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

Remove `GEMINI_API_KEY`, add `DEEPSEEK_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_STT_API_KEY`.

- [ ] **Step 6: Create .env.example**

Write `.env.example`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 7: Update vite.config.ts to add env prefix**

Read current, ensure envPrefix includes `VITE_` (Vite default — no change needed).

- [ ] **Step 8: Install Netlify functions deps**

Run:
```bash
cd netlify/functions && npm install && cd ../..
```

---

## Task 2: Auth System — Context, Pages, Guard

**Files:**
- Create: `src/hooks/useAuth.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/SignupPage.tsx`
- Create: `src/components/AuthGuard.tsx`
- Modify: `src/main.tsx` (wrap with AuthProvider)
- Modify: `src/App.tsx` (add auth routes)

- [ ] **Step 1: Create AuthProvider**

Create `src/hooks/useAuth.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Create AuthGuard**

Create `src/components/AuthGuard.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AuthGuard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf9f5]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#cc785c] border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
```

- [ ] **Step 3: Create LoginPage**

Create `src/pages/LoginPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await signIn(email, password)
    if (err) setError(err)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-[36px] font-[400] tracking-[-0.5px] text-[#141413] text-center mb-8">
          MUN Prep
        </h1>
        <form onSubmit={handleSubmit} className="bg-[#efe9de] rounded-xl p-8 space-y-4">
          <h2 className="font-[500] text-[18px] text-[#141413]">Sign in</h2>
          {error && (
            <div className="text-sm text-[#c64545] bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="block text-sm font-[500] text-[#3d3d3a] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-[#e6dfd8] px-3 py-2 text-sm bg-[#faf9f5] text-[#141413] placeholder:text-[#8e8b82] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-[500] text-[#3d3d3a] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-[#e6dfd8] px-3 py-2 text-sm bg-[#faf9f5] text-[#141413] placeholder:text-[#8e8b82] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-[500] bg-[#cc785c] text-white hover:bg-[#a9583e] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-sm text-[#6c6a64] text-center">
            No account?{' '}
            <Link to="/signup" className="text-[#cc785c] hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create SignupPage**

Create `src/pages/SignupPage.tsx` — same layout as LoginPage but for signup. Uses `signUp` from useAuth. Shows success message ("Check your email") on successful signup.

```tsx
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SignupPage() {
  const { user, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />
  if (success) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#efe9de] rounded-xl p-8 text-center">
          <h2 className="font-[500] text-[18px] text-[#141413] mb-2">Check your email</h2>
          <p className="text-sm text-[#3d3d3a]">We sent a confirmation link to {email}</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await signUp(email, password)
    if (err) setError(err)
    else setSuccess(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-[36px] font-[400] tracking-[-0.5px] text-[#141413] text-center mb-8">
          MUN Prep
        </h1>
        <form onSubmit={handleSubmit} className="bg-[#efe9de] rounded-xl p-8 space-y-4">
          <h2 className="font-[500] text-[18px] text-[#141413]">Create account</h2>
          {error && (
            <div className="text-sm text-[#c64545] bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="block text-sm font-[500] text-[#3d3d3a] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-[#e6dfd8] px-3 py-2 text-sm bg-[#faf9f5] text-[#141413] placeholder:text-[#8e8b82] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-[500] text-[#3d3d3a] mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-[#e6dfd8] px-3 py-2 text-sm bg-[#faf9f5] text-[#141413] placeholder:text-[#8e8b82] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              placeholder="Minimum 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-[500] bg-[#cc785c] text-white hover:bg-[#a9583e] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
          <p className="text-sm text-[#6c6a64] text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-[#cc785c] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update main.tsx to wrap with AuthProvider**

Read current `src/main.tsx`, wrap `<App />` inside `<AuthProvider>`. Also import `AuthProvider`.

```tsx
import { AuthProvider } from './hooks/useAuth'

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 6: Update App.tsx routing**

Read current, rewrite:
```tsx
import { Routes, Route } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { ConferenceProvider } from './hooks/useConference'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import ConferenceWorkspace from './pages/ConferenceWorkspace'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<ConferenceProvider />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="conference/:id" element={<ConferenceWorkspace />}>
              <Route index element={<Navigate to="cheat-sheet" replace />} />
              <Route path="cheat-sheet" element={<CheatSheet />} />
              <Route path="research" element={<ResearchTab />} />
              <Route path="debate" element={<DebateSimulator />} />
              <Route path="documents" element={<DocumentWorkshop />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
```

---

## Task 3: Design System — Tailwind Config + CSS

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Rewrite tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#faf9f5',
        'surface-soft': '#f5f0e8',
        'surface-card': '#efe9de',
        'surface-cream-strong': '#e8e0d2',
        'surface-dark': '#181715',
        'surface-dark-elevated': '#252320',
        'surface-dark-soft': '#1f1e1b',
        hairline: '#e6dfd8',
        'hairline-soft': '#ebe6df',
        ink: '#141413',
        'body-strong': '#252523',
        body: '#3d3d3a',
        muted: '#6c6a64',
        'muted-soft': '#8e8b82',
        primary: '#cc785c',
        'primary-active': '#a9583e',
        'primary-disabled': '#e6dfd8',
        'on-primary': '#ffffff',
        'on-dark': '#faf9f5',
        'on-dark-soft': '#a09d96',
        'accent-teal': '#5db8a6',
        'accent-amber': '#e8a55a',
        success: '#5db872',
        warning: '#d4a017',
        error: '#c64545',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Garamond', '"Times New Roman"', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        pill: '9999px',
      },
      spacing: {
        section: '96px',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

- [ ] **Step 2: Rewrite src/index.css**

Replace existing with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

@layer base {
  body {
    @apply antialiased bg-canvas text-ink font-sans;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-[500] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none;
  }
  .btn-primary {
    @apply btn bg-primary text-on-primary hover:bg-primary-active focus:ring-primary;
  }
  .btn-secondary {
    @apply btn bg-canvas text-ink border border-hairline hover:bg-surface-soft focus:ring-primary;
  }
  .btn-ghost {
    @apply btn text-muted hover:text-ink hover:bg-surface-soft focus:ring-primary;
  }
  .input {
    @apply block w-full rounded-lg border border-hairline px-3 py-2 text-sm bg-canvas text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary;
  }
  .card {
    @apply bg-surface-card rounded-xl p-8;
  }
  .card-light {
    @apply bg-canvas rounded-xl border border-hairline p-8;
  }
  .badge {
    @apply inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-[500];
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Compiles without errors.

---

## Task 4: Conference Context — Supabase-Backed

**Files:**
- Modify: `src/hooks/useConference.tsx` (rewrite)
- Modify: `src/hooks/useAutoSave.ts` (adapt)

- [ ] **Step 1: Rewrite useConference.tsx**

Read current file, then rewrite:

```tsx
import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Conference, Document, DebateQA, ResearchChatMessage } from '../types'

interface ConferenceContextValue {
  conference: Conference | null
  loading: boolean
  conferences: Conference[]
  refreshConferences: () => Promise<void>
  updateConference: (partial: Partial<Conference>) => Promise<void>
  createConference: (data: Partial<Conference>) => Promise<Conference | null>
  deleteConference: (id: string) => Promise<void>
  setActiveConferenceId: (id: string | null) => void
  activeConferenceId: string | null
}

const ConferenceContext = createContext<ConferenceContextValue | null>(null)

export function ConferenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConferenceId, setActiveConferenceId] = useState<string | null>(null)

  const fetchConferences = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('conferences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setConferences(data as Conference[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchConferences() }, [fetchConferences])

  const conference = useMemo(
    () => conferences.find(c => c.id === activeConferenceId) ?? null,
    [conferences, activeConferenceId]
  )

  const updateConference = useCallback(async (partial: Partial<Conference>) => {
    if (!activeConferenceId) return
    await supabase.from('conferences').update(partial).eq('id', activeConferenceId)
    setConferences(prev => prev.map(c => c.id === activeConferenceId ? { ...c, ...partial } : c))
  }, [activeConferenceId])

  const createConference = useCallback(async (data: Partial<Conference>): Promise<Conference | null> => {
    if (!user) return null
    const { data: inserted, error } = await supabase
      .from('conferences')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()
    if (error || !inserted) return null
    setConferences(prev => [inserted as Conference, ...prev])
    return inserted as Conference
  }, [user])

  const deleteConference = useCallback(async (id: string) => {
    await supabase.from('conferences').delete().eq('id', id)
    setConferences(prev => prev.filter(c => c.id !== id))
    if (activeConferenceId === id) setActiveConferenceId(null)
  }, [activeConferenceId])

  const value = useMemo(() => ({
    conference,
    loading,
    conferences,
    refreshConferences: fetchConferences,
    updateConference,
    createConference,
    deleteConference,
    setActiveConferenceId,
    activeConferenceId,
  }), [conference, loading, conferences, fetchConferences, updateConference, createConference, deleteConference, activeConferenceId])

  return (
    <ConferenceContext.Provider value={value}>
      {children}
    </ConferenceContext.Provider>
  )
}

export function useConference() {
  const ctx = useContext(ConferenceContext)
  if (!ctx) throw new Error('useConference must be used within ConferenceProvider')
  return ctx
}
```

Note: `ConferenceProvider` is no longer a `<Route>` wrapper — it's a regular context provider. Update `App.tsx` accordingly to wrap children instead of being an element.

Actually, looking at the App.tsx structure above, I have `<Route element={<ConferenceProvider />}>` which doesn't work because ConferenceProvider doesn't render an Outlet. Fix in App.tsx:

```tsx
// App.tsx should wrap routes inside ConferenceProvider:
<Route element={<AuthGuard />}>
  <Route element={<ConferenceProvider><Outlet /></ConferenceProvider>}>
    <Route element={<Layout />}>
      ...
```

Wait, `ConferenceProvider` is a context provider, not a layout component. The cleanest approach: make it wrap `<Outlet />`:

```tsx
export function ConferenceProvider({ children }: { children: ReactNode }) {
  // ... all the state logic
  return (
    <ConferenceContext.Provider value={value}>
      {children}
    </ConferenceContext.Provider>
  )
}
```

And in App.tsx:
```tsx
<Route element={<AuthGuard />}>
  <Route element={<ConferenceProvider><Outlet /></ConferenceProvider>}>
    <Route element={<Layout />}>
```

But this means `useConference()` is available in all child routes of the AuthGuard, which is fine.

- [ ] **Step 2: Adapt useAutoSave.ts**

Read current, change signature and implementation to call `updateConference` callback:

```typescript
import { useEffect, useRef } from 'react'

export function useAutoSave(
  value: unknown,
  onSave: () => Promise<void>,
  delay = 2000
) {
  const isFirstRender = useRef(true)
  const isSaving = useRef(false)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = setTimeout(async () => {
      if (isSaving.current) return
      isSaving.current = true
      await onSave()
      isSaving.current = false
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay, onSave])
}
```

---

## Task 5: Layout, Navigation, Routing Polish

**Files:**
- Modify: `src/components/Layout.tsx`
- Modify: `src/pages/Dashboard.tsx` (auth-aware)
- Modify: `src/pages/ConferenceWorkspace.tsx` (4 tabs + research)

- [ ] **Step 1: Update Layout.tsx**

Read current, rewrite auth-aware header with settings gear + user menu:

```tsx
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Settings, LogOut, Globe } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useConference } from '../hooks/useConference'

export default function Layout() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const { conference } = useConference()

  const showBreadcrumb = pathname.startsWith('/conference/') && conference

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-50 bg-canvas border-b border-hairline">
        <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-ink hover:text-primary transition-colors">
              <Globe className="w-5 h-5" />
              <span className="font-serif text-[22px] font-[400] tracking-[-0.3px]">MUN Prep</span>
            </Link>
            {showBreadcrumb && (
              <span className="text-muted text-sm">
                / <span className="text-body">{conference.name}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted hidden sm:block">{user.email}</span>
            )}
            <Link to="/settings" className="btn-ghost p-2">
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content" className="max-w-content mx-auto px-6 py-section">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Update Dashboard.tsx**

Rewrite to fetch from Supabase (through useConference), no localStorage. Create conference form similar to before but calling `createConference`.

Key sections:
- Empty state when `conferences.length === 0`
- Grid of cards with search + "New Conference" button
- Create modal using updated form (no deadline required? Keep deadline as optional)
- Delete calls `deleteConference(id)`

Use `Navigator` pattern or `useNavigate` to go to conference on create.

- [ ] **Step 3: Update ConferenceWorkspace.tsx**

Add Research tab to the 3 existing tabs, making it 4 tabs: Cheat Sheet, Research, Debate, Documents.

```tsx
import { useEffect } from 'react'
import { NavLink, Outlet, useParams, Navigate } from 'react-router-dom'
import { useConference } from '../../hooks/useConference'
import { BookOpen, FileText, MessageSquare, Search } from 'lucide-react'

const TABS = [
  { path: 'cheat-sheet', label: 'Cheat Sheet', icon: BookOpen },
  { path: 'research', label: 'Research', icon: Search },
  { path: 'debate', label: 'Debate', icon: MessageSquare },
  { path: 'documents', label: 'Documents', icon: FileText },
]

export default function ConferenceWorkspace() {
  const { id } = useParams<{ id: string }>()
  const { setActiveConferenceId, conference } = useConference()

  useEffect(() => {
    if (id) setActiveConferenceId(id)
  }, [id, setActiveConferenceId])

  if (!conference) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1 mb-8 border-b border-hairline">
        {TABS.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-[500] border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-ink'
                  : 'border-transparent text-muted hover:text-body hover:border-hairline'
              }`
            }
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
```

- [ ] **Step 4: Update src/App.tsx with corrected routing**

```tsx
import { StrictMode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ConferenceProvider } from './hooks/useConference'
import { AuthGuard } from './components/AuthGuard'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import ConferenceWorkspace from './pages/ConferenceWorkspace'
import Settings from './pages/Settings'
import CheatSheet from './modules/cheat-sheet/CheatSheet'
import ResearchTab from './modules/research/ResearchTab'
import DebateSimulator from './modules/debate/DebateSimulator'
import DocumentWorkshop from './modules/documents/DocumentWorkshop'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<ConferenceProvider><Outlet /></ConferenceProvider>}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="conference/:id" element={<ConferenceWorkspace />}>
              <Route index element={<Navigate to="cheat-sheet" replace />} />
              <Route path="cheat-sheet" element={<CheatSheet />} />
              <Route path="research" element={<ResearchTab />} />
              <Route path="debate" element={<DebateSimulator />} />
              <Route path="documents" element={<DocumentWorkshop />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
```

---

## Task 6: Netlify Functions — Shared Client + All 7 Endpoints

**Files:**
- Create: `netlify/functions/shared.ts`
- Create: `netlify/functions/generate-cheatsheet.ts`
- Create: `netlify/functions/generate-research.ts`
- Create: `netlify/functions/research-chat.ts`
- Create: `netlify/functions/evaluate-speech.ts`
- Create: `netlify/functions/stt-proxy.ts`
- Rewrite: `netlify/functions/generate-question.ts`
- Rewrite: `netlify/functions/evaluate-answer.ts`
- Rewrite: `netlify/functions/document-ai.ts`

- [ ] **Step 1: Create shared DeepSeek client**

`netlify/functions/shared.ts`:
```typescript
import OpenAI from 'openai'

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: 'https://api.deepseek.com',
})

export function ok(body: unknown) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function error(status: number, message: string) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  }
}
```

- [ ] **Step 2: Create generate-cheatsheet.ts**

```typescript
import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const SYSTEM_PROMPT = `You are an expert MUN delegate. Generate a comprehensive cheat sheet as JSON matching this schema exactly:
{
  "mandate": "string - the delegate's mandate and powers",
  "coreDemands": ["string - each core demand"],
  "redLines": ["string - each red line"],
  "keyArguments": ["string - each key argument"],
  "allies": ["string - ally countries"],
  "opponents": ["string - opponent countries"],
  "votingRecord": "string - voting record details",
  "draftClauses": ["string - each draft clause"],
  "bilateralRelations": "string - bilateral relations summary",
  "qaPairs": [{"question": "string", "answer": "string"}],
  "strategyNotes": "string - strategy notes"
}`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { country, committee, topic, specialRole } = JSON.parse(event.body || '{}')
    const userPrompt = `Country: ${country}\nCommittee: ${committee}\nTopic: ${topic}${specialRole ? `\nSpecial Role: ${specialRole}` : ''}\n\nGenerate comprehensive cheat sheet JSON.`
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    })
    return ok(JSON.parse(response.choices[0].message.content || '{}'))
  } catch (e: any) {
    return error(500, e.message)
  }
}
```

- [ ] **Step 3: Create generate-research.ts**

```typescript
import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const SYSTEM_PROMPT = (country: string, committee: string, topic: string) =>
  `You are an expert Model United Nations research agent. Your task is to conduct comprehensive research for a delegate representing ${country} in a Model United Nations conference on ${topic} in ${committee}.

Research and compile the following:

1. COUNTRY PROFILE
Government structure, current leadership, and political stability
Key economic indicators (GDP, major industries, unemployment, poverty rate)
Demographics, ethnic groups, and official/spoken languages
Recent major news or developments (last 12 months)

2. FOREIGN POLICY & ALLIANCES
${country}'s foreign policy priorities and doctrine
Key bilateral relationships and regional alliances
Relationship with major powers (USA, China, UK, Russia)
Stance on multilateralism and the United Nations

3. COMMITTEE-SPECIFIC RESEARCH
Committee: ${committee} | Topic: ${topic}
${country}'s official position or voting history on this topic
Any resolutions ${country} has co-sponsored related to this topic
Domestic relevance of this topic to ${country}
Key arguments ${country} would likely make on the floor

4. HISTORICAL CONTEXT
${country}'s history with the UN (peacekeeping, aid, partnerships)
Past conflicts or crises and their lasting impact
Any international agreements or treaties ${country} has signed

5. BLOC ALIGNMENT
Which country blocs ${country} typically aligns with
Potential allies on this specific committee topic
Countries ${country} may oppose and why

6. DELEGATE TOOLKIT
3-5 strong opening speech talking points
Likely amendments or clauses ${country} would push for
Red lines — positions ${country} would strongly oppose
5 potential working paper allies to approach

Format as a structured briefing document with HTML headings and paragraphs. Use <h2>, <h3>, <ul>, <p> tags.`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { country, committee, topic } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(country, committee, topic) },
        { role: 'user', content: `Generate comprehensive research briefing for ${country} on ${topic} in ${committee}.` },
      ],
    })
    return ok({ content: response.choices[0].message.content })
  } catch (e: any) {
    return error(500, e.message)
  }
}
```

- [ ] **Step 4: Create research-chat.ts**

```typescript
import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { researchContext, question } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: `You are a research assistant. Use the following research context to answer questions:\n\n${researchContext}` },
        { role: 'user', content: question },
      ],
    })
    return ok({ answer: response.choices[0].message.content })
  } catch (e: any) {
    return error(500, e.message)
  }
}
```

- [ ] **Step 5: Create evaluate-speech.ts**

```typescript
import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const SYSTEM_PROMPT = `You are a MUN speech evaluator. Evaluate the transcript and return JSON:
{
  "transcript": "string",
  "evaluation": {
    "clarity": { "score": 1-10, "feedback": "string" },
    "argumentStrength": { "score": 1-10, "feedback": "string" },
    "factualAccuracy": { "score": 1-10, "feedback": "string" },
    "tone": { "score": 1-10, "feedback": "string" }
  },
  "overallScore": "number 0-10",
  "suggestedImprovements": ["string", "string"],
  "rebuttalReady": "string - AI-generated counter-argument"
}`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { transcript, researchContext, cheatSheetContext } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + `\n\nResearch Context:\n${researchContext}\n\nCheat Sheet Context:\n${cheatSheetContext}` },
        { role: 'user', content: `Evaluate this speech: "${transcript}"` },
      ],
      response_format: { type: 'json_object' },
    })
    return ok(JSON.parse(response.choices[0].message.content || '{}'))
  } catch (e: any) {
    return error(500, e.message)
  }
}
```

- [ ] **Step 6: Create stt-proxy.ts**

```typescript
import type { Handler } from '@netlify/functions'
import { ok, error } from './shared'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { audioBase64 } = JSON.parse(event.body || '{}')
    const apiKey = process.env.GOOGLE_STT_API_KEY
    if (!apiKey) return error(500, 'GOOGLE_STT_API_KEY not configured')

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
          },
          audio: { content: audioBase64 },
        }),
      }
    )
    const data = await response.json()
    const transcript = data.results
      ?.map((r: any) => r.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(' ') || ''
    return ok({ transcript })
  } catch (e: any) {
    return error(500, e.message)
  }
}
```

- [ ] **Step 7: Rewrite generate-question.ts**

```typescript
import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { country, committee, topic, role } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: `You are a MUN committee chair. Generate a realistic debate question for a delegate representing ${country} in ${committee} on the topic "${topic}". Role: ${role}. Return only the question text, no JSON.` },
        { role: 'user', content: 'Generate a debate question.' },
      ],
    })
    return ok({ question: response.choices[0].message.content })
  } catch (e: any) {
    return error(500, e.message)
  }
}
```

- [ ] **Step 8: Rewrite evaluate-answer.ts**

```typescript
import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const SYSTEM_PROMPT = `You are a MUN evaluator. Score the delegate's answer and return JSON:
{
  "argumentScore": 1-10,
  "diplomacyScore": 1-10,
  "compliment": "string",
  "improvement": "string",
  "modelRebuttal": "string"
}`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { question, answer, country, committee, topic, role } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\nContext: ${country}, ${committee}, ${topic}, Role: ${role}` },
        { role: 'user', content: `Question: ${question}\nAnswer: ${answer}\n\nEvaluate this answer.` },
      ],
      response_format: { type: 'json_object' },
    })
    return ok(JSON.parse(response.choices[0].message.content || '{}'))
  } catch (e: any) {
    return error(500, e.message)
  }
}
```

- [ ] **Step 9: Rewrite document-ai.ts**

```typescript
import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const ACTIONS: Record<string, string> = {
  polish: 'Polish the text to make it more diplomatic and professional. Return only the polished text.',
  shorten: 'Shorten the text to half its length while keeping all key points. Return only the shortened text.',
  brainstorm: 'Brainstorm additional points, arguments, or clauses the delegate could add. Return only the new content, no prefix.',
  'insert-clause': 'Draft a formal working clause on this topic. Return only the clause text.',
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { action, documentType, content, context } = JSON.parse(event.body || '{}')
    const instruction = ACTIONS[action] || ACTIONS.polish
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: `${instruction}\nDocument type: ${documentType}\n${context ? `Context: ${context}` : ''}` },
        { role: 'user', content },
      ],
    })
    return ok({ result: response.choices[0].message.content?.trim() })
  } catch (e: any) {
    return error(500, e.message)
  }
}
```

---

## Task 7: API Layer — Rewrite src/lib/api.ts

**Files:**
- Rewrite: `src/lib/api.ts`

- [ ] **Step 1: Rewrite src/lib/api.ts**

Read current, write new version with all 7 endpoints:

```typescript
const BASE = '/api'

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text || res.statusText, res.status)
  }
  return res.json()
}

export function generateCheatSheet(params: {
  country: string
  committee: string
  topic: string
  specialRole?: string
}) {
  return request<Record<string, unknown>>('/generate-cheatsheet', params)
}

export function generateResearch(params: {
  country: string
  committee: string
  topic: string
}) {
  return request<{ content: string }>('/generate-research', params)
}

export function researchChat(params: {
  researchContext: string
  question: string
}) {
  return request<{ answer: string }>('/research-chat', params)
}

export function documentAi(params: {
  action: string
  documentType: string
  content: string
  context?: string
}) {
  return request<{ result: string }>('/document-ai', params)
}

export function generateQuestion(params: {
  country: string
  committee: string
  topic: string
  role: string
}) {
  return request<{ question: string }>('/generate-question', params)
}

export function evaluateAnswer(params: {
  question: string
  answer: string
  country: string
  committee: string
  topic: string
  role: string
}) {
  return request<{
    argumentScore: number
    diplomacyScore: number
    compliment: string
    improvement: string
    modelRebuttal: string
  }>('/evaluate-answer', params)
}

export function evaluateSpeech(params: {
  transcript: string
  researchContext: string
  cheatSheetContext: string
}) {
  return request<{
    transcript: string
    evaluation: {
      clarity: { score: number; feedback: string }
      argumentStrength: { score: number; feedback: string }
      factualAccuracy: { score: number; feedback: string }
      tone: { score: number; feedback: string }
    }
    overallScore: number
    suggestedImprovements: string[]
    rebuttalReady: string
  }>('/evaluate-speech', params)
}

export function sttProxy(params: { audioBase64: string }) {
  return request<{ transcript: string }>('/stt-proxy', params)
}
```

---

## Task 8: Cheat Sheet — Read-Only, 7 Tabs, AI-Generated

**Files:**
- Rewrite: `src/modules/cheat-sheet/CheatSheet.tsx`

- [ ] **Step 1: Rewrite CheatSheet.tsx**

Complete rewrite — read-only, generate button, 7 tabs:

```tsx
import { useState } from 'react'
import { useConference } from '../../hooks/useConference'
import { generateCheatSheet } from '../../lib/api'
import { Sparkles } from 'lucide-react'
import type { CheatSheetJson } from '../../types'

const TABS = [
  { key: 'mandate', label: 'Mandate' },
  { key: 'coreDemands', label: 'Core Demands' },
  { key: 'redLines', label: 'Red Lines' },
  { key: 'alliesOpponents', label: 'Allies & Opponents' },
  { key: 'votingRecord', label: 'Voting Record' },
  { key: 'draftClauses', label: 'Draft Clauses' },
  { key: 'strategy', label: 'Strategy & Q&A' },
]

export default function CheatSheet() {
  const { conference, updateConference } = useConference()
  const [activeTab, setActiveTab] = useState('mandate')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!conference) return
    setGenerating(true)
    try {
      const data = await generateCheatSheet({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        specialRole: conference.special_role || undefined,
      })
      await updateConference({ cheat_sheet_data: data as CheatSheetJson })
    } finally {
      setGenerating(false)
    }
  }

  const cs = conference?.cheat_sheet_data

  return (
    <div>
      {!cs ? (
        <div className="card text-center">
          <p className="text-body mb-4">Generate an AI-powered cheat sheet for {conference?.assigned_country}.</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating…' : 'Generate Cheat Sheet'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1 border-b border-hairline">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-[500] border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary text-ink'
                      : 'border-transparent text-muted hover:text-body'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={generating} className="btn-ghost text-sm">
              <Sparkles className="w-3 h-3" />
              Regenerate
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'mandate' && (
              <div className="card-light">
                <p className="text-body whitespace-pre-wrap">{cs.mandate}</p>
              </div>
            )}
            {activeTab === 'coreDemands' && (
              <div className="card-light">
                <ol className="list-decimal pl-5 space-y-2">
                  {cs.coreDemands.map((d, i) => <li key={i} className="text-body">{d}</li>)}
                </ol>
              </div>
            )}
            {activeTab === 'redLines' && (
              <div className="card-light">
                <ul className="list-disc pl-5 space-y-2">
                  {cs.redLines.map((r, i) => <li key={i} className="text-body">{r}</li>)}
                </ul>
              </div>
            )}
            {activeTab === 'alliesOpponents' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-3">Allies</h3>
                  <ul className="space-y-1">
                    {cs.allies.map((a, i) => <li key={i} className="text-body">{a}</li>)}
                  </ul>
                </div>
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-3">Opponents</h3>
                  <ul className="space-y-1">
                    {cs.opponents.map((o, i) => <li key={i} className="text-body">{o}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'votingRecord' && (
              <div className="card-light">
                <p className="text-body whitespace-pre-wrap">{cs.votingRecord}</p>
              </div>
            )}
            {activeTab === 'draftClauses' && (
              <div className="card-light">
                <ol className="list-decimal pl-5 space-y-2">
                  {cs.draftClauses.map((c, i) => <li key={i} className="text-body">{c}</li>)}
                </ol>
              </div>
            )}
            {activeTab === 'strategy' && (
              <div className="space-y-4">
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-2">Key Arguments</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {cs.keyArguments.map((a, i) => <li key={i} className="text-body">{a}</li>)}
                  </ul>
                </div>
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-2">Bilateral Relations</h3>
                  <p className="text-body whitespace-pre-wrap">{cs.bilateralRelations}</p>
                </div>
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-2">Q&A Pairs</h3>
                  <div className="space-y-3">
                    {cs.qaPairs.map((qa, i) => (
                      <div key={i}>
                        <p className="font-[500] text-sm text-ink">Q: {qa.question}</p>
                        <p className="text-body text-sm">A: {qa.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-2">Strategy Notes</h3>
                  <p className="text-body whitespace-pre-wrap">{cs.strategyNotes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Task 9: Research Tab — Generation, Display, Chat, Copy to Docs

**Files:**
- Create: `src/modules/research/ResearchTab.tsx`
- Create: `src/modules/research/ResearchChat.tsx`

- [ ] **Step 1: Create ResearchTab.tsx**

Full research module — generate button, HTML display, copy-to-docs button, chat interface:

```tsx
import { useState } from 'react'
import { useConference } from '../../hooks/useConference'
import { generateResearch } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import ResearchChat from './ResearchChat'
import { Sparkles, Copy, FileText } from 'lucide-react'

export default function ResearchTab() {
  const { conference, updateConference } = useConference()
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!conference) return
    setGenerating(true)
    try {
      const data = await generateResearch({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
      })
      await updateConference({ research_data: { content: data.content } })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyToDocuments = async () => {
    if (!conference || !conference.research_data) return
    await supabase.from('documents').insert({
      conference_id: conference.id,
      title: `Research – ${conference.assigned_country} – ${conference.topic}`,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: conference.research_data.content }] },
        ],
      }),
      archived: false,
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const researchContent = conference?.research_data?.content

  return (
    <div>
      {!researchContent ? (
        <div className="card text-center">
          <p className="text-body mb-4">
            Generate a comprehensive research briefing for {conference?.assigned_country} on {conference?.topic}.
          </p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating…' : 'Generate Research'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-[22px] font-[400] tracking-[-0.3px] text-ink">
              Research Briefing — {conference?.assigned_country}
            </h2>
            <div className="flex gap-2">
              <button onClick={handleCopyToDocuments} className="btn-secondary">
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy to Documents'}
              </button>
              <button onClick={handleGenerate} disabled={generating} className="btn-ghost">
                <Sparkles className="w-3 h-3" />
                Regenerate
              </button>
            </div>
          </div>

          <div
            className="card-light prose prose-sm max-w-none [&_h2]:font-serif [&_h2]:text-[22px] [&_h2]:font-[400] [&_h2]:tracking-[-0.3px] [&_h2]:text-ink [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:font-[500] [&_h3]:text-body [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:text-body [&_p]:text-body"
            dangerouslySetInnerHTML={{ __html: researchContent }}
          />

          <div className="mt-8">
            <ResearchChat />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create ResearchChat.tsx**

Chat bubble interface below research content:

```tsx
import { useState, useEffect, useRef } from 'react'
import { useConference } from '../../hooks/useConference'
import { researchChat } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Send } from 'lucide-react'
import type { ResearchChatMessage } from '../../types'

export default function ResearchChat() {
  const { conference } = useConference()
  const { user } = useAuth()
  const [messages, setMessages] = useState<ResearchChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conference) return
    supabase
      .from('research_chat_messages')
      .select('*')
      .eq('conference_id', conference.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ResearchChatMessage[])
      })
  }, [conference?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !conference || !user) return
    const text = input.trim()
    setInput('')

    const userMsg: ResearchChatMessage = {
      id: crypto.randomUUID(),
      conference_id: conference.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setSending(true)

    try {
      const { answer } = await researchChat({
        researchContext: conference.research_data?.content || '',
        question: text,
      })
      const assistantMsg: ResearchChatMessage = {
        id: crypto.randomUUID(),
        conference_id: conference.id,
        role: 'assistant',
        content: answer,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])

      await supabase.from('research_chat_messages').insert([userMsg, assistantMsg])
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h3 className="font-[500] text-sm text-muted mb-4">Ask follow-up questions</h3>
      <div className="card-light p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-muted-soft text-sm text-center py-8">Ask a question about the research above.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-soft text-body'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-surface-soft rounded-xl px-4 py-2 text-sm text-muted">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about this research…"
          className="input flex-1"
          disabled={sending}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()} className="btn-primary">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
```

---

## Task 10: Documents — Multi-Document Manager

**Files:**
- Rewrite: `src/modules/documents/DocumentWorkshop.tsx`
- Modify: `src/modules/documents/RichTextEditor.tsx` (minor — use new api.ts)
- Modify: `src/modules/documents/AiActionButtons.tsx` (minor — use new api.ts)

- [ ] **Step 1: Rewrite DocumentWorkshop.tsx**

Multi-document manager with tabs, create, archive, rename:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useConference } from '../../hooks/useConference'
import { supabase } from '../../lib/supabase'
import { useAutoSave } from '../../hooks/useAutoSave'
import RichTextEditor from './RichTextEditor'
import AiActionButtons from './AiActionButtons'
import { Plus, X } from 'lucide-react'
import type { Document } from '../../types'

export default function DocumentWorkshop() {
  const { conference } = useConference()
  const [docs, setDocs] = useState<Document[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const activeDoc = docs.find(d => d.id === activeDocId)

  useEffect(() => {
    if (!conference) return
    supabase
      .from('documents')
      .select('*')
      .eq('conference_id', conference.id)
      .eq('archived', false)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setDocs(data as Document[])
          if (!activeDocId && data.length > 0) setActiveDocId(data[0].id)
        }
      })
  }, [conference?.id])

  const saveDocument = useCallback(async () => {
    if (!activeDoc) return
    await supabase.from('documents').update({ content: activeDoc.content, updated_at: new Date().toISOString() }).eq('id', activeDoc.id)
  }, [activeDoc])

  useAutoSave(activeDoc?.content, saveDocument)

  const handleCreate = async () => {
    if (!conference) return
    const { data } = await supabase
      .from('documents')
      .insert({
        conference_id: conference.id,
        title: 'Untitled',
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
        archived: false,
      })
      .select()
      .single()
    if (data) {
      setDocs(prev => [...prev, data as Document])
      setActiveDocId(data.id)
    }
  }

  const handleArchive = async (id: string) => {
    await supabase.from('documents').update({ archived: true }).eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
    if (activeDocId === id) {
      const remaining = docs.filter(d => d.id !== id)
      setActiveDocId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleRename = async (id: string, title: string) => {
    await supabase.from('documents').update({ title }).eq('id', id)
    setDocs(prev => prev.map(d => d.id === id ? { ...d, title } : d))
    setRenamingId(null)
  }

  const handleContentChange = (content: string) => {
    if (!activeDocId) return
    setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, content } : d))
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center border-b border-hairline mb-4 overflow-x-auto">
        {docs.map(doc => (
          <div
            key={doc.id}
            className={`flex items-center gap-1 px-3 py-2 text-sm cursor-pointer border-b-2 transition-colors shrink-0 ${
              activeDocId === doc.id
                ? 'border-primary text-ink'
                : 'border-transparent text-muted hover:text-body'
            }`}
            onClick={() => setActiveDocId(doc.id)}
          >
            {renamingId === doc.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => handleRename(doc.id, renameValue)}
                onKeyDown={e => e.key === 'Enter' && handleRename(doc.id, renameValue)}
                className="input py-0.5 px-1 text-sm w-32"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={() => { setRenamingId(doc.id); setRenameValue(doc.title) }}
              >
                {doc.title}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); handleArchive(doc.id) }}
              className="p-0.5 hover:bg-surface-soft rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={handleCreate} className="p-3 text-muted hover:text-ink">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {activeDoc ? (
        <div>
          <AiActionButtons
            content={activeDoc.content}
            documentType="general"
            onResult={(result) => handleContentChange(result)}
          />
          <div className="mt-4">
            <RichTextEditor
              content={activeDoc.content}
              onChange={handleContentChange}
            />
          </div>
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-muted">No documents yet. Click <strong>+</strong> to create one.</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update AiActionButtons.tsx**

Read current, swap Gemini API calls with new `documentAi` from `src/lib/api.ts`:

```tsx
import { useState } from 'react'
import { documentAi } from '../../lib/api'
import { Sparkles, Scissors, Lightbulb, FilePlus } from 'lucide-react'

interface Props {
  content: string
  documentType: string
  onResult: (result: string) => void
}

const ACTIONS = [
  { key: 'polish', label: 'Polish', icon: Sparkles },
  { key: 'shorten', label: 'Shorten', icon: Scissors },
  { key: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
  { key: 'insert-clause', label: 'Insert Clause', icon: FilePlus },
]

export default function AiActionButtons({ content, documentType, onResult }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setLoadingAction(action)
    try {
      const { result } = await documentAi({ action, documentType, content })
      if (action === 'polish' || action === 'shorten') {
        onResult(result)
      } else {
        const parsed = JSON.parse(content)
        parsed.content.push({ type: 'paragraph', content: [{ type: 'text', text: '\n' + result }] })
        onResult(JSON.stringify(parsed))
      }
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="flex gap-2">
      {ACTIONS.map(action => (
        <button
          key={action.key}
          onClick={() => handleAction(action.key)}
          disabled={loadingAction !== null}
          className="btn-secondary text-xs"
        >
          {loadingAction === action.key ? (
            <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <action.icon className="w-3.5 h-3.5" />
          )}
          {action.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Update RichTextEditor.tsx**

Read current. The main change is that `AiActionButtons` now passes raw TipTap JSON string. The editor should parse/set content accordingly. Minor tweak to handle content changes as JSON string:

```tsx
// In the editor, onChange should emit the JSON string:
onChange: (editor) => {
  onChange(JSON.stringify(editor.getJSON()))
}

// And content should be parsed:
const initialContent = useRef(() => {
  if (content) {
    try { editor.commands.setContent(JSON.parse(content)) } catch { /* ignore */ }
  }
})
```

---

## Task 11: Debate — Q&A + Speech Practice

**Files:**
- Modify: `src/modules/debate/DebateSimulator.tsx` (add Speech Practice toggle, use Supabase)
- Create: `src/modules/debate/SpeechPractice.tsx`

- [ ] **Step 1: Rewrite DebateSimulator.tsx**

Integrate with `debate_qa` table, add role column, add Speech Practice toggle:

```tsx
import { useState, useEffect } from 'react'
import { useConference } from '../../hooks/useConference'
import { supabase } from '../../lib/supabase'
import { generateQuestion, evaluateAnswer } from '../../lib/api'
import QuestionDisplay from './QuestionDisplay'
import FeedbackDisplay from './FeedbackDisplay'
import SpeechPractice from './SpeechPractice'
import { MessageSquare, Mic } from 'lucide-react'
import type { DebateQA } from '../../types'

export default function DebateSimulator() {
  const { conference } = useConference()
  const [mode, setMode] = useState<'qa' | 'speech'>('qa')
  const [role, setRole] = useState('UfC')
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentEval, setCurrentEval] = useState<any>(null)
  const [history, setHistory] = useState<DebateQA[]>([])

  const DEBATE_ROLES = [
    { value: 'UfC', label: 'Unilateralist for Change' },
    { value: 'G4', label: 'Group of 4' },
    { value: 'Chair', label: 'Committee Chair' },
    { value: 'Swing', label: 'Swing State' },
    { value: 'Journalist', label: 'Journalist' },
  ]

  useEffect(() => {
    if (!conference) return
    supabase
      .from('debate_qa')
      .select('*')
      .eq('conference_id', conference.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setHistory(data as DebateQA[])
      })
  }, [conference?.id])

  const handleAsk = async () => {
    if (!conference) return
    setLoading(true)
    try {
      const { question } = await generateQuestion({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        role,
      })
      setCurrentQuestion(question)
      setAnswer('')
      setCurrentEval(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!conference || !currentQuestion) return
    setLoading(true)
    try {
      const evaluation = await evaluateAnswer({
        question: currentQuestion,
        answer,
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        role,
      })
      setCurrentEval(evaluation)

      await supabase.from('debate_qa').insert({
        conference_id: conference.id,
        role,
        question: currentQuestion,
        user_answer: answer,
        evaluation,
      })

      supabase
        .from('debate_qa')
        .select('*')
        .eq('conference_id', conference.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { if (data) setHistory(data as DebateQA[]) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-hairline mb-6">
        <button
          onClick={() => setMode('qa')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-[500] border-b-2 transition-colors ${
            mode === 'qa' ? 'border-primary text-ink' : 'border-transparent text-muted'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Q&A Practice
        </button>
        <button
          onClick={() => setMode('speech')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-[500] border-b-2 transition-colors ${
            mode === 'speech' ? 'border-primary text-ink' : 'border-transparent text-muted'
          }`}
        >
          <Mic className="w-4 h-4" /> Speech Practice
        </button>
      </div>

      {mode === 'qa' ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm font-[500] text-body">Role:</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="input w-auto">
              {DEBATE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button onClick={handleAsk} disabled={loading} className="btn-primary">
              {loading ? 'Generating…' : 'Ask Question'}
            </button>
          </div>

          {currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              answer={answer}
              onAnswerChange={setAnswer}
              onSubmit={handleSubmitAnswer}
              loading={loading}
            />
          )}

          {currentEval && <FeedbackDisplay feedback={currentEval} />}

          {history.length > 0 && (
            <div className="mt-8">
              <h3 className="font-[500] text-sm text-muted mb-3">Past Questions</h3>
              <div className="space-y-2">
                {history.slice(0, 10).map(entry => (
                  <div key={entry.id} className="card-light p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="badge bg-surface-card text-muted">{entry.role}</span>
                      <span className="text-xs text-muted-soft">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-body">{entry.question}</p>
                    {entry.evaluation && (
                      <div className="flex gap-3 mt-2 text-xs text-muted">
                        <span>Argument: {entry.evaluation.argumentScore}/10</span>
                        <span>Diplomacy: {entry.evaluation.diplomacyScore}/10</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <SpeechPractice />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create SpeechPractice.tsx**

```tsx
import { useState, useRef } from 'react'
import { useConference } from '../../hooks/useConference'
import { evaluateSpeech, sttProxy } from '../../lib/api'
import { Mic, Square, Send } from 'lucide-react'
import type { SpeechEvaluation } from '../../types'

export default function SpeechPractice() {
  const { conference } = useConference()
  const [transcript, setTranscript] = useState('')
  const [recording, setRecording] = useState(false)
  const [evaluation, setEvaluation] = useState<SpeechEvaluation | null>(null)
  const [loading, setLoading] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      chunks.current = []
      recorder.ondataavailable = (e) => chunks.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm;codecs=opus' })
        const buffer = await blob.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        const { transcript: t } = await sttProxy({ audioBase64: base64 })
        setTranscript(t)
        stream.getTracks().forEach(track => track.stop())
      }
      recorder.start()
      mediaRecorder.current = recorder
      setRecording(true)
    } catch {
      alert('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  const handleEvaluate = async () => {
    if (!transcript.trim() || !conference) return
    setLoading(true)
    try {
      const result = await evaluateSpeech({
        transcript,
        researchContext: conference.research_data?.content || '',
        cheatSheetContext: JSON.stringify(conference.cheat_sheet_data || {}),
      })
      setEvaluation(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-light">
        <h3 className="font-[500] text-sm text-body mb-4">Record or type your speech</h3>
        <div className="flex items-center gap-3 mb-4">
          {!recording ? (
            <button onClick={startRecording} className="btn-primary">
              <Mic className="w-4 h-4" /> Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} className="btn-danger">
              <Square className="w-4 h-4" /> Stop Recording
            </button>
          )}
        </div>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder="Your speech will appear here after recording, or type it manually…"
          className="input min-h-[120px] resize-y"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleEvaluate}
            disabled={loading || !transcript.trim()}
            className="btn-primary"
          >
            {loading ? 'Evaluating…' : 'Evaluate Speech'}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {evaluation && (
        <div className="space-y-4">
          <div className="card-light">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[500] text-lg text-ink">Evaluation</h3>
              <span className="text-2xl font-serif text-primary">
                {evaluation.overallScore.toFixed(1)}/10
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(evaluation.evaluation).map(([key, val]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-[500] text-body capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm font-[500] text-primary">{val.score}/10</span>
                  </div>
                  <div className="w-full bg-surface-soft rounded-full h-1.5">
                    <div className="bg-primary rounded-full h-1.5" style={{ width: `${val.score * 10}%` }} />
                  </div>
                  <p className="text-xs text-muted mt-1">{val.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-light">
            <h3 className="font-[500] text-sm text-body mb-2">Suggested Improvements</h3>
            <ul className="list-disc pl-5 space-y-1">
              {evaluation.suggestedImprovements.map((s, i) => (
                <li key={i} className="text-sm text-body">{s}</li>
              ))}
            </ul>
          </div>

          <div className="card-light">
            <h3 className="font-[500] text-sm text-body mb-2">Rebuttal Ready</h3>
            <p className="text-sm text-body">{evaluation.rebuttalReady}</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Task 12: Settings — Stripped Down

**Files:**
- Rewrite: `src/pages/Settings.tsx`

- [ ] **Step 1: Rewrite Settings.tsx**

```tsx
import { useAuth } from '../hooks/useAuth'
import { LogOut } from 'lucide-react'

export default function Settings() {
  const { user, signOut } = useAuth()

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="font-serif text-[28px] font-[400] tracking-[-0.3px] text-ink">Settings</h1>

      <div className="card">
        <h2 className="font-[500] text-sm text-body mb-1">Account</h2>
        <p className="text-sm text-muted mb-4">{user?.email}</p>
        <p className="text-sm text-muted-soft mb-6">Account management (password change, account deletion) coming soon.</p>
        <button onClick={signOut} className="btn-secondary">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )
}
```

---

## Task 13: Cleanup — Remove Old Files and Dependencies

- [ ] **Step 1: Delete removed files**

```bash
rm -f src/hooks/useLocalStorage.ts
rm -f src/hooks/useSettings.ts
```

- [ ] **Step 2: Remove old Gemini functions**

```bash
rm -f netlify/functions/generate-question.ts  # will be rewritten, skip
```

Actually the old Gemini functions are being rewritten, not deleted. Just confirming no old Gemini files remain.

- [ ] **Step 3: Remove `@google/generative-ai` from functions deps**

Already handled in Task 1 Step 4 (package.json rewrite).

- [ ] **Step 4: Update src/lib/constants.ts**

Remove `SIERRA_LEONE_CHEAT_SHEET`, `DEFAULT_DOCUMENTS`, `createDefaultConference`, `createEmptyAppData`. Keep only utility constants if needed.

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Must pass without errors.

- [ ] **Step 6: Check for leftover Gemini/GEMINI references**

```bash
rg -i 'gemini' src/ netlify/ --include '*.ts' --include '*.tsx' --include '*.json'
```

Expected: No matches.

- [ ] **Step 7: Check for old localStorage references**

```bash
rg -i 'localStorage|useLocalStorage' src/ --include '*.ts' --include '*.tsx'
```

Expected: No matches (supabase client is fine, but direct localStorage calls should be gone).

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Supabase setup + RLS — Task 1
- ✅ Auth (login/signup pages, protected routes) — Task 2
- ✅ Design system (cream/coral/navy, Cormorant Garamond, Inter) — Task 3
- ✅ Conference context backed by Supabase — Task 4
- ✅ Auto-save adapted to Supabase — Task 4
- ✅ Cheat Sheet read-only, AI-generated, 7 tabs — Task 8
- ✅ Remove "Reset to Sierra Leone" — Task 8 (omitted)
- ✅ Research tab with generation + display — Task 9
- ✅ Research chat with bubble UI — Task 9
- ✅ "Copy to Documents" button — Task 9
- ✅ Multi-document manager with tabs — Task 10
- ✅ Document archive (X button) — Task 10
- ✅ Document rename (double-click) — Task 10
- ✅ AI helper buttons (Polish/Shorten/Brainstorm/Insert Clause) — Task 10
- ✅ Debate Q&A with role column — Task 11
- ✅ Speech Practice with recording + text input — Task 11
- ✅ Speech evaluation with scores — Task 11
- ✅ Google STT proxy — Task 6
- ✅ 7 Netlify functions all using DeepSeek — Task 6
- ✅ Remove all Gemini code — Task 13
- ✅ Settings stripped to logout only — Task 12
- ✅ Remove "Load Demo Data" — Task 12 (omitted)
- ✅ Remove Export/Import/Clear — Task 12 (omitted)
- ✅ Environment variables updated (no GEMINI) — Task 1
- ✅ RLS instructions (SQL in deliverable docs)

**Placeholder scan:** No TBD, TODO, or "implement later" patterns.

**Type consistency:** Types defined in Task 1 match usage across all subsequent tasks. `CheatSheetJson`, `Document`, `DebateQA`, `ResearchChatMessage`, `SpeechEvaluation` all consistent.

**Missing pieces:**
- Need to provide Supabase SQL for table creation + RLS policies
- Need to create stripped constants.ts
- The `useSettings` removal means deleting the file

---

**Plan complete and saved.** Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
