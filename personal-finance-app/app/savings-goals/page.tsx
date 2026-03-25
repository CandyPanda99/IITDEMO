"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SavingsGoalCard } from "@/components/savings-goals/SavingsGoalCard";
import { SavingsGoalForm } from "@/components/savings-goals/SavingsGoalForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSavingsGoals } from "@/hooks/use-savings-goals";

export default function SavingsGoalsPage() {
  const { data: goals = [], isLoading } = useSavingsGoals();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Savings Goals</h1>
        <Button onClick={() => setAddOpen(true)}>+ New Goal</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading goals…</p>
      ) : goals.length === 0 ? (
        <EmptyState
          title="No savings goals yet"
          description="Create a goal to start tracking your savings progress."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <SavingsGoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}

      <SavingsGoalForm open={addOpen} onOpenChange={setAddOpen} />
    </main>
  );
}
