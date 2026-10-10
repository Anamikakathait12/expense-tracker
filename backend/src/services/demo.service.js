import crypto from "node:crypto";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import Transaction from "../models/transaction.model.js";
import Budget from "../models/budget.model.js";
import defaultCategories from "../utils/defaultCategories.js";
import { currentMonth, shiftMonth, daysInMonth, getTimezone } from "../utils/dateRange.js";
import { getDemoMaxActive, getDemoTtlMs } from "../config/demo.js";

export const DEMO_TTL_MS = getDemoTtlMs();
export const DEMO_MAX_ACTIVE = getDemoMaxActive();
const MONTHS_OF_DATA = 6;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const roundTo = (n, step) => Math.round(n / step) * step;

const FIXED = [
  { cat: "Salary", type: "income", notes: ["Monthly salary", "Salary credit", "Payroll"], day: 1, amount: () => rand(62000, 72000), methods: ["bank_transfer"] },
  { cat: "Rent", type: "expense", notes: ["House rent", "Monthly rent", "Apartment rent"], day: 5, amount: () => rand(17000, 20500), methods: ["bank_transfer"] },
  { cat: "Bills", type: "expense", notes: ["Electricity bill", "Power bill"], day: 8, amount: () => rand(1100, 2600), methods: ["upi", "card"] },
  { cat: "Bills", type: "expense", notes: ["Internet", "Broadband bill"], day: 10, amount: () => rand(799, 1299), methods: ["upi", "card"] },
  { cat: "Bills", type: "expense", notes: ["Mobile recharge", "Phone bill"], day: 12, amount: () => rand(299, 699), methods: ["upi", "card"] },
];

const VARIABLE = [
  { cat: "Food", notes: ["Lunch", "Groceries", "Dinner out", "Coffee", "Restaurant", "Market shop"], min: 120, max: 900, count: 9, methods: ["upi", "card", "cash"] },
  { cat: "Travel", notes: ["Ride share", "Metro recharge", "Fuel", "Auto fare", "Bus ticket"], min: 100, max: 1500, count: 4, methods: ["upi", "cash", "card"] },
  { cat: "Shopping", notes: ["Clothes", "Online order", "Shoes", "Gift", "Home supplies"], min: 500, max: 3500, count: 2, methods: ["card", "upi"] },
  { cat: "Entertainment", notes: ["Movie", "Concert", "Streaming plan", "Game", "Weekend outing"], min: 199, max: 1200, count: 2, methods: ["card", "upi"] },
  { cat: "Health", notes: ["Pharmacy", "Doctor visit", "Gym", "Health supplies"], min: 200, max: 1500, count: 1, methods: ["upi", "cash"] },
];

const getLocalDateParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: getTimezone(),
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
};

const dateAtLocalNoon = (month, day) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, monthNumber - 1, day, 12));
  const local = getLocalDateParts(utcGuess);
  const localAsUtc = Date.UTC(
    Number(local.year),
    Number(local.month) - 1,
    Number(local.day),
    Number(local.hour),
    Number(local.minute),
    Number(local.second)
  );
  return new Date(utcGuess.getTime() - (localAsUtc - utcGuess.getTime()));
};

const buildTransactions = (userId, catByName, expiresAt) => {
  const docs = [];
  const spent = {};
  const nowMonth = currentMonth();
  const today = Number(getLocalDateParts(new Date()).day);

  const add = (month, day, type, catName, rupees, note, paymentMethod) => {
    docs.push({
      user: userId,
      type,
      amount: rupees * 100,
      category: catByName[catName]._id,
      date: dateAtLocalNoon(month, day),
      note,
      paymentMethod,
      expiresAt,
    });
    if (type === "expense") {
      spent[month] ??= {};
      spent[month][catName] = (spent[month][catName] || 0) + rupees;
    }
  };

  for (let offset = MONTHS_OF_DATA - 1; offset >= 0; offset--) {
    const month = shiftMonth(nowMonth, -offset);
    const isCurrent = offset === 0;
    const lastDay = isCurrent ? today : daysInMonth(month);

    for (const fixed of FIXED) {
      if (fixed.day <= lastDay) {
        add(month, fixed.day, fixed.type, fixed.cat, fixed.amount(), pick(fixed.notes), pick(fixed.methods));
      }
    }

    if (rand(0, 2) === 0 && lastDay >= 18) {
      add(month, rand(18, lastDay), "income", "Freelance", rand(8000, 22000), pick([
        "Design project", "Freelance work", "Side project", "Consulting payment",
      ]), "bank_transfer");
    }

    for (const variable of VARIABLE) {
      const count = isCurrent
        ? Math.max(1, Math.round((variable.count * lastDay) / daysInMonth(month)))
        : variable.count;
      for (let index = 0; index < count; index++) {
        add(month, rand(1, lastDay), "expense", variable.cat, rand(variable.min, variable.max), pick(variable.notes), pick(variable.methods));
      }
    }
  }

  return { docs, spent };
};

const buildBudgets = (userId, catByName, spent, expiresAt) => {
  const nowMonth = currentMonth();
  const prevMonth = shiftMonth(nowMonth, -1);
  const budgets = [];
  const typical = { Food: 6000, Travel: 3000, Shopping: 4000, Entertainment: 1500, Bills: 5000 };
  const factors = { Food: 1.12, Travel: 0.8, Shopping: 1.6, Entertainment: 1.4, Bills: 1.3 };

  for (const [name, limit] of Object.entries(typical)) {
    budgets.push({
      user: userId,
      category: catByName[name]._id,
      month: nowMonth,
      limit: limit * 100,
      expiresAt,
    });
  }

  for (const [name, factor] of Object.entries(factors)) {
    const limit = roundTo((spent[prevMonth]?.[name] || 0) * factor, 100);
    if (limit > 0) {
      budgets.push({
        user: userId,
        category: catByName[name]._id,
        month: prevMonth,
        limit: limit * 100,
        expiresAt,
      });
    }
  }

  return budgets;
};

const deleteUsersAndData = async (ids) => {
  await Transaction.deleteMany({ user: { $in: ids } });
  await Category.deleteMany({ user: { $in: ids } });
  await Budget.deleteMany({ user: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids }, isDemo: true });
};

export const createDemoUser = async () => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DEMO_TTL_MS);
  const user = await User.create({
    username: "Demo Guest",
    email: `demo-${crypto.randomBytes(12).toString("hex")}@demo.local`,
    password: crypto.randomBytes(32).toString("hex"),
    isDemo: true,
    expiresAt,
  });

  try {
    const categories = await Category.insertMany(
      defaultCategories.map((category) => ({ ...category, user: user._id, expiresAt }))
    );
    const catByName = Object.fromEntries(categories.map((category) => [category.name, category]));
    const { docs, spent } = buildTransactions(user._id, catByName, expiresAt);

    await Transaction.insertMany(docs);
    await Budget.insertMany(buildBudgets(user._id, catByName, spent, expiresAt));
  } catch (error) {
    await deleteUsersAndData([user._id]);
    throw error;
  }

  return user;
};

export const cleanupExpiredDemos = async () => {
  const now = new Date();
  const fallbackCutoff = new Date(now.getTime() - DEMO_TTL_MS);
  const expired = await User.find({
    isDemo: true,
    $or: [
      { expiresAt: { $lte: now } },
      { expiresAt: { $exists: false }, createdAt: { $lte: fallbackCutoff } },
    ],
  }).select("_id");

  if (!expired.length) return 0;
  await deleteUsersAndData(expired.map((user) => user._id));
  return expired.length;
};
