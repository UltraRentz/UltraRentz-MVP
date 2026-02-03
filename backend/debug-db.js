// Debug script to test database connection and table creation
const { Sequelize } = require("sequelize");

console.log("🔧 Starting database debug...");

// Test connection
const sequelize = new Sequelize({
  host: "localhost",
  port: 5432,
  database: "postgres",
  username: "user",
  password: "root",
  dialect: "postgres",
  logging: console.log,
});

async function debug() {
  try {
    console.log("\n1️⃣ Testing connection...");
    await sequelize.authenticate();
    console.log("✅ Connection successful!");

    console.log("\n2️⃣ Creating test table...");
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        nonce VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Users table created!");

    console.log("\n3️⃣ Listing all tables...");
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("📋 Tables in database:");
    tables.forEach((table) => console.log(`  - ${table.table_name}`));

    console.log("\n4️⃣ Testing table structure...");
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log("📋 Users table structure:");
    columns.forEach((col) =>
      console.log(
        `  - ${col.column_name}: ${col.data_type} (${
          col.is_nullable === "YES" ? "nullable" : "not null"
        })`
      )
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  } finally {
    await sequelize.close();
    console.log("\n🔚 Connection closed.");
  }
}

debug();
