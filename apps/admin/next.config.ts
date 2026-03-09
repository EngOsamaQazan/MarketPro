import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@marketpro/shared", "@marketpro/ai", "@marketpro/social"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
