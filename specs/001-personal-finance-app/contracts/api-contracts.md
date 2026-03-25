# API Contracts: Personal Finance Management App

**Branch**: `001-personal-finance-app` | **Date**: 2026-03-25
**Platform**: Next.js App Router Route Handlers
**Base path**: `/api`
**Format**: JSON (request/response); `text/csv` for export endpoint
**Auth**: None (single-user local app)

---

## Conventions

- All request bodies are JSON unless noted.
- All successful responses return HTTP 200 (GET/PUT) or 201 (POST) or 204 (DELETE, no body).
- Validation errors return HTTP 400 with `{ error: string, issues?: ZodIssue[] }`.
- Not-found returns HTTP 404 with `{ error: string }`.
- Constraint violations (e.g., deleting a category with transactions) return HTTP 409 with `{ error: string }`.
- Decimal fields are serialized as **strings** in JSON to preserve precision (e.g., `"amount": "42.50"`).
- Dates are serialized as **ISO 8601 strings** (e.g., `"2026-03-25T00:00:00.000Z"`).

---

## Categories

### `GET /api/categories`
Returns all categories ordered by name.

**Response 200**:
```json
[
  { "id": "clxyz", "name": "Food & Dining", "type": "DEFAULT", "createdAt": "..." },
  { "id": "clxyz2", "name": "My Custom Cat", "type": "CUSTOM", "createdAt": "..." }
]
```

### `POST /api/categories`
Creates a new custom category.

**Request body**:
```json
{ "name": "Gym Membership" }
```

**Response 201**:
```json
{ "id": "clxyz3", "name": "Gym Membership", "type": "CUSTOM", "createdAt": "..." }
```

**Errors**: 400 (invalid name), 409 (name already exists)

### `DELETE /api/categories/:id`
Deletes a custom category. Blocked if any transactions reference this category.

**Response 204**: (empty)

**Errors**: 404 (not found), 409 (`{ "error": "Category has assigned transactions. Reassign or delete them first." }`)

---

## Transactions

### `GET /api/transactions`
Returns transactions, optionally filtered. Results ordered by `date DESC`.

**Query parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `categoryId` | string? | Filter by category |
| `type` | `INCOME \| EXPENSE`? | Filter by type |
| `dateFrom` | ISO date? | Inclusive start date |
| `dateTo` | ISO date? | Inclusive end date |

**Response 200**:
```json
[
  {
    "id": "clxyz",
    "type": "EXPENSE",
    "amount": "42.50",
    "currency": "USD",
    "categoryId": "clcat1",
    "category": { "id": "clcat1", "name": "Food & Dining" },
    "date": "2026-03-20T00:00:00.000Z",
    "notes": "Lunch",
    "isRecurring": false,
    "recurringFrequency": null,
    "recurringNextDate": null,
    "recurringParentId": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### `POST /api/transactions`
Creates a new transaction. If `isRecurring=true`, sets `recurringNextDate` based on `date + frequency`.

**Request body**:
```json
{
  "type": "EXPENSE",
  "amount": 42.5,
  "currency": "USD",
  "categoryId": "clcat1",
  "date": "2026-03-20",
  "notes": "Lunch",
  "isRecurring": false,
  "recurringFrequency": null
}
```

**Response 201**: Full transaction object (same shape as GET item)

**Errors**: 400 (validation), 404 (categoryId not found)

### `PUT /api/transactions/:id`
Updates a transaction. For recurring series, `scope` controls propagation.

**Request body**:
```json
{
  "amount": 50.0,
  "notes": "Updated lunch",
  "scope": "this"
}
```

`scope` values:
- `"this"` — update this occurrence only (default)
- `"this-and-future"` — update this record and all future children in the recurring series; does NOT modify past children

**Response 200**: Updated transaction object

**Errors**: 400, 404

### `DELETE /api/transactions/:id`
Deletes a single transaction occurrence. Does not affect other occurrences in a recurring series.

**Response 204**: (empty)

**Errors**: 404

### `GET /api/transactions/export`
Downloads a CSV file of all transactions matching the same filters as `GET /api/transactions`.

**Query parameters**: Same as `GET /api/transactions` (all optional)

**Response 200**:
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="transactions.csv"`
- Body: UTF-8 CSV with header row: `type,category,amount,currency,date,notes`

**Empty result**: 200 with header row only (no data rows)

### `POST /api/transactions/generate-recurring`
Scans all recurring transactions with `recurringNextDate <= today` and generates new occurrences. Idempotent — safe to call multiple times per day.

**Request body**: (empty — `{}`)

**Response 200**:
```json
{ "generated": 2 }
```

---

## Budgets

### `GET /api/budgets`
Returns all budgets with dynamically computed current-month spending.

**Response 200**:
```json
[
  {
    "id": "clbudget1",
    "categoryId": "clcat1",
    "category": { "id": "clcat1", "name": "Food & Dining" },
    "monthlyLimit": "400.00",
    "currentSpending": "320.00",
    "progressRatio": 0.8,
    "state": "YELLOW",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

`state` is computed server-side: `GREEN` (<0.75), `YELLOW` (0.75–0.99), `RED` (≥1.0).

### `POST /api/budgets`
Creates a new budget for a category. `createdAt` is used as the mid-month zero-start cutoff.

**Request body**:
```json
{ "categoryId": "clcat1", "monthlyLimit": 400 }
```

**Response 201**: Budget object with `currentSpending`, `progressRatio`, `state`

**Errors**: 400, 409 (budget already exists for this category — use PUT to update)

### `PUT /api/budgets/:id`
Updates an existing budget's `monthlyLimit`.

**Request body**:
```json
{ "monthlyLimit": 450 }
```

**Response 200**: Updated budget object

### `DELETE /api/budgets/:id`
Removes a budget limit. The category is retained; spending tracking continues without a limit indicator.

**Response 204**: (empty)

---

## Savings Goals

### `GET /api/savings-goals`
Returns all savings goals with computed progress.

**Response 200**:
```json
[
  {
    "id": "clgoal1",
    "name": "Trip to Japan",
    "targetAmount": "2000.00",
    "targetDate": "2026-08-01T00:00:00.000Z",
    "status": "ACTIVE",
    "totalContributed": "800.00",
    "progressRatio": 0.4,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### `POST /api/savings-goals`
Creates a new savings goal.

**Request body**:
```json
{
  "name": "Trip to Japan",
  "targetAmount": 2000,
  "targetDate": "2026-08-01"
}
```

**Response 201**: Goal object (same shape as GET item, `totalContributed: "0.00"`, `progressRatio: 0`)

### `PUT /api/savings-goals/:id`
Updates a goal's name, targetAmount, or targetDate. Cannot un-complete a COMPLETED goal.

**Request body** (all optional):
```json
{ "name": "Japan Trip", "targetAmount": 2500, "targetDate": "2026-09-01" }
```

**Response 200**: Updated goal object

### `POST /api/savings-goals/:id/contributions`
Records a contribution. If `totalContributed + amount >= targetAmount`, the goal's `status` is set to `COMPLETED`.

**Request body**:
```json
{ "amount": 300, "date": "2026-03-25" }
```

**Response 201**:
```json
{
  "contribution": { "id": "clcont1", "amount": "300.00", "date": "...", "savingsGoalId": "clgoal1" },
  "goal": { "id": "clgoal1", "totalContributed": "1100.00", "progressRatio": 0.55, "status": "ACTIVE" }
}
```

---

## Dashboard

### `GET /api/dashboard`
Returns all aggregated data needed to render the dashboard in a single request.
TanStack Query calls this on mount and after any transaction/contribution mutation.

**Query parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `period` | `weekly \| monthly \| yearly` | Time range for trend charts (default: `monthly`) |

**Response 200**:
```json
{
  "summary": {
    "totalIncome": "3200.00",
    "totalExpenses": "1850.50",
    "netBalance": "1349.50",
    "month": "2026-03"
  },
  "spendingByCategory": [
    { "categoryId": "clcat1", "categoryName": "Food & Dining", "total": "320.00" }
  ],
  "incomeTrend": [
    { "period": "2026-01", "income": "3000.00", "expenses": "1700.00" }
  ],
  "netSavingsTrend": [
    { "period": "2026-01", "netSavings": "1300.00" }
  ],
  "savingsGoalsSummary": [
    {
      "id": "clgoal1",
      "name": "Trip to Japan",
      "progressRatio": 0.4,
      "status": "ACTIVE"
    }
  ]
}
```

`incomeTrend` and `netSavingsTrend` arrays contain one entry per bucket (week/month/year) within the selected period window (last 4 weeks, last 12 months, last 5 years).
