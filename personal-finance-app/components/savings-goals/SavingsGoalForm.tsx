"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateSavingsGoal, useUpdateSavingsGoal } from "@/hooks/use-savings-goals";

const SavingsGoalFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().positive("Target amount must be positive"),
  targetDate: z.string().optional(),
});

type SavingsGoalFormValues = z.infer<typeof SavingsGoalFormSchema>;

interface SavingsGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: { name: string; targetAmount: number; targetDate?: string };
  goalId?: string;
}

export function SavingsGoalForm({
  open,
  onOpenChange,
  defaultValues,
  goalId,
}: SavingsGoalFormProps) {
  const isEditing = Boolean(goalId);
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SavingsGoalFormValues>({
    resolver: zodResolver(SavingsGoalFormSchema),
    defaultValues: defaultValues ?? { name: "", targetAmount: 0 },
  });

  useEffect(() => {
    if (open) reset(defaultValues ?? { name: "", targetAmount: 0 });
  }, [open, defaultValues, reset]);

  const onSubmit = async (data: SavingsGoalFormValues) => {
    const payload = {
      ...data,
      targetDate: data.targetDate === "" ? undefined : data.targetDate,
    };
    if (isEditing && goalId) {
      await updateGoal.mutateAsync({ id: goalId, ...payload });
    } else {
      await createGoal.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Goal" : "New Savings Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Goal Name</Label>
            <Input {...register("name")} placeholder="e.g. Emergency Fund" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Target Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...register("targetAmount", { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.targetAmount && (
              <p className="text-xs text-destructive">{errors.targetAmount.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Deadline (optional)</Label>
            <Input type="date" {...register("targetDate")} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? "Save Changes" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
