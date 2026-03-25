# Tasks: Personal Finance Management App

**Branch**: `001-personal-finance-app`
**Input**: Design documents from `/specs/001-personal-finance-app/`
**Stack**: Next.js 14+ App Router · TypeScript 5.x strict · Prisma 5+ / SQLite · TanStack Query v5 · Zustand 4 · React Hook Form 7 + Zod 3 · shadcn/ui · Tailwind CSS 3 · Recharts 2.x · papaparse · date-fns 3.x
**Tests**: None (excluded per user request — see plan.md Complexity Tracking)
**Generated**: 2026-03-25

## Format

- **[P]**: Task operates on a distinct file with no unresolved dependencies — can run in parallel
- **[USn]**: User story this task belongs to (US1–US5)
- All file paths are relative to `personal-finance-app/` (the Next.js project root)

---

## Phase 1: Setup

**Purpose**: Scaffold the Next.js project and install all dependencies before any feature work begins.

- [X] T001 Scaffold a new Next.js 14+ project in `personal-finance-app/` using `create-next-app@latest` with flags `--typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"`
- [X] T002 [P] Install all additional runtime dependencies in `personal-finance-app/`: `@prisma/client`, `prisma`, `@tanstack/react-query@^5`, `@tanstack/react-query-devtools`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`, `recharts`, `papaparse`, `@types/papaparse`, `date-fns`, `sonner`, `ts-node`
- [X] T003 [P] Configure TypeScript strict mode in `personal-finance-app/tsconfig.json`: ensure `"strict": true`, `"noUncheckedIndexedAccess": true`, and `"forceConsistentCasingInFileNames": true` are set under `compilerOptions`
- [X] T004 [P] Initialize shadcn/ui in `personal-finance-app/` with `npx shadcn@latest init` (New York style, CSS variables), then add components: `button card dialog input label progress select textarea badge sonner separator sheet`

**Checkpoint**: Project scaffolded, all packages installed, TypeScript strict, shadcn/ui ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma schema, seed data, Zod schemas, Zustand store, and Next.js providers. **Every user story depends on this phase being complete.**

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Create `personal-finance-app/prisma/schema.prisma` with SQLite provider (`url = env("DATABASE_URL")`), `prisma-client-js` generator, and all models and enums: enums `CategoryType {DEFAULT CUSTOM}`, `TransactionType {INCOME EXPENSE}`, `RecurringFrequency {WEEKLY MONTHLY YEARLY}`, `SavingsGoalStatus {ACTIVE COMPLETED}`; model `Category` (id:String @id @default(cuid()), name:String @unique, type:CategoryType @default(CUSTOM), transactions:Transaction[], budget:Budget?, createdAt:DateTime @default(now())); model `Transaction` (id, type:TransactionType, amount:Decimal, currency:String @default("USD"), category:Category @relation(fields:[categoryId], references:[id]), categoryId:String, date:DateTime, notes:String?, isRecurring:Boolean @default(false), recurringFrequency:RecurringFrequency?, recurringNextDate:DateTime?, recurringParentId:String?, recurringParent:Transaction? @relation("RecurringSeries" fields:[recurringParentId] references:[id]), recurringChildren:Transaction[] @relation("RecurringSeries"), createdAt:DateTime @default(now()), updatedAt:DateTime @updatedAt); model `Budget` (id, categoryId:String @unique, category:Category @relation(fields:[categoryId] references:[id]), monthlyLimit:Decimal, createdAt:DateTime @default(now()), updatedAt:DateTime @updatedAt); model `SavingsGoal` (id, name:String, targetAmount:Decimal, targetDate:DateTime?, status:SavingsGoalStatus @default(ACTIVE), contributions:Contribution[], createdAt:DateTime @default(now()), updatedAt:DateTime @updatedAt); model `Contribution` (id, savingsGoalId:String, savingsGoal:SavingsGoal @relation(fields:[savingsGoalId] references:[id]), amount:Decimal, date:DateTime, createdAt:DateTime @default(now()))
- [X] T006 Create `personal-finance-app/prisma/seed.ts` that upserts 10 default Category records with `type: "DEFAULT"` and names: Housing, Food & Dining, Transport, Utilities, Healthcare, Entertainment, Shopping, Education, Income, Other; add seed config to `personal-finance-app/package.json` under `"prisma": {"seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"}`; create `personal-finance-app/.env` with `DATABASE_URL="file:./dev.db"`; run `npx prisma migrate dev --name init` then `npx prisma db seed`
- [X] T007 [P] Create Prisma client singleton in `personal-finance-app/lib/db.ts`: declare `global.prisma` on the NodeJS global type; export `const prisma` that reuses `global.prisma` in development (to avoid connection exhaustion on hot-reload) or creates a new `PrismaClient` instance; assign to `global.prisma` outside of production
- [X] T008 [P] Create all Zod validation schemas in `personal-finance-app/lib/validations/`: `category.ts` exporting `CreateCategorySchema = z.object({ name: z.string().min(1) })`; `transaction.ts` exporting `CreateTransactionSchema` (type:enum(["INCOME","EXPENSE"]), amount:z.number().positive(), currency:z.string().default("USD"), categoryId:z.string().cuid(), date:z.coerce.date(), notes:z.string().optional(), isRecurring:z.boolean().default(false), recurringFrequency:z.enum(["WEEKLY","MONTHLY","YEARLY"]).optional()) with `.refine(d => !d.isRecurring || d.recurringFrequency != null, { message:"recurringFrequency required when isRecurring is true", path:["recurringFrequency"] })`, and `EditTransactionSchema = CreateTransactionSchema.partial().extend({ scope: z.enum(["this","this-and-future"]).default("this") })`; `budget.ts` exporting `CreateBudgetSchema = z.object({ categoryId: z.string().cuid(), monthlyLimit: z.number().positive() })` and `UpdateBudgetSchema = z.object({ monthlyLimit: z.number().positive() })`; `savings-goal.ts` exporting `CreateSavingsGoalSchema = z.object({ name: z.string().min(1), targetAmount: z.number().positive(), targetDate: z.coerce.date().optional() })` and `UpdateSavingsGoalSchema = CreateSavingsGoalSchema.partial()`; `contribution.ts` exporting `CreateContributionSchema = z.object({ amount: z.number().positive(), date: z.coerce.date() })`
- [X] T009 [P] Create Zustand UI store in `personal-finance-app/store/ui-store.ts`: export `useUiStore` with state `selectedPeriod: "weekly" | "monthly" | "yearly"` (default `"monthly"`), `activeModal: string | null` (default `null`), `transactionFilters: { categoryId?: string; type?: "INCOME" | "EXPENSE"; dateFrom?: string; dateTo?: string }` (default `{}`); and setter actions `setSelectedPeriod`, `setActiveModal`, `setTransactionFilters`, `clearTransactionFilters`
- [X] T010 Create TanStack Query provider in `personal-finance-app/app/providers.tsx` as a `"use client"` component: initialize `queryClient` with `useState(() => new QueryClient())` to prevent re-creation on renders; wrap `children` with `<QueryClientProvider client={queryClient}>`; optionally include `<ReactQueryDevtools initialIsOpen={false} />`
- [X] T011 Create root layout in `personal-finance-app/app/layout.tsx`: import and render `<Providers>` wrapping all children, `<Toaster>` from sonner (for global toast notifications), set metadata `{ title: "Personal Finance", description: "Personal Finance Management App" }`, apply `className="min-h-screen bg-background font-sans antialiased"` on body; import `Navigation` component from `@/components/ui/Navigation` and render it inside the layout body (create the Navigation file as a placeholder if it does not yet exist)
- [X] T012 [P] Create `personal-finance-app/next.config.ts` exporting `const nextConfig: NextConfig = { reactStrictMode: true }` with `export default nextConfig`; create `personal-finance-app/public/manifest.json` with fields `name: "Personal Finance"`, `short_name: "Finance"`, `start_url: "/"`, `display: "standalone"`, `background_color: "#ffffff"`, `theme_color: "#000000"`, `icons: []`

**Checkpoint**: `npx prisma studio` opens with seeded categories. `npm run dev` starts without errors. All Zod schemas importable. Zustand store accessible.

---

## Phase 3: User Story 1 — Track Daily Transactions (Priority: P1) 🎯 MVP

**Goal**: Users can create, list, edit, and delete income/expense transactions including recurring ones. Custom categories can be added; categories with assigned transactions cannot be deleted.

**Independent Test**: Create a custom category "Gym". Add a monthly-recurring expense of $50 under "Gym" dated today. Verify it appears in the transaction list. Edit its amount to $55 (this occurrence only). Verify the list shows $55. Open the transactions page a second time — verify the recurring logic fires and a new $55 instance is NOT yet created (recurringNextDate is next month). Delete the original transaction. Verify the list is empty. Attempt to delete a default category that has a transaction — verify a 409 error is shown.

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement `GET /api/categories` and `POST /api/categories` in `personal-finance-app/app/api/categories/route.ts`: GET queries all categories ordered by `name ASC` and returns 200 with array `[{ id, name, type, createdAt }]`; POST parses request body with `CreateCategorySchema` (400 on failure), checks for duplicate `name` with `prisma.category.findFirst` (409 if found), creates record with `type: "CUSTOM"`, returns 201 with the new category object
- [X] T014 [P] [US1] Implement `DELETE /api/categories/:id` in `personal-finance-app/app/api/categories/[id]/route.ts`: find the category (404 if not found); count related transactions with `prisma.transaction.count({ where: { categoryId: id } })`; if count > 0 return 409 `{ error: "Category has assigned transactions. Reassign or delete them first." }`; otherwise delete and return 204
- [X] T015 [P] [US1] Create recurring transaction generation logic in `personal-finance-app/lib/recurring.ts`: export async function `generateRecurringTransactions(prisma: PrismaClient): Promise<number>` that queries all Transaction records where `isRecurring: true` and `recurringNextDate: { lte: new Date() }`; for each found record, creates a child Transaction (same type/amount/currency/categoryId, notes, `isRecurring: false`, `recurringFrequency: null`, `recurringNextDate: null`, `recurringParentId: parent.id`, `date: parent.recurringNextDate`); then computes the next `recurringNextDate` on the parent using date-fns: `addWeeks(current, 1)` for WEEKLY, `addMonths(current, 1)` for MONTHLY, `addYears(current, 1)` for YEARLY — then clamp to end-of-month using `min(computed, endOfMonth(computed))` only when MONTHLY and the source day exceeds the days in the target month; updates parent's `recurringNextDate` with the new value; returns total count of created transactions
- [X] T016 [P] [US1] Implement `GET /api/transactions` and `POST /api/transactions` in `personal-finance-app/app/api/transactions/route.ts`: GET reads optional query params `categoryId`, `type`, `dateFrom`, `dateTo` from `request.nextUrl.searchParams`; builds Prisma `where` clause dynamically; returns transactions ordered `date DESC` with nested `category: { select: { id: true, name: true } }`; serializes `amount` as string; POST validates body with `CreateTransactionSchema` (400), verifies `categoryId` exists (404), computes `recurringNextDate` from `date + frequency` using date-fns when `isRecurring=true`, creates the record, returns 201 with full transaction object
- [X] T017 [P] [US1] Implement `PUT /api/transactions/:id` and `DELETE /api/transactions/:id` in `personal-finance-app/app/api/transactions/[id]/route.ts`: PUT validates with `EditTransactionSchema` (400); finds record (404); if `scope === "this"` updates only the target record; if `scope === "this-and-future"` updates the target AND all `recurringChildren` where `date >= target.date` using `prisma.transaction.updateMany`; returns 200 with updated record; DELETE removes the single record (404 if missing) and returns 204
- [X] T018 [P] [US1] Implement `POST /api/transactions/generate-recurring` in `personal-finance-app/app/api/transactions/generate-recurring/route.ts`: import `generateRecurringTransactions` from `@/lib/recurring`; call it with the Prisma client; return 200 `{ generated: N }`
- [X] T019 [P] [US1] Create TanStack Query hooks in `personal-finance-app/hooks/use-categories.ts`: export `useCategories()` with query key `["categories"]` fetching `GET /api/categories`; `useCreateCategory()` mutation that POSTs `{ name }` and invalidates `["categories"]` on success; `useDeleteCategory()` mutation that calls `DELETE /api/categories/:id` and invalidates `["categories"]` and `["transactions"]` on success
- [X] T020 [P] [US1] Create TanStack Query hooks in `personal-finance-app/hooks/use-transactions.ts`: export `useTransactions(filters?: TransactionFilters)` with query key `["transactions", filters]` that builds `URLSearchParams` from filters and fetches `GET /api/transactions`; `useCreateTransaction()` mutation (POST, invalidates `["transactions"]` and `["dashboard"]`); `useUpdateTransaction()` mutation (PUT /api/transactions/:id with body including `scope`, invalidates `["transactions"]` and `["dashboard"]`); `useDeleteTransaction()` mutation (DELETE, invalidates `["transactions"]` and `["dashboard"]`)
- [X] T021 [P] [US1] Create `TransactionForm` component in `personal-finance-app/components/transactions/TransactionForm.tsx` as `"use client"`: uses React Hook Form with `zodResolver(CreateTransactionSchema)`; renders fields: type (Income/Expense radio group using shadcn RadioGroup or Button toggle), category (shadcn Select populated from `useCategories()`), amount (number Input with `min="0.01"` `step="0.01"`), date (date Input defaulting to today), notes (Textarea optional), isRecurring (Checkbox), recurringFrequency (shadcn Select shown only when isRecurring=true, options: Weekly/Monthly/Yearly); on submit calls `useCreateTransaction()`; displays sonner toast on success (clears form) and on error; accepts optional `onSuccess` callback prop
- [X] T022 [P] [US1] Create `TransactionList` component in `personal-finance-app/components/transactions/TransactionList.tsx` as `"use client"`: calls `useTransactions(filters)` where `filters` comes from the Zustand `transactionFilters` state; renders a responsive table (shadcn Table or div-based) with columns: Type badge (Income=green, Expense=red), Category, Amount, Date (formatted `yyyy-MM-dd`), Notes (truncated), Recurring badge (if applicable), Actions (Edit / Delete); Delete button calls `useDeleteTransaction()` after a shadcn AlertDialog confirmation; Edit button opens an inline Dialog with a pre-filled `TransactionForm` variant (separate `EditTransactionForm` or re-use with default values + scope selector); shows `<EmptyState>` when no transactions match
- [X] T023 [P] [US1] Create `RecurringBadge` component in `personal-finance-app/components/transactions/RecurringBadge.tsx`: accepts `frequency: "WEEKLY" | "MONTHLY" | "YEARLY"` prop; renders a small shadcn Badge with text "Weekly" / "Monthly" / "Yearly" and a repeat icon; only rendered by TransactionList when `transaction.isRecurring === true`
- [X] T024 [P] [US1] Create `CategoryManager` component in `personal-finance-app/components/transactions/CategoryManager.tsx` as `"use client"`: renders a shadcn Sheet (slide-in panel); lists all categories from `useCategories()` grouped into Default and Custom sections; for Custom categories shows a Delete button that calls `useDeleteCategory()` — catches 409 response and shows a sonner toast with the constraint message instead of throwing; includes a small form at the bottom of the sheet to create a new custom category (single name Input + Submit button using `useCreateCategory()`)
- [X] T025 [US1] Create transactions page in `personal-finance-app/app/transactions/page.tsx`: this is a Next.js Server Component; on render, call `fetch("/api/transactions/generate-recurring", { method: "POST" })` server-side to ensure recurring transactions are generated on page load; render a client-side `"use client"` wrapper `TransactionsPageClient` (or inline using Suspense) that composes: a top toolbar with an "Add Transaction" button (opens TransactionForm in a Dialog), a "Manage Categories" button (opens CategoryManager Sheet), an "Export CSV" button (placeholder for T052), and a `<TransactionList />`

**Checkpoint**: US1 fully functional — transactions CRUD works, recurring generation fires on load, categories can be managed.

---

## Phase 4: User Story 2 — Monitor Budget Goals by Category (Priority: P2)

**Goal**: Users can set a monthly spending limit for any category and see live green/yellow/red progress. Budget spending is computed dynamically; mid-month budgets start at zero.

**Independent Test**: Set a Food budget of $400. Add a $300 expense under Food. Verify green state (75%). Add a $25 expense. Verify yellow state (81.25%). Add a $100 expense. Verify red state (>100%). Start of a new month — verify progress resets to zero.

### Implementation for User Story 2

- [X] T026 [P] [US2] Implement `GET /api/budgets` and `POST /api/budgets` in `personal-finance-app/app/api/budgets/route.ts`: GET fetches all budgets with `include: { category: true }`; for each budget computes `currentSpending` using `prisma.transaction.aggregate({ _sum: { amount: true }, where: { categoryId, type: "EXPENSE", date: { gte: MAX(startOfMonth(now()), budget.createdAt), lte: endOfMonth(now()) } } })` using date-fns `startOfMonth` and `endOfMonth`; computes `progressRatio = currentSpending / monthlyLimit`; derives `state`: `"GREEN"` if <0.75, `"YELLOW"` if 0.75–0.99, `"RED"` if ≥1.0; returns 200 with enriched budget array (all Decimal fields as strings); POST validates with `CreateBudgetSchema` (400), checks for existing budget on the same categoryId (409 `"Budget already exists for this category"`), creates and returns 201 with computed spending fields
- [X] T027 [P] [US2] Implement `PUT /api/budgets/:id` and `DELETE /api/budgets/:id` in `personal-finance-app/app/api/budgets/[id]/route.ts`: PUT validates with `UpdateBudgetSchema` (400), finds budget (404), updates `monthlyLimit`, returns 200 with recomputed spending fields (same logic as GET); DELETE finds budget (404), deletes it, returns 204
- [X] T028 [P] [US2] Create TanStack Query hooks in `personal-finance-app/hooks/use-budgets.ts`: `useBudgets()` (query key `["budgets"]`, GET /api/budgets); `useCreateBudget()` mutation (POST, invalidates `["budgets"]`); `useUpdateBudget()` mutation (PUT /api/budgets/:id, invalidates `["budgets"]`); `useDeleteBudget()` mutation (DELETE /api/budgets/:id, invalidates `["budgets"]`)
- [X] T029 [P] [US2] Create `BudgetProgress` component in `personal-finance-app/components/budgets/BudgetProgress.tsx`: accepts props `currentSpending: string`, `monthlyLimit: string`, `progressRatio: number`, `state: "GREEN" | "YELLOW" | "RED"`; renders a shadcn `<Progress value={Math.min(progressRatio * 100, 100)} />` with `className` overriding the indicator color — green (`[&>div]:bg-green-500`) for GREEN, yellow (`[&>div]:bg-yellow-500`) for YELLOW, red (`[&>div]:bg-red-500`) for RED; below the bar shows text `"$X.XX / $Y.YY (Z%)"` with the state label
- [X] T030 [P] [US2] Create `BudgetCard` component in `personal-finance-app/components/budgets/BudgetCard.tsx` as `"use client"`: shadcn Card with header showing category name and state badge; body containing `<BudgetProgress>`; footer with Edit and Delete icon buttons; Delete triggers shadcn AlertDialog confirmation then calls `useDeleteBudget()`; Edit opens a `<BudgetForm>` Dialog pre-filled with existing `monthlyLimit`
- [X] T031 [P] [US2] Create `BudgetForm` dialog component in `personal-finance-app/components/budgets/BudgetForm.tsx` as `"use client"`: React Hook Form + `zodResolver`; when creating (`mode="create"`), shows a category Select populated from `useCategories()` filtered to exclude categories that already have a budget; when editing (`mode="edit"`), shows only the monthlyLimit Input; amount Input (`type="number"` `min="0.01"` `step="0.01"`); calls `useCreateBudget()` or `useUpdateBudget()` on submit; shows sonner toast on success/error; accepts `onClose` prop
- [X] T032 [US2] Create budgets page in `personal-finance-app/app/budgets/page.tsx` as a `"use client"` component: calls `useBudgets()`; renders a responsive grid of `<BudgetCard>` items; includes an "Add Budget" button (opens `<BudgetForm mode="create">` in a Dialog); shows `<EmptyState title="No budgets yet" description="Set a monthly limit for a category to start tracking your spending." />` when the array is empty

**Checkpoint**: US2 fully functional — budget progress reflects live transaction data with colour-coded states.

---

## Phase 5: User Story 3 — View Financial Dashboard (Priority: P3)

**Goal**: Landing page shows current-month summary cards, a spending donut chart, income-vs-expenses trend bars, a net savings trend line, and an active savings goals widget — all updateable by a period selector.

**Independent Test**: Enter 3 expense transactions across 2 categories and 1 income transaction in the current month. Open `localhost:3000`. Verify summary cards show correct income, expenses, and net balance. Verify the spending chart has 2 slices proportional to the 2 categories. Switch period to "Weekly" — verify trend chart updates to show weekly buckets.

### Implementation for User Story 3

- [X] T033 [US3] Implement `GET /api/dashboard` in `personal-finance-app/app/api/dashboard/route.ts`: read `period` query param (default `"monthly"`); compute `summary` by aggregating INCOME and EXPENSE transactions for current calendar month using `startOfMonth(now())` / `endOfMonth(now())`; compute `spendingByCategory` using Prisma `groupBy` on categoryId for EXPENSE in current month, join category names; compute trend buckets — for `weekly`: last 4 ISO weeks; for `monthly`: last 12 calendar months; for `yearly`: last 5 calendar years — for each bucket sum INCOME and EXPENSE and derive `netSavings`; fetch all ACTIVE SavingsGoals with `_sum` on contributions to build `savingsGoalsSummary` (id, name, totalContributed, progressRatio, status); return 200 with `{ summary, spendingByCategory, incomeTrend, netSavingsTrend, savingsGoalsSummary }` (all Decimal fields as strings)
- [X] T034 [P] [US3] Create TanStack Query hook in `personal-finance-app/hooks/use-dashboard.ts`: `useDashboard()` reads `selectedPeriod` from `useUiStore()`; query key `["dashboard", selectedPeriod]`; fetches `GET /api/dashboard?period=${selectedPeriod}` and returns typed dashboard response
- [X] T035 [P] [US3] Create `DashboardSummaryCards` component in `personal-finance-app/components/dashboard/DashboardSummaryCards.tsx` as `"use client"`: accepts `summary` prop (`{ totalIncome, totalExpenses, netBalance, month }`); renders 3 shadcn Cards in a 3-column responsive grid — Total Income (green icon, formatted currency), Total Expenses (red icon, formatted currency), Net Balance (blue icon, formatted currency, negative values shown in red); shows skeleton placeholders while loading
- [X] T036 [P] [US3] Create `SpendingChart` component in `personal-finance-app/components/dashboard/SpendingChart.tsx` as `"use client"`: accepts `data: { categoryName: string; total: string }[]`; renders a Recharts `<PieChart>` with `<Pie dataKey="total" innerRadius="55%" outerRadius="80%">` (donut); each slice gets a distinct color from a fixed palette; includes `<Tooltip>`, `<Legend>`; shows `<EmptyState>` when `data` is empty
- [X] T037 [P] [US3] Create `TrendChart` component in `personal-finance-app/components/dashboard/TrendChart.tsx` as `"use client"`: accepts `incomeTrend` and `netSavingsTrend` arrays; renders a Recharts `<ComposedChart>` with `<Bar dataKey="income">` (green), `<Bar dataKey="expenses">` (red), `<Line dataKey="netSavings">` (blue); includes `<XAxis dataKey="period">`, `<YAxis>`, `<CartesianGrid strokeDasharray="3 3">`, `<Tooltip>`, `<Legend>`; shows `<EmptyState>` when data is empty; uses `ResponsiveContainer width="100%" height={300}`
- [X] T038 [P] [US3] Create `PeriodSelector` component in `personal-finance-app/components/dashboard/PeriodSelector.tsx` as `"use client"`: renders 3 shadcn Button variants (`"outline"` for inactive, `"default"` for active) labelled Weekly, Monthly, Yearly; reads `selectedPeriod` from `useUiStore()` and calls `setSelectedPeriod` on click
- [X] T039 [P] [US3] Create `SavingsWidget` component in `personal-finance-app/components/dashboard/SavingsWidget.tsx` as `"use client"`: accepts `goals: { id, name, progressRatio, status }[]`; renders a compact shadcn Card list with each goal showing name, a mini `<Progress>` bar, and percentage text; shows a "No active savings goals" `<EmptyState>` stub when empty; includes a "View all" link to `/savings-goals`
- [X] T040 [US3] Update `personal-finance-app/app/page.tsx` (the Next.js root/dashboard page): call `POST /api/transactions/generate-recurring` server-side on load; render a `"use client"` `DashboardPageClient` component (or use Suspense boundaries) that composes: `<PeriodSelector>` in the top-right, `<DashboardSummaryCards>` in a top row, `<SpendingChart>` and `<TrendChart>` side-by-side in a 2-column grid, `<SavingsWidget>` below; all components receive data from `useDashboard()`

**Checkpoint**: US3 fully functional — dashboard renders all charts and cards, period selector updates all trend data.

---

## Phase 6: User Story 4 — Create and Track Savings Goals (Priority: P4)

**Goal**: Users can create named savings goals with optional target dates, record manual contributions, and see progress visualized. Goals auto-complete when total contributions reach the target.

**Independent Test**: Create goal "New Laptop" with target $1,200 and target date 3 months ahead. Verify 0% progress shown. Contribute $500 — verify ~41.7% progress. Contribute $800 — verify goal is marked COMPLETED (100%). Verify the dashboard widget reflects the completed goal.

### Implementation for User Story 4

- [X] T041 [P] [US4] Implement `GET /api/savings-goals` and `POST /api/savings-goals` in `personal-finance-app/app/api/savings-goals/route.ts`: GET fetches all goals with `include: { contributions: { select: { amount: true } } }`; computes `totalContributed` (sum of contribution amounts) and `progressRatio` (totalContributed/targetAmount, capped at 1.0) for each goal; returns 200 with enriched array (Decimals as strings); POST validates with `CreateSavingsGoalSchema` (400), creates goal with `status: "ACTIVE"`, returns 201 with `totalContributed: "0.00"`, `progressRatio: 0`
- [X] T042 [P] [US4] Implement `PUT /api/savings-goals/:id` in `personal-finance-app/app/api/savings-goals/[id]/route.ts`: find goal (404); if `status === "COMPLETED"` return 409 `"Cannot edit a completed goal"`; validate with `UpdateSavingsGoalSchema` (400); update allowed fields (name, targetAmount, targetDate); recompute progress fields; return 200 with updated goal
- [X] T043 [P] [US4] Implement `POST /api/savings-goals/:id/contributions` in `personal-finance-app/app/api/savings-goals/[id]/contributions/route.ts`: validate with `CreateContributionSchema` (400); find goal (404); if `status === "COMPLETED"` return 409 `"Goal is already completed"`; create Contribution record; recompute `totalContributed` by summing all contributions for the goal; if `totalContributed >= targetAmount`, update goal `status` to `"COMPLETED"`; return 201 `{ contribution: { id, amount, date, savingsGoalId }, goal: { id, totalContributed, progressRatio, status } }`
- [X] T044 [P] [US4] Create TanStack Query hooks in `personal-finance-app/hooks/use-savings-goals.ts`: `useSavingsGoals()` (query key `["savings-goals"]`, GET /api/savings-goals); `useCreateSavingsGoal()` mutation (POST, invalidates `["savings-goals"]` and `["dashboard"]`); `useUpdateSavingsGoal()` mutation (PUT /api/savings-goals/:id, invalidates `["savings-goals"]` and `["dashboard"]`); `useAddContribution(goalId: string)` mutation (POST /api/savings-goals/:goalId/contributions, invalidates `["savings-goals"]` and `["dashboard"]`)
- [X] T045 [P] [US4] Create `SavingsGoalCard` component in `personal-finance-app/components/savings-goals/SavingsGoalCard.tsx` as `"use client"`: shadcn Card with goal name as title, status badge (ACTIVE=blue, COMPLETED=green), progress bar (`<Progress value={progressRatio * 100} />`), text `"$X.XX / $Y.YY (Z%)"`, optional target date shown as `"Target: yyyy-MM-dd (N days remaining)"` using date-fns `differenceInDays` — omit days-remaining text if date has passed; action buttons: "Add Contribution" (opens ContributionForm Dialog), "Edit" (opens SavingsGoalForm, hidden when COMPLETED); card visually muted when COMPLETED
- [X] T046 [P] [US4] Create `SavingsGoalForm` dialog component in `personal-finance-app/components/savings-goals/SavingsGoalForm.tsx` as `"use client"`: React Hook Form + `zodResolver(CreateSavingsGoalSchema)` (or UpdateSavingsGoalSchema for edit mode); fields: name (Input), targetAmount (number Input `min="0.01"`), targetDate (date Input optional); calls `useCreateSavingsGoal()` in create mode or `useUpdateSavingsGoal()` in edit mode; shows sonner toasts on success/error; accepts `defaultValues` and `onClose` props
- [X] T047 [P] [US4] Create `ContributionForm` dialog component in `personal-finance-app/components/savings-goals/ContributionForm.tsx` as `"use client"`: React Hook Form + `zodResolver(CreateContributionSchema)`; fields: amount (number Input `min="0.01"`), date (date Input defaults to today); calls `useAddContribution(goalId)` on submit; on success: if response `goal.status === "COMPLETED"` show a special sonner toast "🎉 Goal completed!" in addition to the regular success toast; accepts `goalId` and `onClose` props
- [X] T048 [US4] Create savings goals page in `personal-finance-app/app/savings-goals/page.tsx` as a `"use client"` component: calls `useSavingsGoals()`; renders a responsive grid of `<SavingsGoalCard>` items; includes a "New Goal" button (opens `<SavingsGoalForm mode="create">` in a Dialog); shows `<EmptyState title="No savings goals yet" description="Create a goal to start saving toward something meaningful." />` when the array is empty

**Checkpoint**: US4 fully functional — goals created, contributions tracked, auto-complete fires correctly, dashboard widget reflects current state.

---

## Phase 7: User Story 5 — Export Transactions to CSV (Priority: P5)

**Goal**: Users can download a UTF-8 CSV of all transactions, optionally filtered by category and/or date range.

**Independent Test**: Add 6 transactions across 2 categories. Export all — verify CSV has 6 data rows plus a header row (columns: type, category, amount, currency, date, notes). Filter by one category — verify only matching rows appear. Filter by a date range that excludes 2 transactions — verify 4 rows in the output.

### Implementation for User Story 5

- [X] T049 [P] [US5] Create CSV serialization utility in `personal-finance-app/lib/csv.ts`: import `unparse` from `papaparse` and `format` from `date-fns`; export function `transactionsToCsv(transactions: TransactionWithCategory[]): string` that maps each transaction to an object `{ type, category: transaction.category.name, amount: Number(transaction.amount).toFixed(2), currency, date: format(new Date(transaction.date), "yyyy-MM-dd"), notes: transaction.notes ?? "" }`; calls `unparse({ fields: ["type","category","amount","currency","date","notes"], data: rows })` and returns the UTF-8 CSV string
- [X] T050 [US5] Implement `GET /api/transactions/export` in `personal-finance-app/app/api/transactions/export/route.ts`: read optional query params (`categoryId`, `type`, `dateFrom`, `dateTo`) from `request.nextUrl.searchParams` using the same filtering logic as `GET /api/transactions`; include `category: { select: { name: true } }` in the Prisma query; call `transactionsToCsv()` from `@/lib/csv`; return a `new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=\"transactions.csv\"" } })`
- [X] T051 [P] [US5] Create `ExportDialog` component in `personal-finance-app/components/transactions/ExportDialog.tsx` as `"use client"`: shadcn Dialog with: category Select (optional, populated from `useCategories()`), dateFrom date Input (optional), dateTo date Input (optional); validates that `dateFrom <= dateTo` if both provided (shows inline error); on "Export" click, constructs query string from non-empty fields and sets `window.location.href = "/api/transactions/export?" + params` to trigger the browser's native CSV download; shows "No filters applied — all transactions will be exported" helper text when no filters are selected
- [X] T052 [US5] Wire `<ExportDialog>` into `personal-finance-app/app/transactions/page.tsx`: replace the "Export CSV" placeholder button (added in T025) with a real button that opens the `<ExportDialog>` component via a controlled Dialog state

**Checkpoint**: US5 fully functional — filtered and unfiltered CSV exports download correctly from the transactions page.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Navigation, shared empty states, global error pages, and PWA finalisation.

- [X] T053 [P] Create `Navigation` component in `personal-finance-app/components/ui/Navigation.tsx` as `"use client"`: responsive top navigation bar (or sidebar on larger screens) using shadcn Sheet for mobile; renders nav links to `/` (Dashboard), `/transactions` (Transactions), `/budgets` (Budgets), `/savings-goals` (Savings Goals); uses Next.js `usePathname()` to highlight the active route with a distinct Tailwind style; update `personal-finance-app/app/layout.tsx` to import and render `<Navigation>` replacing any stub
- [X] T054 [P] Create `EmptyState` component in `personal-finance-app/components/ui/EmptyState.tsx`: accepts props `icon?: React.ReactNode`, `title: string`, `description: string`, `action?: React.ReactNode`; renders a centered flex column with the icon, title (heading), description (muted text), and an optional action button slot; wire this component into all existing `<EmptyState>` usages across TransactionList, BudgetCard grid, SavingsGoalCard grid, SpendingChart, and TrendChart
- [X] T055 [P] Add global error handling pages: create `personal-finance-app/app/error.tsx` as a `"use client"` Next.js Error component with a "Something went wrong" heading, error message display, and a "Try again" button calling `reset()`; create `personal-finance-app/app/not-found.tsx` as a server component with a 404 message and a "Go to Dashboard" link pointing to `/`
- [X] T056 Complete PWA configuration: add placeholder icon files `personal-finance-app/public/icon-192.png` and `personal-finance-app/public/icon-512.png` (can use any 192×192 and 512×512 PNG for now); update `personal-finance-app/public/manifest.json` icons array with `[{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" }, { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }]`; add `<link rel="manifest" href="/manifest.json" />` and `<meta name="theme-color" content="#000000" />` to the `<head>` in `personal-finance-app/app/layout.tsx`

**Checkpoint**: Full app navigable, all empty states render correctly, error pages in place, PWA manifest complete.

---

## User Story Dependencies

- **US1 (P1)** — Start after Foundational (Phase 2). No dependencies on other stories. Delivers the core transaction store — prerequisite for meaningful data in US2–US5.
- **US2 (P2)** — Start after Foundational (Phase 2). Code is fully independent of US1; uses the `Category` and `Transaction` models (seeded in Foundational). Meaningful to test only after US1 creates transaction data.
- **US3 (P3)** — Start after Foundational (Phase 2). Dashboard API aggregates existing `Transaction`, `Budget`, and `SavingsGoal` data. No code dependency on US1/US2/US4 — but richer to demo with data from all three.
- **US4 (P4)** — Start after Foundational (Phase 2). Fully independent — own models. Dashboard widget (US3) surfaces US4 data automatically via the dashboard API.
- **US5 (P5)** — Start after Foundational (Phase 2). Reuses the `GET /api/transactions` query logic. Independent of US2–US4.

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 in parallel after T001
- **Phase 2**: T007, T008, T009, T012 in parallel after T005+T006; T010 then T011 sequentially
- **US1**: T013, T014, T015, T016, T017, T018 all in parallel (each a different file); T019, T020, T021, T022, T023, T024 in parallel after API layer exists; T025 after all above
- **US2**: T026, T027, T028, T029, T030, T031 all in parallel; T032 after all above
- **US3**: T034, T035, T036, T037, T038, T039 in parallel after T033 (API must exist first); T040 after all above
- **US4**: T041, T042, T043, T044, T045, T046, T047 all in parallel; T048 after all above
- **US5**: T049, T051 in parallel; T050 after T049; T052 after T050+T051
- **Phase 8**: T053, T054, T055, T056 all in parallel
- **Across stories**: US1, US2, US4, US5 can be developed in parallel by separate developers once Phase 2 completes; US3 benefits from being last but is not technically blocked

---

## Parallel Example: User Story 1

```
# All API Route Handlers (separate files, fully parallel):
T013  →  app/api/categories/route.ts
T014  →  app/api/categories/[id]/route.ts
T015  →  lib/recurring.ts
T016  →  app/api/transactions/route.ts
T017  →  app/api/transactions/[id]/route.ts
T018  →  app/api/transactions/generate-recurring/route.ts

# All TanStack Query hooks (separate files, parallel with each other):
T019  →  hooks/use-categories.ts
T020  →  hooks/use-transactions.ts

# All UI components (separate files, can develop in parallel alongside hooks):
T021  →  components/transactions/TransactionForm.tsx
T022  →  components/transactions/TransactionList.tsx
T023  →  components/transactions/RecurringBadge.tsx
T024  →  components/transactions/CategoryManager.tsx

# Final integration (depends on all above):
T025  →  app/transactions/page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup** (T001–T004)
2. Complete **Phase 2: Foundational** (T005–T012) ← **REQUIRED — blocks everything**
3. Complete **Phase 3: US1** (T013–T025)
4. **STOP AND VALIDATE**: Test transaction CRUD, recurring generation, and category constraint end-to-end at `localhost:3000/transactions`
5. Deploy or demo — a working personal expense log (MVP)

### Incremental Delivery

1. Phase 1 + Phase 2 → App boots, database migrated, providers ready ✓
2. + US1 (Phase 3) → Full transaction log with categories + recurring ✓ **(MVP!)**
3. + US2 (Phase 4) → Monthly budget goals with live progress indicators ✓
4. + US3 (Phase 5) → Financial dashboard with charts and period selector ✓
5. + US4 (Phase 6) → Savings goals with contributions and auto-completion ✓
6. + US5 (Phase 7) → Filtered CSV export ✓
7. + Phase 8 → Navigation, empty states, error pages, PWA ✓

### Parallel Team Strategy

With multiple developers (after Phase 2 completes):
- **Dev A** → US1 (P1): transactions, categories, recurring logic
- **Dev B** → US2 (P2): budgets, progress indicators
- **Dev C** → US4 (P4): savings goals, contributions
- **Dev D** → US5 (P5): CSV export; then joins US3 (P3) for dashboard charts

---

## Notes

- All paths are relative to `personal-finance-app/` (the Next.js project root created in T001)
- `[P]` tasks operate on distinct files — safe to implement concurrently with other `[P]` tasks in the same phase
- Route Handlers in `app/api/` may NOT use `"use client"` — they run on the server only
- All interactive components (hooks, state, browser APIs) require `"use client"` at the top of the file
- Prisma `Decimal` fields must be serialized as **strings** in all API responses (`amount.toString()`) to preserve precision — see `contracts/api-contracts.md` conventions
- TanStack Query invalidation pattern: transaction mutations → invalidate `["transactions"]` + `["dashboard"]`; contribution mutations → invalidate `["savings-goals"]` + `["dashboard"]`
- Recurring generation endpoint (`POST /api/transactions/generate-recurring`) is idempotent — call it on every transactions and dashboard page load
- Commit after each checkpoint to preserve independently testable increments
