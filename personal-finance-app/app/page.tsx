"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { SavingsWidget } from "@/components/dashboard/SavingsWidget";
import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const { data, isLoading, error } = useDashboard(period);

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <p className="text-destructive">Failed to load dashboard data.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {isLoading || !data ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <DashboardSummaryCards summary={data.summary} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <SpendingChart data={data.spendingByCategory} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={data.trendData} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.budgetSummary.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No budgets set.</p>
                ) : (
                  data.budgetSummary.map((b) => (
                    <div key={b.categoryName} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{b.categoryName}</span>
                        <span className="text-muted-foreground">
                          ${b.spent.toFixed(2)} / ${b.limit.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full transition-all ${
                            b.progressRatio >= 1
                              ? "bg-red-500"
                              : b.progressRatio >= 0.75
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(b.progressRatio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <SavingsWidget goals={data.savingsGoalsSummary} />
          </div>
        </>
      )}
    </main>
  );
}
