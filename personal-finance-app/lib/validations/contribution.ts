import { z } from "zod";

export const CreateContributionSchema = z.object({
  amount: z.number().positive(),
  date: z.coerce.date(),
});

export type CreateContributionInput = z.infer<typeof CreateContributionSchema>;
