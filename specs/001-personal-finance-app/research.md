# Research: Personal Finance Management App

**Branch**: `001-personal-finance-app` | **Date**: 2026-03-25
**Phase**: 0 — Resolves all NEEDS CLARIFICATION items from Technical Context

---

## 1. Chart Library

**Decision**: Recharts 2.x  
**Rationale**: Recharts is a React-first, declarative chart library built on D3. It composes naturally with React components, supports all required chart types (PieChart/ResponsiveContainer for category donut, BarChart/LineChart for trends), has first-class TypeScript types, and is compatible with Tailwind styling through className props. It is the de-facto standard for React/Next.js charting with minimal setup overhead.  
**Alternatives considered**:
- Chart.js + react-chartjs-2: More complex API, canvas-based (harder to style consistently with Tailwind), requires additional adapter setup for React.
- Victory: Smaller ecosystem, weaker TypeScript support as of 2025.
- visx (Airbnb): Extremely low-level, requires significant boilerplate for standard charts.

---

## 2. State Management Split: TanStack Query vs Zustand

**Decision**: TanStack Query v5 for all server-derived state; Zustand 4 for UI-only ephemeral state  
**Rationale**: Constitution Principle IV mandates this exact split. TanStack Query's stale-while-revalidate model means budget indicators update in the same interaction cycle after a transaction mutation (via `invalidateQueries`). Zustand holds: selected dashboard time period (weekly/monthly/yearly), open modal identity, and active transaction filter state. These are transient UI concerns that must not pollute the server-state cache.  
**Alternatives considered**:
- Redux Toolkit: Vastly heavier for this use case; RTK Query overlaps with TanStack Query.
- React context + useReducer: Does not provide built-in caching, background refetch, or optimistic update primitives.
- SWR: Viable but TanStack Query v5 is more mature for mutations/invalidation patterns needed here.

---

## 3. CSV Export in Next.js

**Decision**: Route Handler (`GET /api/transactions/export`) that streams a CSV response; client uses `<a href>` download link  
**Rationale**: papaparse's `unparse()` function serializes an array of transaction objects into a well-formed CSV string. The Route Handler sets `Content-Type: text/csv` and `Content-Disposition: attachment; filename="transactions.csv"` headers. The client triggers the download by navigating to the URL or using `window.open`. This avoids loading a large CSV into a React component's memory and is framework-native.  
**Alternatives considered**:
- Client-side CSV generation: Works but loads all data into the client bundle; less suitable if history grows.
- Server Action with `redirect`: Not appropriate for file downloads.

---

## 4. Recurring Transaction Generation Strategy

**Decision**: On-demand via `POST /api/transactions/generate-recurring`, called once on app mount via TanStack Query mutation (with deduplication via a `lastGeneratedAt` timestamp check)  
**Rationale**: The spec assumption states "generation occurs when the application is opened; background scheduling not assumed." A Route Handler called from the root layout's client component on mount checks each active recurring transaction's `recurringNextDate`. If it is on or before today, it creates a new transaction record and advances `recurringNextDate` to the next interval. The call is idempotent — if already called today (checked via a client-side flag in Zustand), it is skipped.  
**Key algorithm**:
1. Query all transactions where `isRecurring = true` AND `recurringNextDate <= today`.
2. For each, insert a new transaction with `date = recurringNextDate`, compute new `recurringNextDate` based on frequency.
3. Handle invalid dates (e.g., Feb 30): clamp to last valid day of the target month using `date-fns`'s `endOfMonth` helper.
**Alternatives considered**:
- Cron job / background worker: Requires infrastructure; out of scope per spec assumptions.
- Database trigger: Not supported by Prisma/SQLite without raw SQL extensions.

---

## 5. Budget Mid-Month Spending Computation

**Decision**: Budget spending is computed dynamically at query time — sum of expense transactions in the current calendar month where `transaction.date >= budget.createdAt`  
**Rationale**: The spec clarified that budgets created mid-month start at zero; only transactions dated on or after `budget.createdAt` count. Since spending is always computed from raw transactions (not stored in a separate counter), this is implemented as a `_sum` aggregation in the Prisma query: `WHERE categoryId = budget.categoryId AND type = EXPENSE AND date >= MAX(startOfMonth, budget.createdAt) AND date < startOfNextMonth`. This keeps the data model clean (no denormalized counters) and is always in sync after any transaction mutation.  
**Alternatives considered**:
- Storing a running `currentMonthSpending` on the Budget model: Requires careful synchronization on every transaction create/edit/delete; error-prone. Rejected.

---

## 6. Savings Goal Contributions vs Transaction Records

**Decision**: Contributions are a separate `Contribution` model, NOT linked to `Transaction` records  
**Rationale**: Spec assumption: contributions do not appear in or affect transaction list totals. If contributions were entered as income transactions, they would inflate dashboard income charts and CSV exports. A separate model keeps the accounting clean. Contributions have their own `amount` and `date` fields. Dashboard savings widget reads from `Contribution` aggregations.  
**Alternatives considered**:
- Contributions as a special Transaction type: Pollutes the main transaction list; complicates all filter/aggregation queries.

---

## 7. Form Validation Architecture

**Decision**: React Hook Form + Zod at form layer; same Zod schema re-used in Route Handler for server-side validation  
**Rationale**: Constitution Principle III requires Zod for all financial inputs. Sharing the same schema between the form (`zodResolver`) and the Route Handler eliminates duplication and guarantees identical rules at both trust boundaries. Key validation rules:
- `amount`: `z.number().positive()` — zero amounts rejected (edge case resolved)
- `date`: `z.coerce.date()` — coerces ISO string to Date on the server
- `category`: must reference an existing category ID (Prisma foreign key enforced at DB level)
- `recurringFrequency`: enum or null; required when `isRecurring = true`  
**Alternatives considered**:
- Yup: Weaker TypeScript inference, less composable with tRPC/manual routes.
- Manual validation: Rejected per constitution.

---

## 8. PWA Configuration

**Decision**: `next-pwa` package (Serwist fork) for service worker + `public/manifest.json` for install metadata  
**Rationale**: Next.js 14 App Router does not ship built-in PWA support. The `@serwist/next` package (the modern community-maintained fork of workbox/next-pwa, compatible with App Router) adds a service worker with a network-first caching strategy for page navigations. The `manifest.json` registers the app for installability. SQLite data lives in the server-side file system (`prisma/dev.db`); the service worker handles UI caching only — data is always live from the server.  
**Alternatives considered**:
- No PWA: Valid initial scope reduction; the spec assumption mentions "installable as a PWA" but it is not a hard FR. Defer to a quickstart note rather than blocking the core build.

---

## 9. Date Utilities

**Decision**: `date-fns` 3.x  
**Rationale**: Lightweight, tree-shakeable, pure functions. Required utilities: `startOfMonth`, `endOfMonth`, `addWeeks`, `addMonths`, `addYears`, `isAfter`, `isBefore`, `format`. `date-fns` is already a common transitive dependency in Next.js projects and adds minimal bundle size overhead.  
**Alternatives considered**:
- `dayjs`: Comparable, but `date-fns` has better TypeScript support and no global state.
- `luxon`: Heavier, timezone-heavy API unnecessary for this use case.
- Native `Date` arithmetic: Error-prone for month-end clamping (the Feb 30 edge case).

---

## Summary Decision Table

| Concern | Chosen Solution |
|---------|----------------|
| Charting | Recharts 2.x |
| Server state | TanStack Query v5 |
| UI state | Zustand 4 |
| Forms + validation | React Hook Form + Zod (shared client/server schema) |
| CSV export | Route Handler + papaparse (server-side) |
| Recurring generation | On-mount POST to `/api/transactions/generate-recurring` |
| Budget spending | Dynamic Prisma aggregation at query time |
| Contributions vs transactions | Separate `Contribution` model |
| Date utilities | date-fns 3.x |
| PWA | @serwist/next (deferred to post-MVP quickstart note) |
