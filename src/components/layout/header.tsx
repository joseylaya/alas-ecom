"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { products } from "@/features/catalog/catalog.data";
import { useCartStore } from "@/features/cart/cart-store";
import { formatPeso } from "@/lib/money";
import { Logo } from "@/components/layout/logo";

function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>; }
function UserIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" /></svg>; }
function BagIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5.5 8.5h13l-1 12h-11l-1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></svg>; }
function CloseIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 5 14 14M19 5 5 19" /></svg>; }

export function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const results = useMemo(() => { const term = query.trim().toLowerCase(); return term ? products.filter((product) => `${product.name} ${product.collection}`.toLowerCase().includes(term)) : products.slice(0, 3); }, [query]);
  if (pathname.startsWith("/checkout")) return null;
  return <><header className="sticky top-0 z-50 border-b border-black/10 bg-[#fcf8f8]/90 px-5 py-3 backdrop-blur-md"><nav className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center"><div className="hidden gap-7 text-xs md:flex"><Link className="border-b border-black pb-1" href="/shop">Shop</Link><Link href="/shop">Collections</Link><Link href="/#story">Editorial</Link></div><Logo /><div className="flex items-center justify-end gap-5"><button type="button" aria-label="Search products" onClick={() => setIsSearchOpen(true)}><SearchIcon /></button><Link aria-label="Customer account" href="/login" className="hidden md:block"><UserIcon /></Link><Link aria-label={`Shopping bag with ${count} items`} href="/cart" className="relative"><BagIcon />{count > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">{count}</span>}</Link></div></nav></header>{isSearchOpen && <div className="fixed inset-0 z-[100] bg-[#fcf8f8]/98 px-5 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Product search"><div className="mx-auto max-w-4xl"><div className="flex items-center justify-between"><Logo /><button type="button" aria-label="Close search" onClick={() => { setIsSearchOpen(false); setQuery(""); }}><CloseIcon /></button></div><label className="mt-16 flex items-center gap-4 border-b border-black pb-4"><SearchIcon /><span className="sr-only">Search products</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" className="min-w-0 flex-1 bg-transparent font-editorial text-3xl outline-none placeholder:text-black/30 md:text-5xl" /></label><p className="mt-5 text-[10px] uppercase tracking-[.14em] text-black/50">{query ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Suggested pieces"}</p><div className="mt-8 divide-y divide-black/10">{results.map((product) => <Link key={product.id} href={`/products/${product.slug}`} onClick={() => { setIsSearchOpen(false); setQuery(""); }} className="grid grid-cols-[72px_1fr_auto] items-center gap-5 py-5"><img src={product.image} alt="" className="aspect-[3/4] h-20 w-16 object-cover" /><div><h2 className="font-editorial text-xl">{product.name}</h2><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-black/50">{product.collection}</p></div><span className="text-sm">{formatPeso(Math.min(...product.variants.map((variant) => variant.priceCentavos)))}</span></Link>)}{query && results.length === 0 && <p className="py-12 font-editorial text-2xl text-black/50">No pieces found for “{query}”.</p>}</div></div></div>}</>;
}
