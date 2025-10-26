const { Sequelize } = require("sequelize");
require("dotenv").config();

// Create a simple connection test
const sequelize = new Sequelize({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "postgres",
  username: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "root",
  dialect: "postgres",
  logging: console.log,
});

async function testConnection() {
  try {
    console.log("Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Database connection successful!");

    console.log("Testing database sync...");
    await sequelize.sync({ alter: true });
    console.log("✅ Database sync successful!");

    // List all tables
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    console.log("📋 Tables in database:");
    results.forEach((row) => console.log(`  - ${row.table_name}`));
  } catch (error) {
    console.error("❌ Database error:", error.message);
  } finally {
    await sequelize.close();
  }
}

testConnection();
