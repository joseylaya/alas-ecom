import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalog } from "@/features/catalog/catalog.service";

const schema = z.object({ ids: z.string().max(600) });

export async function GET(request: Request) {
  const parsed = schema.safeParse({ ids: new URL(request.url).searchParams.get("ids") ?? "" });
  if (!parsed.success) return NextResponse.json({ data: [] });
  const ids = new Set(parsed.data.ids.split(",").filter((id) => /^\d+$/.test(id)).slice(0, 5));
  const products = (await getCatalog()).filter((product) => ids.has(product.id));
  return NextResponse.json({ data: products }, { headers: { "Cache-Control": "private, max-age=15" } });
}
