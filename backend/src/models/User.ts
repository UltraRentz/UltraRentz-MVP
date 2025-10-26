import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface UserAttributes {
  id: string;
  wallet_address: string;
  nonce: string;
  created_at: Date;
  updated_at: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "created_at" | "updated_at"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public wallet_address!: string;
  public nonce!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    wallet_address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isLowercase: true,
        len: [42, 42], // Ethereum address length
      },
    },
    nonce: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["wallet_address"],
      },
    ],
  }
);

export { User };

