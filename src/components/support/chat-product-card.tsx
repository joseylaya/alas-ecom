"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/features/cart/cart-store";
import type { Product } from "@/types/catalog";

type Result = { status: string; price_centavos?: number; stock?: number };
type Intent = "cart" | "buy" | null;

function compactProductName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length > 3 ? `${words.slice(0, 3).join(" ")}…` : name;
}

export function ChatProductCard({ product, initialVariantId, messageId, onAction }: { product: Product; initialVariantId?: string; messageId: string; onAction: () => void }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const initial = product.variants.find((variant) => variant.id === initialVariantId && variant.stock > 0) ?? product.variants.find((variant) => variant.stock > 0);
  const [intent, setIntent] = useState<Intent>(null);
  const [color, setColor] = useState(initial?.color ?? product.variants[0]?.color ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [added, setAdded] = useState(false);
  const colors = [...new Set(product.variants.map((variant) => variant.color))];
  const selectedColorVariants = product.variants.filter((variant) => variant.color === color);
  const displayVariant = selectedColorVariants.find((variant) => variant.stock > 0) ?? initial;

  async function chooseSize(variantId: string) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant || busy || !intent) return;
    setBusy(true); setNotice("");
    const action = intent === "buy" ? "BUY_NOW" : "ADD_TO_CART";
    try {
      const response = await fetch("/api/support/commerce-action", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, productId: product.id, variantId: variant.id, quantity: 1, messageId, displayedPriceCentavos: variant.priceCentavos, idempotencyKey: `${messageId}:${action}:${variant.id}` }),
      });
      const body = await response.json() as { data?: Result; error?: { message?: string } };
      if (!response.ok || body.data?.status !== "SUCCESS") {
        setNotice(body.data?.status === "OUT_OF_STOCK" ? "That size just sold out. Please choose another one." : body.data?.status === "PRICE_CHANGED" ? `Price updated to ₱${((body.data.price_centavos ?? 0) / 100).toFixed(2)}. Please try again.` : body.error?.message ?? "That action could not be completed.");
        return;
      }
      if (intent === "buy") { onAction(); router.push("/checkout"); return; }
      addItem({ variantId: variant.id, productSlug: product.slug, productName: product.name, image: product.image, size: variant.size, color: variant.color, displayPriceCentavos: body.data.price_centavos ?? variant.priceCentavos, quantity: 1 });
      setAdded(true); onAction();
    } catch { setNotice("Connection issue — please try again."); } finally { setBusy(false); }
  }

  if (!displayVariant) return <div className="w-[244px] rounded-[20px] bg-white p-4 text-xs text-black/60 shadow-[0_10px_30px_rgba(0,0,0,.08)]">This item is currently sold out.</div>;

  if (added) return <article className="flex h-[346px] w-[244px] flex-none flex-col overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_13px_35px_rgba(0,0,0,.10)] animate-[cardAdded_.42s_ease-out]"><div className="relative h-[164px] overflow-hidden rounded-[16px] bg-[#f5f5f5]"><Image src={product.image} alt={product.name} fill sizes="244px" className="object-contain p-3" /><div className="absolute left-[38%] top-[40%] h-9 w-9 overflow-hidden rounded-lg bg-white shadow-md animate-[productToBag_.7s_ease-in_forwards]"><Image src={product.image} alt="" fill sizes="36px" className="object-contain p-1" /></div><span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-black text-white"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 8.5h13l-1 12h-11l-1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></svg></span></div><div className="flex flex-1 flex-col px-1 pt-3"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-emerald-700">Added to your cart</p><h3 className="mt-1 text-[14px] font-semibold text-black">{compactProductName(product.name)}</h3><p className="mt-1 text-[11px] text-black/55">Your selected size is saved and ready.</p><div className="mt-auto grid grid-cols-2 gap-2"><Link href="/cart" className="flex h-9 items-center justify-center rounded-full bg-[#f2f2f2] text-[10px] font-semibold text-black">View Cart</Link><Link href="/checkout" className="flex h-9 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">Checkout</Link></div></div><style jsx>{`@keyframes cardAdded { from { transform: scale(.94); opacity: .45; } to { transform: scale(1); opacity: 1; } } @keyframes productToBag { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 75% { transform: translate(83px, 58px) scale(.5); opacity: 1; } 100% { transform: translate(90px, 63px) scale(.15); opacity: 0; } }`}</style></article>;

  if (intent) return <article className="flex h-[346px] w-[244px] flex-none flex-col overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_13px_35px_rgba(0,0,0,.10)] animate-[cardAdded_.24s_ease-out]"><div className="flex items-center gap-3"><div className="relative h-14 w-14 flex-none overflow-hidden rounded-[14px] bg-[#f5f5f5]"><Image src={product.image} alt="" fill sizes="56px" className="object-contain p-1" /></div><div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-black/45">{intent === "buy" ? "Buy now" : "Add to cart"}</p><h3 className="truncate text-[13px] font-semibold">{compactProductName(product.name)}</h3><p className="mt-0.5 text-[12px] font-semibold">₱{(displayVariant.priceCentavos / 100).toFixed(2)}</p></div></div>{colors.length > 1 && <div className="mt-4"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-black/45">Color</p><div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">{colors.map((option) => <button key={option} disabled={busy || !product.variants.some((variant) => variant.color === option && variant.stock > 0)} onClick={() => setColor(option)} className={`h-8 shrink-0 rounded-full px-3 text-[10px] font-semibold ${color === option ? "bg-black text-white" : "bg-[#f1f1f1] text-black"} disabled:opacity-30`}>{option}</button>)}</div></div>}<div className="mt-4"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-black/45">Choose your size</p><div className="mt-2 grid grid-cols-4 gap-2">{selectedColorVariants.map((variant) => <button key={variant.id} disabled={busy || variant.stock < 1} onClick={() => void chooseSize(variant.id)} className="h-10 rounded-full bg-[#f1f1f1] px-1 text-[11px] font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30">{busy ? "…" : variant.stock < 1 ? "Sold" : variant.size}</button>)}</div></div>{notice && <p role="status" className="mt-3 text-[10px] leading-4 text-red-700">{notice}</p>}<button type="button" onClick={() => { setIntent(null); setNotice(""); }} className="mt-auto grid h-8 w-8 place-items-center rounded-full bg-[#f3f3f3] text-black/65 transition hover:bg-black hover:text-white" aria-label="Back to product"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><style jsx>{`@keyframes cardAdded { from { transform: translateY(7px); opacity: .2; } to { transform: translateY(0); opacity: 1; } }`}</style></article>;

  return <article className="flex h-[346px] w-[244px] flex-none flex-col overflow-hidden rounded-[22px] bg-white p-2.5 shadow-[0_13px_35px_rgba(0,0,0,.10)]"><Link href={`/products/${product.slug}`} className="relative block h-[164px] flex-none overflow-hidden rounded-[16px] bg-[#f5f5f5]"><Image src={product.image} alt={product.name} fill sizes="244px" className="object-contain p-3" /></Link><div className="flex flex-1 flex-col px-1 pt-2.5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 title={product.name} className="text-[13px] font-semibold leading-[18px] text-[#171717]">{compactProductName(product.name)}</h3><p className="mt-0.5 text-[13px] font-semibold text-black">₱{(displayVariant.priceCentavos / 100).toFixed(2)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${displayVariant.stock > 3 ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>{displayVariant.stock > 3 ? "Available" : `${displayVariant.stock} left`}</span></div><Link href={`/products/${product.slug}`} className="mt-auto flex h-8 items-center justify-center rounded-full bg-[#f3f3f3] text-[10px] font-semibold text-black">View Product</Link><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setIntent("cart")} className="h-8 whitespace-nowrap rounded-full bg-[#f3f3f3] px-2 text-[9px] font-semibold text-black">Add to Cart</button><button type="button" onClick={() => setIntent("buy")} className="h-8 whitespace-nowrap rounded-full bg-black px-2 text-[9px] font-semibold text-white">Buy Now</button></div></div></article>;
}
