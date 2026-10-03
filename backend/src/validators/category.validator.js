import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(30),
  type: z.enum(["income", "expense"], {
    message: "Type must be income or expense",
  }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex code like #ff0000")
    .optional(),
  icon: z.string().trim().optional(),
});
export const updateCategorySchema = categorySchema.partial();