import { sequelize } from "../config/database";
import { User } from "./User";
import { Deposit, DepositStatus } from "./Deposit";
import { Signatory } from "./Signatory";
import { Vote, VoteChoice } from "./Vote";
import { Dispute, DisputeStatus } from "./Dispute";
import { YieldHistory } from "./YieldHistory";
import { YieldDeposit } from "./YieldDeposit";

// Initialize all models first
console.log("🔧 Initializing Sequelize models...");

// Define associations
Deposit.hasMany(Signatory, { foreignKey: "deposit_id", as: "signatories" });
Signatory.belongsTo(Deposit, { foreignKey: "deposit_id", as: "deposit" });

Deposit.hasMany(Vote, { foreignKey: "deposit_id", as: "votes" });
Vote.belongsTo(Deposit, { foreignKey: "deposit_id", as: "deposit" });

Deposit.hasMany(Dispute, { foreignKey: "deposit_id", as: "disputes" });
Dispute.belongsTo(Deposit, { foreignKey: "deposit_id", as: "deposit" });

Deposit.hasMany(YieldHistory, { foreignKey: "deposit_id", as: "yieldHistory" });
YieldHistory.belongsTo(Deposit, { foreignKey: "deposit_id", as: "deposit" });

console.log("✅ All models initialized and associations defined");

// Export models and sequelize instance
export {
  sequelize,
  User,
  Deposit,
  Signatory,
  Vote,
  Dispute,
  YieldHistory,
  YieldDeposit,
  DepositStatus,
  VoteChoice,
  DisputeStatus,
};

// Function to sync database
export const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Import all models to ensure they're registered
    console.log("📋 Registering models...");
    console.log("  - User model registered");
    console.log("  - Deposit model registered");
    console.log("  - Signatory model registered");
    console.log("  - Vote model registered");
    console.log("  - Dispute model registered");
    console.log("  - YieldHistory model registered");

    // Sync all models
    console.log("🔄 Syncing database tables...");
    await sequelize.sync({ alter: true }); // Use alter: true for development
    console.log("✅ Database synchronized successfully.");

    // List all tables
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    console.log("📋 Tables created:");
    results.forEach((row: any) => console.log(`  - ${row.table_name}`));
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  }
};
