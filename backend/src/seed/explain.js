import "dotenv/config";
import "../utils/dnsOverride.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Transaction from "../models/transaction.model.js";
import { monthRange } from "../utils/dateRange.js";

// follow the plan tree and list its stages, e.g. FETCH -> IXSCAN(user_1_date_-1)
const stages = (p) =>
  p ? [p.stage + (p.indexName ? `(${p.indexName})` : ""), ...stages(p.inputStage)] : [];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email: "rahul@test.com" });
  const { start, end } = monthRange(process.argv[2] || "2026-09");

  const plan = await Transaction.find({
    user: user._id,
    date: { $gte: start, $lt: end },
  }).explain("executionStats");

  const winning = plan.queryPlanner.winningPlan;
  const root = winning.queryPlan || winning; // newer MongoDB nests the plan

  console.log("Plan:", stages(root).join(" -> "));
  console.log("Documents returned:", plan.executionStats.nReturned);
  console.log("Index keys examined:", plan.executionStats.totalKeysExamined);
  console.log("Documents examined:", plan.executionStats.totalDocsExamined);
  console.log("Time (ms):", plan.executionStats.executionTimeMillis);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});