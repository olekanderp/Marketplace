import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sequelize + pg load native/dynamic code and must not be bundled by Turbopack.
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
  output: "standalone",
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
