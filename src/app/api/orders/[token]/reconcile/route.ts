import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ message: "Order not found." }, { status: 404 });
  const baseUrl = process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, "");
  if (!baseUrl) return NextResponse.json({ message: "Payment confirmation is unavailable." }, { status: 503 });
  const response = await fetch(`${baseUrl}/api/v1/storefront/orders/${token}/refresh-payment`, { method: "POST", cache: "no-store", headers: { accept: "application/json" } });
  return NextResponse.json(await response.json(), { status: response.status });
}
