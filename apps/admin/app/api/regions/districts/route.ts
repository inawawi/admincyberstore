import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RegionItem {
  id: string;
  name: string;
  province_id?: string;
  regency_id?: string;
}

// In-memory cache to prevent redundant HTTP calls
let cachedProvinces: RegionItem[] | null = null;
const cachedRegenciesByProv = new Map<string, RegionItem[]>();
const cachedDistrictsByReg = new Map<string, string[]>();

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function cleanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.|adm\.)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawProvince = String(searchParams.get("province") || "").trim();
  const rawCity = String(searchParams.get("city") || "").trim();

  const cors = getCorsHeaders(request);

  if (!rawCity) {
    return NextResponse.json({ districts: [] }, { headers: cors });
  }

  try {
    // 1. Fetch & cache provinces list
    if (!cachedProvinces) {
      const res = await fetch("https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json", {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        cachedProvinces = await res.json();
      }
    }

    // 2. Identify province
    let matchedProv: RegionItem | undefined;
    if (rawProvince && cachedProvinces) {
      const cleanProv = cleanName(rawProvince);
      matchedProv = cachedProvinces.find((p) => {
        const pClean = cleanName(p.name);
        return pClean.includes(cleanProv) || cleanProv.includes(pClean);
      });
    }

    // 3. Find regency
    let targetRegency: RegionItem | undefined;

    if (matchedProv) {
      if (!cachedRegenciesByProv.has(matchedProv.id)) {
        const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${matchedProv.id}.json`, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const regList = await res.json();
          cachedRegenciesByProv.set(matchedProv.id, regList || []);
        }
      }

      const regencies = cachedRegenciesByProv.get(matchedProv.id) || [];
      const cleanTargetCity = cleanName(rawCity);
      const isKota = /kota/i.test(rawCity);
      const isKab = /kabupaten/i.test(rawCity);

      if (isKota) {
        targetRegency = regencies.find(
          (r) => /kota/i.test(r.name) && (cleanName(r.name) === cleanTargetCity || cleanName(r.name).includes(cleanTargetCity))
        );
      } else if (isKab) {
        targetRegency = regencies.find(
          (r) => /kabupaten/i.test(r.name) && (cleanName(r.name) === cleanTargetCity || cleanName(r.name).includes(cleanTargetCity))
        );
      }

      if (!targetRegency) {
        targetRegency = regencies.find((r) => cleanName(r.name) === cleanTargetCity);
      }

      if (!targetRegency) {
        targetRegency = regencies.find((r) => {
          const rClean = cleanName(r.name);
          return rClean.includes(cleanTargetCity) || cleanTargetCity.includes(rClean);
        });
      }
    } else if (cachedProvinces) {
      const cleanTargetCity = cleanName(rawCity);
      for (const p of cachedProvinces) {
        if (!cachedRegenciesByProv.has(p.id)) {
          try {
            const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${p.id}.json`, {
              headers: { "Accept": "application/json" },
              signal: AbortSignal.timeout(6000),
            });
            if (res.ok) {
              const regList = await res.json();
              cachedRegenciesByProv.set(p.id, regList || []);
            }
          } catch {
            continue;
          }
        }
        const regencies = cachedRegenciesByProv.get(p.id) || [];
        const found = regencies.find((r) => {
          const rClean = cleanName(r.name);
          return rClean === cleanTargetCity || rClean.includes(cleanTargetCity) || cleanTargetCity.includes(rClean);
        });
        if (found) {
          targetRegency = found;
          break;
        }
      }
    }

    if (!targetRegency) {
      return NextResponse.json({ districts: [] }, { headers: cors });
    }

    // 4. Fetch districts for regency
    if (!cachedDistrictsByReg.has(targetRegency.id)) {
      const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${targetRegency.id}.json`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const rawDistricts: RegionItem[] = await res.json();
        const districtNames = (rawDistricts || [])
          .map((d) => toTitleCase(d.name.trim()))
          .sort((a, b) => a.localeCompare(b, "id"));

        cachedDistrictsByReg.set(targetRegency.id, districtNames);
      }
    }

    const result = cachedDistrictsByReg.get(targetRegency.id) || [];
    return NextResponse.json({ districts: result }, { headers: cors });
  } catch (err: any) {
    console.warn("Failed to fetch districts for", rawCity, err?.message);
    return NextResponse.json({ districts: [] }, { headers: cors });
  }
}

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
