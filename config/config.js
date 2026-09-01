// Configuration consumed by sequelize-cli (migrations + seeders).
// The Next.js runtime builds its own Sequelize instance in src/lib/db/index.ts.
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — cannot run migrations/seeders.");
}

const url = process.env.DATABASE_URL;
const needsSsl = /sslmode=require/i.test(url) || /neon\.tech/i.test(url);

const shared = {
  dialect: "postgres",
  dialectOptions: needsSsl ? { ssl: { require: true, rejectUnauthorized: true } } : {},
  // Track applied seeders in a table so `db:seed:all` is idempotent
  // (safe to run on every container start).
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
