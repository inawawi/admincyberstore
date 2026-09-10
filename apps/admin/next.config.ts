import type { NextConfig } from "next";
import path from "node:path";

const workspaceRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  distDir: "next-build",
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  poweredByHeader: false,
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.app", "*.ngrok.io"],
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
