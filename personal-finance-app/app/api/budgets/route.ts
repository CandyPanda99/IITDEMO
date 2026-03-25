import { prisma } from "@/lib/db";
import { CreateBudgetSchema } from "@/lib/validations/budget";
import { startOfMonth, endOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

async function computeBudgetWithSpending(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { category: true },
  });
  if (!budget) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  // Start counting from the later of: start of month OR budget creation date
  const spendingStart =
    budget.createdAt > monthStart ? budget.createdAt : monthStart;

  const agg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      categoryId: budget.categoryId,
      type: "EXPENSE",
      date: { gte: spendingStart, lte: monthEnd },
    },
  });

  const currentSpending = Number(agg._sum.amount ?? 0);
  const monthlyLimit = Number(budget.monthlyLimit);
  const progressRatio = monthlyLimit > 0 ? currentSpending / monthlyLimit : 0;
  const state =
    progressRatio >= 1.0 ? "RED" : progressRatio >= 0.75 ? "YELLOW" : "GREEN";

  return {
    id: budget.id,
    categoryId: budget.categoryId,
    category: budget.category,
    monthlyLimit: budget.monthlyLimit.toString(),
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
    currentSpending: currentSpending.toFixed(2),
    progressRatio,
    state,
  };
}

export async function GET() {
  const budgets = await prisma.budget.findMany({
    include: { category: true },
  });

  const enriched = await Promise.all(
    budgets.map((b) => computeBudgetWithSpending(b.id))
  );
  return NextResponse.json(enriched.filter(Boolean));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = CreateBudgetSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { categoryId, monthlyLimit } = result.data;
  const existing = await prisma.budget.findFirst({ where: { categoryId } });
  if (existing) {
    return NextResponse.json(
      { error: "Budget already exists for this category" },
      { status: 409 }
    );
  }

  const budget = await prisma.budget.create({
    data: { categoryId, monthlyLimit },
  });

  const enriched = await computeBudgetWithSpending(budget.id);
  return NextResponse.json(enriched, { status: 201 });
}
