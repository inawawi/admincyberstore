import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim();

  const cors = getCorsHeaders(request);

  if (!q) {
    return NextResponse.json({ results: [] }, { headers: cors });
  }

  // Skenario 1: Coba Photon Komoot (OSM Geocoder - Cepat & Akurat)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`;
    const res = await fetch(photonUrl, {
      headers: {
        "User-Agent": "BsiCyberStoreApp/1.0 (cs@bsicyberstore.ac.id)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const pData = await res.json();
      if (pData?.features && Array.isArray(pData.features) && pData.features.length > 0) {
        const formatted = pData.features.map((f: any) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [0, 0];
          const title = p.name || p.street || "Lokasi Terpilih";
          const parts = [p.street, p.district, p.city, p.state, p.postcode].filter(Boolean);
          const display = parts.length > 0 ? `${title}, ${parts.join(", ")}` : title;

          return {
            lat: coords[1],
            lon: coords[0],
            name: title,
            display_name: display,
            street: p.street || p.name || "",
            city: p.city || "",
            district: p.district || "",
            province: p.state || "",
            postal_code: p.postcode || "",
          };
        });
        return NextResponse.json({ results: formatted }, { headers: cors });
      }
    }
  } catch (photonErr) {
    console.warn("Photon server search failed, fallback to Nominatim:", photonErr);
  }

  // Skenario 2: Fallback ke Nominatim OSM
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=id&limit=6&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "BsiCyberStoreApp/1.0 (cs@bsicyberstore.ac.id)",
        "Accept-Language": "id",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item: any) => {
          const addr = item.address || {};
          const title = item.name || (item.display_name ? item.display_name.split(",")[0] : "");
          return {
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            name: title,
            display_name: item.display_name,
            street: addr.road || addr.residential || addr.pedestrian || "",
            city: addr.city || addr.town || addr.municipality || addr.county || "",
            district: addr.subdistrict || addr.district || "",
            province: addr.state || addr.region || "",
            postal_code: addr.postcode || "",
          };
        });
        return NextResponse.json({ results: formatted }, { headers: cors });
      }
    }
  } catch (nomErr) {
    console.error("Nominatim server search failed:", nomErr);
  }

  return NextResponse.json({ results: [] }, { headers: cors });
}

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
