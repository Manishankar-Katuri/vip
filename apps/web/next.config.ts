import type { NextConfig } from "next";
import path from "node:path";

const monorepoRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  transpilePackages: ["@vip/social-engine", "@vip/market-intelligence", "@vip/shared", "@vip/database", "@vip/strategy-engine"],
  serverExternalPackages: ["@prisma/client", "prisma"]
};

export default nextConfig;
