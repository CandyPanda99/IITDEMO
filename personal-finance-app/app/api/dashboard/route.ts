import { prisma } from "@/lib/db";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  subYears,
  format,
  getISOWeek,
  getYear,
} from "date-fns";
import { NextRequest, NextResponse } from "next/server";

type Period = "weekly" | "monthly" | "yearly";

function getBuckets(period: Period) {
  const now = new Date();
  if (period === "weekly") {
    return Array.from({ length: 4 }, (_, i) => {
      const start = startOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
      const end = endOfWeek(start, { weekStartsOn: 1 });
      return { label: `W${getISOWeek(start)} ${getYear(start)}`, start, end };
    });
  }
  if (period === "yearly") {
    return Array.from({ length: 5 }, (_, i) => {
      const start = startOfYear(subYears(now, 4 - i));
      const end = endOfYear(start);
      return { label: String(getYear(start)), start, end };
    });
  }
  // monthly (default)
  return Array.from({ length: 12 }, (_, i) => {
    const ref = subMonths(now, 11 - i);
    const start = startOfMonth(ref);
    const end = endOfMonth(ref);
    return { label: format(start, "MMM yyyy"), start, end };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "monthly") as Period;

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const [incomeAgg, expenseAgg, categories, budgets] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME", date: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE", date: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.budget.findMany({ include: { category: true } }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
  const netSavings = totalIncome - totalExpenses;

  // Spending by category for pie chart
  const categorySpending = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: {
      type: "EXPENSE",
      date: { gte: currentMonthStart, lte: currentMonthEnd },
    },
  });

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const spendingByCategory = categorySpending
    .map((row) => ({
      categoryId: row.categoryId ?? "uncategorized",
      categoryName: row.categoryId ? (categoryMap[row.categoryId] ?? "Unknown") : "Uncategorized",
      amount: Number(row._sum.amount ?? 0),
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Trend data (buckets)
  const buckets = getBuckets(period);
  const trendData = await Promise.all(
    buckets.map(async ({ label, start, end }) => {
      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "INCOME", date: { gte: start, lte: end } },
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "EXPENSE", date: { gte: start, lte: end } },
        }),
      ]);
      return {
        label,
        income: Number(inc._sum.amount ?? 0),
        expenses: Number(exp._sum.amount ?? 0),
      };
    })
  );

  // Budget summary
  const budgetSummary = await Promise.all(
    budgets.map(async (budget) => {
      const spendingStart =
        budget.createdAt > currentMonthStart ? budget.createdAt : currentMonthStart;
      const agg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: { gte: spendingStart, lte: currentMonthEnd },
        },
      });
      const spent = Number(agg._sum.amount ?? 0);
      const limit = Number(budget.monthlyLimit);
      return {
        categoryName: budget.category.name,
        spent,
        limit,
        progressRatio: limit > 0 ? spent / limit : 0,
      };
    })
  );

  // Savings goals summary
  const goals = await prisma.savingsGoal.findMany({
    where: { status: "ACTIVE" },
    include: {
      contributions: { select: { amount: true } },
    },
  });

  const savingsGoalsSummary = goals.map((g) => {
    const totalContributed = g.contributions.reduce(
      (s, c) => s + Number(c.amount),
      0
    );
    const target = Number(g.targetAmount);
    return {
      id: g.id,
      name: g.name,
      targetAmount: target,
      totalContributed,
      progressRatio: target > 0 ? totalContributed / target : 0,
      deadline: g.targetDate,
    };
  });

  return NextResponse.json({
    summary: {
      totalIncome,
      totalExpenses,
      netSavings,
    },
    spendingByCategory,
    trendData,
    budgetSummary,
    savingsGoalsSummary,
  });
}
