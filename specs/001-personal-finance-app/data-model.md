# Data Model: Personal Finance Management App

**Branch**: `001-personal-finance-app` | **Date**: 2026-03-25
**Phase**: 1 — Derived from spec.md entities and research.md decisions

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── Enums ─────────────────────────────────────────────────────────────────

enum CategoryType {
  DEFAULT
  CUSTOM
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum RecurringFrequency {
  WEEKLY
  MONTHLY
  YEARLY
}

enum SavingsGoalStatus {
  ACTIVE
  COMPLETED
}

// ─── Models ────────────────────────────────────────────────────────────────

model Category {
  id           String        @id @default(cuid())
  name         String        @unique
  type         CategoryType  @default(CUSTOM)
  transactions Transaction[]
  budget       Budget?
  createdAt    DateTime      @default(now())
}

model Transaction {
  id                 String              @id @default(cuid())
  type               TransactionType
  amount             Decimal
  currency           String              @default("USD")
  category           Category            @relation(fields: [categoryId], references: [id])
  categoryId         String
  date               DateTime
  notes              String?
  isRecurring        Boolean             @default(false)
  recurringFrequency RecurringFrequency?
  recurringNextDate  DateTime?
  recurringParentId  String?
  recurringParent    Transaction?        @relation("RecurringSeries", fields: [recurringParentId], references: [id])
  recurringChildren  Transaction[]       @relation("RecurringSeries")
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
}

model Budget {
  id           String   @id @default(cuid())
  category     Category @relation(fields: [categoryId], references: [id])
  categoryId   String   @unique
  monthlyLimit Decimal
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model SavingsGoal {
  id            String            @id @default(cuid())
  name          String
  targetAmount  Decimal
  targetDate    DateTime?
  status        SavingsGoalStatus @default(ACTIVE)
  contributions Contribution[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

model Contribution {
  id            String      @id @default(cuid())
  savingsGoal   SavingsGoal @relation(fields: [savingsGoalId], references: [id])
  savingsGoalId String
  amount        Decimal
  date          DateTime
  createdAt     DateTime    @default(now())
}
```

---

## Entity Descriptions

### Category
Classifies transactions and optionally carries a budget. Default categories are seeded on first run and cannot be deleted while transactions exist.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | String (unique) | Display label |
| type | CategoryType | DEFAULT or CUSTOM |
| transactions | Transaction[] | Relation — blocks deletion if non-empty |
| budget | Budget? | One-to-one optional relation |
| createdAt | DateTime | |

**Seeded default names**: Housing, Food & Dining, Transport, Utilities, Healthcare, Entertainment, Shopping, Education, Income, Other

---

### Transaction
Core financial event. Recurring transactions form a chain via `recurringParentId`. The original "series root" transaction holds `isRecurring=true` and `recurringNextDate`; generated children reference back via `recurringParentId`.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| type | TransactionType | INCOME or EXPENSE |
| amount | Decimal | Positive non-zero (validated by Zod) |
| currency | String | Defaults to "USD" |
| categoryId | String | FK → Category |
| date | DateTime | The effective date of the transaction |
| notes | String? | Optional free text |
| isRecurring | Boolean | True only on series root records |
| recurringFrequency | RecurringFrequency? | WEEKLY / MONTHLY / YEARLY; null for non-recurring |
| recurringNextDate | DateTime? | Next generation date; null after series is stopped |
| recurringParentId | String? | FK → Transaction (self-relation); null for root or one-off |
| createdAt / updatedAt | DateTime | Audit timestamps |

**Edit scope behaviour**: When a user edits a root recurring transaction with "this and future" scope, the system updates the root record AND any un-generated future children fields. Past generated children are never modified.

---

### Budget
One budget per category, representing the monthly spending limit. Current-month spending is always **computed at query time** (see research.md §5) — never stored.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| categoryId | String (unique) | FK → Category; one budget per category |
| monthlyLimit | Decimal | Positive non-zero |
| createdAt | DateTime | Used to determine mid-month zero-start cutoff |
| updatedAt | DateTime | |

**Spending computation**: `SUM(transaction.amount) WHERE categoryId = budget.categoryId AND type = EXPENSE AND date >= MAX(startOfCurrentMonth, budget.createdAt) AND date < startOfNextMonth`

**Budget state thresholds**:
- Green: spending / monthlyLimit < 0.75
- Yellow: 0.75 ≤ spending / monthlyLimit < 1.0
- Red: spending / monthlyLimit ≥ 1.0

---

### SavingsGoal
A named savings target. `status` transitions to COMPLETED automatically when total contributions ≥ `targetAmount`. Contributions are a separate model and do not appear in the transaction list.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | String | Display label |
| targetAmount | Decimal | Positive non-zero |
| targetDate | DateTime? | Optional deadline; no auto-expiry on pass |
| status | SavingsGoalStatus | ACTIVE or COMPLETED; set by server on contribution |
| contributions | Contribution[] | Relation |
| createdAt / updatedAt | DateTime | |

---

### Contribution
An explicit allocation toward a savings goal. Amounts are summed to derive progress.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| savingsGoalId | String | FK → SavingsGoal |
| amount | Decimal | Positive non-zero |
| date | DateTime | Date of the contribution |
| createdAt | DateTime | |

---

## Entity Relationship Diagram

```
Category (1) ──────────────── (N) Transaction
Category (1) ──────────────── (0..1) Budget

Transaction (1) ────────────── (N) Transaction   [self: recurringParent → recurringChildren]

SavingsGoal (1) ─────────────── (N) Contribution
```

---

## Zod Validation Schemas (summary)

```typescript
// lib/validations/transaction.ts
const CreateTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  categoryId: z.string().cuid(),
  date: z.coerce.date(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).optional(),
}).refine(
  (d) => !d.isRecurring || d.recurringFrequency != null,
  { message: "recurringFrequency required when isRecurring is true", path: ["recurringFrequency"] }
);

const EditTransactionSchema = CreateTransactionSchema.partial().extend({
  scope: z.enum(["this", "this-and-future"]).default("this"),
});

// lib/validations/budget.ts
const CreateBudgetSchema = z.object({
  categoryId: z.string().cuid(),
  monthlyLimit: z.number().positive(),
});

// lib/validations/savings-goal.ts
const CreateSavingsGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  targetDate: z.coerce.date().optional(),
});

// lib/validations/contribution.ts
const CreateContributionSchema = z.object({
  amount: z.number().positive(),
  date: z.coerce.date(),
});

// lib/validations/category.ts
const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
});
```

---

## State Ownership Map

| Data | Owner | Invalidation Trigger |
|------|-------|---------------------|
| Transaction list | TanStack Query (`/api/transactions`) | Create, edit, delete transaction; generate-recurring |
| Budget list + computed spending | TanStack Query (`/api/budgets`) | Create/edit/delete transaction; create/edit/delete budget |
| Dashboard aggregates | TanStack Query (`/api/dashboard`) | Any transaction mutation |
| Savings goals + contributions | TanStack Query (`/api/savings-goals`) | Create contribution; edit/delete goal |
| Categories | TanStack Query (`/api/categories`) | Create/delete category |
| Selected time range | Zustand `ui-store` | User interaction only |
| Active modal identity | Zustand `ui-store` | User interaction only |
| Active transaction filters | Zustand `ui-store` | User interaction only |
| Recurring generation flag (today) | Zustand `ui-store` | Reset on next calendar day |

---

## Migration Strategy

1. `prisma migrate dev --name init` creates all tables and seeds default categories via `prisma/seed.ts`.
2. Subsequent schema changes use named migrations (`prisma migrate dev --name <description>`).
3. No migration rollback strategy required for SQLite in single-user local dev context.
