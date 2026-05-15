# MUN Prep Companion — Design Spec

## Overview

A personal MUN (Model United Nations) preparation web app for a high school delegate. Helps research countries, practice debate, and write documents. All data stored in browser localStorage with JSON export/import for backup.

## Tech Stack

- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- Rich Text: TipTap (ProseMirror-based)
- Icons: Lucide React
- Dates: date-fns
- AI: Google Gemini API via Netlify Functions
- Routing: React Router v6
- Hosting: Netlify (static site + serverless functions)

## Architecture

### Project Structure

```
mun-help/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Layout.tsx         # Top bar + breadcrumbs shell
│   │   ├── ConferenceCard.tsx
│   │   ├── EmptyState.tsx
│   │   └── WordCountIndicator.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ConferenceWorkspace.tsx
│   │   └── Settings.tsx
│   ├── modules/
│   │   ├── cheat-sheet/
│   │   │   └── CheatSheet.tsx
│   │   ├── debate/
│   │   │   ├── DebateSimulator.tsx
│   │   │   ├── QuestionPanel.tsx
│   │   │   ├── FeedbackDisplay.tsx
│   │   │   └── DebateHistory.tsx
│   │   └── documents/
│   │       ├── DocumentWorkshop.tsx
│   │       └── RichTextEditor.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useConference.ts
│   │   └── useAutoSave.ts
│   ├── types/
│   │   └── index.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── netlify/
│   └── functions/
│       ├── generate-question.ts
│       └── evaluate-answer.ts
├── public/
├── netlify.toml
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### Navigation

Top bar navigation (user selected over sidebar/hybrid):
- Dashboard is the landing page (`/`)
- Clicking a conference navigates to `/conference/:id` (defaults to cheat-sheet tab)
- Workspace tabs: Cheat Sheet, Debate Simulator, Documents
- Breadcrumb: `← Dashboard / Conference Name`
- Settings gear icon in top bar, routes to `/settings`

### Routing

| Route | Component | Description |
|---|---|---|
| `/` | Dashboard | List of conferences as cards |
| `/settings` | Settings | Export, import, reset, demo data |
| `/conference/:id` | ConferenceWorkspace | Default tab: cheat-sheet |
| `/conference/:id/cheat-sheet` | CheatSheet | Country info with inline editing |
| `/conference/:id/debate` | DebateSimulator | AI-powered Q&A practice |
| `/conference/:id/documents` | DocumentWorkshop | Rich text drafting |

### Data Model

Single localStorage key `mun_prep_app_data` storing:

```typescript
interface AppData {
  conferences: Conference[];
  activeConferenceId: string | null;
}

interface Conference {
  id: string;                    // crypto.randomUUID()
  name: string;                  // e.g. "UNHRC — Rohingya Crisis"
  committee: string;             // e.g. "UNHRC"
  topic: string;                 // e.g. "Rohingya Crisis"
  assignedCountry: string;       // e.g. "Bangladesh"
  deadline: string;              // ISO date string
  cheatSheet: CheatSheet;
  documents: Documents;
  debateHistory: DebateEntry[];
}

interface CheatSheet {
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

interface Documents {
  openingSpeech: string;      // HTML from TipTap
  positionPaper: string;      // HTML from TipTap
  workingClauses: string;     // HTML from TipTap
  caucusNotes: string;        // HTML from TipTap
}

interface DebateEntry {
  id: string;
  role: DebateRole;
  question: string;
  answer: string;
  feedback: DebateFeedback | null;
  timestamp: number;
}

type DebateRole = 'UfC' | 'G4' | 'Chair' | 'Swing' | 'Journalist';

interface DebateFeedback {
  argumentScore: number;     // 1-5
  diplomacyScore: number;    // 1-5
  compliment: string;
  improvement: string;
  modelRebuttal: string;
}
```

### Data Flow

- `useLocalStorage<T>(key, initialValue)` — generic hook. Returns `[value, setValue, removeValue]` tuple. Reads from localStorage on mount, stringifies on set. All mutations go through this hook.
- `useAutoSave(value, delayMs)` — debounced write hook for TipTap content (2s delay). Returns `{ isSaving }` to show a subtle saving indicator.
- `useConference()` — React Context hook. Returns `{ conference, updateConference, conferenceId, allConferences, setAllConferences, setActiveConferenceId }`. Throws if called outside ConferenceProvider. `updateConference` accepts a partial `Conference` and merges into the active conference in AppData. Reads `activeConferenceId` from AppData to determine which conference is active.
- `ConferenceProvider` wraps the entire `<Routes>` block (top-level), making it available to Dashboard, Settings, and ConferenceWorkspace alike. `ConferenceWorkspace` calls `setActiveConferenceId(id)` in a `useEffect` when the route param `:id` changes. When navigating away (back to Dashboard), the active conference ID persists in localStorage but the Dashboard ignores it.
- On app load, reads `mun_prep_app_data` from localStorage. If missing, initializes with empty conferences array.
- AI calls: Component → `lib/api.ts` → `fetch('/api/generate-question', ...)` → Netlify Function → Gemini API.

### Visual Design

- **Style**: Vibrant/Modern (user selected)
- **Accent**: Indigo (#6366f1)
- **Background**: Light gray (`bg-gray-50`), cards in white with subtle shadows
- **Typography**: Clean sans-serif (Tailwind default stack)
- **Dark mode**: Not included (user opted out)

## Modules

### 1. Dashboard

- Responsive grid of conference cards
- Each card shows: conference name, assigned country (with flag emoji), days until deadline (color-coded: green >14, yellow 7-14, red <7)
- "New Conference" button opens a modal/form to create
- Edit (pencil) and Delete (trash) buttons on each card
- Empty state with illustration and "Create your first conference" CTA when no conferences exist
- Clicking a card navigates to `/conference/:id/cheat-sheet`

### 2. Cheat Sheet

- Read view: displays all CheatSheet fields with labels
- Edit toggle: switches to inline editable inputs (textarea for multi-line fields)
- Changes save to localStorage on blur or explicit save button
- "Reset to Sierra Leone" button: fills all fields with default template data
- "Print View" button: hides edit controls, applies print-friendly CSS (`@media print`)
- Fields displayed in logical grouped sections (Country Info, Policy, Alliances)

### 3. Debate Simulator

- **Role selector** dropdown: UfC (opponent), G4 (ally), Chair, Swing (Nordic), Journalist
- **Ask Question** button → calls `generate-question` Netlify Function
  - Passes: role, topic, mandate, coreDemands
  - Returns: short challenging question (≤30 words)
  - Question displayed in a chat bubble
- **Answer textarea**: Enter to submit, Shift+Enter for newline
  - Shows placeholder: "Type your answer as if speaking in committee..."
- **Submit Answer** button → calls `evaluate-answer` Netlify Function
  - Passes: role, question, answer, mandate, coreDemands
  - Returns: `{ argumentScore, diplomacyScore, compliment, improvement, modelRebuttal }`
  - Displayed as a scored feedback card with star ratings
- **History tab**: scrollable list of past debate entries for this conference
  - Each entry shows: role, question, answer truncated, scores, timestamp
  - Click to expand full detail

### 4. Document Workshop

- **Tabs**: Opening Speech, Position Paper, Working Clauses, Caucus Notes
- Each tab loads corresponding document from `conference.documents`
- If empty, initializes with a template heading
- **Rich text editor** (TipTap) with toolbar grouped as: `[Bold | Italic | Underline] — [Bullet List | Ordered List] — [Heading (H3)]`. 6 items across 3 logical groups separated by dividers.
- **Auto-save**: debounced at 2 seconds, saves HTML to localStorage
- **Word count** displayed below editor with target indicator:
  - Opening speech: 150–200 words (green in range, yellow near, red outside)
  - Position paper: 500–800 words
  - Clauses: no strict limit (just count display)
  - Caucus notes: 50–70 words per point
- **AI action buttons** (each calls a Netlify Function):
  - Polish: improve grammar/flow, inject key phrases
  - Shorten: condense to target word count range
  - Brainstorm: generate 3 alternative openings/arguments (inserted as suggestions below editor)
  - Insert Clause: add a pre-written clause (modal to pick from template library)

### 5. Settings

- **Export**: Downloads `mun_prep_app_data.json` with current localStorage data
- **Import**: File picker for JSON file. Prompt: "Replace all data or merge?" (Replace = overwrite, Merge = append non-conflicting conferences)
- **Clear All**: Confirmation dialog → deletes localStorage key
- **Load Demo Data**: Fills with Sierra Leone example conference

## Netlify Functions

### `generate-question`

- Input: `{ role: string, mandate: string, coreDemands: string, topic: string }`
- Prompt: "You are a delegate representing {role} in a MUN committee on {topic}. The delegate you are questioning represents a country whose mandate is {mandate} and core demands include {coreDemands}. Generate a short, realistic, diplomatic question (max 30 words) that challenges their position. The question should be specific and research-based."
- Response: plain text string (the question)

### `evaluate-answer`

- Input: `{ role: string, question: string, answer: string, mandate: string, coreDemands: string }`
- Prompt: "You are a MUN chair evaluating a delegate's answer. The delegate represents a country with mandate: {mandate} and core demands: {coreDemands}. The question was: {question}. The answer was: {answer}. Provide feedback in this exact JSON format: { \"argumentScore\": 1-5, \"diplomacyScore\": 1-5, \"compliment\": \"specific positive feedback\", \"improvement\": \"specific area to improve\", \"modelRebuttal\": \"2-3 sentence example of a stronger answer\" }"
- Response: JSON object

### `document-ai`

- Input: `{ action: 'polish' | 'shorten' | 'brainstorm' | 'insert-clause', documentType: string, content: string, keyPhrases?: string, targetWordCount?: number }`
- Prompt varies by action. All prompts instruct Gemini to return plain text (no markdown, no HTML):
  - `polish`: "Improve grammar and flow of this {documentType} for a MUN conference. Inject relevant key phrases naturally. Return the polished text as plain text. No markdown or HTML."
  - `shorten`: "Condense this MUN {documentType} to approximately {targetWordCount} words while preserving key arguments. Return the shortened text as plain text. No markdown or HTML."
  - `brainstorm`: "Generate 3 alternative openings or arguments for a MUN {documentType} on this topic. Return as a numbered list. Use plain text only, no markdown or HTML."
  - `insert-clause`: "Generate a standard MUN working clause on this topic suitable for {documentType}. Include an operative clause with proper formatting. Return as plain text. No markdown or HTML."
- Response: plain text string. The client wraps it in `<p>` tags before inserting into TipTap so it renders as a new paragraph.

## Edge Cases & Error Handling

- **Empty localStorage on first visit**: Initialize default `AppData` with empty conferences array
- **AI fetch failures**: Show user-friendly error toast, re-enable buttons
- **Loading states**: Spinner/skeleton during AI calls, all action buttons disabled
- **Missing Netlify Function**: In dev, functions run locally via Netlify CLI. Graceful fallback message.
- **Invalid JSON import**: Validation before merge/replace, show error if format doesn't match schema
- **Conference with no deadline**: Display "No deadline set" instead of NaN
- **Word count on empty document**: Show 0 words, prompt user to start writing
- **Empty debate history**: "No practice sessions yet. Start a debate to see history here."
- **Browser back/forward**: React Router handles naturally; no state loss since everything is in localStorage
- **Concurrent tabs**: Each tab maintains its own TipTap instance; changes auto-save independently

## Loading & Error States

| Component | Loading | Error | Empty |
|-----------|---------|-------|-------|
| Dashboard | N/A (localStorage) | N/A | "No conferences yet" + CTA |
| Cheat Sheet | N/A | N/A | Pre-filled Sierra Leone template |
| Debate Simulator | Spinner on AI calls | Error toast + re-enable buttons | N/A (always has role selected) |
| Document Workshop | N/A | Save error toast | Initial template inserted |
| Settings | N/A | Import validation error | N/A |

## Design Constraints

- No user authentication
- No backend database (localStorage only)
- Single localStorage key `mun_prep_app_data`
- All AI calls go through Netlify Functions (never expose API key to client)
- Function timeout: 30s (Netlify default)
- Build output: `dist/`
