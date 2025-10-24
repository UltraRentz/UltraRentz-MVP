// Simple test server to verify basic setup
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5001;

// CORS configuration - more permissive for development
app.use(
  cors({
    origin: true, // Allow all origins in development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Additional CORS headers middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Simple server is running",
  });
});

// Test API endpoints
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

app.get("/api/yields/summary/:address", (req, res) => {
  res.json({
    data: {
      totalYield: "0.0000",
      claimableYield: "0.0000",
      currentAPY: "0.00",
      activeDeposits: 0,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API endpoints available`);
});
