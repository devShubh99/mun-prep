# MUN Prep Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete MUN preparation web app with dashboard, cheat sheet, debate simulator, document workshop, and settings.

**Architecture:** Vite + React 18 + TypeScript + Tailwind CSS SPA, localStorage persistence, Netlify Functions as Gemini API proxy. React Router v6 for routing, TipTap for rich text editing.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, React Router v6, TipTap, Lucide React, date-fns, Netlify Functions, Google Gemini API, Vitest

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `netlify.toml`
- Create: `.env.example`
- Create: `src/vite-env.d.ts`
- Create: `src/main.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "mun-prep-companion",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@tiptap/extension-bullet-list": "^2.11.5",
    "@tiptap/extension-heading": "^2.11.5",
    "@tiptap/extension-ordered-list": "^2.11.5",
    "@tiptap/extension-underline": "^2.11.5",
    "@tiptap/pm": "^2.11.5",
    "@tiptap/react": "^2.11.5",
    "@tiptap/starter-kit": "^2.11.5",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.15",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.6.3",
    "vite": "^6.0.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 5: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

- [ ] **Step 6: Create postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MUN Prep Companion</title>
  </head>
  <body class="bg-gray-50 text-gray-900 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

- [ ] **Step 9: Create .env.example**

```
GEMINI_API_KEY=your_gemini_api_key_here
```

- [ ] **Step 10: Create src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 11: Create src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 12: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none;
  }
  .btn-primary {
    @apply btn bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500;
  }
  .btn-secondary {
    @apply btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-accent-500;
  }
  .btn-danger {
    @apply btn bg-red-500 text-white hover:bg-red-600 focus:ring-red-500;
  }
  .btn-ghost {
    @apply btn text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-accent-500;
  }
  .input {
    @apply block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500;
  }
  .card {
    @apply bg-white rounded-xl border border-gray-200 shadow-sm;
  }
  .badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;
  }
}
```

- [ ] **Step 13: Install dependencies**

Run: `npm install`
Expected: node_modules created, lockfile generated

- [ ] **Step 14: Verify build**

Run: `npm run build`
Expected: dist/ directory created with index.html and assets

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create src/types/index.ts**

```ts
export type DebateRole = 'UfC' | 'G4' | 'Chair' | 'Swing' | 'Journalist';

export const DEBATE_ROLES: { value: DebateRole; label: string }[] = [
  { value: 'UfC', label: 'UfC (Opponent)' },
  { value: 'G4', label: 'G4 (Ally)' },
  { value: 'Chair', label: 'Chair (Moderator)' },
  { value: 'Swing', label: 'Swing (Nordic)' },
  { value: 'Journalist', label: 'Journalist' },
];

export interface CheatSheet {
  flagColors: string;
  population: string;
  gdp: string;
  povertyRate: string;
  headOfState: string;
  mandate: string;
  coreDemands: string;
  redLines: string;
  allies: string;
  foes: string;
  keyPhrases: string;
}

export const CHEAT_SHEET_FIELDS: { key: keyof CheatSheet; label: string }[] = [
  { key: 'flagColors', label: 'Flag Colors' },
  { key: 'population', label: 'Population' },
  { key: 'gdp', label: 'GDP' },
  { key: 'povertyRate', label: 'Poverty Rate' },
  { key: 'headOfState', label: 'Head of State' },
  { key: 'mandate', label: 'Mandate' },
  { key: 'coreDemands', label: 'Core Demands' },
  { key: 'redLines', label: 'Red Lines' },
  { key: 'allies', label: 'Allies' },
  { key: 'foes', label: 'Foes' },
  { key: 'keyPhrases', label: 'Key Phrases' },
];

export interface DebateFeedback {
  argumentScore: number;
  diplomacyScore: number;
  compliment: string;
  improvement: string;
  modelRebuttal: string;
}

export interface DebateEntry {
  id: string;
  role: DebateRole;
  question: string;
  answer: string;
  feedback: DebateFeedback | null;
  timestamp: number;
}

export interface Documents {
  openingSpeech: string;
  positionPaper: string;
  workingClauses: string;
  caucusNotes: string;
}

export const DOCUMENT_TABS: { key: keyof Documents; label: string }[] = [
  { key: 'openingSpeech', label: 'Opening Speech' },
  { key: 'positionPaper', label: 'Position Paper' },
  { key: 'workingClauses', label: 'Working Clauses' },
  { key: 'caucusNotes', label: 'Caucus Notes' },
];

export const WORD_COUNT_TARGETS: Record<keyof Documents, { min: number; max: number } | null> = {
  openingSpeech: { min: 150, max: 200 },
  positionPaper: { min: 500, max: 800 },
  workingClauses: null,
  caucusNotes: { min: 50, max: 70 },
};

export interface Conference {
  id: string;
  name: string;
  committee: string;
  topic: string;
  assignedCountry: string;
  deadline: string;
  cheatSheet: CheatSheet;
  documents: Documents;
  debateHistory: DebateEntry[];
}

export interface AppData {
  conferences: Conference[];
  activeConferenceId: string | null;
}

export const STORAGE_KEY = 'mun_prep_app_data';
```

- [ ] **Step 2: Create src/lib/constants.ts**

```ts
import type { CheatSheet, Conference } from '@/types';

export const SIERRA_LEONE_CHEAT_SHEET: CheatSheet = {
  flagColors: 'Green, white, blue',
  population: '8.6 million (2023)',
  gdp: '$4.2 billion USD',
  povertyRate: '56.8%',
  headOfState: 'President Julius Maada Bio',
  mandate: 'Post-conflict recovery, sustainable development, human rights protection',
  coreDemands: 'Debt relief, climate justice funding, equitable vaccine access',
  redLines: 'Cannot accept conditions that compromise national sovereignty over natural resources',
  allies: 'ECOWAS member states, African Union, Least Developed Countries bloc',
  foes: 'Major powers pushing conditional aid, extractive industries opposing regulation',
  keyPhrases: 'Bridging the digital divide, common but differentiated responsibilities, leaving no one behind',
};

export const DEFAULT_DOCUMENTS = {
  openingSpeech: '<h3>Opening Speech</h3><p>Start drafting your opening speech here...</p>',
  positionPaper: '<h3>Position Paper</h3><p>Start drafting your position paper here...</p>',
  workingClauses: '<h3>Working Clauses</h3><p>Start drafting your working clauses here...</p>',
  caucusNotes: '<h3>Caucus Notes</h3><p>Start drafting your caucus notes here...</p>',
};

export function createDefaultConference(overrides?: Partial<Conference>): Conference {
  return {
    id: crypto.randomUUID(),
    name: '',
    committee: '',
    topic: '',
    assignedCountry: '',
    deadline: '',
    cheatSheet: { ...SIERRA_LEONE_CHEAT_SHEET },
    documents: { ...DEFAULT_DOCUMENTS },
    debateHistory: [],
    ...overrides,
  };
}

export function createEmptyAppData(): { conferences: []; activeConferenceId: null } {
  return { conferences: [], activeConferenceId: null };
}
```

- [ ] **Step 3: Create src/lib/utils.ts**

```ts
import { formatDistanceToNow, parseISO, isBefore } from 'date-fns';

export function daysUntil(deadline: string): number | null {
  if (!deadline) return null;
  const deadlineDate = parseISO(deadline);
  const now = new Date();
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function wordCount(html: string): number {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || div.innerText || '';
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function deadlineColor(days: number | null): string {
  if (days === null) return 'text-gray-400';
  if (days < 0) return 'text-red-600';
  if (days <= 7) return 'text-red-500';
  if (days <= 14) return 'text-yellow-600';
  return 'text-green-600';
}

export function formatDeadline(deadline: string): string {
  if (!deadline) return 'No deadline set';
  const days = daysUntil(deadline);
  if (days === null) return 'No deadline set';
  if (days < 0) return 'Past deadline';
  if (days === 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'}`;
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

---

### Task 3: localStorage Hooks

**Files:**
- Create: `src/hooks/useLocalStorage.ts`
- Create: `src/hooks/useAutoSave.ts`
- Create: `src/hooks/useConference.tsx`

- [ ] **Step 1: Create src/hooks/useLocalStorage.ts**

```ts
import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
```

- [ ] **Step 2: Create src/hooks/useAutoSave.ts**

```ts
import { useEffect, useRef } from 'react';

export function useAutoSave(value: string, onSave: (value: string) => void, delay = 2000) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => onSave(value), delay);
    return () => clearTimeout(timer);
  }, [value, onSave, delay]);
}
```

- [ ] **Step 3: Create src/hooks/useConference.tsx**

```tsx
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { Conference } from '@/types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEY, type AppData, createEmptyAppData } from '@/types';

interface ConferenceContextValue {
  conference: Conference | null;
  conferenceId: string | null;
  updateConference: (partial: Partial<Conference>) => void;
  allConferences: Conference[];
  setAllConferences: (conferences: Conference[] | ((prev: Conference[]) => Conference[])) => void;
  setActiveConferenceId: (id: string | null) => void;
}

const ConferenceContext = createContext<ConferenceContextValue | null>(null);

export function ConferenceProvider({ children }: { children: React.ReactNode }) {
  const [appData, setAppData] = useLocalStorage<AppData>(STORAGE_KEY, createEmptyAppData());

  const conference = useMemo(
    () => appData.conferences.find((c) => c.id === appData.activeConferenceId) ?? null,
    [appData.conferences, appData.activeConferenceId],
  );

  const setActiveConferenceId = useCallback(
    (id: string | null) => {
      setAppData((prev) => ({ ...prev, activeConferenceId: id }));
    },
    [setAppData],
  );

  const updateConference = useCallback(
    (partial: Partial<Conference>) => {
      setAppData((prev) => ({
        ...prev,
        conferences: prev.conferences.map((c) =>
          c.id === prev.activeConferenceId ? { ...c, ...partial } : c,
        ),
      }));
    },
    [setAppData],
  );

  const setAllConferences = useCallback(
    (conferences: Conference[] | ((prev: Conference[]) => Conference[])) => {
      setAppData((prev) => ({
        ...prev,
        conferences: conferences instanceof Function ? conferences(prev.conferences) : conferences,
      }));
    },
    [setAppData],
  );

  return (
    <ConferenceContext.Provider
      value={{
        conference,
        conferenceId: appData.activeConferenceId,
        updateConference,
        allConferences: appData.conferences,
        setAllConferences,
        setActiveConferenceId,
      }}
    >
      {children}
    </ConferenceContext.Provider>
  );
}

export function useConference(): ConferenceContextValue {
  const context = useContext(ConferenceContext);
  if (!context) throw new Error('useConference must be used within ConferenceProvider');
  return context;
}
```

- [ ] **Step 4: Verify hooks compile**

Run: `npx tsc --noEmit`
Expected: No type errors

---

### Task 4: Layout & Navigation

**Files:**
- Create: `src/components/Layout.tsx`
- Create: `src/pages/Settings.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Create src/components/Layout.tsx**

```tsx
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, Plus, Globe } from 'lucide-react';
import { useConference } from '@/hooks/useConference';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conference } = useConference();
  const isInConference = location.pathname.startsWith('/conference/');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isInConference ? (
              <>
                <button
                  onClick={() => navigate('/')}
                  className="btn-ghost p-1.5 -ml-1.5 shrink-0"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Link to="/" className="text-gray-500 hover:text-gray-700 whitespace-nowrap">
                    Dashboard
                  </Link>
                  <span className="text-gray-300 shrink-0">/</span>
                  <span className="font-medium text-gray-900 truncate">
                    {conference?.name || 'Conference'}
                  </span>
                </div>
              </>
            ) : (
              <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Globe className="w-6 h-6 text-accent-500" />
                MUN Prep
              </Link>
            )}
          </div>
          <Link to="/settings" className="btn-ghost p-2" aria-label="Settings">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create src/App.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import ConferenceWorkspace from '@/pages/ConferenceWorkspace';
import CheatSheet from '@/modules/cheat-sheet/CheatSheet';
import DebateSimulator from '@/modules/debate/DebateSimulator';
import DocumentWorkshop from '@/modules/documents/DocumentWorkshop';
import { ConferenceProvider } from '@/hooks/useConference';

export default function App() {
  return (
    <ConferenceProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="conference/:id" element={<ConferenceWorkspace />}>
            <Route index element={<Navigate to="cheat-sheet" replace />} />
            <Route path="cheat-sheet" element={<CheatSheet />} />
            <Route path="debate" element={<DebateSimulator />} />
            <Route path="documents" element={<DocumentWorkshop />} />
          </Route>
        </Route>
      </Routes>
    </ConferenceProvider>
  );
}
```

---

### Task 5: Dashboard

**Files:**
- Create: `src/components/ConferenceCard.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Create src/components/ConferenceCard.tsx**

```tsx
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import type { Conference } from '@/types';
import { deadlineColor, formatDeadline } from '@/lib/utils';

interface Props {
  conference: Conference;
  onEdit: (conf: Conference) => void;
  onDelete: (id: string) => void;
}

export default function ConferenceCard({ conference, onEdit, onDelete }: Props) {
  const navigate = useNavigate();
  const flagEmoji = conference.assignedCountry
    ? String.fromCodePoint(...[...conference.assignedCountry.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : '';

  return (
    <div
      className="card p-5 cursor-pointer hover:shadow-md hover:border-accent-300 transition-all border-l-4 border-l-accent-500"
      onClick={() => navigate(`/conference/${conference.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{conference.name || 'Untitled Conference'}</h3>
          {conference.assignedCountry && (
            <p className="text-sm text-gray-500 mt-1">
              {flagEmoji} {conference.assignedCountry}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button className="btn-ghost p-1.5" onClick={() => onEdit(conference)} aria-label="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button className="btn-ghost p-1.5 text-red-500 hover:text-red-600" onClick={() => onDelete(conference.id)} aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        {conference.committee && <span className="badge bg-gray-100 text-gray-600">{conference.committee}</span>}
        <span className={`text-xs font-medium ${deadlineColor(0)}`}>
          {formatDeadline(conference.deadline)}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/EmptyState.tsx**

```tsx
import { Globe } from 'lucide-react';

interface Props {
  onCreate: () => void;
}

export default function EmptyState({ onCreate }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mb-4">
        <Globe className="w-8 h-8 text-accent-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No conferences yet</h2>
      <p className="text-gray-500 mb-6 max-w-sm">
        Create your first conference to start preparing. Add your committee, country, and deadline.
      </p>
      <button onClick={onCreate} className="btn-primary">
        Create Your First Conference
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create src/pages/Dashboard.tsx**

```tsx
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ConferenceCard from '@/components/ConferenceCard';
import EmptyState from '@/components/EmptyState';
import ConferenceFormModal from '@/components/ConferenceFormModal';
import { useConference } from '@/hooks/useConference';
import { createDefaultConference } from '@/lib/constants';
import type { Conference } from '@/types';

export default function Dashboard() {
  const { allConferences, setAllConferences } = useConference();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConference, setEditingConference] = useState<Conference | null>(null);

  const filtered = allConferences.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.assignedCountry.toLowerCase().includes(search.toLowerCase()) ||
      c.committee.toLowerCase().includes(search.toLowerCase()),
  );

  function handleCreate() {
    const conf = createDefaultConference();
    setAllConferences((prev) => [...prev, conf]);
    setEditingConference(conf);
    setModalOpen(true);
  }

  function handleEdit(conf: Conference) {
    setEditingConference(conf);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this conference? This cannot be undone.')) {
      setAllConferences((prev) => prev.filter((c) => c.id !== id));
    }
  }

  function handleSave(updated: Conference) {
    setAllConferences((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setModalOpen(false);
    setEditingConference(null);
  }

  if (allConferences.length === 0) {
    return <EmptyState onCreate={handleCreate} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conferences..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Conference
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No conferences match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((conf) => (
            <ConferenceCard key={conf.id} conference={conf} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modalOpen && editingConference && (
        <ConferenceFormModal
          conference={editingConference}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingConference(null);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create src/components/ConferenceFormModal.tsx**

```tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import type { Conference } from '@/types';

interface Props {
  conference: Conference;
  onSave: (conf: Conference) => void;
  onClose: () => void;
}

export default function ConferenceFormModal({ conference, onSave, onClose }: Props) {
  const [form, setForm] = useState({ ...conference });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{conference.name ? 'Edit Conference' : 'New Conference'}</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conference Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. UNHRC — Rohingya Crisis"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
              <input className="input" value={form.committee} onChange={(e) => setForm({ ...form, committee: e.target.value })} placeholder="e.g. UNHRC" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Country</label>
              <input className="input" value={form.assignedCountry} onChange={(e) => setForm({ ...form, assignedCountry: e.target.value })} placeholder="e.g. Bangladesh" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Rohingya Crisis" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### Task 6: Conference Workspace Tabs

**Files:**
- Create: `src/pages/ConferenceWorkspace.tsx`

- [ ] **Step 1: Create src/pages/ConferenceWorkspace.tsx**

```tsx
import { useEffect } from 'react';
import { NavLink, Outlet, Navigate, useParams } from 'react-router-dom';
import { FileText, MessageSquare, BookOpen } from 'lucide-react';
import { useConference } from '@/hooks/useConference';

const tabs = [
  { path: 'cheat-sheet', label: 'Cheat Sheet', icon: BookOpen },
  { path: 'debate', label: 'Debate Simulator', icon: MessageSquare },
  { path: 'documents', label: 'Document Workshop', icon: FileText },
];

export default function ConferenceWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { conference, setActiveConferenceId } = useConference();

  useEffect(() => {
    if (id) setActiveConferenceId(id);
  }, [id, setActiveConferenceId]);

  if (!conference) return <Navigate to="/" replace />;

  return (
    <div>
      <div className="mb-1">
        <h1 className="text-xl font-bold text-gray-900">{conference.name}</h1>
        {conference.committee && (
          <p className="text-sm text-gray-500 mt-0.5">
            {conference.assignedCountry && `${conference.assignedCountry} · `}
            {conference.committee}
            {conference.topic && ` · ${conference.topic}`}
          </p>
        )}
      </div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-accent-500 text-accent-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
```

---

### Task 7: Cheat Sheet Module

**Files:**
- Create: `src/modules/cheat-sheet/CheatSheet.tsx`

- [ ] **Step 1: Create src/modules/cheat-sheet/CheatSheet.tsx**

```tsx
import { useState } from 'react';
import { Pencil, FileDown, RotateCcw, Printer } from 'lucide-react';
import { useConference } from '@/hooks/useConference';
import { CHEAT_SHEET_FIELDS } from '@/types';
import { SIERRA_LEONE_CHEAT_SHEET } from '@/lib/constants';

export default function CheatSheet() {
  const { conference, updateConference } = useConference();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conference?.cheatSheet);

  if (!conference || !draft) return null;

  function handleSave() {
    updateConference({ cheatSheet: draft });
    setEditing(false);
  }

  function handleReset() {
    if (confirm('Reset cheat sheet to Sierra Leone template?')) {
      setDraft(SIERRA_LEONE_CHEAT_SHEET);
      updateConference({ cheatSheet: SIERRA_LEONE_CHEAT_SHEET });
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 print:hidden">
        {editing ? (
          <>
            <button onClick={handleSave} className="btn-primary">Save Changes</button>
            <button onClick={() => { setDraft(conference.cheatSheet); setEditing(false); }} className="btn-secondary">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="btn-primary">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button onClick={handleReset} className="btn-secondary">
              <RotateCcw className="w-4 h-4" /> Reset to Sierra Leone
            </button>
            <button onClick={() => window.print()} className="btn-secondary">
              <Printer className="w-4 h-4" /> Print
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHEAT_SHEET_FIELDS.map(({ key, label }) => (
          <div key={key} className="card p-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
            {editing ? (
              <textarea
                className="input min-h-[60px] resize-y"
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{draft[key] || '—'}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 8: API Client & Netlify Functions

**Files:**
- Create: `src/lib/api.ts`
- Create: `netlify/functions/generate-question.ts`
- Create: `netlify/functions/evaluate-answer.ts`
- Create: `netlify/functions/document-ai.ts`

- [ ] **Step 1: Create src/lib/api.ts**

```ts
import type { DebateRole, CheatSheet, DebateFeedback } from '@/types';

const BASE = '/api';

export async function generateQuestion(role: DebateRole, topic: string, cheatSheet: CheatSheet): Promise<string> {
  const res = await fetch(`${BASE}/generate-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, topic, mandate: cheatSheet.mandate, coreDemands: cheatSheet.coreDemands }),
  });
  if (!res.ok) throw new Error('Failed to generate question');
  const text = await res.text();
  return text;
}

export async function evaluateAnswer(
  role: DebateRole,
  question: string,
  answer: string,
  cheatSheet: CheatSheet,
): Promise<DebateFeedback> {
  const res = await fetch(`${BASE}/evaluate-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, question, answer, mandate: cheatSheet.mandate, coreDemands: cheatSheet.coreDemands }),
  });
  if (!res.ok) throw new Error('Failed to evaluate answer');
  return res.json();
}

export async function documentAi(
  action: 'polish' | 'shorten' | 'brainstorm' | 'insert-clause',
  documentType: string,
  content: string,
  keyPhrases?: string,
  targetWordCount?: number,
): Promise<string> {
  const res = await fetch(`${BASE}/document-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, documentType, content, keyPhrases, targetWordCount }),
  });
  if (!res.ok) throw new Error('Failed to process document');
  return res.text();
}
```

- [ ] **Step 2: Create netlify/functions/generate-question.ts**

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Event {
  body: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const handler = async (event: Event) => {
  try {
    const { role, mandate, coreDemands, topic } = JSON.parse(event.body);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a delegate in a MUN committee on "${topic}". 
You are representing the role of "${role}".
The delegate you are questioning represents a country whose mandate is "${mandate}" 
and core demands include "${coreDemands}".

Generate a short, realistic, diplomatic question (max 30 words) that challenges their position. 
The question should be specific and research-based, as if asked in an actual MUN committee session.
Return ONLY the question, nothing else.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate question' }),
    };
  }
};
```

- [ ] **Step 3: Create netlify/functions/evaluate-answer.ts**

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Event {
  body: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const handler = async (event: Event) => {
  try {
    const { role, question, answer, mandate, coreDemands } = JSON.parse(event.body);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a MUN chair evaluating a delegate's answer.

The delegate represents a country with mandate: "${mandate}" and core demands: "${coreDemands}".
The question was: "${question}"
The answer was: "${answer}"

Provide feedback in this exact JSON format. Do NOT include markdown formatting, code blocks, or any text outside the JSON:
{
  "argumentScore": <1-5>,
  "diplomacyScore": <1-5>,
  "compliment": "<specific positive feedback about what they did well>",
  "improvement": "<specific area to improve>",
  "modelRebuttal": "<2-3 sentence example of a stronger answer>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const feedback = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to evaluate answer' }),
    };
  }
};
```

- [ ] **Step 4: Create netlify/functions/document-ai.ts**

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Event {
  body: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const handler = async (event: Event) => {
  try {
    const { action, documentType, content, keyPhrases, targetWordCount } = JSON.parse(event.body);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    let prompt = '';

    switch (action) {
      case 'polish':
        prompt = `Improve grammar and flow of this ${documentType} for a MUN conference.${keyPhrases ? ` Naturally inject these key phrases where relevant: "${keyPhrases}".` : ''}
Return the polished text as plain text. No markdown or HTML.

Content:
${content}`;
        break;
      case 'shorten':
        prompt = `Condense this ${documentType} to approximately ${targetWordCount} words while preserving key arguments.
Return the shortened text as plain text. No markdown or HTML.

Content:
${content}`;
        break;
      case 'brainstorm':
        prompt = `Generate 3 alternative openings or arguments for a MUN ${documentType} on this topic. Each should be distinct and persuasive.
Use plain text only, no markdown or HTML. Number each option (1., 2., 3.).

Current content for context:
${content}`;
        break;
      case 'insert-clause':
        prompt = `Generate a standard MUN working clause suitable for this ${documentType}. Include an operative clause with proper formatting (e.g., "1. Calls upon...", "2. Encourages...").
Return as plain text. No markdown or HTML.

Topic context:
${content}`;
        break;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process document' }),
    };
  }
};
```

- [ ] **Step 5: Create package.json for Netlify functions**

Create `netlify/functions/package.json`:
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0"
  }
}
```

Run: `cd netlify/functions && npm install`

---

### Task 9: Debate Simulator Module

**Files:**
- Create: `src/modules/debate/DebateSimulator.tsx`
- Create: `src/modules/debate/QuestionPanel.tsx`
- Create: `src/modules/debate/FeedbackDisplay.tsx`
- Create: `src/modules/debate/DebateHistory.tsx`

- [ ] **Step 1: Create src/modules/debate/DebateSimulator.tsx**

```tsx
import { useState, useCallback } from 'react';
import { MessageSquare, History, Loader2, ChevronDown } from 'lucide-react';
import { useConference } from '@/hooks/useConference';
import { DEBATE_ROLES, type DebateRole, type DebateEntry } from '@/types';
import { generateQuestion, evaluateAnswer } from '@/lib/api';
import FeedbackDisplay from './FeedbackDisplay';
import DebateHistory from './DebateHistory';

export default function DebateSimulator() {
  const { conference, updateConference } = useConference();
  const [role, setRole] = useState<DebateRole>('UfC');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<DebateEntry['feedback']>(null);
  const [loading, setLoading] = useState<'question' | 'answer' | null>(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

  const handleAskQuestion = useCallback(async () => {
    if (!conference) return;
    setLoading('question');
    setError('');
    setFeedback(null);
    setAnswer('');
    setCurrentEntryId(null);
    try {
      const q = await generateQuestion(role, conference.topic, conference.cheatSheet);
      setQuestion(q);
      const entryId = crypto.randomUUID();
      setCurrentEntryId(entryId);
      setAnswer('');
    } catch {
      setError('Failed to generate question. Check your connection and try again.');
    } finally {
      setLoading(null);
    }
  }, [conference, role]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!conference || !currentEntryId || !answer.trim()) return;
    setLoading('answer');
    setError('');
    try {
      const fb = await evaluateAnswer(role, question, answer, conference.cheatSheet);
      setFeedback(fb);
      const entry: DebateEntry = {
        id: currentEntryId,
        role,
        question,
        answer,
        feedback: fb,
        timestamp: Date.now(),
      };
      updateConference({
        debateHistory: [...conference.debateHistory, entry],
      });
    } catch {
      setError('Failed to evaluate answer. Check your connection and try again.');
    } finally {
      setLoading(null);
    }
  }, [conference, currentEntryId, answer, role, question, updateConference]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      if (!feedback && answer.trim()) handleSubmitAnswer();
    }
  }

  function handleNewDebate() {
    setQuestion('');
    setAnswer('');
    setFeedback(null);
    setCurrentEntryId(null);
    setError('');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Role:</label>
          <div className="relative">
            <select
              className="input pr-8 appearance-none bg-white"
              value={role}
              onChange={(e) => { setRole(e.target.value as DebateRole); handleNewDebate(); }}
            >
              {DEBATE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className="btn-ghost text-sm">
          <History className="w-4 h-4" />
          {showHistory ? 'Back to Simulator' : 'History'}
        </button>
      </div>

      {showHistory ? (
        <DebateHistory entries={conference?.debateHistory || []} />
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleAskQuestion}
            disabled={loading !== null}
            className="btn-primary w-full"
          >
            {loading === 'question' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating question...</>
            ) : (
              <><MessageSquare className="w-4 h-4" /> Ask Question</>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          {question && (
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-accent-600 uppercase tracking-wider mb-1">Question ({role})</p>
              <p className="text-gray-900">{question}</p>
            </div>
          )}

          {question && !feedback && (
            <>
              <textarea
                className="input min-h-[120px] resize-y"
                placeholder="Type your answer as if speaking in committee... (Enter to submit, Shift+Enter for newline)"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading === 'answer'}
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={loading !== null || !answer.trim()}
                className="btn-primary w-full"
              >
                {loading === 'answer' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
                ) : (
                  'Submit Answer'
                )}
              </button>
            </>
          )}

          {feedback && (
            <>
              <FeedbackDisplay feedback={feedback} />
              <button onClick={handleNewDebate} className="btn-primary w-full">
                <MessageSquare className="w-4 h-4" /> New Question
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create src/modules/debate/FeedbackDisplay.tsx**

```tsx
import { Star } from 'lucide-react';
import type { DebateFeedback } from '@/types';

interface Props {
  feedback: DebateFeedback;
}

function StarRating({ score, label }: { score: number; label: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function FeedbackDisplay({ feedback }: Props) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Feedback</h3>
      <div className="flex gap-6">
        <StarRating score={feedback.argumentScore} label="Argument" />
        <StarRating score={feedback.diplomacyScore} label="Diplomacy" />
      </div>
      <div>
        <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Compliment</p>
        <p className="text-sm text-gray-700">{feedback.compliment}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">Improvement</p>
        <p className="text-sm text-gray-700">{feedback.improvement}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-accent-600 uppercase tracking-wider mb-1">Model Rebuttal</p>
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-3">
          <p className="text-sm text-gray-700">{feedback.modelRebuttal}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create src/modules/debate/DebateHistory.tsx**

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import type { DebateEntry } from '@/types';
import FeedbackDisplay from './FeedbackDisplay';

interface Props {
  entries: DebateEntry[];
}

export default function DebateHistory({ entries }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageSquare className="w-8 h-8 mx-auto mb-3 text-gray-300" />
        <p>No practice sessions yet. Start a debate to see history here.</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-3">
      {sorted.map((entry) => (
        <div key={entry.id} className="card">
          <button
            className="w-full flex items-center justify-between p-4 text-left"
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="badge bg-accent-100 text-accent-700">{entry.role}</span>
                <span className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1 truncate">{entry.question}</p>
            </div>
            {expandedId === entry.id ? (
              <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            )}
          </button>
          {expandedId === entry.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Your Answer</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{entry.answer}</p>
              </div>
              {entry.feedback && <FeedbackDisplay feedback={entry.feedback} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript for debate module**

Run: `npx tsc --noEmit`
Expected: No type errors

---

### Task 10: Document Workshop Module

**Files:**
- Create: `src/modules/documents/RichTextEditor.tsx`
- Create: `src/modules/documents/DocumentWorkshop.tsx`

- [ ] **Step 1: Create src/modules/documents/RichTextEditor.tsx**

```tsx
import { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading3 } from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-accent-100 text-accent-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet List">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Ordered List">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="Heading">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none" />
    </div>
  );
}
```

- [ ] **Step 2: Create src/modules/documents/DocumentWorkshop.tsx**

```tsx
import { useState, useCallback } from 'react';
import { Sparkles, Scissors, Lightbulb, FilePlus, Loader2, Check } from 'lucide-react';
import { useConference } from '@/hooks/useConference';
import { DOCUMENT_TABS, WORD_COUNT_TARGETS, type Documents } from '@/types';
import { documentAi } from '@/lib/api';
import { wordCount } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import RichTextEditor from './RichTextEditor';

export default function DocumentWorkshop() {
  const { conference, updateConference } = useConference();
  const [activeTab, setActiveTab] = useState<keyof Documents>('openingSpeech');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!conference) return null;

  const content = conference.documents[activeTab];
  const target = WORD_COUNT_TARGETS[activeTab];

  function handleContentChange(html: string) {
    updateConference({
      documents: { ...conference.documents, [activeTab]: html },
    });
  }

  const handleAutoSave = useCallback(
    (html: string) => {
      setSaving(true);
      updateConference({
        documents: { ...conference.documents, [activeTab]: html },
      });
      setTimeout(() => setSaving(false), 500);
    },
    [activeTab, conference.documents, updateConference],
  );

  useAutoSave(content, handleAutoSave);

  async function handleAiAction(action: 'polish' | 'shorten' | 'brainstorm' | 'insert-clause') {
    setAiLoading(action);
    try {
      const wc = wordCount(content);
      const result = await documentAi(
        action,
        activeTab,
        content,
        conference.cheatSheet.keyPhrases,
        target ? Math.round((target.min + target.max) / 2) : undefined,
      );
      if (action === 'brainstorm') {
        const newContent = content + `<p><br></p><hr><p><strong>AI Suggestions:</strong></p><p>${result.replace(/\n/g, '<br>')}</p>`;
        handleContentChange(newContent);
      } else if (action === 'insert-clause') {
        const newContent = content + `<p><br></p><p>${result.replace(/\n/g, '<br>')}</p>`;
        handleContentChange(newContent);
      } else {
        handleContentChange(`<p>${result.replace(/\n/g, '<br>')}</p>`);
      }
    } catch {
      alert('AI action failed. Please try again.');
    } finally {
      setAiLoading(null);
    }
  }

  const count = wordCount(content);
  let wordCountColor = 'text-gray-500';
  if (target) {
    if (count < target.min * 0.8) wordCountColor = 'text-amber-500';
    else if (count >= target.min && count <= target.max) wordCountColor = 'text-green-600';
    else if (count > target.max) wordCountColor = 'text-red-500';
    else wordCountColor = 'text-amber-500';
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {DOCUMENT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className={`text-xs font-medium ${wordCountColor}`}>
          {count} words
          {target && ` (target: ${target.min}-${target.max})`}
        </span>
      </div>

      <RichTextEditor content={content} onChange={handleContentChange} />

      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => handleAiAction('polish')} disabled={aiLoading !== null} className="btn-secondary text-xs">
          {aiLoading === 'polish' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Polish
        </button>
        <button onClick={() => handleAiAction('shorten')} disabled={aiLoading !== null} className="btn-secondary text-xs">
          {aiLoading === 'shorten' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scissors className="w-3 h-3" />}
          Shorten
        </button>
        <button onClick={() => handleAiAction('brainstorm')} disabled={aiLoading !== null} className="btn-secondary text-xs">
          {aiLoading === 'brainstorm' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
          Brainstorm
        </button>
        <button onClick={() => handleAiAction('insert-clause')} disabled={aiLoading !== null} className="btn-secondary text-xs">
          {aiLoading === 'insert-clause' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FilePlus className="w-3 h-3" />}
          Insert Clause
        </button>
        <div className="flex-1" />
        {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
      </div>
    </div>
  );
}
```

---

### Task 11: Settings Page

**Files:**
- Create: `src/pages/Settings.tsx`

- [ ] **Step 1: Create src/pages/Settings.tsx**

```tsx
import { useRef } from 'react';
import { Download, Upload, Trash2, RotateCcw } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEY, type AppData, type Conference, createEmptyAppData } from '@/types';
import { createDefaultConference } from '@/lib/constants';
import { downloadJson } from '@/lib/utils';

export default function Settings() {
  const [appData, setAppData] = useLocalStorage<AppData>(STORAGE_KEY, createEmptyAppData());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModeRef = useRef<'replace' | 'merge'>('replace');

  function handleExport() {
    downloadJson(appData, 'mun_prep_app_data.json');
  }

  function handleImport() {
    const mode = confirm('Click OK to replace all data, Cancel to merge (adds non-conflicting conferences).');
    importModeRef.current = mode ? 'replace' : 'merge';
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.conferences || !Array.isArray(data.conferences)) {
          alert('Invalid file format. Expected a JSON object with a "conferences" array.');
          return;
        }
        if (importModeRef.current === 'replace') {
          setAppData({ conferences: data.conferences, activeConferenceId: null });
        } else {
          setAppData((prev) => {
            const existingIds = new Set(prev.conferences.map((c) => c.id));
            const newConfs = data.conferences.filter((c: Conference) => !existingIds.has(c.id));
            return { ...prev, conferences: [...prev.conferences, ...newConfs] };
          });
        }
        alert(`Import successful! ${importModeRef.current === 'replace' ? 'Data replaced.' : `${data.conferences.length} conferences merged.`}`);
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleClear() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      setAppData(createEmptyAppData());
    }
  }

  function handleDemoData() {
    if (confirm('Load demo data? This will replace your current data.')) {
      const demo: Conference = {
        ...createDefaultConference(),
        name: 'UNHRC — Rohingya Crisis',
        committee: 'UNHRC',
        topic: 'Rohingya Crisis',
        assignedCountry: 'Bangladesh',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cheatSheet: {
          flagColors: 'Green, white, blue',
          population: '8.6 million (2023)',
          gdp: '$4.2 billion USD',
          povertyRate: '56.8%',
          headOfState: 'President Julius Maada Bio',
          mandate: 'Post-conflict recovery, sustainable development, human rights protection',
          coreDemands: 'Debt relief, climate justice funding, equitable vaccine access',
          redLines: 'Cannot accept conditions that compromise national sovereignty over natural resources',
          allies: 'ECOWAS member states, African Union, Least Developed Countries bloc',
          foes: 'Major powers pushing conditional aid, extractive industries opposing regulation',
          keyPhrases: 'Bridging the digital divide, common but differentiated responsibilities, leaving no one behind',
        },
      };
      setAppData({ conferences: [demo], activeConferenceId: null });
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="space-y-3">
        <button onClick={handleExport} className="btn-secondary w-full justify-start">
          <Download className="w-4 h-4" /> Export Data as JSON
        </button>
        <button onClick={handleImport} className="btn-secondary w-full justify-start">
          <Upload className="w-4 h-4" /> Import Data from JSON
        </button>
        <button onClick={handleDemoData} className="btn-secondary w-full justify-start">
          <RotateCcw className="w-4 h-4" /> Load Demo Data (Sierra Leone)
        </button>
        <button onClick={handleClear} className="btn-danger w-full justify-start">
          <Trash2 className="w-4 h-4" /> Clear All Data
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
```

---

### Task 12: README & Final Build Verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```md
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, `dist/` directory generated with `index.html`

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

---

## Self-Review Checklist

- [ ] **Spec coverage**: Every module in the spec has a corresponding task
  - Dashboard → Task 5
  - Cheat Sheet → Task 7
  - Debate Simulator → Task 9
  - Document Workshop → Task 10
  - Settings → Task 11
  - Netlify Functions → Task 8
  - Types → Task 2
  - Hooks → Task 3
  - Layout/Navigation → Task 4
  - Scaffolding → Task 1

- [ ] **Placeholder scan**: No "TBD", "TODO", or incomplete code blocks

- [ ] **Type consistency**: Conference, CheatSheet, Documents, DebateEntry types used consistently across all tasks. API wrappers in Task 8 match the function signatures expected by modules in Tasks 9 and 10.

- [ ] **Word count targets** in DocumentWorkshop match spec (150-200, 500-800, none, 50-70)

- [ ] **Toolbar grouping** matches spec: Bold|Italic|Underline — Bullet|Ordered — Heading
