import path from "node:path";
import { access, cp } from "node:fs/promises";
import { config } from "dotenv";

// Standalone server changes cwd to next-build/standalone. Load local development
// env before that happens, while still allowing externally injected env vars.
config({ path: path.resolve(process.cwd(), ".env.local") });
if (process.env.MEDIA_ROOT && !path.isAbsolute(process.env.MEDIA_ROOT)) {
  process.env.MEDIA_ROOT = path.resolve(process.cwd(), process.env.MEDIA_ROOT);
}

const buildRoot = path.resolve(process.cwd(), "next-build");
const standaloneRoot = path.join(buildRoot, "standalone");
const staticRoot = path.join(buildRoot, "static");
try {
  await access(staticRoot);
  await cp(staticRoot, path.join(standaloneRoot, "next-build", "static"), { recursive: true });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

await import("../next-build/standalone/server.js");
