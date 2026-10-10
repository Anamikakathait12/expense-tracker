import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Category from "../models/category.model.js";
import defaultCategories from "../utils/defaultCategories.js";
import { createDemoUser, cleanupExpiredDemos, DEMO_TTL_MS, DEMO_MAX_ACTIVE } from "../services/demo.service.js";
import { generateToken, cookieOptions } from "../utils/token.js";

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email already registered");

  const user = await User.create({ username, email, password });
  
  await Category.insertMany(defaultCategories.map((c) => ({ ...c, user: user._id })));


  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions);

  res.status(201).json({ success: true, message: "Registered successfully", user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions);

  res.json({ success: true, message: "Logged in successfully", user });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: "Logged out" });
});

export const getMe = asyncHandler(async (req,res) => {
    res.json({
        success:true,
        user:req.user,
    })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,            // return the updated document
    runValidators: true,  // apply the schema rules to the new values
  });

  res.json({ success: true, message: "Profile updated", user });
});

export const startDemo = asyncHandler(async (req, res) => {
  const now = new Date();
  const active = await User.countDocuments({
    isDemo: true,
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: { $exists: false }, createdAt: { $gt: new Date(now.getTime() - DEMO_TTL_MS) } },
    ],
  });
  if (active >= DEMO_MAX_ACTIVE) {
    throw new ApiError(503, "The demo is busy right now. Please try again in a few minutes.");
  }

  const user = await createDemoUser();
  const remainingTtl = Math.max(1, user.expiresAt.getTime() - Date.now());

  res.cookie("token", generateToken(user._id, Math.ceil(remainingTtl / 1000)), {
    ...cookieOptions,
    maxAge: remainingTtl,
  });
  res.status(201).json({ success: true, message: "Demo started", user });

  cleanupExpiredDemos().catch((err) => console.error("Demo cleanup failed:", err.message));
});