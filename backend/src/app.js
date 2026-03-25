const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const { handleStripeWebhook } = require("./controllers/subscriptionController");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

const parseOrigins = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = new Set([
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.FRONTEND_ORIGINS),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const allowVercelPreviews = (process.env.ALLOW_VERCEL_PREVIEWS || "false").toLowerCase() === "true";
const isVercelPreviewOrigin = (origin) => {
  if (!allowVercelPreviews || !origin) {
    return false;
  }

  try {
    const parsed = new URL(origin);
    return parsed.hostname.endsWith(".vercel.app");
  } catch (error) {
    return false;
  }
};

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isVercelPreviewOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.post("/api/subscriptions/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
