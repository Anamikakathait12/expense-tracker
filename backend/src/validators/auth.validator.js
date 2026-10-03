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