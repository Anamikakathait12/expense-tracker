import { Router } from "express";
import {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} from "../controller/budget.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetQuerySchema,
} from "../validators/budget.validator.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(validate(budgetQuerySchema, "query"), getBudgets)
  .post(validate(createBudgetSchema), createBudget);

router
  .route("/:id")
  .put(validate(updateBudgetSchema), updateBudget)
  .delete(deleteBudget);

export default router;