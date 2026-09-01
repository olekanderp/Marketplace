/**
 * Runtime environment access.
 *
 * Resolved lazily and memoised so that `next build` (which evaluates route
 * modules without a database or secrets available) never throws — the checks
 * run on the first real request instead.
 */

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  COOKIE_SECURE: boolean;
  NODE_ENV: "development" | "test" | "production";
}

let cached: Env | null = null;

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export function env(): Env {
  if (cached) return cached;

  const nodeEnv = (process.env.NODE_ENV ?? "development") as Env["NODE_ENV"];
  const secret = required("JWT_SECRET");

  if (nodeEnv === "production" && secret.startsWith("dev-only")) {
    throw new Error(
      "Refusing to start in production with the example JWT_SECRET. " +
        "Generate one with `openssl rand -base64 48`.",
    );
  }

  cached = {
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: secret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
    // Explicit COOKIE_SECURE wins; otherwise default to secure only in production.
    COOKIE_SECURE:
      process.env.COOKIE_SECURE !== undefined
        ? process.env.COOKIE_SECURE === "true"
        : nodeEnv === "production",
    NODE_ENV: nodeEnv,
  };
  return cached;
}
