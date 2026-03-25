# Implementation Plan: Personal Finance Management App

**Branch**: `001-personal-finance-app` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-personal-finance-app/spec.md`

## Summary

Build a browser-based personal finance management web application delivered as a single Next.js App Router codebase. Users can track income and expense transactions (with recurring support), set monthly category budgets with visual progress indicators, view a dashboard with chart-based summaries, manage savings goals with progress visualization, and export transactions to CSV. The full stack — React UI, Route Handler APIs, Prisma ORM, SQLite database — lives in one Next.js project. TanStack Query owns all server-state and cache invalidation; Zustand covers lightweight UI state; React Hook Form with Zod handles all validated input.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 14+ (App Router), Prisma 5+, TanStack Query v5, Zustand 4+, React Hook Form 7+, Zod 3+, shadcn/ui, Tailwind CSS 3+, Recharts 2+, papaparse (CSV)
**Storage**: SQLite via Prisma ORM (local file `prisma/dev.db`)
**Testing**: None (explicit user request — see Complexity Tracking for constitution note)
**Target Platform**: Web browser, PWA-installable
**Project Type**: Full-stack web application (Next.js monolith)
**Performance Goals**: Dashboard renders in <2 s with 12 months of data; budget indicators update within the same interaction cycle
**Constraints**: Single-user, browser-local data (standard browser storage assumption), offline-capable via PWA, no auth
**Scale/Scope**: Single user, ~5 screens, ~10 Route Handler endpoints, 6 Prisma models

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js App Router Is The Product Boundary | ✅ PASS | Single Next.js codebase; no separate frontend or API service |
| II. Server Components Default, Client Components By Exception | ✅ PASS | Pages and layouts use RSC; `use client` limited to chart wrappers, form components, and interactive UI leaves |
| III. Strict Types And Validated Data Contracts | ✅ PASS | TypeScript strict enabled; Zod validates all Route Handler inputs, form submissions, and financial amounts |
| IV. Canonical Data Flow And Persistence | ✅ PASS | Prisma + SQLite is single persistence path; TanStack Query owns server state; Zustand limited to UI-only state (e.g., active modal, selected time range) |
| V. Minimal Dependencies And Clean Separation | ✅ PASS | All additions justified: Recharts (charting, no built-in Next.js alternative), papaparse (CSV serialization), shadcn/ui (accessible component base) |
| Testing gate | ⚠️ VIOLATION (justified) | User explicitly excluded tests. See Complexity Tracking. |

## Project Structure

### Documentation (this feature)

```text
specs/001-personal-finance-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-contracts.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created by /speckit.plan)
```

### Source Code (repository root)

```text
personal-finance-app/          # Next.js project root
├── app/
│   ├── layout.tsx             # Root layout (providers: QueryClientProvider, Toaster)
│   ├── page.tsx               # Dashboard (RSC, data fetched server-side)
│   ├── transactions/
│   │   └── page.tsx           # Transaction list + entry form
│   ├── budgets/
│   │   └── page.tsx           # Budget goals screen
│   ├── savings-goals/
│   │   └── page.tsx           # Savings goals screen
│   └── api/
│       ├── transactions/
│       │   ├── route.ts               # GET (list + filters), POST (create)
│       │   ├── [id]/route.ts          # PUT (edit with scope), DELETE
│       │   ├── export/route.ts        # GET (CSV download)
│       │   └── generate-recurring/route.ts  # POST (trigger recurring generation)
│       ├── categories/
│       │   ├── route.ts               # GET, POST
│       │   └── [id]/route.ts          # DELETE (with constraint enforcement)
│       ├── budgets/
│       │   ├── route.ts               # GET (with computed spending), POST
│       │   └── [id]/route.ts          # PUT, DELETE
│       ├── savings-goals/
│       │   ├── route.ts               # GET, POST
│       │   ├── [id]/route.ts          # PUT
│       │   └── [id]/contributions/route.ts  # POST
│       └── dashboard/
│           └── route.ts               # GET (aggregated summary + chart data)
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── dashboard/             # DashboardSummaryCards, SpendingChart, TrendChart, SavingsWidget
│   ├── transactions/          # TransactionList, TransactionForm, RecurringBadge
│   ├── budgets/               # BudgetCard, BudgetProgress
│   └── savings-goals/         # SavingsGoalCard, ContributionForm
├── hooks/
│   ├── use-transactions.ts    # TanStack Query hooks for transactions
│   ├── use-budgets.ts
│   ├── use-savings-goals.ts
│   ├── use-categories.ts
│   └── use-dashboard.ts
├── store/
│   └── ui-store.ts            # Zustand: selected time range, open modals, active filters
├── lib/
│   ├── db.ts                  # Prisma client singleton
│   ├── validations/
│   │   ├── transaction.ts     # Zod schemas for transaction inputs
│   │   ├── budget.ts
│   │   ├── savings-goal.ts
│   │   ├── category.ts
│   │   └── contribution.ts
│   ├── csv.ts                 # CSV serialization using papaparse
│   └── recurring.ts           # Recurring transaction generation logic
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                # Seeds default categories
├── public/
│   └── manifest.json          # PWA manifest
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

**Structure Decision**: Single Next.js App Router project (Option 1 variant). Frontend and backend coexist — RSC pages call Prisma directly at the page level for initial load; Route Handlers serve TanStack Query on the client side. No separate services directory — business logic lives in Route Handlers and `lib/` utilities, keeping the boundary clean without unnecessary abstraction layers.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| No test coverage (constitution §Delivery Workflow requires tests for financial calculations, schema changes, and Route Handler contracts) | User explicitly excluded tests from scope for this version | Acknowledging risk: financial calculation bugs (budget accumulation, savings goal completion, CSV formatting) will only surface at runtime. Recommend adding tests in a follow-up task before production use. |
