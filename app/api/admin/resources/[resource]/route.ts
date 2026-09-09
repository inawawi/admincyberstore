import { createResource, getResourceMeta, listResource } from "@/lib/admin-resources";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, requestData } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Context { params: Promise<{ resource: string }> }

export async function GET(request: Request, context: Context) {
  try {
    await requireAdmin();
    const { resource } = await context.params;
    const url = new URL(request.url);
    const meta = await getResourceMeta(resource);
    const result = await listResource(resource, {
      search: url.searchParams.get("search") || "",
      status: url.searchParams.get("status") || "",
      page: Number(url.searchParams.get("page") || 1),
      perPage: Number(url.searchParams.get("per_page") || 15),
    });
    return Response.json({ meta, ...result });
  } catch (error) {
    return handleApiError(request, error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { resource } = await context.params;
    const data = await requestData(request);
    const id = await createResource(resource, data, admin);
    return Response.json({ message: "Data berhasil ditambahkan.", id }, { status: 201 });
  } catch (error) {
    return handleApiError(request, error);
  }
}
