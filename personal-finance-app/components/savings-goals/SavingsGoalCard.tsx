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
import { Badge } from "@/components/ui/badge";
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
import { SavingsGoalForm } from "./SavingsGoalForm";
import { ContributionForm } from "./ContributionForm";
import { useDeleteSavingsGoal } from "@/hooks/use-savings-goals";
import type { SavingsGoal } from "@/hooks/use-savings-goals";
import { format, differenceInDays } from "date-fns";

const statusBadge: Record<SavingsGoal["status"], string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

export function SavingsGoalCard({ goal }: SavingsGoalCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteGoal = useDeleteSavingsGoal();

  const pct = Math.min(goal.progressRatio * 100, 100);
  const daysLeft = goal.targetDate
    ? differenceInDays(new Date(goal.targetDate), new Date())
    : null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{goal.name}</CardTitle>
          <Badge className={statusBadge[goal.status]}>{goal.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${Number(goal.totalContributed).toFixed(2)} saved</span>
              <span>${Number(goal.targetAmount).toFixed(2)} goal</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {pct.toFixed(0)}% of goal reached
          </p>
          {goal.targetDate && (
            <p className="text-xs text-muted-foreground">
              Deadline: {format(new Date(goal.targetDate), "MMM d, yyyy")}
              {daysLeft !== null &&
                (daysLeft > 0
                  ? ` (${daysLeft} days left)`
                  : " (past deadline)")}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {goal.status === "ACTIVE" && (
            <Button size="sm" onClick={() => setContributeOpen(true)}>
              + Contribute
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
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

      <SavingsGoalForm
        open={editOpen}
        onOpenChange={setEditOpen}
        goalId={goal.id}
        defaultValues={{
          name: goal.name,
          targetAmount: Number(goal.targetAmount),
          targetDate: goal.targetDate
            ? goal.targetDate.toString().slice(0, 10)
            : undefined,
        }}
      />

      <ContributionForm
        open={contributeOpen}
        onOpenChange={setContributeOpen}
        goalId={goal.id}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete savings goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{goal.name}&quot; and all its contributions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteGoal.mutate(goal.id);
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
