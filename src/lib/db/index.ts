import { Sequelize } from "sequelize";
import { env } from "@/lib/env";
import { registerModels, type Models } from "./models";

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
  return { sequelize, models: registerModels(sequelize) };
}

export function db(): Models {
  globalForDb.__n5dealDb ??= create();
  return globalForDb.__n5dealDb.models;
}

export * from "./models";
