import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { toRupees } from "../utils/money.js";
import {
  monthRange,
  currentMonth,
  getTimezone,
  shiftMonth,
  daysInMonth,
} from "../utils/dateRange.js";

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

export const getTopExpenses = asyncHandler(async (req, res) => {
  const { limit } = req.validatedQuery;
  const month = req.validatedQuery.month || currentMonth();
  const { start, end } = monthRange(month);

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user.id),
        type: "expense",
        date: { $gte: start, $lt: end },
      },
    },
    { $sort: { amount: -1, _id: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        amount: 1,
        date: 1,
        note: 1,
        paymentMethod: 1,
        "category.name": 1,
        "category.color": 1,
      },
    },
  ]);

  const expenses = rows.map((r) => ({ ...r, amount: toRupees(r.amount) }));
  res.json({ success: true, month, count: expenses.length, expenses });
});

export const getDaily = asyncHandler(async (req, res) => {
  const { type } = req.validatedQuery;
  const month = req.validatedQuery.month || currentMonth();
  const { start, end } = monthRange(month);
  const timezone = getTimezone();

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user.id),
        type,
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: { date: "$date", timezone } },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byDay = new Map(rows.map((r) => [r._id, r]));

  // one entry for every day, so the chart has no gaps
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => {
    const row = byDay.get(i + 1);
    return { day: i + 1, total: toRupees(row?.total || 0), count: row?.count || 0 };
  });

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  res.json({ success: true, month, type, total: toRupees(grandTotal), days });
});

export const getMonthlyTrend = asyncHandler(async (req, res) => {
  const { months } = req.validatedQuery;
  const timezone = getTimezone();

  const current = currentMonth();
  const first = shiftMonth(current, -(months - 1));
  const start = monthRange(first).start;
  const end = monthRange(current).end;

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user.id),
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: { date: "$date", timezone } },
          month: { $month: { date: "$date", timezone } },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // "2026-09" -> { income, expense } in paise
  const totals = new Map();
  for (const r of rows) {
    const key = `${r._id.year}-${String(r._id.month).padStart(2, "0")}`;
    const entry = totals.get(key) || { income: 0, expense: 0 };
    entry[r._id.type] = r.total;
    totals.set(key, entry);
  }

  // one entry for every month in the window, oldest first
  const trend = Array.from({ length: months }, (_, i) => {
    const key = shiftMonth(first, i);
    const t = totals.get(key) || { income: 0, expense: 0 };
    return {
      month: key,
      income: toRupees(t.income),
      expense: toRupees(t.expense),
      balance: toRupees(t.income - t.expense),
    };
  });

  res.json({ success: true, months, trend });
});