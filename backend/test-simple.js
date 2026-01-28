// Simple test to check database connection and table creation
const { Sequelize } = require("sequelize");
require("dotenv").config();

console.log("🔧 Testing database connection...");
console.log("Host:", process.env.DB_HOST || "localhost");
console.log("Port:", process.env.DB_PORT || "5432");
console.log("Database:", process.env.DB_NAME || "postgres");
console.log("Username:", process.env.DB_USER || "user");

const sequelize = new Sequelize({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "postgres",
  username: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "root",
  dialect: "postgres",
  logging: console.log,
});

async function test() {
  try {
    console.log("\n1️⃣ Testing connection...");
    await sequelize.authenticate();
    console.log("✅ Connection successful!");

    console.log("\n2️⃣ Testing table creation...");
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Test table created!");

    console.log("\n3️⃣ Listing all tables...");
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("📋 Tables in database:");
    tables.forEach((table) => console.log(`  - ${table.table_name}`));

    console.log("\n4️⃣ Cleaning up test table...");
    await sequelize.query("DROP TABLE IF EXISTS test_table;");
    console.log("✅ Test table removed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔚 Connection closed.");
  }
}

test();
