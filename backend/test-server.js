// Simple test server to check if basic setup works
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5001;

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:3000",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Test server is running",
  });
});

// Test API endpoint
app.get("/api/deposits/stats", (req, res) => {
  res.json({
    data: {
      totalDeposits: 0,
      activeDeposits: 0,
      releasedDeposits: 0,
      disputedDeposits: 0,
    },
  });
});

app.get("/api/disputes/stats", (req, res) => {
  res.json({
    data: {
      activeDisputes: 0,
      resolvedDisputes: 0,
      averageResolutionTimeHours: 0,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});
