import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { toRupees } from "../utils/money.js";
import { monthRange, currentMonth } from "../utils/dateRange.js";

// Income and expense totals for one month, in paise.
// Exported so the compare endpoint can reuse it in the next step.
export const getMonthTotals = async (userId, month) => {
  const { start, end } = monthRange(month);

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  const income = rows.find((r) => r._id === "income");
  const expense = rows.find((r) => r._id === "expense");

  return {
    incomePaise: income?.total || 0,
    expensePaise: expense?.total || 0,
    count: (income?.count || 0) + (expense?.count || 0),
  };
};

export const getSummary = asyncHandler(async (req, res) => {
  const month = req.validatedQuery.month || currentMonth();
  const t = await getMonthTotals(req.user.id, month);

  res.json({
    success: true,
    month,
    income: toRupees(t.incomePaise),
    expense: toRupees(t.expensePaise),
    balance: toRupees(t.incomePaise - t.expensePaise),
    transactionCount: t.count,
  });
});

export const getByCategory = asyncHandler(async (req, res) => {
  const { type } = req.validatedQuery;
  const month = req.validatedQuery.month || currentMonth();
  const { start, end } = monthRange(month);

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user.id),
        type,
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        name: "$category.name",
        color: "$category.color",
        total: 1,
        count: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  const categories = rows.map((r) => ({
    categoryId: r.categoryId,
    name: r.name,
    color: r.color,
    total: toRupees(r.total),
    count: r.count,
    percent: grandTotal ? Math.round((r.total / grandTotal) * 1000) / 10 : 0,
  }));

  res.json({ success: true, month, type, total: toRupees(grandTotal), categories });
});