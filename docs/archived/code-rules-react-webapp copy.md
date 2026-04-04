# Code Rules: React + TypeScript + Tailwind Webapp

**Derived from:** Done & Dusted (family chore management app)
**Stack:** React 19, TypeScript, Tailwind CSS v4, Vite, Firebase/Firestore, Framer Motion, date-fns, lucide-react
**Generated:** April 1, 2026

Use this document as a baseline rule set for any vibe-coded React webapp. Paste it into your AI coding agent's knowledge base, CLAUDE.md, or project README before generating code.

---

## 1. Project Structure

```
src/
  App.tsx              # Root component, context providers, auth flow, primary views
  main.tsx             # Entry point (ReactDOM.createRoot)
  types.ts             # All TypeScript interfaces and enums — single source of truth
  services.ts          # All database/API operations — no raw DB calls in components
  utils.ts             # Pure helper functions (date conversion, class merging, hashing)
  firebase.ts          # Firebase/Supabase initialization and exports (db, auth)
  index.css            # Tailwind imports, custom font imports, utility classes, scrollbar styles
  components/          # Extracted components (modals, complex widgets)
```

**Rules:**

- Keep `App.tsx` as the orchestrator. It owns the context provider, auth state listener, and top-level routing logic (login → setup → dashboard). Individual views can live in App.tsx until they exceed ~200 lines, then extract to `components/`.
- Every TypeScript interface and enum goes in `types.ts`. Components import from there. Never define data shapes inline.
- Every database read/write goes through `services.ts`. Components call service functions. Components never import `db` or `collection` directly.
- `utils.ts` contains only pure functions with no side effects and no imports from services or components.
- The Firebase/Supabase initialization file exports only `db` and `auth`. Connection tests live here, not in components.

---

## 2. TypeScript Conventions

### Data Models

Define interfaces for every database entity. Use string literal unions for constrained fields instead of bare `string`.

```typescript
export type UserRole = 'organizer' | 'contributor';

export interface Chore {
  id: string;
  familyId: string;
  title: string;
  description?: string;           // Optional fields use ?
  assignedTo?: string;
  status: 'pending' | 'done';     // String literal union, not string
  dueDate?: any;                  // Firestore Timestamp — use `any` and convert at read time
  points?: number;
  isRecurring?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceInterval?: number;
  originalChoreId?: string;       // FK references use the same type as the PK
}
```

### Error Tracking

Define an enum for operation types. Wrap errors with context (operation, path, auth state) so you can debug Firestore/Supabase permission failures without guessing.

```typescript
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
```

### General Rules

- Use `Omit<Chore, 'id'>` for create operations where the ID is auto-generated.
- Use `Partial<Chore>` for update operations where only some fields change.
- Avoid `as` type assertions except when reading untyped database responses.
- Firestore Timestamps and Supabase dates are unreliable types at runtime. Always convert through a safe wrapper (see Section 7).

---

## 3. Services Layer

All database operations go through named service objects grouped by entity.

```typescript
export const choreService = {
  subscribeToChores(familyId: string, callback: (chores: Chore[]) => void) { ... },
  async addChore(chore: Omit<Chore, 'id'>): Promise<void> { ... },
  async toggleChoreStatus(choreId: string, status: 'pending' | 'done', userId: string): Promise<void> { ... },
  async updateChore(choreId: string, data: Partial<Chore>, mode: 'single' | 'series' = 'series'): Promise<void> { ... },
  async deleteChore(choreId: string): Promise<void> { ... },
};
```

**Rules:**

- One service object per database entity: `userService`, `familyService`, `choreService`.
- Every async function wraps its body in try/catch and calls `handleError` with the operation type and path.
- Subscription functions return the unsubscribe callback so the calling component can clean up.
- Service functions accept primitive arguments (strings, objects), never React state or refs.
- Use a `cleanObject` utility to strip `undefined` values before writing to the database. Firestore rejects `undefined`; Supabase silently drops it.

```typescript
function cleanObject(obj: any) {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) delete newObj[key];
  });
  return newObj;
}
```

- Centralize error handling with auth context for debugging permission errors:

```typescript
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
  };
  console.error('DB Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
```

---

## 4. State Management

### Global State: React Context

Use a single `AppContext` for auth user, profile, family, and app-wide flags. Do not use Redux, Zustand, or other state libraries unless the app exceeds ~10 distinct pieces of shared state.

```typescript
interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  family: Family | null;
  loading: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
```

**Rules:**

- The `AppProvider` component owns the `onAuthStateChanged` listener and all profile/family loading logic.
- `refreshProfile` is exposed so child components can trigger a re-fetch after mutations (e.g., creating a family).
- Local component state (`useState`) handles everything that doesn't need to be shared: form values, modal open/close, filter selections, view toggles.
- Realtime subscriptions (`onSnapshot`, Supabase `.subscribe()`) live in `useEffect` with cleanup functions returned from the subscription call.

```typescript
useEffect(() => {
  if (!family) return;
  const unsubscribe = choreService.subscribeToChores(family.id, setChores);
  return () => unsubscribe();
}, [family]);
```

---

## 5. Auth Flow

Implement a progressive onboarding pattern. The user sees only what's relevant to their current state.

```
Not authenticated  →  Login screen (Google OAuth)
Authenticated, no profile  →  Auto-create profile from auth user
Profile exists, no familyId  →  Family Setup (create or join)
Profile + familyId  →  Dashboard
```

```tsx
{!user ? <Login /> : !profile?.familyId ? <FamilySetup /> : <Dashboard />}
```

**Rules:**

- The auth listener in `AppProvider` handles all transitions. Components don't manage auth state.
- On first sign-in, auto-create the user profile from the auth object (displayName, photoURL, uid). Don't make the user fill out a form.
- Invite codes: 6-character uppercase alphanumeric, generated with `Math.random().toString(36).substring(2, 8).toUpperCase()`. Good enough for household apps. Use crypto-random for anything with real security requirements.
- Role assignment happens at family creation (organizer) or join (contributor). Store it on the user profile, not a separate roles table.

---

## 6. Component Patterns

### Modals

Every modal follows this structure:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="absolute inset-0 bg-violet-600/40 backdrop-blur-sm"
  />
  {/* Content */}
  <motion.div
    ref={modalRef}
    tabIndex={-1}
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: 20 }}
    className="relative w-full max-w-lg modern-box overflow-hidden max-h-[90vh]"
  >
    <div className="p-8 overflow-y-auto custom-scrollbar">
      {/* Modal content */}
    </div>
  </motion.div>
</div>
```

**Modal rules:**

- Always wrap in `<AnimatePresence>` at the parent level for exit animations.
- Always add Escape key listener with cleanup.
- Always set `tabIndex={-1}` on the modal container and focus it on mount via `useRef` + `useEffect`.
- Backdrop uses `onClick={onClose}` for click-outside dismissal.
- Content container uses `max-h-[90vh]` with `overflow-y-auto` so tall modals scroll.
- Nested modals (e.g., confirmation inside a management modal) use `z-[60]` to stack above the parent `z-50`.

```typescript
useEffect(() => {
  if (modalRef.current) modalRef.current.focus();
  const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, [onClose]);
```

### Cards and List Items

- Interactive cards use `onClick`, `tabIndex={0}`, and `onKeyDown` (Enter/Space) for keyboard accessibility.
- Nested interactive elements (buttons inside clickable cards) call `e.stopPropagation()` on both `onClick` and `onKeyDown`.
- Use `motion.div` with `layout`, `initial`, `animate`, and `exit` props for list item animations.
- Wrap lists in `<AnimatePresence mode="popLayout">` for smooth reordering.

### Forms

- All inputs are controlled (`value` + `onChange`).
- Every form tracks `loading` (boolean) and `error` (string | null) state.
- Submit buttons show `disabled={loading || !requiredField}`.
- Use `autoFocus` on the primary input in modals.
- The submit handler always calls `e.preventDefault()` and sets `setLoading(true)` before the async operation.

---

## 7. Utility Functions

### Class Name Merging

Use `clsx` + `tailwind-merge` via a `cn()` helper. This is the standard pattern across the React + Tailwind ecosystem.

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Safe Date Conversion

Database timestamps arrive in unpredictable formats (Firestore Timestamp objects, plain Date objects, serialized `{seconds, nanoseconds}` objects). Always convert through a single function.

```typescript
export function getSafeDate(dateObj: any): Date {
  if (!dateObj) return new Date();
  if (dateObj instanceof Date) return dateObj;
  if (typeof dateObj.toDate === 'function') return dateObj.toDate();  // Firestore Timestamp
  if (dateObj.seconds) return new Date(dateObj.seconds * 1000);       // Serialized Timestamp
  return new Date(dateObj);                                            // ISO string or number
}
```

### Deterministic Color Assignment

Hash user IDs to colors for consistent avatar borders and badges. The same user always gets the same color across sessions.

```typescript
export function getUserColor(userId: string | undefined): string {
  if (!userId) return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  const colors = [
    'bg-slate-600 text-white border-slate-700',
    'bg-amber-600 text-white border-amber-700',
    'bg-emerald-600 text-white border-emerald-700',
    // ... more colors
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
```

---

## 8. Styling System

### CSS Architecture

Use Tailwind CSS v4 with `@import "tailwindcss"` in `index.css`. Define custom fonts via `@theme`. Define reusable component classes as Tailwind `@apply` compositions.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Outfit", ui-sans-serif, system-ui, sans-serif;
}

@custom-variant dark (&:where(.dark, .dark *));
```

### Utility Classes

Define these reusable classes in `index.css`. Components reference them by name.

| Class | Purpose | Key Properties |
|-------|---------|----------------|
| `modern-box` | Primary card/container | `bg-white/95 rounded-2xl border border-white/50 shadow-xl backdrop-blur-xl` |
| `modern-box-sm` | Secondary card (inside a primary card) | `bg-white/95 rounded-xl shadow-lg` |
| `modern-btn` | Button base | `rounded-xl shadow-sm active:scale-[0.98] disabled:opacity-50` |
| `modern-input` | Input/select base | `bg-zinc-50/80 rounded-xl border border-zinc-200` |
| `custom-scrollbar` | Thin scrollbar | 4px width, transparent track, rounded thumb |

**Every utility class must have a `.dark` variant.**

### Color System

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| Primary | `violet-600` | `violet-600` | Buttons, active states, today indicator |
| Secondary | `rose-600` | `rose-400` | CTAs, invite buttons, recurring indicators |
| Success | `emerald-100/600` | `emerald-900/400` | Completed items |
| Gamification | `amber-50/500` | `amber-900/400` | Leaderboard, top performer |
| Danger | `red-50/600` | `red-900/400` | Delete buttons, overdue dates |
| Neutral text | `violet-950` | `white` | Headings |
| Secondary text | `zinc-500` | `zinc-400` | Labels, descriptions |
| Label text | `zinc-400` | `zinc-500` | Uppercase tracking labels |

### Typography

- **Headings and display:** `font-display` (Outfit), `text-2xl` or `text-3xl`
- **Body:** `font-sans` (Inter), default size
- **Labels:** `text-[10px] font-bold uppercase tracking-widest text-zinc-400`
- **Points/badges:** `font-bold text-rose-600`
- **Mono/codes:** `font-mono tracking-widest` (invite codes)

### Background

Warm, multi-gradient background on `body`. Not a flat color.

```css
body {
  background-color: #fdfbf7;
  background-image:
    radial-gradient(at 0% 0%, #fef2f2 0px, transparent 50%),
    radial-gradient(at 100% 0%, #f5f3ff 0px, transparent 50%),
    radial-gradient(at 100% 100%, #ecfdf5 0px, transparent 50%),
    radial-gradient(at 0% 100%, #fffbeb 0px, transparent 50%);
  background-attachment: fixed;
}
```

---

## 9. Dark Mode

### Implementation

Class-based dark mode with localStorage persistence and system preference detection.

```typescript
const [darkMode, setDarkMode] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('darkMode') === 'true'
      || window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
});

useEffect(() => {
  document.documentElement.classList.toggle('dark', darkMode);
  localStorage.setItem('darkMode', darkMode.toString());
}, [darkMode]);
```

### Rules

- Toggle via a Sun/Moon icon button in the header.
- Every `modern-box`, `modern-input`, and `modern-btn` class needs a `.dark` variant in CSS.
- Text: heading text uses `dark:text-white`, body text uses `dark:text-zinc-300`, label text uses `dark:text-zinc-500`.
- Backgrounds: cards use `dark:bg-slate-900/90`, inputs use `dark:bg-slate-800/80`, hover states use `dark:hover:bg-slate-700`.
- Borders: `dark:border-slate-800` for primary, `dark:border-slate-700` for secondary.
- Backdrop overlays keep the same `bg-violet-600/40 backdrop-blur-sm` in both modes.

---

## 10. Animation

Use Framer Motion (`motion/react` import path for v12+).

### Standard Transitions

| Element | Initial | Animate | Exit |
|---------|---------|---------|------|
| Page/section mount | `opacity: 0, y: 20` | `opacity: 1, y: 0` | — |
| Modal content | `opacity: 0, scale: 0.9, y: 20` | `opacity: 1, scale: 1, y: 0` | `opacity: 0, scale: 0.9, y: 20` |
| Modal backdrop | `opacity: 0` | `opacity: 1` | `opacity: 0` |
| Slide-in panel | `opacity: 0, x: 20` | `opacity: 1, x: 0` | `opacity: 0, x: -20` |
| List items | `opacity: 0, y: 10` | `opacity: 1, y: 0` | `opacity: 0, scale: 0.95` |
| Loading spinner | `rotate: 360` | `repeat: Infinity, ease: "linear"` | — |

### Rules

- Wrap any component that conditionally renders with `<AnimatePresence>`.
- Use `mode="wait"` on AnimatePresence when switching between mutually exclusive views (e.g., setup wizard steps).
- Use `mode="popLayout"` on AnimatePresence for lists that reorder.
- Add `layout` prop to list items that reorder for smooth layout animations.
- Collapsible sections use `height: 0/auto` with `overflow: hidden`.
- Buttons use CSS `active:scale-[0.98]` (not Framer Motion) for micro-interactions.

---

## 11. Accessibility

### Keyboard Navigation

- All interactive non-button elements (cards, pills) get `tabIndex={0}` and `onKeyDown` handling Enter and Space.
- Escape closes the topmost modal.
- Nested interactive elements call `e.stopPropagation()` on both click and keydown.
- `autoFocus` on the primary input in every modal and form.

### Screen Readers and Semantics

- Every icon-only button gets a `title` attribute describing its action.
- Role badges and status indicators use visible text (not just color).
- Focus rings: `focus:ring-2 focus:ring-violet-500 outline-none` on all interactive elements.

---

## 12. Recurring Data Pattern (Template + Instance)

For any entity that repeats on a schedule (chores, events, habits), use the template-instance pattern.

### Database Model

The template chore has `isRecurring: true`, a `recurrence` type, a `recurrenceInterval`, and a `dueDate` that represents the *next* occurrence. When a user completes an occurrence:

1. Create a new "done" record with `originalChoreId` pointing to the template, `isRecurring: false`, and a `completedAt` timestamp.
2. Advance the template's `dueDate` to the next occurrence based on `recurrence` and `recurrenceInterval`.

### Client-Side Projections

Future occurrences are computed in the UI, never stored in the database.

- Starting from the template's current `dueDate`, step forward by interval until you pass the calendar day being rendered.
- If a day already has a completed instance for the same `originalChoreId`, don't show the projection.
- Projected chores get a synthetic ID: `${templateId}-projected-${timestamp}`.
- When a projected occurrence is toggled, extract the template ID and timestamp from the synthetic ID.

### Edge Cases to Handle

- Monthly recurrence on the 31st (months with fewer days).
- End dates that terminate the recurrence.
- "Edit this occurrence only" creates a new non-recurring instance and advances the template.
- "Edit entire series" updates the template directly.
- Undoing a completed recurring chore (marking pending again) should not create duplicate projections.

---

## 13. Calendar View

### Layout

- 7-column CSS grid for the day grid.
- Header row: `text-[10px] font-bold uppercase tracking-widest` day abbreviations.
- Day cells: `min-h-[140px]`, border-r and border-b with subtle borders.
- Days outside the current month get reduced opacity background.
- Today gets a `bg-violet-600 text-white` circle on the day number.

### Navigation

- Month and year dropdowns (custom select components, not native `<select>`).
- Prev/Next month buttons with `ChevronLeft`/`ChevronRight` icons.
- "Today" button that resets to current date.
- All nav buttons get `onKeyDown` handlers for Enter/Space.

### Mobile

- Wrap the calendar grid in a container with `overflow-x-auto custom-scrollbar`.
- Set `min-w-[700px]` on the inner grid so it scrolls horizontally on small screens rather than collapsing to an unusable state.

---

## 14. AI Integration

### Structured Output (Suggestions)

When you need the AI to return structured data, use JSON schema enforcement.

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          points: { type: Type.INTEGER },
          recurrence: { type: Type.STRING },
        },
        required: ["title", "points", "recurrence"]
      }
    }
  }
});
const parsed = JSON.parse(response.text.trim());
```

**Rules:**

- Always use `responseMimeType: "application/json"` with a `responseSchema` when you need structured data. Don't rely on prompt engineering alone.
- Parse with `JSON.parse` inside a try/catch. Show an error state on failure.
- Display suggestions as selectable cards with checkboxes, not a list. Users should be able to preview, edit inline, then batch-add selected items.

### Freeform Analysis (Habits)

When you need prose output, request Markdown and render with `react-markdown` + `@tailwindcss/typography`.

```tsx
<div className="prose prose-zinc dark:prose-invert max-w-none">
  <ReactMarkdown>{analysis || ''}</ReactMarkdown>
</div>
```

**Rules:**

- Include the current date in the prompt so the AI can reason about recency.
- Send only the data the AI needs (chore titles, member names, statuses, dates). Don't send IDs or internal metadata.
- Specify the tone in the prompt: "warm, encouraging, constructive."
- Always show a loading spinner with descriptive text ("Analyzing family habits...").

### General AI Rules

- API keys go in environment variables or the platform's secrets manager. Never hardcode.
- Vite exposes env vars via `process.env.VARIABLE_NAME` defined in `vite.config.ts`, not `import.meta.env`.
- AI features should degrade gracefully. If the API call fails, show an error with a retry button. Don't crash the app.
- AI modals are Organizer-only in role-based apps.

---

## 15. Security Rules (Firestore/Supabase)

### Helper Functions

Define reusable rule helpers at the top of your security rules file.

```
isAuthenticated()        — request.auth != null
isOwner(userId)          — auth.uid == userId
isFamilyMember(familyId) — user's profile has matching familyId
isFamilyOrganizer(familyId) — member + role == 'organizer'
```

### Rules of Thumb

- Users can only read/write within their own family scope.
- Users can only update their own profile.
- `uid` and `createdAt` fields are immutable after creation.
- `familyId` and `createdBy` on chores are immutable after creation.
- Validate all fields with `hasOnlyAllowedFields` and `hasRequiredFields` to reject unexpected data.
- String fields get min/max length validation.
- Timestamp fields get type checks: `data.field is timestamp`.
- Number fields get type checks: `data.field is number`.
- Boolean fields get type checks: `data.field is bool`.
- Role escalation (contributor → organizer) requires the user to be listed in the family's `organizerIds`.
- Reading families is open to all authenticated users (needed for invite code lookup).
- Add a `test/connection` document with open read access for connection testing.

---

## 16. Vite Configuration

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
  };
});
```

**Rules:**

- Use `@tailwindcss/vite` plugin for Tailwind v4 (not PostCSS config).
- Load environment variables with `loadEnv` and expose them via `define`. Don't use `import.meta.env` for secrets that need server-side access.
- Set `@` alias to project root for clean imports.
- TypeScript target: `ES2022`. Module resolution: `bundler`. JSX: `react-jsx`.

---

## 17. Dependencies (Recommended Stack)

| Package | Purpose | Why This One |
|---------|---------|-------------|
| `react` + `react-dom` | UI framework | v19 for concurrent features |
| `typescript` | Type safety | Non-negotiable |
| `tailwindcss` v4 | Styling | Utility-first, dark mode, responsive |
| `@tailwindcss/typography` | Prose rendering | For AI-generated Markdown content |
| `clsx` + `tailwind-merge` | Class merging | Conditional classes without conflicts |
| `motion` (Framer Motion) | Animation | AnimatePresence, layout animations |
| `date-fns` | Date manipulation | Tree-shakeable, immutable, no moment.js |
| `lucide-react` | Icons | Consistent, lightweight, tree-shakeable |
| `firebase` or `@supabase/supabase-js` | Backend | Auth + DB + realtime |
| `react-markdown` | Markdown rendering | For AI analysis output |
| `recharts` | Charts (if needed) | React-native, composable |
| `vite` | Build tool | Fast HMR, ESM-native |

Avoid adding dependencies unless a feature genuinely requires them. Every modal, dropdown, and toggle in Done & Dusted is hand-built with React + Tailwind. No component library.

---

## 18. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `ChoreCard`, `ManageFamilyModal` |
| Service objects | camelCase with entity prefix | `choreService`, `userService` |
| Service methods | camelCase verb-first | `addChore`, `toggleChoreStatus`, `subscribeToChores` |
| Types/Interfaces | PascalCase | `UserProfile`, `Chore`, `Family` |
| Enums | PascalCase with UPPER_CASE values | `OperationType.CREATE` |
| CSS utility classes | kebab-case | `modern-box`, `modern-btn`, `custom-scrollbar` |
| State variables | camelCase descriptive | `showModal`, `editingChore`, `viewingChore` |
| Boolean state | `is`/`show`/`has` prefix | `isRecurring`, `showManageFamily`, `loading` |
| Event handlers | `handle` prefix | `handleAddChore`, `handleToggle`, `handleSubmit` |
| Database fields | camelCase (Firestore) or snake_case (Supabase) | Match your backend convention |

---

## 19. Performance

- Realtime subscriptions fire on every change. Don't re-subscribe on every render. Put subscriptions in `useEffect` with stable dependencies.
- Calendar projections are computed on render. For apps with hundreds of recurring items, memoize with `useMemo`.
- Use `AnimatePresence mode="popLayout"` (not `mode="wait"`) for lists so removed items animate out while new items animate in simultaneously.
- `layout` prop on motion.div triggers layout measurement on every render. Only apply it to items that actually reorder.
- Filter and sort operations (`chores.filter().sort()`) run on every render. For large datasets, memoize the result.

---

## 20. Checklist Before Shipping

- [ ] All modals close on Escape and click-outside
- [ ] All icon-only buttons have `title` attributes
- [ ] All interactive non-button elements have `tabIndex={0}` + keyboard handlers
- [ ] All forms have loading + error states
- [ ] All service functions have error handling with context
- [ ] Dark mode works on every component (check cards, inputs, modals, badges, borders)
- [ ] Mobile layout tested (calendar scrolls, modals fit, text doesn't overflow)
- [ ] Realtime subscriptions clean up on unmount
- [ ] Auth listener cleans up on unmount
- [ ] API keys are in environment variables, not hardcoded
- [ ] Firestore/Supabase security rules validate all fields and enforce role-based access
- [ ] Recurring logic handles: mark done, undo, edit single vs. series, monthly edge cases
- [ ] AI features degrade gracefully on API failure
