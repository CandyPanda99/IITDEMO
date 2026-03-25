"use client";

import type { Budget } from "@/hooks/use-budgets";

const stateColors: Record<Budget["state"], string> = {
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-500",
  RED: "bg-red-500",
};

interface BudgetProgressProps {
  budget: Budget;
}

export function BudgetProgress({ budget }: BudgetProgressProps) {
  const pct = Math.min(budget.progressRatio * 100, 100);
  return (
    <div className="space-y-1">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${stateColors[budget.state]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${Number(budget.currentSpending).toFixed(2)} spent</span>
        <span>${Number(budget.monthlyLimit).toFixed(2)} limit</span>
      </div>
    </div>
  );
}
