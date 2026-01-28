import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface SignatoryAttributes {
  id: string;
  deposit_id: string;
  address: string;
  signatory_index: number;
  created_at: Date;
}

interface SignatoryCreationAttributes
  extends Optional<SignatoryAttributes, "id" | "created_at"> {}

class Signatory
  extends Model<SignatoryAttributes, SignatoryCreationAttributes>
  implements SignatoryAttributes
{
  public id!: string;
  public deposit_id!: string;
  public address!: string;
  public signatory_index!: number;
  public readonly created_at!: Date;
}

Signatory.init(
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
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        len: [42, 42],
      },
    },
    signatory_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 5,
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
    tableName: "signatories",
    timestamps: false,
    indexes: [
      {
        fields: ["deposit_id"],
      },
      {
        fields: ["address"],
      },
      {
        unique: true,
        fields: ["deposit_id", "signatory_index"],
      },
    ],
  }
);

export { Signatory };

