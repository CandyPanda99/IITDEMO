"use client";

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
import { useAddContribution } from "@/hooks/use-savings-goals";

const ContributionFormSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().optional(),
});

type ContributionFormValues = z.infer<typeof ContributionFormSchema>;

interface ContributionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
}

export function ContributionForm({ open, onOpenChange, goalId }: ContributionFormProps) {
  const addContribution = useAddContribution();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContributionFormValues>({
    resolver: zodResolver(ContributionFormSchema),
    defaultValues: { amount: 0 },
  });

  const onSubmit = async (data: ContributionFormValues) => {
    await addContribution.mutateAsync({ goalId, ...data });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contribution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount", { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              {...register("date")}
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Add Contribution
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
