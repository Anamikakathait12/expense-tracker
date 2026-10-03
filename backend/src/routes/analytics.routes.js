import { Router } from "express";
import { getSummary, getByCategory } from "../controller/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { monthQuerySchema, byCategoryQuerySchema } from "../validators/analytics.validator.js";

const router = Router();

router.use(protect);

router.get("/summary", validate(monthQuerySchema, "query"), getSummary);
router.get("/by-category", validate(byCategoryQuerySchema, "query"), getByCategory);

export default router;