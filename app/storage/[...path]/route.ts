import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { resolveMediaPath } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const params = await context.params;
    const relative = params.path.join("/");
    const filePath = resolveMediaPath(relative);
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const data = await readFile(filePath);
    return new Response(data, {
      headers: {
        "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
