import { NextRequest, NextResponse } from "next/server";

type PsgcItem = { code: string; name: string; province?: string; zip_code?: string; type?: string };
const baseUrl = "https://psgc.cloud/api/v2";

async function get(path: string): Promise<PsgcItem[]> {
  const response = await fetch(`${baseUrl}${path}`, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`PSGC request failed with ${response.status}`);
  const body = await response.json();
  return Array.isArray(body.data) ? body.data : [];
}

export async function GET(request: NextRequest) {
  const level = request.nextUrl.searchParams.get("level");
  const regionCode = request.nextUrl.searchParams.get("regionCode");
  const province = request.nextUrl.searchParams.get("province");
  const cityCode = request.nextUrl.searchParams.get("cityCode");
  try {
    if (level === "regions") {
      const items = await get("/regions");
      return NextResponse.json({ data: items.map(({ code, name }) => ({ code, name: name.trim() })) });
    }
    if ((level === "provinces" || level === "cities") && /^\d{10}$/.test(regionCode ?? "")) {
      const cities = await get(`/regions/${regionCode}/cities-municipalities`);
      const normalized = cities.map((item) => ({ ...item, name: item.name.trim(), province: item.province?.trim() || (regionCode === "1300000000" ? "Metro Manila" : "Independent City") }));
      if (level === "provinces") {
        const names = [...new Set(normalized.map((item) => item.province!))].sort((a, b) => a.localeCompare(b));
        return NextResponse.json({ data: names.map((name) => ({ code: `${regionCode}:${name}`, name })) });
      }
      if (!province) return NextResponse.json({ data: [] });
      return NextResponse.json({ data: normalized.filter((item) => item.province === province).map(({ code, name, zip_code, type }) => ({ code, name, postalCode: zip_code ?? "", type })) });
    }
    if (level === "barangays" && /^\d{10}$/.test(cityCode ?? "")) {
      const items = await get(`/cities-municipalities/${cityCode}/barangays`);
      return NextResponse.json({ data: items.map(({ code, name }) => ({ code, name: name.trim() })) });
    }
    return NextResponse.json({ error: { message: "Invalid address hierarchy request." } }, { status: 422 });
  } catch {
    return NextResponse.json({ error: { message: "Philippine address options are temporarily unavailable." } }, { status: 503 });
  }
}
