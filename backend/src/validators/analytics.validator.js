import { z } from "zod";

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-10");

export const monthQuerySchema = z.object({ month: month.optional() });

export const byCategoryQuerySchema = z.object({
  month: month.optional(),
  type: z.enum(["income", "expense"]).default("expense"),
});