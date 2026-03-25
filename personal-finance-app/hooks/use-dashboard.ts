"use client";

import { useQuery } from "@tanstack/react-query";

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
}

export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface TrendDataPoint {
  label: string;
  income: number;
  expenses: number;
}

export interface BudgetSummaryItem {
  categoryName: string;
  spent: number;
  limit: number;
  progressRatio: number;
}

export interface SavingsGoalSummaryItem {
  id: string;
  name: string;
  targetAmount: number;
  totalContributed: number;
  progressRatio: number;
  targetDate: string | null;
}

export interface DashboardData {
  summary: DashboardSummary;
  spendingByCategory: SpendingByCategory[];
  trendData: TrendDataPoint[];
  budgetSummary: BudgetSummaryItem[];
  savingsGoalsSummary: SavingsGoalSummaryItem[];
}

export function useDashboard(period: "weekly" | "monthly" | "yearly" = "monthly") {
  return useQuery<DashboardData>({
    queryKey: ["dashboard", period],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });
}
