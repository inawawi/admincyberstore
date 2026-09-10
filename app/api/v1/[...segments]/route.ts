import { handleV1Request } from "@/lib/api/router";
import { getCorsHeaders } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ segments: string[] }>;
}

async function dispatch(request: Request, context: Context) {
  const { segments } = await context.params;
  return handleV1Request(request, segments || []);
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
