import { z } from "zod";

export const CreateBudgetSchema = z.object({
  categoryId: z.string().min(1),
  monthlyLimit: z.number().positive(),
});

export const UpdateBudgetSchema = z.object({
  monthlyLimit: z.number().positive(),
});

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>;
