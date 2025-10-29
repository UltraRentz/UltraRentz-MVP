import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Debug: Log environment variables
console.log("🔍 Database Configuration Debug:");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log(
  "DATABASE_URL value:",
  process.env.DATABASE_URL?.substring(0, 20) + "..."
);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Support both DATABASE_URL (Railway) and individual connection params
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl:
          process.env.NODE_ENV === "production"
            ? {
                require: true,
                rejectUnauthorized: false,
              }
            : false,
      },
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: false,
      },
    })
  : new Sequelize({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "postgres",
      username: process.env.DB_USER || "user",
      password: process.env.DB_PASSWORD || "root",
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: false,
      },
    });

export { sequelize };
