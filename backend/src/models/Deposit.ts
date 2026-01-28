import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export enum DepositStatus {
  PENDING = "pending",
  ACTIVE = "active",
  RELEASED = "released",
  DISPUTED = "disputed",
  RESOLVED = "resolved",
}

interface DepositAttributes {
  id: string;
  chain_deposit_id: number;
  tenant_address: string;
  landlord_address: string;
  token_address: string;
  amount: string;
  status: DepositStatus;
  released: boolean;
  in_dispute: boolean;
  created_at: Date;
  updated_at: Date;
  tx_hash: string;
}

interface DepositCreationAttributes
  extends Optional<DepositAttributes, "id" | "created_at" | "updated_at"> {}

class Deposit
  extends Model<DepositAttributes, DepositCreationAttributes>
  implements DepositAttributes
{
  public id!: string;
  public chain_deposit_id!: number;
  public tenant_address!: string;
  public landlord_address!: string;
  public token_address!: string;
  public amount!: string;
  public status!: DepositStatus;
  public released!: boolean;
  public in_dispute!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public tx_hash!: string;
}

Deposit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chain_deposit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    tenant_address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [42, 42],
      },
    },
    landlord_address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [42, 42],
      },
    },
    token_address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [42, 42],
      },
    },
    amount: {
      type: DataTypes.DECIMAL(36, 18), // Support for large numbers with 18 decimals
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DepositStatus)),
      allowNull: false,
      defaultValue: DepositStatus.PENDING,
    },
    released: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    in_dispute: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [66, 66], // Ethereum transaction hash length
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "deposits",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["chain_deposit_id"],
      },
      {
        fields: ["tenant_address"],
      },
      {
        fields: ["landlord_address"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

export { Deposit };

