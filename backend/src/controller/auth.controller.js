import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Category from "../models/category.model.js";
import defaultCategories from "../utils/defaultCategories.js";
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