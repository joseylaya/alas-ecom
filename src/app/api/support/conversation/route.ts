import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const messageSchema = z.object({ content: z.string().trim().min(1).max(2000), clientMessageId: z.string().min(1).max(100) });
const createSchema = z.object({ displayName: z.string().trim().max(100).optional(), context: z.object({ product_id: z.number().int().positive().optional(), variant_id: z.number().int().positive().optional(), product_slug: z.string().max(255).optional(), page_path: z.string().max(500).optional() }).optional() });
const idCookie = "alas_support_conversation";
const tokenCookie = "alas_support_token";

function managementUrl() { return process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, ""); }

export async function GET() {
  const jar = await cookies(); const id = jar.get(idCookie)?.value; const token = jar.get(tokenCookie)?.value; const base = managementUrl();
  if (!id || !token) return NextResponse.json({ data: null });
  if (!base) return NextResponse.json({ error: { message: "Support is temporarily unavailable." } }, { status: 503 });
  const response = await fetch(`${base}/api/v1/support/conversations/${id}`, { headers: { accept: "application/json", authorization: `Bearer ${token}` }, cache: "no-store" });
  if (response.status === 403 || response.status === 404) { jar.delete(idCookie); jar.delete(tokenCookie); return NextResponse.json({ data: null }); }
  return NextResponse.json(await response.json(), { status: response.status });
}

export async function POST(request: Request) {
  const base = managementUrl(); if (!base) return NextResponse.json({ error: { message: "Support is temporarily unavailable." } }, { status: 503 });
  const body = await request.json().catch(() => ({})); const jar = await cookies(); const id = jar.get(idCookie)?.value; const token = jar.get(tokenCookie)?.value;
  if (id && token) {
    const parsed = messageSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: { message: "Enter a message up to 2,000 characters." } }, { status: 422 });
    const response = await fetch(`${base}/api/v1/support/conversations/${id}/messages`, { method: "POST", headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ content: parsed.data.content, client_message_id: parsed.data.clientMessageId }), cache: "no-store" });
    return NextResponse.json(await response.json(), { status: response.status });
  }
  const parsed = createSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: { message: "Unable to start support." } }, { status: 422 });
  const response = await fetch(`${base}/api/v1/support/conversations`, { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ display_name: parsed.data.displayName, context: parsed.data.context }), cache: "no-store" });
  const payload = await response.json();
  if (response.ok) {
    jar.set(idCookie, payload.data.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 90, path: "/" });
    jar.set(tokenCookie, payload.support_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 90, path: "/" });
    delete payload.support_token;
  }
  return NextResponse.json(payload, { status: response.status });
}
