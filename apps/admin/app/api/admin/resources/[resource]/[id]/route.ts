import { deleteResource, getChatDetail, getOrderDetail, getReviewDetail, updateResource } from "@/lib/admin-resources";
import { requireAdmin } from "@/lib/auth";
import { row } from "@/lib/db";
import { ApiError, handleApiError, requestData } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Context { params: Promise<{ resource: string; id: string }> }

export async function GET(request: Request, context: Context) {
  try {
    await requireAdmin();
    const { resource, id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id)) throw new ApiError(400, "ID tidak valid.");

    if (resource === "orders") {
      const details = await getOrderDetail(id);
      if (!details) throw new ApiError(404, "Pesanan tidak ditemukan.");
      return Response.json(details);
    }

    if (resource === "chats") {
      const details = await getChatDetail(id);
      if (!details) throw new ApiError(404, "Chat tidak ditemukan.");
      return Response.json(details);
    }

    if (resource === "reviews") {
      const details = await getReviewDetail(id);
      if (!details) throw new ApiError(404, "Ulasan tidak ditemukan.");
      return Response.json(details);
    }

    const item = await row(`SELECT * FROM ${resource} WHERE id = ? LIMIT 1`, [id]);
    if (!item) throw new ApiError(404, "Data tidak ditemukan.");
    return Response.json(item);
  } catch (error) {
    return handleApiError(request, error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { resource, id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id)) throw new ApiError(400, "ID tidak valid.");
    await updateResource(resource, id, await requestData(request), admin);
    return Response.json({ message: "Perubahan berhasil disimpan." });
  } catch (error) {
    return handleApiError(request, error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { resource, id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id)) throw new ApiError(400, "ID tidak valid.");
    const action = await deleteResource(resource, id, admin);
    return Response.json({ message: action === "deactivated" ? "Pengguna berhasil dinonaktifkan dan token login dicabut." : "Data berhasil dihapus." });
  } catch (error) {
    return handleApiError(request, error);
  }
}
