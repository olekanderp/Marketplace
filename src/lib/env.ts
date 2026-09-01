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
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`,
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
      "Refusing to start in production with the example JWT_SECRET. Generate one with `openssl rand -base64 48`.",
    );
  }

  cached = {
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: secret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
    COOKIE_SECURE:
      process.env.COOKIE_SECURE !== undefined
        ? process.env.COOKIE_SECURE === "true"
        : nodeEnv === "production",
    NODE_ENV: nodeEnv,
  };
  return cached;
}
