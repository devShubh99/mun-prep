# MUN Prep Companion — Refactoring Design

**Date:** 2026-05-15
**Context:** Full codebase audit + Context7 best-practice research for React 18, React Router v6, TypeScript 5, Vite 6, Tailwind CSS 3, TipTap 2

## Approach

**B) Focused incremental refactor** — 5 isolated phases, each verifiable via the existing E2E test suite (`node e2e.mjs`) before moving to the next.

---

## Phase 1 — Memoization & Context Optimisation

**Goal:** Eliminate unnecessary re-renders by properly memoizing context values, callbacks, and derived data.

### Changes

| File | Change | Justification |
|---|---|---|
| `src/hooks/useConference.tsx` | Wrap context value object in `useMemo` | Every consumer re-renders when the parent re-renders because a new object is created each time |
| `src/pages/Dashboard.tsx` | `useCallback` on `handleCreate`, `handleEdit`, `handleDelete`, `handleSave`; `useMemo` on `filtered` array | Handlers recreated every render; filter re-runs on every keystroke |
| `src/pages/ConferenceWorkspace.tsx` | Hoist `tabs` array to module scope | Static array+icon objects recreated every render |
| `src/pages/Settings.tsx` | `useCallback` on all 5 handlers | All handlers recreated every render |
| `src/modules/cheat-sheet/CheatSheet.tsx` | `useCallback` on `handleSave`, `handleReset` | Follow pattern from other components |
| `src/modules/documents/DocumentWorkshop.tsx` | `useCallback` on `handleContentChange` | `handleAutoSave` already memoized, but `handleContentChange` is not |
| `src/modules/documents/RichTextEditor.tsx` | Move `ToolbarButton` to module scope (outside component) | Defined inline, recreated every render (full extraction to separate file in P3) |

### Verification
- `npm run build` — must pass (TypeScript check is `tsc -b`)
- `node e2e.mjs` — all 14 E2E tests pass

---

## Phase 2 — Accessibility

**Goal:** ARIA compliance, keyboard support, proper modal semantics.

### Changes

| File | Change |
|---|---|
| `src/components/ConferenceFormModal.tsx` | Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (pointing to modal title), ESC key listener closes modal, focus trap on mount (`useEffect` + ref) |
| `src/modules/debate/FeedbackDisplay.tsx` | `StarRating` — add `aria-label` displaying "Rated X out of 5" |
| `src/pages/Dashboard.tsx` | Wrap search bar in `<div role="search">` |
| `src/components/Layout.tsx` | Add a skip-to-content link (visually hidden, focusable) |
| `index.html` | Ensure `<html lang="en">` |

### Verification
- `npm run build` passes
- `node e2e.mjs` passes
- Manual: tab through modal to verify focus trap

---

## Phase 3 — Component Splitting

**Goal:** Smaller, focused files with single responsibilities.

### Changes

| File | Action |
|---|---|
| `RichTextEditor.tsx` → full `ToolbarButton` extraction | Move from module-scope to `src/components/ToolbarButton.tsx` and import it |
| `Settings.tsx` → extract `useSettings` hook | Move all handler logic + `useLocalStorage` to `src/hooks/useSettings.ts`; keep `Settings.tsx` as pure JSX |
| `DocumentWorkshop.tsx` → extract `AiActionButtons` | Pull the 4 AI action buttons + loading indicator into `src/modules/documents/AiActionButtons.tsx` |
| `DebateSimulator.tsx` → extract `QuestionDisplay` | Pull question card + error display + answer textarea into `src/modules/debate/QuestionDisplay.tsx` |

### Verification
- `npm run build` passes
- `node e2e.mjs` passes

---

## Phase 4 — Type Safety & Error Handling

**Goal:** Typed errors, consistent patterns, no `catch {}`.

### Changes

| File | Change |
|---|---|
| `src/lib/api.ts` | Replace `new Error('...')` throws with typed `ApiError` class; functions return typed error objects |
| All `catch` blocks | Use `instanceof ApiError` check instead of generic string message |
| `src/types/index.ts` | Consider `Omit`/`Pick` utility types for Conference partials; consistent `interface` vs `type` usage (use `interface` for public APIs, `type` for unions/computations) |

### Verification
- `npm run build` passes
- `node e2e.mjs` passes

---

## Phase 5 — Test Suite Refactoring

**Goal:** Structured E2E tests + unit test coverage for core logic.

### Changes

| File | Action |
|---|---|
| `e2e.mjs` | Migrate to Playwright test config (`playwright.config.mjs` + `e2e/` directory with structured `describe`/`test` blocks). Keep running via `node e2e.mjs` as fallback |
| `src/lib/__tests__/utils.test.ts` | Vitest unit tests for `daysUntil`, `wordCount`, `stripHtml`, `formatDeadline`, `deadlineColor` |
| `src/lib/__tests__/constants.test.ts` | Vitest tests for `createDefaultConference`, `createEmptyAppData` |
| `src/hooks/__tests__/useLocalStorage.test.ts` | Vitest test with `localStorage` mock |
| `src/components/__tests__/EmptyState.test.tsx` | Vitest + @testing-library/react: renders and calls `onCreate` |
| `package.json` | Update `"test"` script: `vitest run && node e2e.mjs` |

### Verification
- `npm test` passes (unit + E2E)
- `npm run build` passes

---

## Rollback Strategy

Each phase is independently revertible:
- P1: `git checkout -- src/hooks/useConference.tsx src/pages/*.tsx src/modules/*/*.tsx`
- P2: `git checkout -- src/components/ConferenceFormModal.tsx src/modules/debate/FeedbackDisplay.tsx src/pages/Dashboard.tsx src/components/Layout.tsx index.html`
- P3: `git checkout -- src/modules/documents/RichTextEditor.tsx src/pages/Settings.tsx src/modules/documents/DocumentWorkshop.tsx src/modules/debate/DebateSimulator.tsx`
- P4: `git checkout -- src/lib/api.ts src/types/index.ts`
- P5: `git checkout -- e2e/ playwright.config.mjs src/lib/__tests__/ src/hooks/__tests__/ src/components/__tests__/ package.json`

## Out of Scope

- Migration to React 19 or React Router v7
- Adding new features or UI components
- CSS redesign or theme changes
- Backend (Netlify function) changes
