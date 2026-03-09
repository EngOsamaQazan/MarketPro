import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@marketpro/shared", "@marketpro/ai", "@marketpro/social"],
};

export default nextConfig;
