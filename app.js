const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://c4r.co.uk",
  "https://www.c4r.co.uk",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/geocode", geocodeRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "noahautomotive_backend Automotive API is running",
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
