// Script to manually create all tables
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  host: "localhost",
  port: 5432,
  database: "postgres",
  username: "user",
  password: "root",
  dialect: "postgres",
  logging: console.log,
});

async function createTables() {
  try {
    console.log("🔧 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected successfully!");

    console.log("\n📋 Creating all tables...");

    // Create Users table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        nonce VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Users table created");

    // Create Deposits table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chain_deposit_id INTEGER UNIQUE NOT NULL,
        tenant_address VARCHAR(42) NOT NULL,
        landlord_address VARCHAR(42) NOT NULL,
        token_address VARCHAR(42) NOT NULL,
        amount VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        released BOOLEAN DEFAULT FALSE,
        in_dispute BOOLEAN DEFAULT FALSE,
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Deposits table created");

    // Create Signatories table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS signatories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deposit_id UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
        address VARCHAR(42) NOT NULL,
        signatory_index INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Signatories table created");

    // Create Votes table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deposit_id UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
        signatory_address VARCHAR(42) NOT NULL,
        vote_choice VARCHAR(20) NOT NULL DEFAULT 'pending',
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Votes table created");

    // Create Disputes table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS disputes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deposit_id UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
        triggered_by VARCHAR(42) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        resolution TEXT,
        tenant_amount VARCHAR(255),
        landlord_amount VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
    `);
    console.log("✅ Disputes table created");

    // Create YieldHistory table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS yield_histories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deposit_id UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
        user_address VARCHAR(42) NOT NULL,
        yield_amount VARCHAR(255) NOT NULL,
        apy VARCHAR(255) NOT NULL,
        claimed BOOLEAN DEFAULT FALSE,
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT NOW(),
        claimed_at TIMESTAMP
      );
    `);
    console.log("✅ YieldHistory table created");

    // Create indexes
    console.log("\n🔍 Creating indexes...");
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_deposits_tenant ON deposits(tenant_address);"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_deposits_landlord ON deposits(landlord_address);"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_signatories_deposit ON signatories(deposit_id);"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_votes_deposit ON votes(deposit_id);"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_disputes_deposit ON disputes(deposit_id);"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_yield_histories_user ON yield_histories(user_address);"
    );
    console.log("✅ All indexes created");

    // List all tables
    console.log("\n📋 Final table list:");
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    tables.forEach((table) => console.log(`  - ${table.table_name}`));

    console.log("\n🎉 All tables created successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔚 Connection closed.");
  }
}

createTables();
