import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface YieldHistoryAttributes {
  id: string;
  deposit_id: string;
  user_address: string;
  yield_amount: string;
  apy: string;
  claimed: boolean;
  tx_hash: string | null;
  created_at: Date;
  claimed_at: Date | null;
}

interface YieldHistoryCreationAttributes
  extends Optional<
    YieldHistoryAttributes,
    "id" | "created_at" | "claimed_at"
  > {}

class YieldHistory
  extends Model<YieldHistoryAttributes, YieldHistoryCreationAttributes>
  implements YieldHistoryAttributes
{
  public id!: string;
  public deposit_id!: string;
  public user_address!: string;
  public yield_amount!: string;
  public apy!: string;
  public claimed!: boolean;
  public tx_hash!: string | null;
  public readonly created_at!: Date;
  public claimed_at!: Date | null;
}

YieldHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deposit_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "deposits",
        key: "id",
      },
    },
    user_address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [42, 42],
      },
    },
    yield_amount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
    },
    apy: {
      type: DataTypes.DECIMAL(5, 2), // e.g., 8.50 for 8.5%
      allowNull: false,
    },
    claimed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isLowercase: true,
        len: [66, 66],
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "yield_history",
    timestamps: false,
    indexes: [
      {
        fields: ["deposit_id"],
      },
      {
        fields: ["user_address"],
      },
      {
        fields: ["claimed"],
      },
    ],
  }
);

export { YieldHistory };

