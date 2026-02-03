import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface DisputeMessageAttributes {
  id: string;
  dispute_id: string;
  sender: string;
  message: string;
  created_at: Date;
}

interface DisputeMessageCreationAttributes extends Optional<DisputeMessageAttributes, "id" | "created_at"> {}

class DisputeMessage extends Model<DisputeMessageAttributes, DisputeMessageCreationAttributes> implements DisputeMessageAttributes {
  public id!: string;
  public dispute_id!: string;
  public sender!: string;
  public message!: string;
  public readonly created_at!: Date;
}

DisputeMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dispute_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "disputes", key: "id" },
    },
    sender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "dispute_messages",
    timestamps: false,
  }
);

export { DisputeMessage };
