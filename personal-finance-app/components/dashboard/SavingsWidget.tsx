"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SavingsGoalSummaryItem } from "@/hooks/use-dashboard";
import { differenceInDays } from "date-fns";

interface SavingsWidgetProps {
  goals: SavingsGoalSummaryItem[];
}

export function SavingsWidget({ goals }: SavingsWidgetProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Savings Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active savings goals.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active Savings Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const pct = Math.min(goal.progressRatio * 100, 100);
          const daysLeft = goal.targetDate
              ? differenceInDays(new Date(goal.targetDate), new Date())
              : null;
          return (
            <div key={goal.id} className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span>{goal.name}</span>
                <span>
                  ${goal.totalContributed.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pct.toFixed(0)}% saved</span>
                {daysLeft !== null && (
                  <span>{daysLeft > 0 ? `${daysLeft} days left` : "Overdue"}</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
