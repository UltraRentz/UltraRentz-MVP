import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface EvidenceAttributes {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  file_url: string;
  file_type: string;
  file_name: string;
  created_at: Date;
}

interface EvidenceCreationAttributes extends Optional<EvidenceAttributes, "id" | "created_at"> {}

class Evidence extends Model<EvidenceAttributes, EvidenceCreationAttributes> implements EvidenceAttributes {
  public id!: string;
  public dispute_id!: string;
  public uploaded_by!: string;
  public file_url!: string;
  public file_type!: string;
  public file_name!: string;
  public readonly created_at!: Date;
}

Evidence.init(
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
    uploaded_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
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
    tableName: "evidence",
    timestamps: false,
  }
);

export { Evidence };
