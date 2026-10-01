import { healthcheck } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Proteksi dengan secret key opsional. Set HEALTH_CHECK_KEY di env production.
  const expectedKey = process.env.HEALTH_CHECK_KEY;
  if (expectedKey) {
    const provided = request.headers.get("x-health-key");
    if (provided !== expectedKey) {
      return new Response(null, { status: 401 });
    }
  }

  try {
    const database = await healthcheck();
    return Response.json({ status: "ok", database, timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: "degraded", database: { ok: false }, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
