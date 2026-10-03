import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req,res,next) => {
    const token = req.cookies.token;
    if(!token) throw new ApiError(401, "Not authenticated, please log in");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if(!user) throw new ApiError(401, "User no longer exists");

    req.user = user;
    next();
});