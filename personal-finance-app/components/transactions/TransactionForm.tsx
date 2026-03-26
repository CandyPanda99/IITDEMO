"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCategories } from "@/hooks/use-categories";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import { format } from "date-fns";

const LocalTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string(),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  isRecurring: z.boolean(),
  recurringFrequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).optional(),
}).refine(
  (d) => !d.isRecurring || d.recurringFrequency != null,
  { message: "Frequency required when recurring", path: ["recurringFrequency"] }
);

type FormData = z.infer<typeof LocalTransactionSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
  transactionId?: string;
  defaultValues?: Partial<FormData>;
}

export function TransactionForm({ onSuccess, transactionId, defaultValues }: TransactionFormProps) {
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const isEditing = Boolean(transactionId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(LocalTransactionSchema),
    defaultValues: defaultValues ?? {
      type: "EXPENSE",
      currency: "USD",
      date: format(new Date(), "yyyy-MM-dd"),
      isRecurring: false,
      categoryId: "",
    },
  });

  const isRecurring = watch("isRecurring");
  const transactionType = watch("type");

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        amount: Number(data.amount),
        date: data.date,
      };
      
      if (isEditing && transactionId) {
        await updateTransaction.mutateAsync({ id: transactionId, data: payload });
        toast.success("Transaction updated successfully");
      } else {
        await createTransaction.mutateAsync(payload);
        toast.success("Transaction added successfully");
      }
      reset({
        type: "EXPENSE",
        currency: "USD",
        date: format(new Date(), "yyyy-MM-dd"),
        isRecurring: false,
        amount: 0,
        categoryId: "",
        notes: "",
        recurringFrequency: undefined,
      });
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add transaction");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type */}
      <div className="space-y-1">
        <Label>Type</Label>
        <div className="flex gap-2">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              variant={transactionType === t ? "default" : "outline"}
              size="sm"
              onClick={() => setValue("type", t)}
            >
              {t === "INCOME" ? "Income" : "Expense"}
            </Button>
          ))}
        </div>
        {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1">
        <Label htmlFor="categoryId">Category</Label>
        <Select value={watch("categoryId")} onValueChange={(v) => setValue("categoryId", String(v ?? ""))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category">
              {categories?.find(c => c.id === watch("categoryId"))?.name || "Select a category"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-xs text-red-500">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-xs text-red-500">{errors.amount.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-1">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          {...register("date")}
        />
        {errors.date && (
          <p className="text-xs text-red-500">{String(errors.date.message)}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" placeholder="Add a note..." {...register("notes")} />
      </div>

      {/* Is Recurring */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isRecurring"
          checked={isRecurring}
          onCheckedChange={(v) => setValue("isRecurring", Boolean(v))}
        />
        <Label htmlFor="isRecurring">Recurring transaction</Label>
      </div>

      {/* Recurring Frequency */}
      {isRecurring && (
        <div className="space-y-1">
          <Label>Frequency</Label>
          <Select
            onValueChange={(v) =>
              setValue("recurringFrequency", String(v) as "WEEKLY" | "MONTHLY" | "YEARLY")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringFrequency && (
            <p className="text-xs text-red-500">
              {errors.recurringFrequency.message}
            </p>
          )}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Transaction"}
      </Button>
    </form>
  );
}
