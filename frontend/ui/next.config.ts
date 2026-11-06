import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker sliko sestavimo iz samostojne gradnje, lokalna gradnja ostane nespremenjena
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
