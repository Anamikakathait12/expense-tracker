import mongoose from "mongoose";
import { toRupees } from "../utils/money.js";
const transactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["income", "expense"], required: true },
        // stored in paise (integer): ₹250.75 is saved as 25075
        amount: {
            type: Number,
            required: true,
            min: [1, "Amount must be greater than 0"],
            validate: {
                validator: Number.isInteger,
                message: "Amount must be a whole number of paise",
            },
        },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        date: { type: Date, required: true, default: Date.now },
        note: { type: String, trim: true, maxlength: 200, default: "" },
        paymentMethod: {
            type: String,
            enum: ["cash", "upi", "card", "bank_transfer", "other"],
            default: "cash",
        },
    },
    { timestamps: true }
);

// The two indexes from your spec
transactionSchema.index({ user: 1, date: -1 });//ascending and descending order
transactionSchema.index({ user: 1, category: 1 });//ascending both


transactionSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.amount = toRupees(ret.amount); // paise → rupees for API responses
        delete ret.__v;
        return ret;
    },
});
export default mongoose.model("Transaction", transactionSchema);