"use client";
import { useState } from "react";
import { useCartStore } from "@/features/cart/cart-store";
import type { Product } from "@/types/catalog";

export function AddToCart({ product }: { product: Product }) {
  const available = product.variants.filter((variant) => variant.stock > 0); const [variantId, setVariantId] = useState(available[0]?.id ?? ""); const [notice, setNotice] = useState(""); const addItem = useCartStore((state) => state.addItem); const selected = product.variants.find((variant) => variant.id === variantId);
  if (!selected) return <p className="mt-8 border border-black/20 px-5 py-4 text-center text-xs uppercase tracking-[.14em]">Sold out</p>;
  return <div className="mt-12"><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-[.08em]">Size</span><button className="border-b border-black text-xs uppercase">Size guide</button></div><div className="mt-4 grid grid-cols-4 gap-2">{product.variants.map((variant) => <button key={variant.id} disabled={variant.stock === 0} onClick={() => setVariantId(variant.id)} className={`border py-4 text-sm ${variant.id === variantId ? "border-black bg-black text-white" : "border-black/15"} disabled:text-black/30 disabled:line-through`}>{variant.size}</button>)}</div><button onClick={() => { addItem({ variantId: selected.id, productSlug: product.slug, productName: product.name, image: product.image, size: selected.size, color: selected.color, displayPriceCentavos: selected.priceCentavos, quantity: 1 }); setNotice("Added to bag"); }} className="mt-10 w-full bg-black px-5 py-5 text-xs font-semibold uppercase tracking-[.16em] text-white transition hover:bg-[#bb152c]">Add to bag →</button><button className="mt-3 w-full border border-black/15 px-5 py-5 text-xs uppercase tracking-[.14em]">♡ &nbsp; Save to wishlist</button>{notice && <p role="status" className="mt-4 text-center text-xs uppercase tracking-[.14em]">{notice}</p>}</div>;
}
