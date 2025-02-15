const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
const gmailRoutes = require("./routes/gmailRoutes");
const authRoutes = require("./routes/authRoutes");
app.use("/api/gmail", gmailRoutes);
app.use("/auth", authRoutes);

// Basic Route
app.get("/", (req, res) => {
  res.send("Internal Tool Backend is running");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
