"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBudgets } from "@/hooks/use-budgets";

export default function BudgetsPage() {
  const { data: budgets = [], isLoading } = useBudgets();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Button onClick={() => setAddOpen(true)}>+ Add Budget</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading budgets…</p>
      ) : budgets.length === 0 ? (
        <EmptyState
          title="No budgets yet"
          description="Set monthly spending limits per category to stay on track."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} />
          ))}
        </div>
      )}

      <BudgetForm open={addOpen} onOpenChange={setAddOpen} />
    </main>
  );
}
