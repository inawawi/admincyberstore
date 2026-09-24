import type { NextConfig } from "next";
import path from "node:path";

import os from "node:os";

const workspaceRoot = path.resolve(process.cwd(), "../..");

function getDevOrigins(): string[] {
  const origins = new Set<string>([
    "cyberstore.kandangdev.com",
    "*.kandangdev.com",
    "172.16.*.*",
    "192.168.*.*",
    "10.*.*.*",
  ]);

  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          origins.add(iface.address);
        }
      }
    }
  } catch {
    // ignore
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const parsed = new URL(process.env.NEXT_PUBLIC_APP_URL);
      origins.add(parsed.hostname);
    } catch {
      // ignore
    }
  }

  if (process.env.ALLOWED_DEV_ORIGINS) {
    for (const origin of process.env.ALLOWED_DEV_ORIGINS.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) origins.add(trimmed);
    }
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  distDir: "next-build",
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  poweredByHeader: false,
  allowedDevOrigins: getDevOrigins(),
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
