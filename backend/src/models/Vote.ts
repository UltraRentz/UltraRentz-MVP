import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export enum VoteChoice {
  PENDING = "pending",
  REFUND_TENANT = "refund_tenant",
  PAY_LANDLORD = "pay_landlord",
}

interface VoteAttributes {
  id: string;
  deposit_id: string;
  signatory_address: string;
  vote_choice: VoteChoice;
  tx_hash: string;
  created_at: Date;
}

interface VoteCreationAttributes
  extends Optional<VoteAttributes, "id" | "created_at"> {}

class Vote
  extends Model<VoteAttributes, VoteCreationAttributes>
  implements VoteAttributes
{
  public id!: string;
  public deposit_id!: string;
  public signatory_address!: string;
  public vote_choice!: VoteChoice;
  public tx_hash!: string;
  public readonly created_at!: Date;
}

Vote.init(
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
    signatory_address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [42, 42],
      },
    },
    vote_choice: {
      type: DataTypes.ENUM(...Object.values(VoteChoice)),
      allowNull: false,
      defaultValue: VoteChoice.PENDING,
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: "votes",
    timestamps: false,
    indexes: [
      {
        fields: ["deposit_id"],
      },
      {
        fields: ["signatory_address"],
      },
      {
        unique: true,
        fields: ["deposit_id", "signatory_address"],
      },
    ],
  }
);

export { Vote };

