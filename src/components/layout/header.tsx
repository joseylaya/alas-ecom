"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { useCartStore } from "@/features/cart/cart-store";
import { productPrice, searchProducts } from "@/lib/catalog-discovery";
import { formatPeso } from "@/lib/money";
import type { Product } from "@/types/catalog";

function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>; }
function UserIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" /></svg>; }
function BagIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5.5 8.5h13l-1 12h-11l-1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></svg>; }
function CloseIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 5 14 14M19 5 5 19" /></svg>; }

export function Header({ products }: { products: Product[] }) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const results = useMemo(() => query.trim() ? searchProducts(products, query).slice(0, 5) : products.slice(0, 3), [products, query]);
  const closeSearch = () => { setIsSearchOpen(false); setQuery(""); };

  useEffect(() => {
    if (!isSearchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeSearch(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKeyDown); };
  }, [isSearchOpen]);

  if (pathname.startsWith("/checkout")) return null;
  const shopSearchUrl = `/shop${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`;

  return <>
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#fcf8f8]/90 px-5 py-3 backdrop-blur-md">
      <nav className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center gap-7 text-xs"><Link className={pathname === "/shop" ? "border-b border-black pb-1" : ""} href="/shop">Shop</Link><Link href="/#story" className="hidden md:block">Editorial</Link></div>
        <Logo />
        <div className="flex items-center justify-end gap-5"><button type="button" aria-label="Search products" onClick={() => setIsSearchOpen(true)}><SearchIcon /></button><Link aria-label="Customer account" href="/login" className="hidden md:block"><UserIcon /></Link><Link aria-label={`Shopping bag with ${count} items`} href="/cart" className="relative"><BagIcon />{count > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">{count}</span>}</Link></div>
      </nav>
    </header>

    {isSearchOpen && <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#fcf8f8]/98 px-5 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Product search">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between"><Logo /><button type="button" aria-label="Close search" onClick={closeSearch}><CloseIcon /></button></div>
        <label className="mt-12 flex items-center gap-4 border-b border-black pb-4 md:mt-16"><SearchIcon /><span className="sr-only">Search products</span><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, categories, materials…" className="min-w-0 flex-1 bg-transparent font-editorial text-2xl outline-none placeholder:text-black/30 md:text-5xl" />{query && <button type="button" onClick={() => setQuery("")} className="text-[10px] font-semibold uppercase tracking-[.12em]">Clear</button>}</label>
        <div className="mt-5 flex items-center justify-between gap-4"><p className="text-[10px] uppercase tracking-[.14em] text-black/50">{query ? `${results.length}${results.length === 5 ? "+" : ""} result${results.length === 1 ? "" : "s"}` : "Suggested pieces"}</p>{query && results.length > 0 && <Link href={shopSearchUrl} onClick={closeSearch} className="text-[10px] font-semibold uppercase tracking-[.12em] underline underline-offset-4">View all in Shop</Link>}</div>
        <div className="mt-5 divide-y divide-black/10">{results.map((product) => <Link key={product.id} href={`/products/${product.slug}`} onClick={closeSearch} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 py-4 md:grid-cols-[72px_1fr_auto] md:gap-5 md:py-5"><img src={product.image} alt="" className="aspect-[3/4] h-20 w-16 object-cover" /><div className="min-w-0"><h2 className="truncate font-editorial text-lg md:text-xl">{product.name}</h2><p className="mt-1 truncate text-[10px] uppercase tracking-[.12em] text-black/50">{product.collection} · {product.material}</p></div><span className="text-xs md:text-sm">{formatPeso(productPrice(product))}</span></Link>)}{query && results.length === 0 && <div className="py-16 text-center"><p className="font-editorial text-2xl text-black/60">No products found for “{query}”.</p><Link href="/shop" onClick={closeSearch} className="mt-6 inline-block border border-black px-6 py-3 text-[10px] font-semibold uppercase tracking-[.14em]">Open Shop</Link></div>}</div>
      </div>
    </div>}
  </>;
}
