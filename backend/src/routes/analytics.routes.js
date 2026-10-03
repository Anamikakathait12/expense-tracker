import { Router } from "express";
import {
  getSummary,
  getByCategory,
  getTopExpenses,
  getDaily,
  getMonthlyTrend,
} from "../controller/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  monthQuerySchema,
  byCategoryQuerySchema,
  topExpensesQuerySchema,
  dailyQuerySchema,
  trendQuerySchema,
} from "../validators/analytics.validator.js";

const router = Router();

router.use(protect);

router.get("/summary", validate(monthQuerySchema, "query"), getSummary);
router.get("/by-category", validate(byCategoryQuerySchema, "query"), getByCategory);
router.get("/top-expenses", validate(topExpensesQuerySchema, "query"), getTopExpenses);
router.get("/daily", validate(dailyQuerySchema, "query"), getDaily);
router.get("/monthly-trend", validate(trendQuerySchema, "query"), getMonthlyTrend);

export default router;