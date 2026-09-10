import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function resolveMediaPath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const fullPath = path.resolve(env.mediaRoot, normalized);
  const relative = path.relative(env.mediaRoot, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ApiError(400, "Path media tidak valid.");
  }
  return fullPath;
}

export async function saveImage(file: File, folder: string, maxMb = 5) {
  if (!allowedTypes[file.type]) {
    throw new ApiError(422, "Format gambar harus JPG, PNG, WEBP, atau GIF.");
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw new ApiError(422, `Ukuran gambar maksimal ${maxMb} MB.`);
  }
  const relativePath = `${folder}/${randomUUID()}${allowedTypes[file.type]}`;
  const fullPath = resolveMediaPath(relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
  return relativePath;
}
