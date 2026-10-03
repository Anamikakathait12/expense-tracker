import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controller/transaction.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  transactionSchema,
  updateTransactionSchema,
  listQuerySchema,
} from "../validators/transaction.validator.js";

const router = Router();

router.use(protect);

router.get("/", validate(listQuerySchema, "query"), getTransactions); // <- the missing route
router.post("/", validate(transactionSchema), createTransaction);

router
  .route("/:id")
  .get(getTransaction)
  .put(validate(updateTransactionSchema), updateTransaction)
  .delete(deleteTransaction);

export default router;