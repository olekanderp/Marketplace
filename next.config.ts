import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
  async redirects() {
    return [{ source: "/", destination: "/listings", permanent: false }];
  },
};

export default nextConfig;
