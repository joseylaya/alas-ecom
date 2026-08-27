"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/features/cart/cart-store";
import type { Product } from "@/types/catalog";

type Result = { status: string; price_centavos?: number; stock?: number; product_name?: string; size?: string; color?: string; quantity?: number };

function compactProductName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length > 3 ? `${words.slice(0, 3).join(" ")}…` : name;
}

export function ChatProductCard({ product, initialVariantId, messageId, onAction }: { product: Product; initialVariantId?: string; messageId: string; onAction: () => void }) {
  const router = useRouter(); const addItem = useCartStore((state) => state.addItem);
  const available = product.variants.filter((variant) => variant.stock > 0);
  const [variantId, setVariantId] = useState(initialVariantId && product.variants.some((variant) => variant.id === initialVariantId) ? initialVariantId : available[0]?.id ?? "");
  const [busy, setBusy] = useState<"SELECT_VARIANT" | "ADD_TO_CART" | "BUY_NOW" | null>(null); const [notice, setNotice] = useState(""); const [added, setAdded] = useState(false);
  const selected = product.variants.find((variant) => variant.id === variantId);
  const colors = [...new Set(product.variants.map((variant) => variant.color))];
  const title = compactProductName(product.name);
  async function act(action: "SELECT_VARIANT" | "ADD_TO_CART" | "BUY_NOW", nextVariantId = variantId) {
    const variant = product.variants.find((item) => item.id === nextVariantId); if (!variant || busy) return false;
    setBusy(action); setNotice("");
    try {
      const response = await fetch("/api/support/commerce-action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, productId: product.id, variantId: variant.id, quantity: 1, messageId, displayedPriceCentavos: variant.priceCentavos, idempotencyKey: `${messageId}:${action}:${variant.id}` }) });
      const body = await response.json() as { data?: Result; error?: { message?: string } }; const result = body.data;
      if (!response.ok || !result || result.status !== "SUCCESS") { setNotice(result?.status === "OUT_OF_STOCK" ? "Sold out just now — choose another size." : result?.status === "PRICE_CHANGED" ? `Price updated to ₱${((result.price_centavos ?? 0) / 100).toFixed(2)}. Please review it again.` : body.error?.message ?? "That action could not be completed."); return false; }
      if (action !== "SELECT_VARIANT") { addItem({ variantId: variant.id, productSlug: product.slug, productName: product.name, image: product.image, size: variant.size, color: variant.color, displayPriceCentavos: result.price_centavos ?? variant.priceCentavos, quantity: 1 }); setAdded(true); }
      if (action === "BUY_NOW") router.push("/checkout");
      onAction(); return true;
    } catch { setNotice("Connection issue — please try again."); return false; } finally { setBusy(null); }
  }
  if (!selected) return <div className="w-[244px] rounded-[20px] bg-white p-4 text-xs text-black/60 shadow-[0_10px_30px_rgba(0,0,0,.08)]">This item is currently sold out.</div>;
  return <article className="flex h-[408px] w-[244px] flex-none flex-col overflow-hidden rounded-[22px] bg-white p-2.5 shadow-[0_13px_35px_rgba(0,0,0,.10)]"><Link href={`/products/${product.slug}`} className="relative block h-[132px] flex-none overflow-hidden rounded-[16px] bg-[#f5f5f5] p-2"><Image src={product.image} alt={product.name} fill sizes="244px" className="object-contain p-2" /></Link><div className="flex min-h-0 flex-1 flex-col px-1 pb-1 pt-2.5"><div className="flex min-h-[49px] items-start justify-between gap-2"><div className="min-w-0"><h3 title={product.name} className="line-clamp-2 text-[13px] font-semibold leading-[18px] text-[#171717]">{title}</h3><p className="mt-0.5 text-[13px] font-semibold text-black">₱{(selected.priceCentavos / 100).toFixed(2)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${selected.stock > 3 ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>{selected.stock > 3 ? "Available" : `${selected.stock} left`}</span></div>{colors.length > 1 && <div className="mt-2"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-black/45">Color</p><div className="mt-1 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">{colors.map((color) => { const variant = product.variants.find((item) => item.color === color && item.stock > 0) ?? product.variants.find((item) => item.color === color); return <button key={color} disabled={!variant || variant.stock < 1 || busy !== null} onClick={() => { if (!variant) return; setVariantId(variant.id); void act("SELECT_VARIANT", variant.id); }} className={`h-7 shrink-0 rounded-full px-2.5 text-[10px] font-semibold transition ${selected.color === color ? "bg-black text-white" : "bg-[#f1f1f1] text-black"} disabled:opacity-35`}>{color}</button>; })}</div></div>}<div className="mt-2"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-black/45">Choose size</p><div className="mt-1 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">{product.variants.filter((variant) => variant.color === selected.color).map((variant) => <button key={variant.id} disabled={variant.stock < 1 || busy !== null} onClick={() => { setVariantId(variant.id); void act("SELECT_VARIANT", variant.id); }} className={`h-7 shrink-0 rounded-full px-3 text-[10px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-black/30 ${variant.id === variantId ? "bg-black text-white" : "bg-[#f1f1f1] text-black"} disabled:cursor-not-allowed disabled:opacity-35`}>{variant.size}{variant.stock < 1 ? " · sold out" : ""}</button>)}</div></div><div className="mt-auto pt-3"><Link href={`/products/${product.slug}`} className="flex h-8 items-center justify-center rounded-full bg-[#f3f3f3] px-3 text-[10px] font-semibold text-black transition hover:bg-[#e8e8e8]">View Product</Link>{added ? <div className="mt-2 grid grid-cols-2 gap-2"><Link href="/cart" className="flex h-8 items-center justify-center whitespace-nowrap rounded-full bg-[#f3f3f3] px-2 text-[9px] font-semibold">View Cart</Link><Link href="/checkout" className="flex h-8 items-center justify-center whitespace-nowrap rounded-full bg-black px-2 text-[9px] font-semibold text-white">Checkout</Link></div> : <div className="mt-2 grid grid-cols-2 gap-2"><button disabled={busy !== null || selected.stock < 1} onClick={() => void act("ADD_TO_CART")} className="h-8 whitespace-nowrap rounded-full bg-[#f3f3f3] px-2 text-[9px] font-semibold text-black disabled:opacity-40">{busy === "ADD_TO_CART" ? "Adding…" : "Add to Cart"}</button><button disabled={busy !== null || selected.stock < 1} onClick={() => void act("BUY_NOW")} className="h-8 whitespace-nowrap rounded-full bg-black px-2 text-[9px] font-semibold text-white disabled:opacity-40">{busy === "BUY_NOW" ? "Opening…" : "Buy Now"}</button></div>}{notice && <p role="status" className="mt-1.5 line-clamp-2 text-[10px] leading-3.5 text-red-700">{notice}</p>}</div></div></article>;
}
