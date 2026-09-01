import { Sequelize } from "sequelize";
import { env } from "@/lib/env";
import { registerModels, type Models } from "./models";

/**
 * A single Sequelize instance is cached on `globalThis` so Next.js dev-mode
 * hot reloads don't open a new connection pool (and re-`init` models) on every
 * edit. The connection itself is opened lazily on first query.
 */
const globalForDb = globalThis as unknown as {
  __n5dealDb?: { sequelize: Sequelize; models: Models };
};

function create(): { sequelize: Sequelize; models: Models } {
  const sequelize = new Sequelize(env().DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    define: { underscored: true, timestamps: true },
    pool: { max: 5, min: 0, idle: 10_000, acquire: 30_000 },
  });
  const models = registerModels(sequelize);
  return { sequelize, models };
}

export function db(): Models {
  if (!globalForDb.__n5dealDb) {
    globalForDb.__n5dealDb = create();
  }
  return globalForDb.__n5dealDb.models;
}

export function sequelize(): Sequelize {
  return db().sequelize;
}

export * from "./models";
