import { z } from "zod";

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-10");

const limitSchema = z
  .number()
  .positive("Limit must be greater than 0")
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6,
    "Limit can have at most 2 decimal places"
  );

export const createBudgetSchema = z.object({
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category id"),
  month: monthSchema,
  limit: limitSchema,
});

// Only the limit can change. To budget another month, create a new budget.
export const updateBudgetSchema = z.object({ limit: limitSchema });

export const budgetQuerySchema = z.object({ month: monthSchema.optional() });