"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    // gen_random_uuid() is built in on PG13+, but keep the extension as a backstop.
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    const now = { allowNull: false, type: DataTypes.DATE };
    const uuidPk = {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
      allowNull: false,
    };

    await queryInterface.createTable("users", {
      id: uuidPk,
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM("buyer", "seller", "manager"), allowNull: false },
      status: {
        type: DataTypes.ENUM("active", "suspended", "removed"),
        allowNull: false,
        defaultValue: "active",
      },
      created_at: now,
      updated_at: now,
    });

    await queryInterface.createTable("buyer_profiles", {
      id: uuidPk,
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      headline: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      bio: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      mandate: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      target_sectors: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      target_jurisdictions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      ticket_min: { type: DataTypes.BIGINT, allowNull: true },
      ticket_max: { type: DataTypes.BIGINT, allowNull: true },
      currency: {
        type: DataTypes.ENUM("USD", "EUR", "GBP"),
        allowNull: false,
        defaultValue: "USD",
      },
      created_at: now,
      updated_at: now,
    });

    await queryInterface.createTable("seller_profiles", {
      id: uuidPk,
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      company_name: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      about: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      website: { type: DataTypes.STRING, allowNull: true },
      created_at: now,
      updated_at: now,
    });

    await queryInterface.createTable("assets", {
      id: uuidPk,
      seller_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      title: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      sector: {
        type: DataTypes.ENUM("bank", "fintech", "payment", "emi", "crypto", "forex"),
        allowNull: false,
      },
      license_type: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      country: { type: DataTypes.STRING, allowNull: false },
      business_status: {
        type: DataTypes.ENUM("active", "dormant", "in_development"),
        allowNull: false,
        defaultValue: "active",
      },
      asking_price: { type: DataTypes.BIGINT, allowNull: true },
      currency: {
        type: DataTypes.ENUM("USD", "EUR", "GBP"),
        allowNull: false,
        defaultValue: "USD",
      },
      year_issued: { type: DataTypes.INTEGER, allowNull: true },
      employees: { type: DataTypes.STRING, allowNull: true },
      regulator: { type: DataTypes.STRING, allowNull: true },
      highlights: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      status: {
        type: DataTypes.ENUM("draft", "published", "suspended", "archived"),
        allowNull: false,
        defaultValue: "draft",
      },
      views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: now,
      updated_at: now,
    });

    await queryInterface.createTable("conversations", {
      id: uuidPk,
      asset_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "assets", key: "id" },
        onDelete: "SET NULL",
      },
      buyer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      seller_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      subject: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      created_at: now,
      updated_at: now,
    });

    await queryInterface.createTable("messages", {
      id: uuidPk,
      conversation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "conversations", key: "id" },
        onDelete: "CASCADE",
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      body: { type: DataTypes.TEXT, allowNull: false },
      read_at: { type: DataTypes.DATE, allowNull: true },
      created_at: now,
      updated_at: now,
    });

    await queryInterface.addIndex("assets", ["status", "sector"]);
    await queryInterface.addIndex("assets", ["country"]);
    await queryInterface.addIndex("assets", ["created_at"]);
    await queryInterface.addIndex("assets", ["seller_id"]);
    await queryInterface.addIndex("conversations", ["buyer_id"]);
    await queryInterface.addIndex("conversations", ["seller_id"]);
    await queryInterface.addConstraint("conversations", {
      fields: ["asset_id", "buyer_id", "seller_id"],
      type: "unique",
      name: "conversations_asset_buyer_seller_uniq",
    });
    await queryInterface.addIndex("messages", ["conversation_id", "created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("messages");
    await queryInterface.dropTable("conversations");
    await queryInterface.dropTable("assets");
    await queryInterface.dropTable("seller_profiles");
    await queryInterface.dropTable("buyer_profiles");
    await queryInterface.dropTable("users");
    // Drop the enum types Sequelize created for the ENUM columns.
    for (const t of [
      "enum_users_role",
      "enum_users_status",
      "enum_buyer_profiles_currency",
      "enum_assets_sector",
      "enum_assets_business_status",
      "enum_assets_currency",
      "enum_assets_status",
    ]) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${t}";`);
    }
  },
};
