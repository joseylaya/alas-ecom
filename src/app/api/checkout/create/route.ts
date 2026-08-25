import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
  customer: z.object({ name: z.string().trim().min(1).max(255), email: z.string().email(), phone: z.string().trim().min(7).max(40) }),
  shippingAddress: z.string().trim().min(1).max(2000),
  deliveryAddress: z.object({
    country: z.literal("Philippines"), region: z.string().trim().min(2).max(120), regionCode: z.string().regex(/^\d{10}$/), province: z.string().trim().min(2).max(120), city: z.string().trim().min(2).max(120), cityCode: z.string().regex(/^\d{10}$/),
    municipality: z.string().trim().max(120).optional(), barangay: z.string().trim().min(2).max(120), barangayCode: z.string().regex(/^\d{10}$/), postalCode: z.string().trim().min(3).max(12), streetAddress: z.string().trim().min(4).max(500),
    latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(),
  }),
  shippingQuoteId: z.string().uuid(),
  shippingSessionId: z.string().uuid(),
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(100) })).min(1).max(50),
});

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_CHECKOUT", message: "Please check your contact, address, and cart details." } }, { status: 422 });
  if (parsed.data.items.some((item) => !/^\d+$/.test(item.variantId))) {
    return NextResponse.json({ error: { code: "STALE_CART", message: "An item in your bag came from the old demo catalog. Remove it and add the product again before checkout." } }, { status: 422 });
  }

  const baseUrl = process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, "");
  if (!baseUrl) return NextResponse.json({ error: { code: "CHECKOUT_UNAVAILABLE", message: "Checkout is temporarily unavailable." } }, { status: 503 });

  const requestedKey = request.headers.get("idempotency-key");
  const idempotencyKey = requestedKey && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedKey) ? requestedKey : crypto.randomUUID();
  const sandbox = process.env.COMMERCE_MODE === "sandbox";
  const sandboxFlow = process.env.PAYMONGO_SANDBOX_FLOW === "checkout_session" ? "checkout_session" : "qrph";
  const sandboxToken = process.env.ALAS_SANDBOX_TOKEN;
  if (sandbox && !sandboxToken) return NextResponse.json({ error: { code: "SANDBOX_MISCONFIGURED", message: "Sandbox checkout is not configured." } }, { status: 503 });
  const response = await fetch(`${baseUrl}/api/v1/storefront/checkouts`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "idempotency-key": idempotencyKey, ...(sandbox ? { "x-commerce-mode": "sandbox", "x-sandbox-token": sandboxToken!, "x-payment-flow": sandboxFlow } : {}) },
    body: JSON.stringify({
      customer: parsed.data.customer,
      delivery_method: "shipping",
      shipping_address: parsed.data.shippingAddress,
      delivery_address: { ...parsed.data.deliveryAddress, region_code: parsed.data.deliveryAddress.regionCode, city_code: parsed.data.deliveryAddress.cityCode, barangay_code: parsed.data.deliveryAddress.barangayCode, postal_code: parsed.data.deliveryAddress.postalCode, street_address: parsed.data.deliveryAddress.streetAddress, regionCode: undefined, cityCode: undefined, barangayCode: undefined, postalCode: undefined, streetAddress: undefined },
      shipping_quote_id: parsed.data.shippingQuoteId,
      shipping_session_id: parsed.data.shippingSessionId,
      items: parsed.data.items.map((item) => ({ variant_id: Number(item.variantId), quantity: item.quantity })),
    }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) return NextResponse.json(body ?? { error: { code: "CHECKOUT_FAILED", message: "We could not create your order." } }, { status: response.status });
  return NextResponse.json(body, { status: 201 });
}
