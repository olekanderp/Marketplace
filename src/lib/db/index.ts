import { Sequelize } from "sequelize";
import pg from "pg";
import { env } from "@/lib/env";
import { registerModels, type Models } from "./models";

const globalForDb = globalThis as unknown as {
  __n5dealDb?: { sequelize: Sequelize; models: Models };
};

function sslFor(url: string) {
  if (!/sslmode=require/i.test(url) && !/neon\.tech/i.test(url)) return undefined;
  return { require: true, rejectUnauthorized: true };
}

function create(): { sequelize: Sequelize; models: Models } {
  const url = env().DATABASE_URL;
  const ssl = sslFor(url);
  const sequelize = new Sequelize(url, {
    dialect: "postgres",
    dialectModule: pg,
    logging: false,
    define: { underscored: true, timestamps: true },
    dialectOptions: ssl ? { ssl } : {},
    pool: { max: 5, min: 0, idle: 10_000, acquire: 30_000 },
  });
  return { sequelize, models: registerModels(sequelize) };
}

export function db(): Models {
  globalForDb.__n5dealDb ??= create();
  return globalForDb.__n5dealDb.models;
}

export * from "./models";
