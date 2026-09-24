import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(String(searchParams.get("lat") || "0"));
  const lng = parseFloat(String(searchParams.get("lng") || searchParams.get("lon") || "0"));

  const cors = getCorsHeaders(request);

  if (!lat || !lng) {
    return NextResponse.json({ address: null }, { headers: cors });
  }

  // Skenario 1: Coba Photon Reverse (Cepat & Akurat)
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const res = await fetch(photonUrl, {
      headers: {
        "User-Agent": "BsiCyberStoreApp/1.0 (cs@bsicyberstore.ac.id)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const pData = await res.json();
      if (pData?.features && pData.features.length > 0) {
        const p = pData.features[0].properties || {};
        const road = p.street || p.name || "";
        const district = p.district || "";
        const city = p.city || "";
        const province = p.state || "";
        const postalCode = p.postcode || "";

        const cleanParts = [road, district].filter(Boolean);
        const streetAddress = cleanParts.length > 0 ? cleanParts.join(", ") : (p.name || "Alamat Terpilih");

        return NextResponse.json(
          {
            address: {
              latitude: lat,
              longitude: lng,
              address: streetAddress,
              city,
              province,
              postal_code: postalCode,
              district,
            },
          },
          { headers: cors },
        );
      }
    }
  } catch (photonErr) {
    console.warn("Photon reverse failed, fallback to Nominatim:", photonErr);
  }

  // Skenario 2: Fallback ke Nominatim Reverse
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "BsiCyberStoreApp/1.0 (cs@bsicyberstore.ac.id)",
        "Accept-Language": "id",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.address) {
        const addr = data.address;
        const road = addr.road || addr.residential || addr.pedestrian || addr.suburb || "";
        const village = addr.village || addr.neighbourhood || addr.quarter || "";
        const district = addr.subdistrict || addr.district || addr.city_district || "";
        const city = addr.city || addr.town || addr.municipality || addr.county || "";
        const province = addr.state || addr.region || "";
        const postalCode = addr.postcode || "";

        const cleanAddressParts = [road, village, district].filter(Boolean);
        const streetAddress = cleanAddressParts.length > 0 ? cleanAddressParts.join(", ") : data.display_name.split(",").slice(0, 2).join(",");

        return NextResponse.json(
          {
            address: {
              latitude: lat,
              longitude: lng,
              address: streetAddress,
              city,
              province,
              postal_code: postalCode,
              district,
              display_name: data.display_name,
            },
          },
          { headers: cors },
        );
      }
    }
  } catch (nomErr) {
    console.error("Nominatim reverse failed:", nomErr);
  }

  return NextResponse.json({ address: null }, { headers: cors });
}

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
