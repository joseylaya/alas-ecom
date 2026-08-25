import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string().uuid(),
  address: z.object({
    country: z.literal("Philippines"), region: z.string().trim().min(2).max(120), regionCode: z.string().regex(/^\d{10}$/), province: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(120), cityCode: z.string().regex(/^\d{10}$/), municipality: z.string().trim().max(120).optional(), barangay: z.string().trim().min(2).max(120), barangayCode: z.string().regex(/^\d{10}$/),
    postalCode: z.string().trim().min(3).max(12), streetAddress: z.string().trim().min(4).max(500),
    latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(),
  }),
  items: z.array(z.object({ variantId: z.string().regex(/^\d+$/), quantity: z.number().int().min(1).max(100) })).min(1).max(50),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: { code: "INCOMPLETE_ADDRESS", message: "Complete your delivery address to see courier prices." } }, { status: 422 });
  const baseUrl = process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, "");
  if (!baseUrl) return NextResponse.json({ error: { code: "SHIPPING_UNAVAILABLE", message: "Delivery quotes are temporarily unavailable." } }, { status: 503 });
  const sandbox = process.env.COMMERCE_MODE === "sandbox";
  const sandboxToken = process.env.ALAS_SANDBOX_TOKEN;
  const response = await fetch(`${baseUrl}/api/v1/storefront/shipping/quotes`, {
    method: "POST", headers: { accept: "application/json", "content-type": "application/json", ...(sandbox && sandboxToken ? { "x-commerce-mode": "sandbox", "x-sandbox-token": sandboxToken } : {}) },
    body: JSON.stringify({
      session_id: parsed.data.sessionId,
      address: { ...parsed.data.address, region_code: parsed.data.address.regionCode, city_code: parsed.data.address.cityCode, barangay_code: parsed.data.address.barangayCode, postal_code: parsed.data.address.postalCode, street_address: parsed.data.address.streetAddress, regionCode: undefined, cityCode: undefined, barangayCode: undefined, postalCode: undefined, streetAddress: undefined },
      items: parsed.data.items.map((item) => ({ variant_id: Number(item.variantId), quantity: item.quantity })),
    }), cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  return NextResponse.json(body ?? { error: { code: "SHIPPING_FAILED", message: "We could not calculate delivery right now." } }, { status: response.status });
}
