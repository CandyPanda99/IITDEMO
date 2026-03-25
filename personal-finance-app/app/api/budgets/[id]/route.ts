import { prisma } from "@/lib/db";
import { UpdateBudgetSchema } from "@/lib/validations/budget";
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = UpdateBudgetSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget) {
    return NextResponse.json({ error: "Budget not found." }, { status: 404 });
  }

  await prisma.budget.update({
    where: { id },
    data: { monthlyLimit: result.data.monthlyLimit },
  });

  const enriched = await computeBudgetWithSpending(id);
  return NextResponse.json(enriched);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget) {
    return NextResponse.json({ error: "Budget not found." }, { status: 404 });
  }
  await prisma.budget.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
