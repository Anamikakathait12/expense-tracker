import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {   isDemo: { type: Boolean, default: false },
        username: { type: String, required: true, trim: true, minLength: 3 },
        email: {
            type: String,
            requied: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String, requied: true, minLength: 6, select: false },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        currency: { type: String, default: "INR" },
        expiresAt: { type: Date },
    },
    { timestamps: true } //adds createdAt and updatedAt automatically
);

// runs before every save:hash the password if it was changes
userSchema.pre("save", async function (){
    if(!this.isModified("password"))return;
    this.password = await bcrypt.hash(this.password, 10);
});

// compare a typed password with the stored hash
userSchema.methods.comparePassword = function(plainPassword){
    return bcrypt.compare(plainPassword, this.password);
};

// Never send the password inJSon responses
userSchema.set("toJSON",{
    transform:(doc,ret)=>{
        delete ret.password;
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});

userSchema.index({ isDemo: 1, createdAt: 1 }); // makes the cleanup query fast
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("User",userSchema);