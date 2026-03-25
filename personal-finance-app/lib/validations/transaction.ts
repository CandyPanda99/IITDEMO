import { z } from "zod";

export const CreateTransactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.number().positive(),
    currency: z.string().default("USD"),
    categoryId: z.string().min(1),
    date: z.coerce.date(),
    notes: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurringFrequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  })
  .refine(
    (d) => !d.isRecurring || d.recurringFrequency != null,
    {
      message: "recurringFrequency required when isRecurring is true",
      path: ["recurringFrequency"],
    }
  );

export const EditTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  scope: z.enum(["this", "this-and-future"]).default("this"),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type EditTransactionInput = z.infer<typeof EditTransactionSchema>;
