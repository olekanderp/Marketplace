import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from "sequelize";
import type {
  AssetStatus,
  BusinessStatus,
  Currency,
  Role,
  Sector,
  UserStatus,
} from "@/lib/domain";

/* ────────────────────────────── User ────────────────────────────── */

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare name: string;
  declare role: Role;
  declare status: CreationOptional<UserStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare buyerProfile?: NonAttribute<BuyerProfile | null>;
  declare sellerProfile?: NonAttribute<SellerProfile | null>;
  declare assets?: NonAttribute<Asset[]>;
}

/* ────────────────────────── BuyerProfile ────────────────────────── */

export class BuyerProfile extends Model<
  InferAttributes<BuyerProfile>,
  InferCreationAttributes<BuyerProfile>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare headline: CreationOptional<string>;
  declare bio: CreationOptional<string>;
  declare mandate: CreationOptional<string>;
  declare targetSectors: CreationOptional<Sector[]>;
  declare targetJurisdictions: CreationOptional<string[]>;
  declare ticketMin: CreationOptional<number | null>;
  declare ticketMax: CreationOptional<number | null>;
  declare currency: CreationOptional<Currency>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
}

/* ────────────────────────── SellerProfile ───────────────────────── */

export class SellerProfile extends Model<
  InferAttributes<SellerProfile>,
  InferCreationAttributes<SellerProfile>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare companyName: CreationOptional<string>;
  declare about: CreationOptional<string>;
  declare website: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
}

/* ────────────────────────────── Asset ───────────────────────────── */

export class Asset extends Model<
  InferAttributes<Asset>,
  InferCreationAttributes<Asset>
> {
  declare id: CreationOptional<string>;
  declare sellerId: string;
  declare title: string;
  declare slug: string;
  declare description: CreationOptional<string>;
  declare sector: Sector;
  declare licenseType: CreationOptional<string>;
  declare country: string;
  declare businessStatus: CreationOptional<BusinessStatus>;
  declare askingPrice: CreationOptional<number | null>;
  declare currency: CreationOptional<Currency>;
  declare yearIssued: CreationOptional<number | null>;
  declare employees: CreationOptional<string | null>;
  declare regulator: CreationOptional<string | null>;
  declare highlights: CreationOptional<string[]>;
  declare status: CreationOptional<AssetStatus>;
  declare views: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare seller?: NonAttribute<User>;
}

/* ─────────────────────────── Conversation ───────────────────────── */

export class Conversation extends Model<
  InferAttributes<Conversation>,
  InferCreationAttributes<Conversation>
> {
  declare id: CreationOptional<string>;
  declare assetId: CreationOptional<string | null>;
  declare buyerId: string;
  declare sellerId: string;
  declare subject: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare buyer?: NonAttribute<User>;
  declare seller?: NonAttribute<User>;
  declare asset?: NonAttribute<Asset | null>;
  declare messages?: NonAttribute<Message[]>;
}

/* ───────────────────────────── Message ──────────────────────────── */

export class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
  declare id: CreationOptional<string>;
  declare conversationId: string;
  declare senderId: string;
  declare body: string;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare sender?: NonAttribute<User>;
  declare conversation?: NonAttribute<Conversation>;
}

/* ─────────────────────────── Registration ───────────────────────── */

export interface Models {
  sequelize: Sequelize;
  User: typeof User;
  BuyerProfile: typeof BuyerProfile;
  SellerProfile: typeof SellerProfile;
  Asset: typeof Asset;
  Conversation: typeof Conversation;
  Message: typeof Message;
}

function bigintGetter(field: string) {
  return function (this: Model): number | null {
    const raw = this.getDataValue(field as never) as unknown;
    return raw === null || raw === undefined ? null : Number(raw);
  };
}

let registered = false;

export function registerModels(sequelize: Sequelize): Models {
  if (registered && User.sequelize === sequelize) {
    return { sequelize, User, BuyerProfile, SellerProfile, Asset, Conversation, Message };
  }

  User.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM("buyer", "seller", "manager"), allowNull: false },
      status: {
        type: DataTypes.ENUM("active", "suspended", "removed"),
        allowNull: false,
        defaultValue: "active",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "users", modelName: "User" },
  );

  BuyerProfile.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      headline: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      bio: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      mandate: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      targetSectors: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      targetJurisdictions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      ticketMin: { type: DataTypes.BIGINT, allowNull: true, get: bigintGetter("ticketMin") },
      ticketMax: { type: DataTypes.BIGINT, allowNull: true, get: bigintGetter("ticketMax") },
      currency: {
        type: DataTypes.ENUM("USD", "EUR", "GBP"),
        allowNull: false,
        defaultValue: "USD",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "buyer_profiles", modelName: "BuyerProfile" },
  );

  SellerProfile.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      companyName: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      about: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      website: { type: DataTypes.STRING, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "seller_profiles", modelName: "SellerProfile" },
  );

  Asset.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      sellerId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      sector: {
        type: DataTypes.ENUM("bank", "fintech", "payment", "emi", "crypto", "forex"),
        allowNull: false,
      },
      licenseType: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      country: { type: DataTypes.STRING, allowNull: false },
      businessStatus: {
        type: DataTypes.ENUM("active", "dormant", "in_development"),
        allowNull: false,
        defaultValue: "active",
      },
      askingPrice: {
        type: DataTypes.BIGINT,
        allowNull: true,
        get: bigintGetter("askingPrice"),
      },
      currency: {
        type: DataTypes.ENUM("USD", "EUR", "GBP"),
        allowNull: false,
        defaultValue: "USD",
      },
      yearIssued: { type: DataTypes.INTEGER, allowNull: true },
      employees: { type: DataTypes.STRING, allowNull: true },
      regulator: { type: DataTypes.STRING, allowNull: true },
      highlights: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      status: {
        type: DataTypes.ENUM("draft", "published", "suspended", "archived"),
        allowNull: false,
        defaultValue: "draft",
      },
      views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "assets", modelName: "Asset" },
  );

  Conversation.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      assetId: { type: DataTypes.UUID, allowNull: true },
      buyerId: { type: DataTypes.UUID, allowNull: false },
      sellerId: { type: DataTypes.UUID, allowNull: false },
      subject: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "conversations", modelName: "Conversation" },
  );

  Message.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      conversationId: { type: DataTypes.UUID, allowNull: false },
      senderId: { type: DataTypes.UUID, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "messages", modelName: "Message" },
  );

  /* Associations */
  User.hasMany(Asset, { foreignKey: "sellerId", as: "assets" });
  Asset.belongsTo(User, { foreignKey: "sellerId", as: "seller" });

  User.hasOne(BuyerProfile, { foreignKey: "userId", as: "buyerProfile" });
  BuyerProfile.belongsTo(User, { foreignKey: "userId", as: "user" });

  User.hasOne(SellerProfile, { foreignKey: "userId", as: "sellerProfile" });
  SellerProfile.belongsTo(User, { foreignKey: "userId", as: "user" });

  Conversation.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
  Conversation.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
  Conversation.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });
  Conversation.hasMany(Message, { foreignKey: "conversationId", as: "messages" });
  Message.belongsTo(Conversation, { foreignKey: "conversationId", as: "conversation" });
  Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });

  registered = true;
  return { sequelize, User, BuyerProfile, SellerProfile, Asset, Conversation, Message };
}
