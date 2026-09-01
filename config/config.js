require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — cannot run migrations/seeders.");
}

const url = process.env.DATABASE_URL;
const needsSsl = /sslmode=require/i.test(url) || /neon\.tech/i.test(url);

const shared = {
  dialect: "postgres",
  dialectOptions: needsSsl ? { ssl: { require: true, rejectUnauthorized: true } } : {},
  seederStorage: "sequelize",
  seederStorageTableName: "sequelize_seeds",
  migrationStorageTableName: "sequelize_migrations",
  logging: false,
};

module.exports = {
  development: { ...shared, url: process.env.DATABASE_URL },
  test: { ...shared, url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL },
  production: { ...shared, url: process.env.DATABASE_URL },
};
