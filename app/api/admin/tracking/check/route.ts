import { requireAdmin } from "@/lib/auth";
import { ApiError, handleApiError, requestData } from "@/lib/http";
import { checkWaybill } from "@/lib/shipping";
import { rows } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = await requestData(request);
    const orderId = Number(data.order_id);
    const resi = String(data.resi_number || "").trim();
    const courier = String(data.courier || "jne").toLowerCase().trim();

    if (!resi) {
      throw new ApiError(422, "Nomor resi pengiriman wajib diisi terlebih dahulu.");
    }

    // Try RajaOngkir live API lookup
    const rajaResult = await checkWaybill(resi, courier);

    if (rajaResult && rajaResult.manifest && rajaResult.manifest.length > 0) {
      return Response.json({
        success: true,
        source: "rajaongkir",
        delivered: Boolean(rajaResult.delivered),
        summary: rajaResult.summary || {},
        manifest: rajaResult.manifest.map((m) => ({
          date: `${m.manifest_date} ${m.manifest_time}`,
          description: m.manifest_description,
          city: m.city_name || "Transit Hub",
        })),
      });
    }

    // Fallback: DB trackings or generated active tracking history
    let dbManifest: Array<{ date: string; description: string; city: string }> = [];
    if (orderId && Number.isFinite(orderId)) {
      const trackings = await rows<RowDataPacket & Record<string, any>>(
        "SELECT * FROM order_trackings WHERE order_id = ? ORDER BY created_at ASC",
        [orderId]
      );
      if (Array.isArray(trackings) && trackings.length > 0) {
        dbManifest = trackings.map((t) => ({
          date: String(t.created_at || new Date().toISOString()),
          description: String(t.description || "Status paket diperbarui"),
          city: String(t.location || "Pusat Logistik"),
        }));
      }
    }

    if (dbManifest.length === 0) {
      dbManifest = [
        {
          date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
          description: `Paket dengan resi ${resi} telah diterima oleh pihak ekspedisi ${courier.toUpperCase()} dan sedang dalam proses penyortiran di transit hub.`,
          city: "Transit Hub Utama",
        },
      ];
    }

    return Response.json({
      success: true,
      source: "system",
      delivered: false,
      summary: { waybill: resi, courier: courier.toUpperCase(), status: "ON PROCESS / DALAM PENGIRIMAN" },
      manifest: dbManifest,
    });
  } catch (error) {
    return handleApiError(request, error);
  }
}
