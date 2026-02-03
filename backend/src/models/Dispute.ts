import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export enum DisputeStatus {
  ACTIVE = "active",
  RESOLVED = "resolved",
}

interface DisputeAttributes {
  id: string;
  deposit_id: string;
  triggered_by: string;
  status: DisputeStatus;
  resolution: string | null;
  tenant_amount: string | null;
  landlord_amount: string | null;
  created_at: Date;
  resolved_at: Date | null;
}

interface DisputeCreationAttributes
  extends Optional<DisputeAttributes, "id" | "created_at" | "resolved_at"> {}

class Dispute
  extends Model<DisputeAttributes, DisputeCreationAttributes>
  implements DisputeAttributes
{
  public id!: string;
  public deposit_id!: string;
  public triggered_by!: string;
  public status!: DisputeStatus;
  public resolution!: string | null;
  public tenant_amount!: string | null;
  public landlord_amount!: string | null;
  public readonly created_at!: Date;
  public resolved_at!: Date | null;
}

Dispute.init(
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
    triggered_by: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [42, 42],
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DisputeStatus)),
      allowNull: false,
      defaultValue: DisputeStatus.ACTIVE,
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tenant_amount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: true,
    },
    landlord_amount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "disputes",
    timestamps: false,
    indexes: [
      {
        fields: ["deposit_id"],
      },
      {
        fields: ["triggered_by"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

export { Dispute };

