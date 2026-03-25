"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/hooks/use-dashboard";

interface DashboardSummaryCardsProps {
  summary: DashboardSummary;
}

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const { totalIncome, totalExpenses, netSavings } = summary;

  const cards = [
    { title: "Total Income", value: totalIncome, color: "text-green-600" },
    { title: "Total Expenses", value: totalExpenses, color: "text-red-600" },
    {
      title: "Net Savings",
      value: netSavings,
      color: netSavings >= 0 ? "text-blue-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(({ title, value, color }) => (
        <Card key={title}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${color}`}>
              {value < 0 ? "-" : ""}${Math.abs(value).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
