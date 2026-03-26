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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useCreateBudget, useUpdateBudget } from "@/hooks/use-budgets";

const BudgetFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  monthlyLimit: z.number().positive("Amount must be positive"),
});

type BudgetFormValues = z.infer<typeof BudgetFormSchema>;

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: BudgetFormValues;
  budgetId?: string;
}

export function BudgetForm({
  open,
  onOpenChange,
  defaultValues,
  budgetId,
}: BudgetFormProps) {
  const { data: categories = [] } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const isEditing = Boolean(budgetId);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: defaultValues ?? { categoryId: "", monthlyLimit: 0 },
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues ?? { categoryId: "", monthlyLimit: 0 });
    }
  }, [open, defaultValues, reset]);

  const categoryId = watch("categoryId");

  const onSubmit = async (data: BudgetFormValues) => {
    if (isEditing && budgetId) {
      await updateBudget.mutateAsync({ id: budgetId, monthlyLimit: data.monthlyLimit });
    } else {
      await createBudget.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Budget" : "Add Budget"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEditing && (
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={categoryId}
                onValueChange={(val) => setValue("categoryId", String(val ?? ""))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category">
                    {categories.find(c => c.id === categoryId)?.name || "Select category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label>Monthly Limit ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...register("monthlyLimit", { valueAsNumber: true })}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"
            />
            {errors.monthlyLimit && (
              <p className="text-xs text-destructive">{errors.monthlyLimit.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? "Save Changes" : "Add Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
