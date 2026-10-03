import { z } from "zod";

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-10");

export const monthQuerySchema = z.object({ month: month.optional() });

export const byCategoryQuerySchema = z.object({
  month: month.optional(),
  type: z.enum(["income", "expense"]).default("expense"),
});

// daily uses the same shape as by-category: month + type
export const dailyQuerySchema = byCategoryQuerySchema;

export const topExpensesQuerySchema = z.object({
  month: month.optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const trendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});