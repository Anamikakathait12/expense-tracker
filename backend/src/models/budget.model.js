import mongoose from "mongoose";
import { toRupees } from "../utils/money.js";

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    month: {
      type: String, // "2026-10"
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-10"],
    },
    // stored in paise, same rule as transactions
    limit: {
      type: Number,
      required: true,
      min: [1, "Limit must be greater than 0"],
      validate: { validator: Number.isInteger, message: "Limit must be a whole number of paise" },
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// One budget per category per month for each user
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });
budgetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

budgetSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.limit = toRupees(ret.limit); // paise -> rupees
    delete ret.expiresAt;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Budget", budgetSchema);