import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@satwa/shared", "@satwa/ai", "@satwa/social"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
