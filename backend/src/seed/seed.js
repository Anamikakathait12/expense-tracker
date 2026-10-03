import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import Transaction from "../models/transaction.model.js";

const EMAIL = "rahul@test.com"; // seed data for this user
const COUNT = 5000;
const METHODS = ["cash", "upi", "card", "bank_transfer", "other"];
const NOTES = ["Lunch", "Groceries", "Uber ride", "Movie", "Electricity bill", "Coffee", "Recharge"];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email: EMAIL });
  if (!user) throw new Error(`User ${EMAIL} not found. Register first.`);

  const categories = await Category.find({ user: user._id });
  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");
  if (!expenseCats.length || !incomeCats.length) {
    throw new Error("Create at least one income and one expense category first.");
  }

  // --reset removes this user's existing transactions first
  if (process.argv.includes("--reset")) {
    const del = await Transaction.deleteMany({ user: user._id });
    console.log(`Deleted ${del.deletedCount} old transactions`);
  }

  const now = Date.now();
  const yearMs = 365 * 24 * 60 * 60 * 1000;

  const docs = Array.from({ length: COUNT }, () => {
    const isIncome = Math.random() < 0.1; // about 10% income
    const category = pick(isIncome ? incomeCats : expenseCats);
    const rupees = isIncome ? rand(20000, 80000) : rand(50, 5000);
    return {
      user: user._id,
      type: isIncome ? "income" : "expense",
      amount: rupees * 100, // stored in paise
      category: category._id,
      date: new Date(now - Math.random() * yearMs),
      note: pick(NOTES),
      paymentMethod: pick(METHODS),
    };
  });

  await Transaction.insertMany(docs);
  console.log(`Inserted ${COUNT} transactions for ${EMAIL}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});