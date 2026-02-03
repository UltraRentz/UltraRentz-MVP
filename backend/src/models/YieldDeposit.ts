import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface YieldDepositAttributes {
  id: string;
  user_address: string;
  deposit_amount: string;
  duration_days: number;
  expected_apy: string;
  status: "pending" | "active" | "completed" | "cancelled";
  created_at: Date;
  activated_at: Date | null;
  completed_at: Date | null;
  tx_hash: string | null;
  use_aave: boolean;
}

interface YieldDepositCreationAttributes
  extends Optional<
    YieldDepositAttributes,
    "id" | "created_at" | "activated_at" | "completed_at" | "tx_hash"
  > {}

class YieldDeposit
  extends Model<YieldDepositAttributes, YieldDepositCreationAttributes>
  implements YieldDepositAttributes
{
  public id!: string;
  public user_address!: string;
  public deposit_amount!: string;
  public duration_days!: number;
  public expected_apy!: string;
  public status!: "pending" | "active" | "completed" | "cancelled";
  public readonly created_at!: Date;
  public activated_at!: Date | null;
  public completed_at!: Date | null;
  public tx_hash!: string | null;
}

YieldDeposit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    use_aave: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    user_address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [42, 42],
      },
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 3650, // Max 10 years
      },
    },
    expected_apy: {
      type: DataTypes.DECIMAL(5, 2), // e.g., 8.50 for 8.5%
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    activated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isLowercase: true,
        len: [66, 66],
      },
    },
  },
  {
    sequelize,
    tableName: "yield_deposits",
    timestamps: false,
    indexes: [
      {
        fields: ["user_address"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

export { YieldDeposit };
