# Quickstart: Personal Finance Management App

**Branch**: `001-personal-finance-app` | **Date**: 2026-03-25

---

## Prerequisites

- Node.js 20+
- npm 10+ (or pnpm/yarn)
- Git

---

## 1. Bootstrap the Next.js project

```bash
npx create-next-app@latest personal-finance-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd personal-finance-app
```

---

## 2. Install dependencies

```bash
npm install \
  prisma @prisma/client \
  @tanstack/react-query \
  zustand \
  react-hook-form @hookform/resolvers \
  zod \
  recharts \
  papaparse \
  date-fns

npm install --save-dev \
  @types/papaparse \
  @tanstack/react-query-devtools
```

---

## 3. Initialize Prisma with SQLite

```bash
npx prisma init --datasource-provider sqlite
```

This creates `prisma/schema.prisma` and `.env` with `DATABASE_URL="file:./dev.db"`.

Replace the contents of `prisma/schema.prisma` with the full schema from [data-model.md](../data-model.md).

---

## 4. Install and configure shadcn/ui

```bash
npx shadcn@latest init
```

Accept prompts: style `default`, base colour `slate`, CSS variables `yes`.

Install the components you need as you build (e.g.):
```bash
npx shadcn@latest add button card input label select dialog progress toast
```

---

## 5. Create the Prisma client singleton

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

---

## 6. Set up TanStack Query provider

```typescript
// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Wrap the root layout:
```typescript
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 7. Run the initial migration and seed

```typescript
// prisma/seed.ts
import { PrismaClient, CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  "Housing", "Food & Dining", "Transport", "Utilities",
  "Healthcare", "Entertainment", "Shopping", "Education", "Income", "Other",
];

async function main() {
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, type: CategoryType.DEFAULT },
    });
  }
  console.log("Seeded default categories.");
}

main().finally(() => prisma.$disconnect());
```

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Then run:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

---

## 8. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the dashboard is the landing page.

---

## 9. Useful Prisma commands

| Command | Purpose |
|---------|---------|
| `npx prisma studio` | Visual database browser |
| `npx prisma migrate dev --name <name>` | Create and apply a new migration |
| `npx prisma migrate reset` | Wipe and re-seed the database |
| `npx prisma generate` | Regenerate the Prisma client after schema changes |

---

## 10. Environment variables

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `file:./prisma/dev.db` | Relative path from project root |
| `NODE_ENV` | `development` | Set to `production` for builds |

---

## PWA (Optional — post-MVP)

To make the app installable as a PWA, install `@serwist/next` and add a `public/manifest.json`. This is not required for the core feature set and can be added after all user stories are implemented.

```bash
npm install @serwist/next serwist
```

See the [Serwist Next.js docs](https://serwist.pages.dev/docs/next/getting-started) for configuration steps.
