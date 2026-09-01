import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sequelize resolves its SQL dialect (and `pg`) through dynamic requires that
  // a bundler can't follow — keep them as real node_modules at runtime.
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
};

export default nextConfig;
