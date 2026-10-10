// token helper
import jwt from "jsonwebtoken";

export const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });

const isProd = process.env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

