import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "next-build",
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.app", "*.ngrok.io"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
