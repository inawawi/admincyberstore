import path from "node:path";
import { access, cp } from "node:fs/promises";
import { config } from "dotenv";

// Standalone server changes cwd to next-build/standalone. Load local development
// env before that happens, while still allowing externally injected env vars.
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });
process.env.MEDIA_ROOT = path.resolve(process.cwd(), process.env.MEDIA_ROOT || "public/storage");

const buildRoot = path.resolve(process.cwd(), "next-build");
const standaloneRoot = path.join(buildRoot, "standalone", "apps", "admin");
const staticRoot = path.join(buildRoot, "static");
try {
  await access(staticRoot);
  await cp(staticRoot, path.join(standaloneRoot, "next-build", "static"), { recursive: true });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

await cp(path.resolve(process.cwd(), "public"), path.join(standaloneRoot, "public"), { recursive: true });
await import("../next-build/standalone/apps/admin/server.js");
