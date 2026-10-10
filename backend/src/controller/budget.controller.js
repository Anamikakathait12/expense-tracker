import mongoose from "mongoose";
import Budget from "../models/budget.model.js";
import Category from "../models/category.model.js";
import Transaction from "../models/transaction.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { toPaise, toRupees } from "../utils/money.js";

import { monthRange, currentMonth } from "../utils/dateRange.js";

const statusFor = (percent) =>
  percent >= 100 ? "exceeded" : percent >= 80 ? "warning" : "ok";

export const createBudget = asyncHandler(async (req, res) => {
  const { category, month, limit } = req.body;

  const cat = await Category.findOne({ _id: category, user: req.user.id });
  if (!cat) throw new ApiError(400, "Category not found");
  if (cat.type !== "expense") {
    throw new ApiError(400, "Budgets can only be set for expense categories");
  }

  const existing = await Budget.findOne({ user: req.user.id, category, month });
  if (existing) throw new ApiError(409, `A budget for ${cat.name} in ${month} already exists`);

  if (req.user.isDemo && await Budget.countDocuments({ user: req.user.id }) >= 30) {
    throw new ApiError(429, "This demo sandbox has reached its 30 budget limit.");
  }

  const budget = await Budget.create({
    user: req.user.id,
    category,
    month,
    limit: toPaise(limit),
    ...(req.user.isDemo && { expiresAt: req.user.expiresAt }),
  });

  await budget.populate("category", "name color type");
  res.status(201).json({ success: true, budget });
});

export const getBudgets = asyncHandler(async (req, res) => {
  const month = req.validatedQuery.month || currentMonth();

  const budgets = await Budget.find({ user: req.user.id, month }).populate(
    "category",
    "name color type"
  );

  // Total spent per category this month, in one database query
  const { start, end } = monthRange(month);
  const spentRows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user.id),
        type: "expense",
        date: { $gte: start, $lt: end },
        category: { $in: budgets.map((b) => b.category._id) },
      },
    },
    { $group: { _id: "$category", spent: { $sum: "$amount" } } },
  ]);

  const spentByCategory = new Map(spentRows.map((r) => [r._id.toString(), r.spent]));

  const result = budgets.map((b) => {
    const spent = spentByCategory.get(b.category._id.toString()) || 0;
    const percentUsed = Math.round((spent / b.limit) * 1000) / 10; // one decimal
    return {
      ...b.toJSON(),               // limit already in rupees here
      spent: toRupees(spent),
      remaining: toRupees(b.limit - spent),
      percentUsed,
      status: statusFor(percentUsed),
    };
  });

  res.json({ success: true, month, count: result.length, budgets: result });
});

export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id });
  if (!budget) throw new ApiError(404, "Budget not found");

  budget.limit = toPaise(req.body.limit);
  await budget.save();

  await budget.populate("category", "name color type");
  res.json({ success: true, budget });
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!budget) throw new ApiError(404, "Budget not found");

  res.json({ success: true, message: "Budget deleted" });
});