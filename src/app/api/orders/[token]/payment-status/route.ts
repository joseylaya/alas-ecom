import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return proxy(token, `/api/v1/storefront/orders/${token}`, "GET");
}

async function proxy(token: string, path: string, method: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ message: "Order not found." }, { status: 404 });
  const baseUrl = process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, "");
  if (!baseUrl) return NextResponse.json({ message: "Payment status is unavailable." }, { status: 503 });
  const response = await fetch(`${baseUrl}${path}`, { method, cache: "no-store", headers: { accept: "application/json" } });
  return NextResponse.json(await response.json(), { status: response.status });
}
