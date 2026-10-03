import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true, trim: true, maxLength: 30 },
        type: { type: String, enum: ["income", "expense"], required: true },
        color: { type: String, default: "#6366f1" },
        icon: { type: String, default: "tag" },
    },
    { timestamps: true }
);

// one user can't have two categories with the same name
categorySchema.index({user:1, name:1}, {unique:true});

export default mongoose.model("Category", categorySchema);