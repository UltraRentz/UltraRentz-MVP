import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

// Import database and models
import { syncDatabase } from "./models";

// Import routes
import authRoutes from "./routes/auth";
import depositRoutes from "./routes/deposits";
import yieldRoutes from "./routes/yields";
import yieldDepositRoutes from "./routes/yieldDeposits";
import disputeRoutes from "./routes/disputes";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Import event listener
import { startEventListener } from "./services/eventListener";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware - more permissive CORS for development
app.use(
  cors({
    origin: true, // Allow all origins in development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/yields", yieldRoutes);
app.use("/api/yield-deposits", yieldDepositRoutes);
app.use("/api/disputes", disputeRoutes);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Subscribe to deposit updates
  socket.on("subscribe:deposit", (depositId) => {
    socket.join(`deposit:${depositId}`);
    console.log(`Client ${socket.id} subscribed to deposit ${depositId}`);
  });

  // Subscribe to yield updates
  socket.on("subscribe:yields", (userAddress) => {
    socket.join(`yields:${userAddress}`);
    console.log(`Client ${socket.id} subscribed to yields for ${userAddress}`);
  });

  // Unsubscribe from deposit
  socket.on("unsubscribe:deposit", (depositId) => {
    socket.leave(`deposit:${depositId}`);
    console.log(`Client ${socket.id} unsubscribed from deposit ${depositId}`);
  });

  // Unsubscribe from yields
  socket.on("unsubscribe:yields", (userAddress) => {
    socket.leave(`yields:${userAddress}`);
    console.log(
      `Client ${socket.id} unsubscribed from yields for ${userAddress}`
    );
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Sync database
    await syncDatabase();

    // Start event listener
    await startEventListener(io);

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 UltraRentz Backend Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `🔗 Frontend URL: ${
          process.env.FRONTEND_URL || "http://localhost:5174"
        }`
      );
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

// Start the server
startServer();
