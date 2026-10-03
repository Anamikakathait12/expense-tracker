import Transaction from "../models/transaction.model.js";
import Category from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { toPaise } from "../utils/money.js";

// The category must exist, belong to this user, and match the transaction type
const assertValidCategory = async (categoryId, type, userId) => {
  const category = await Category.findOne({ _id: categoryId, user: userId });
  if (!category) throw new ApiError(400, "Category not found");
  if (category.type !== type) {
    throw new ApiError(400, `Category "${category.name}" is an ${category.type} category`);
  }
};

export const createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, category, date, note, paymentMethod } = req.body;

  await assertValidCategory(category, type, req.user.id);

  const transaction = await Transaction.create({
    user: req.user.id,
    type,
    amount: toPaise(amount),
    category,
    date,
    note,
    paymentMethod,
  });

  await transaction.populate("category", "name color type");
  res.status(201).json({ success: true, transaction });
});

export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate("category", "name color type");

  if (!transaction) throw new ApiError(404, "Transaction not found");
  res.json({ success: true, transaction });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!transaction) throw new ApiError(404, "Transaction not found");

  const updates = { ...req.body };
  if (updates.amount !== undefined) updates.amount = toPaise(updates.amount);

  Object.assign(transaction, updates);

  // Re-check if the type or category changed
  if (req.body.type !== undefined || req.body.category !== undefined) {
    await assertValidCategory(transaction.category, transaction.type, req.user.id);
  }

  await transaction.save();
  await transaction.populate("category", "name color type");
  res.json({ success: true, transaction });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!transaction) throw new ApiError(404, "Transaction not found");

  res.json({ success: true, message: "Transaction deleted" });
});
export const getTransactions = asyncHandler(async (req, res) => {
  const { type, category, from, to, search, page, limit, sort } = req.validatedQuery;

  const filter = { user: req.user.id }; // ownership filter always comes first
  if (type) filter.type = type;
  if (category) filter.category = category;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }

  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.note = { $regex: safe, $options: "i" };
  }

  const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
  const sortOrder = sort.startsWith("-") ? -1 : 1;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ [sortField]: sortOrder, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name color type"),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    transactions,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});