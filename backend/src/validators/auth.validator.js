import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().trim().min(3, "username must be at least 3 characters"),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(6, "password nust be at least 6 characters"),
});

export const loginSchema = z.object({
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"];

export const updateProfileSchema = z
  .object({
    username: z.string().trim().min(3, "Username must be at least 3 characters").optional(),
    currency: z.enum(CURRENCIES, { message: "Unsupported currency" }).optional(),
  })
  .refine((d) => d.username !== undefined || d.currency !== undefined, {
    message: "Nothing to update",
  });