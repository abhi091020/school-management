// backend/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

/**
 * Base Express application.
 * server.js will attach routes, DB, middleware, and error handlers.
 */
const app = express();

// Base/core middleware shared across all environments
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Simple root endpoint to confirm server is alive
app.get("/", (req, res) => {
  res.status(200).send("School Management API is running...");
});

// Do NOT register routes here.
// server.js dynamically registers all routes.

export default app;
