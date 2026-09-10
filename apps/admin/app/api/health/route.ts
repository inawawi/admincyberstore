import { healthcheck } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = await healthcheck();
    return Response.json({ status: "ok", database, timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: "degraded", database: { ok: false }, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
