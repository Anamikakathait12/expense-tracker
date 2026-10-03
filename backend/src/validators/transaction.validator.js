import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    message: "Type must be income or expense",
  }),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6,
      "Amount can have at most 2 decimal places"
    ),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category id"),
  date: z.coerce.date().optional(),
  note: z.string().trim().max(200).optional(),
  paymentMethod: z
    .enum(["cash", "upi", "card", "bank_transfer", "other"])
    .optional(),
});
export const listQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category id").optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["date", "-date", "amount", "-amount"]).default("-date"),
});

// For PUT: every field becomes optional, so the client can send only what changed
export const updateTransactionSchema = transactionSchema.partial();