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

// Middleware - CORS configuration for both development and production
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL || "https://ultrarentz-mvp.vercel.app"]
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
      ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        process.env.NODE_ENV === "development" ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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
