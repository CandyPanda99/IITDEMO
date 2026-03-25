import { z } from "zod";

export const CreateSavingsGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  targetDate: z.coerce.date().optional(),
});

export const UpdateSavingsGoalSchema = CreateSavingsGoalSchema.partial();

export type CreateSavingsGoalInput = z.infer<typeof CreateSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof UpdateSavingsGoalSchema>;
