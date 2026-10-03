import { Router } from "express";
import { createCategory, getCategories, updateCategory, deleteCategory } from "../controller/category.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { categorySchema, updateCategorySchema } from "../validators/category.validator.js";

const router = Router();

router.use(protect); // every route below requires login

router.route("/").get(getCategories).post(validate(categorySchema), createCategory);

router
  .route("/:id")
  .put(validate(updateCategorySchema), updateCategory)
  .delete(deleteCategory);

export default router;