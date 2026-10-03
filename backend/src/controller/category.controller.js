import Budget from "../models/budget.model.js";
import Category from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Transaction from "../models/transaction.model.js";

export const createCategory = asyncHandler(async (req, res) => {
  const { name, type, color, icon } = req.body;

  const existing = await Category.findOne({ user: req.user.id, name });
  if (existing) throw new ApiError(409, "Category already exists");

  const category = await Category.create({
    user: req.user.id, // from the protect middleware, never from the request body
    name,
    type,
    color,
    icon,
  });

  res.status(201).json({ success: true, category });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user.id }).sort({ name: 1 });
  res.json({ success: true, count: categories.length, categories });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user.id });
  if (!category) throw new ApiError(404, "Category not found");

  const { name, type } = req.body;

  // renaming: the new name must not already be taken by another category
  if (name && name !== category.name) {
    const clash = await Category.findOne({
      user: req.user.id,
      name,
      _id: { $ne: category._id },
    });
    if (clash) throw new ApiError(409, "Category already exists");
  }

  // changing type would leave income entries inside an expense category
  if (type && type !== category.type) {
    const used = await Transaction.exists({ user: req.user.id, category: category._id });
    if (used) throw new ApiError(400, "Cannot change type: category has transactions");
  }

  Object.assign(category, req.body);
  await category.save();
  res.json({ success: true, category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user.id });
  if (!category) throw new ApiError(404, "Category not found");

  const count = await Transaction.countDocuments({
    user: req.user.id,
    category: category._id,
  });
  if (count > 0) {
    throw new ApiError(409, `Cannot delete: ${count} transaction(s) use this category`);
  }

  await Budget.deleteMany({ user: req.user.id, category: category._id });
  await category.deleteOne();

  await category.deleteOne();
  res.json({ success: true, message: "Category deleted" });
});