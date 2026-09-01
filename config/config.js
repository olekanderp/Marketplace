// Configuration consumed by sequelize-cli (migrations + seeders).
// The Next.js runtime builds its own Sequelize instance in src/lib/db/sequelize.ts.
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — cannot run migrations/seeders.");
}

const shared = {
  dialect: "postgres",
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
