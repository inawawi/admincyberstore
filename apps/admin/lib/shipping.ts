import cities from "@/data/rajaongkir_cities.json";
import { env } from "@/lib/env";

type City = { city_id: string; city_name: string; type?: string };

export function findCityId(input: string | null | undefined) {
  if (!input) return null;
  const needle = input.toLowerCase().trim().replace(/^(kota|kabupaten)\s+/, "");
  const match = (cities as City[]).find((entry) => {
    const name = entry.city_name.toLowerCase();
    return name.includes(needle) || needle.includes(name);
  });
  return match?.city_id || null;
}

export async function shippingCost(input: {
  origin: string | number;
  destination: string | number;
  weight: number;
  courier: string;
  service?: string;
}) {
  if (!env.rajaOngkir.apiKey) return null;
  try {
    const body = new URLSearchParams({
      origin: String(input.origin),
      destination: String(input.destination),
      weight: String(Math.max(1, input.weight)),
      courier: input.courier,
    });
    const response = await fetch(`${env.rajaOngkir.baseUrl.replace(/\/$/, "")}/cost`, {
      method: "POST",
      headers: {
        key: env.rajaOngkir.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const data = await response.json() as {
      rajaongkir?: { results?: Array<{ costs?: Array<{ service: string; cost?: Array<{ value: number; etd?: string }> }> }> };
    };
    const costs = data.rajaongkir?.results?.[0]?.costs || [];
    const selected = costs.find((cost) =>
      input.service ? cost.service.toLowerCase() === input.service.toLowerCase() : true,
    ) || costs[0];
    return selected?.cost?.[0] || null;
  } catch {
    return null;
  }
}

export async function checkWaybill(waybill: string, courier: string) {
  if (!env.rajaOngkir.apiKey || !waybill) return null;
  try {
    const body = new URLSearchParams({
      waybill: waybill.trim(),
      courier: courier.toLowerCase().trim(),
    });
    const baseUrl = env.rajaOngkir.baseUrl.replace(/\/$/, "").replace(/\/starter$/, "");
    const response = await fetch(`${baseUrl}/waybill`, {
      method: "POST",
      headers: {
        key: env.rajaOngkir.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) return null;
    const data = await response.json() as {
      rajaongkir?: {
        result?: {
          delivered?: boolean;
          summary?: Record<string, unknown>;
          details?: Record<string, unknown>;
          manifest?: Array<{ manifest_description: string; manifest_date: string; manifest_time: string; city_name?: string }>;
        };
      };
    };
    return data.rajaongkir?.result || null;
  } catch {
    return null;
  }
}
