import rateLimit from "express-rate-limit";

export const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // per hour
  limit: 20,                // generous, so an office sharing one IP still works
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many demo sessions from this network. Please try again later.",
    errors: [],
  },
});