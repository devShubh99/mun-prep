# MUN Prep Companion — Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the MUN Prep Companion across 5 incremental phases (memoization, accessibility, component splitting, type safety, test suite) with E2E verification between each phase.

**Architecture:** Each phase is independently revertible. All changes in `src/` (frontend) and `e2e.mjs` (tests). No backend/Netlify changes.

**Tech Stack:** React 18, TypeScript 5, Vite 6, Tailwind CSS 3, TipTap 2, React Router v6, Vitest, Playwright

---

## File Structure

### Phase 1 — modified
- `src/hooks/useConference.tsx` `src/pages/Dashboard.tsx` `src/pages/ConferenceWorkspace.tsx` `src/pages/Settings.tsx` `src/modules/cheat-sheet/CheatSheet.tsx` `src/modules/documents/DocumentWorkshop.tsx` `src/modules/documents/RichTextEditor.tsx`

### Phase 2 — modified
- `src/components/ConferenceFormModal.tsx` `src/modules/debate/FeedbackDisplay.tsx` `src/pages/Dashboard.tsx` `src/components/Layout.tsx` `index.html`

### Phase 3 — created + modified
- Create: `src/components/ToolbarButton.tsx` `src/hooks/useSettings.ts` `src/modules/documents/AiActionButtons.tsx` `src/modules/debate/QuestionDisplay.tsx`
- Modify: `src/modules/documents/RichTextEditor.tsx` `src/pages/Settings.tsx` `src/modules/documents/DocumentWorkshop.tsx` `src/modules/debate/DebateSimulator.tsx`

### Phase 4 — modified
- `src/lib/api.ts` `src/modules/debate/DebateSimulator.tsx` `src/modules/documents/DocumentWorkshop.tsx`

### Phase 5 — created + modified
- Create: `src/lib/__tests__/utils.test.ts` `src/lib/__tests__/constants.test.ts` `src/hooks/__tests__/useLocalStorage.test.ts` `src/components/__tests__/EmptyState.test.tsx`
- Modify: `package.json`

---

### Task 1: Memoize context in useConference.tsx

**Files:**
- Modify: `src/hooks/useConference.tsx:55-68`

- [ ] **Wrap context value in useMemo**

```tsx
const value = useMemo(
  () => ({
    conference,
    conferenceId: appData.activeConferenceId,
    updateConference,
    allConferences: appData.conferences,
    setAllConferences,
    setActiveConferenceId,
  }),
  [
    conference,
    appData.activeConferenceId,
    appData.conferences,
    updateConference,
    setAllConferences,
    setActiveConferenceId,
  ],
);

return (
  <ConferenceContext.Provider value={value}>
    {children}
  </ConferenceContext.Provider>
);
```

- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/hooks/useConference.tsx && git commit -m "refactor: memoize context value"`

---

### Task 2: Memoize Dashboard handlers + filtered list

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Add `useMemo` import, memoize filtered list**

```tsx
const filtered = useMemo(
  () =>
    allConferences.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.assignedCountry.toLowerCase().includes(search.toLowerCase()) ||
        c.committee.toLowerCase().includes(search.toLowerCase()),
    ),
  [allConferences, search],
);
```

- [ ] **Wrap handlers in useCallback**

```tsx
const handleCreate = useCallback(() => {
  const conf = createDefaultConference();
  setEditingConference(conf);
  setModalOpen(true);
}, []);

const handleEdit = useCallback((conf: Conference) => {
  setEditingConference(conf);
  setModalOpen(true);
}, []);

const handleDelete = useCallback((id: string) => {
  if (confirm('Delete this conference? This cannot be undone.')) {
    setAllConferences((prev) => prev.filter((c) => c.id !== id));
  }
}, [setAllConferences]);

const handleSave = useCallback(
  (updated: Conference) => {
    setAllConferences((prev) => {
      const exists = prev.some((c) => c.id === updated.id);
      return exists ? prev.map((c) => (c.id === updated.id ? updated : c)) : [...prev, updated];
    });
    setModalOpen(false);
    setEditingConference(null);
  },
  [setAllConferences],
);
```

- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/pages/Dashboard.tsx && git commit -m "refactor: memoize Dashboard handlers + filter"`

---

### Task 3: Hoist static tabs + memoize CheatSheet handlers

**Files:**
- Modify: `src/pages/ConferenceWorkspace.tsx` `src/modules/cheat-sheet/CheatSheet.tsx`

- [ ] **Hoist tabs array** — move `const tabs = [...]` outside the component function in `ConferenceWorkspace.tsx`
- [ ] **Add useCallback to CheatSheet handlers**

```tsx
import { useState, useCallback } from 'react';

const handleSave = useCallback(() => {
  updateConference({ cheatSheet: draft });
  setEditing(false);
}, [draft, updateConference]);

const handleReset = useCallback(() => {
  if (confirm('Reset cheat sheet to Sierra Leone template?')) {
    setDraft(SIERRA_LEONE_CHEAT_SHEET);
    updateConference({ cheatSheet: SIERRA_LEONE_CHEAT_SHEET });
  }
}, [draft, updateConference]);
```

- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/pages/ConferenceWorkspace.tsx src/modules/cheat-sheet/CheatSheet.tsx && git commit -m "refactor: hoist static tabs, memoize CheatSheet"`

---

### Task 4: Memoize Settings handlers

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Add useCallback import, wrap all 5 handlers.** Each handler wraps in `useCallback` with its deps (`[]` for `handleImport`, `[appData]` for `handleExport`, `[setAppData]` for the rest). See spec for full code.
- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/pages/Settings.tsx && git commit -m "refactor: memoize Settings handlers"`

---

### Task 5: Memoize DocumentWorkshop + ToolbarButton scope extraction

**Files:**
- Modify: `src/modules/documents/DocumentWorkshop.tsx` `src/modules/documents/RichTextEditor.tsx`

- [ ] **Memoize handleContentChange in DocumentWorkshop**

```tsx
const handleContentChange = useCallback(
  (html: string) => {
    updateConference({
      documents: { ...conf.documents, [activeTab]: html },
    });
  },
  [activeTab, conf.documents, updateConference],
);
```

- [ ] **Move ToolbarButton to module scope** — extract the `function ToolbarButton(...)` definition to **outside** the `RichTextEditor` component in `RichTextEditor.tsx`.
- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/modules/documents/DocumentWorkshop.tsx src/modules/documents/RichTextEditor.tsx && git commit -m "refactor: memoize handlers, extract ToolbarButton"`

---

### Task 6: Phase 1 E2E verification

- [ ] **Run full E2E:** `npm run build && node e2e.mjs`
- [ ] **Tag:** `git tag -a "refactor-phase-1" -m "Phase 1: Memoization complete"`

---

### Task 7: Modal ARIA + focus trap + ESC

**Files:**
- Modify: `src/components/ConferenceFormModal.tsx`

- [ ] **Add ARIA attributes** — `role="dialog"` on overlay, `aria-modal="true"`, `aria-labelledby={titleId}` on overlay, `id={titleId}` on `<h2>`
- [ ] **Add focus trap** — `const modalRef = useRef<HTMLDivElement>(null)`, `useEffect` to focus `modalRef.current` on mount, restore previous focus on cleanup
- [ ] **Add ESC handler** — `useEffect` with `keydown` listener for `Escape` → `onClose`
- [ ] **Full component code** — see spec for complete component
- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/components/ConferenceFormModal.tsx && git commit -m "refactor: add ARIA, focus trap, ESC to modal"`

---

### Task 8: StarRating labels + search role + skip-to-content + lang

**Files:**
- Modify: `src/modules/debate/FeedbackDisplay.tsx` `src/pages/Dashboard.tsx` `src/components/Layout.tsx` `index.html`

- [ ] **StarRating aria-label**

```tsx
<div className="flex gap-0.5" role="img" aria-label={`${label}: ${score} out of 5`}>
```

- [ ] **Search role in Dashboard**

```tsx
<div role="search" className="relative flex-1 max-w-sm">
```

- [ ] **Skip-to-content in Layout** — add `<a href="#main-content" className="sr-only focus:not-sr-only ...">` and `id="main-content"` on `<main>`
- [ ] **lang attr** — `<html lang="en">` in `index.html`
- [ ] **Build + E2E:** `npm run build && node e2e.mjs`
- [ ] **Commit + tag:** `git add -A && git commit -m "refactor: accessibility improvements" && git tag -a "refactor-phase-2" -m "Phase 2: Accessibility complete"`

---

### Task 9: Extract ToolbarButton to separate file

**Files:**
- Create: `src/components/ToolbarButton.tsx`
- Modify: `src/modules/documents/RichTextEditor.tsx`

- [ ] **Create ToolbarButton.tsx**

```tsx
interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  label: string;
}

export default function ToolbarButton({ onClick, active, children, label }: ToolbarButtonProps) {
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
```

- [ ] **Update RichTextEditor.tsx** — remove local `ToolbarButton`, add `import ToolbarButton from '@/components/ToolbarButton'`
- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/components/ToolbarButton.tsx src/modules/documents/RichTextEditor.tsx && git commit -m "refactor: extract ToolbarButton component"`

---

### Task 10: Extract useSettings hook

**Files:**
- Create: `src/hooks/useSettings.ts`
- Modify: `src/pages/Settings.tsx`

- [ ] **Create useSettings.ts** — move all state, refs, and handlers into a custom hook returning `{ fileInputRef, handleExport, handleImport, handleFileChange, handleClear, handleDemoData }`
- [ ] **Update Settings.tsx** — replace all handler logic with `const { ... } = useSettings()`
- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/hooks/useSettings.ts src/pages/Settings.tsx && git commit -m "refactor: extract useSettings hook"`

---

### Task 11: Extract AiActionButtons component

**Files:**
- Create: `src/modules/documents/AiActionButtons.tsx`
- Modify: `src/modules/documents/DocumentWorkshop.tsx`

- [ ] **Create AiActionButtons.tsx**

```tsx
import { Sparkles, Scissors, Lightbulb, FilePlus, Loader2, Check } from 'lucide-react';

type AiAction = 'polish' | 'shorten' | 'brainstorm' | 'insert-clause';

interface AiActionButtonsProps {
  onAction: (action: AiAction) => void;
  aiLoading: string | null;
  saving: boolean;
}

const actions: { value: AiAction; label: string; icon: typeof Sparkles }[] = [
  { value: 'polish', label: 'Polish', icon: Sparkles },
  { value: 'shorten', label: 'Shorten', icon: Scissors },
  { value: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
  { value: 'insert-clause', label: 'Insert Clause', icon: FilePlus },
];

export default function AiActionButtons({ onAction, aiLoading, saving }: AiActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 mt-4">
      {actions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onAction(value)}
          disabled={aiLoading !== null}
          className="btn-secondary text-xs"
        >
          {aiLoading === value ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
          {label}
        </button>
      ))}
      <div className="flex-1" />
      {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
    </div>
  );
}
```

- [ ] **Update DocumentWorkshop.tsx** — add `import AiActionButtons from './AiActionButtons'`, replace bottom buttons section with `<AiActionButtons onAction={handleAiAction} aiLoading={aiLoading} saving={saving} />`
- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/modules/documents/AiActionButtons.tsx src/modules/documents/DocumentWorkshop.tsx && git commit -m "refactor: extract AiActionButtons"`

---

### Task 12: Extract QuestionDisplay component

**Files:**
- Create: `src/modules/debate/QuestionDisplay.tsx`
- Modify: `src/modules/debate/DebateSimulator.tsx`

- [ ] **Create QuestionDisplay.tsx**

```tsx
import { Loader2 } from 'lucide-react';

interface QuestionDisplayProps {
  question: string;
  error: string;
  loading: 'question' | 'answer' | null;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export default function QuestionDisplay({
  question, error, loading, answer, onAnswerChange, onSubmit, onKeyDown,
}: QuestionDisplayProps) {
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-accent-600 uppercase tracking-wider mb-1">Question</p>
        <p className="text-gray-900">{question}</p>
      </div>
      {!loading && (
        <>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Type your answer as if speaking in committee... (Enter to submit, Shift+Enter for newline)"
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading === 'answer'}
          />
          <button
            onClick={onSubmit}
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
    </>
  );
}
```

Wait, the condition should be `!feedback` not `!loading`. Let me fix:

```tsx
export default function QuestionDisplay({
  question, error, loading, answer, onAnswerChange, onSubmit, onKeyDown,
}: QuestionDisplayProps) {
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-accent-600 uppercase tracking-wider mb-1">Question</p>
        <p className="text-gray-900">{question}</p>
      </div>
      <textarea
        className="input min-h-[120px] resize-y"
        placeholder="Type your answer as if speaking in committee... (Enter to submit, Shift+Enter for newline)"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={loading === 'answer'}
      />
      <button
        onClick={onSubmit}
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
  );
}
```

- [ ] **Update DebateSimulator.tsx** — add `import QuestionDisplay from './QuestionDisplay'`. Replace the inline JSX block (lines 124-153) with the conditional rendering using `QuestionDisplay`.
- [ ] **Build + E2E:** `npm run build && node e2e.mjs`
- [ ] **Commit + tag:** `git add -A && git commit -m "refactor: extract QuestionDisplay" && git tag -a "refactor-phase-3" -m "Phase 3: Component splitting complete"`

---

### Task 13: Typed ApiError + refactor API layer

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Add ApiError class + checkResponse helper**

```tsx
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function checkResponse(res: Response): Promise<void> {
  if (!res.ok) throw new ApiError(`Request failed: ${res.statusText}`, res.status);
}
```

Replace `if (!res.ok) throw new Error(...)` with `await checkResponse(res)` in each function.
- [ ] **Build check:** `npm run build`
- [ ] **Commit:** `git add src/lib/api.ts && git commit -m "refactor: add typed ApiError to API layer"`

---

### Task 14: Update catch blocks to use ApiError

**Files:**
- Modify: `src/modules/debate/DebateSimulator.tsx` `src/modules/documents/DocumentWorkshop.tsx`

- [ ] **Import ApiError** — add `import { ApiError } from '@/lib/api'` in both files
- [ ] **Update DebateSimulator catch blocks**

```tsx
catch (e) {
  setError(e instanceof ApiError ? e.message : 'Failed to generate question. Check your connection and try again.');
}
// and
catch (e) {
  setError(e instanceof ApiError ? e.message : 'Failed to evaluate answer. Check your connection and try again.');
}
```

- [ ] **Update DocumentWorkshop catch block**

```tsx
catch (e) {
  alert(e instanceof ApiError ? e.message : 'AI action failed. Please try again.');
}
```

- [ ] **Build check:** `npm run build`
- [ ] **Commit + tag:** `git add src/modules/debate/DebateSimulator.tsx src/modules/documents/DocumentWorkshop.tsx && git commit -m "refactor: use typed ApiError in catch blocks" && git tag -a "refactor-phase-4" -m "Phase 4: Type safety complete"`

---

### Task 15: Unit tests for utils

**Files:**
- Create: `src/lib/__tests__/utils.test.ts`

- [ ] **Create utils test**

```tsx
import { describe, it, expect } from 'vitest';
import { daysUntil, wordCount, stripHtml, formatDeadline, deadlineColor } from '../utils';

describe('daysUntil', () => {
  it('returns null for empty string', () => expect(daysUntil('')).toBeNull());
  it('returns null for invalid date', () => expect(daysUntil('bad')).toBeNull());
  it('returns positive number for future date', () => {
    const d = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    expect(daysUntil(d)).toBe(7);
  });
  it('returns negative for past date', () => {
    const d = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    expect(daysUntil(d)).toBe(-7);
  });
});

describe('wordCount', () => {
  it('returns 0 for empty', () => expect(wordCount('')).toBe(0));
  it('counts words', () => expect(wordCount('hello world')).toBe(2));
  it('strips HTML', () => expect(wordCount('<p>hello <strong>world</strong></p>')).toBe(2));
});

describe('stripHtml', () => {
  it('strips tags', () => expect(stripHtml('<p>hello</p>')).toBe('hello'));
  it('returns combined text', () => expect(stripHtml('<h1>A</h1><p>B</p>')).toBe('AB'));
});

describe('formatDeadline', () => {
  it('returns fallback for empty', () => expect(formatDeadline('')).toBe('No deadline set'));
  it('returns fallback for invalid', () => expect(formatDeadline('bad')).toBe('No deadline set'));
});

describe('deadlineColor', () => {
  it('gray for null', () => expect(deadlineColor(null)).toBe('text-gray-400'));
  it('red-600 for past', () => expect(deadlineColor(-1)).toBe('text-red-600'));
  it('red-500 for <=7', () => expect(deadlineColor(7)).toBe('text-red-500'));
  it('yellow for <=14', () => expect(deadlineColor(14)).toBe('text-yellow-600'));
  it('green for >14', () => expect(deadlineColor(15)).toBe('text-green-600'));
});
```

- [ ] **Run tests:** `npm test`
- [ ] **Commit:** `git add src/lib/__tests__/utils.test.ts && git commit -m "test: unit tests for utils"`

---

### Task 16: Unit tests for constants

**Files:**
- Create: `src/lib/__tests__/constants.test.ts`

- [ ] **Create constants test**

```tsx
import { describe, it, expect } from 'vitest';
import { createDefaultConference, createEmptyAppData } from '../constants';

describe('createDefaultConference', () => {
  it('has all required fields', () => {
    const c = createDefaultConference();
    expect(c).toHaveProperty('id');
    expect(c.name).toBe('');
    expect(c.debateHistory).toEqual([]);
  });
  it('generates unique ids', () => {
    expect(createDefaultConference().id).not.toBe(createDefaultConference().id);
  });
  it('applies overrides', () => {
    const c = createDefaultConference({ name: 'Test', committee: 'UNHRC' });
    expect(c.name).toBe('Test');
    expect(c.committee).toBe('UNHRC');
  });
});

describe('createEmptyAppData', () => {
  it('returns empty state', () => {
    const d = createEmptyAppData();
    expect(d.conferences).toEqual([]);
    expect(d.activeConferenceId).toBeNull();
  });
});
```

- [ ] **Run tests:** `npm test`
- [ ] **Commit:** `git add src/lib/__tests__/constants.test.ts && git commit -m "test: unit tests for constants"`

---

### Task 17: Unit tests for useLocalStorage hook

**Files:**
- Create: `src/hooks/__tests__/useLocalStorage.test.ts`

- [ ] **Create useLocalStorage test**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  const key = 'test_key';
  beforeEach(() => localStorage.clear());

  it('returns default when empty', () => {
    const { result } = renderHook(() => useLocalStorage(key, 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value', () => {
    localStorage.setItem(key, JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage(key, 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage(key, ''));
    act(() => result.current[1]('value'));
    expect(JSON.parse(localStorage.getItem(key)!)).toBe('value');
  });

  it('supports function updater', () => {
    localStorage.setItem(key, JSON.stringify(1));
    const { result } = renderHook(() => useLocalStorage<number>(key, 0));
    act(() => result.current[1]((p) => p + 1));
    expect(result.current[0]).toBe(2);
  });

  it('removes value', () => {
    localStorage.setItem(key, JSON.stringify('x'));
    const { result } = renderHook(() => useLocalStorage(key, 'default'));
    act(() => result.current[2]());
    expect(result.current[0]).toBe('default');
    expect(localStorage.getItem(key)).toBeNull();
  });
});
```

- [ ] **Run tests:** `npm test`
- [ ] **Commit:** `git add src/hooks/__tests__/useLocalStorage.test.ts && git commit -m "test: unit tests for useLocalStorage"`

---

### Task 18: Unit test for EmptyState component

**Files:**
- Create: `src/components/__tests__/EmptyState.test.tsx`

- [ ] **Create EmptyState test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders empty state message', () => {
    render(<EmptyState onCreate={() => {}} />);
    expect(screen.getByText('No conferences yet')).toBeDefined();
  });

  it('calls onCreate on button click', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<EmptyState onCreate={fn} />);
    await user.click(screen.getByText('Create Your First Conference'));
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Run tests:** `npm test`
- [ ] **Commit:** `git add src/components/__tests__/EmptyState.test.tsx && git commit -m "test: unit tests for EmptyState"`

---

### Task 19: Update package.json test scripts

**Files:**
- Modify: `package.json`

- [ ] **Update scripts**

```json
"test": "vitest run && node e2e.mjs",
"test:unit": "vitest run",
"test:e2e": "node e2e.mjs"
```

- [ ] **Full test run:** `npm test`
- [ ] **Commit + tag:** `git add package.json && git commit -m "test: add unit test suite, update scripts" && git tag -a "refactor-phase-5" -m "Phase 5: Test suite complete"`

---

## Verification per phase

| Phase | Command |
|---|---|
| 1 | `npm run build && node e2e.mjs` |
| 2 | `npm run build && node e2e.mjs` |
| 3 | `npm run build && node e2e.mjs` |
| 4 | `npm run build && node e2e.mjs` |
| 5 | `npm test` (vitest + e2e) |
