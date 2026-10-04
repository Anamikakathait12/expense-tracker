import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} from "../controller/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, validate(updateProfileSchema), updateProfile);

export default router;