import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json()); // parses JSON request bodies into req.body
app.use(cookieParser()); // parses cookies into req.cookies

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});


app.use(notFound);     // catches any URL that doesn't match a route
app.use(errorHandler); // formats every error into a consistent JSON response

export default app;