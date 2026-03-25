"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { BudgetProgress } from "./BudgetProgress";
import { BudgetForm } from "./BudgetForm";
import { useDeleteBudget } from "@/hooks/use-budgets";
import type { Budget } from "@/hooks/use-budgets";

const stateBadge: Record<Budget["state"], string> = {
  GREEN: "bg-green-100 text-green-700",
  YELLOW: "bg-yellow-100 text-yellow-700",
  RED: "bg-red-100 text-red-700",
};

interface BudgetCardProps {
  budget: Budget;
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteBudget = useDeleteBudget();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{budget.category.name}</CardTitle>
          <Badge className={stateBadge[budget.state]}>{budget.state}</Badge>
        </CardHeader>
        <CardContent>
          <BudgetProgress budget={budget} />
          <p className="mt-2 text-sm text-muted-foreground">
            {(budget.progressRatio * 100).toFixed(0)}% of monthly budget used
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </CardFooter>
      </Card>

      <BudgetForm
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultValues={{ categoryId: budget.categoryId, monthlyLimit: Number(budget.monthlyLimit) }}
        budgetId={budget.id}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the budget for &quot;{budget.category.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteBudget.mutate(budget.id);
                setDeleteOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
