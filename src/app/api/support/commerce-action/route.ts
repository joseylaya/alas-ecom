import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ action: z.enum(["SELECT_VARIANT", "ADD_TO_CART", "BUY_NOW"]), productId: z.string().regex(/^\d+$/), variantId: z.string().regex(/^\d+$/), quantity: z.number().int().min(1).max(20), messageId: z.string().uuid().optional(), displayedPriceCentavos: z.number().int().min(0).optional(), idempotencyKey: z.string().min(1).max(120) });
const base = () => process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, "");

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid product action." } }, { status: 422 });
  const jar = await cookies(); const conversationId = jar.get("alas_support_conversation")?.value; const token = jar.get("alas_support_token")?.value;
  if (!conversationId || !token || !base()) return NextResponse.json({ error: { message: "Start a support chat first." } }, { status: 401 });
  const response = await fetch(`${base()}/api/v1/support/conversations/${conversationId}/commerce-actions`, { method: "POST", headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ action: parsed.data.action, product_id: Number(parsed.data.productId), variant_id: Number(parsed.data.variantId), quantity: parsed.data.quantity, message_id: parsed.data.messageId, displayed_price_centavos: parsed.data.displayedPriceCentavos, idempotency_key: parsed.data.idempotencyKey }), cache: "no-store" });
  return NextResponse.json(await response.json(), { status: response.status });
}
