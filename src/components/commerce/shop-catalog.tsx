"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { productPrice, searchProducts } from "@/lib/catalog-discovery";
import type { Product } from "@/types/catalog";

type Sort = "relevance" | "price-asc" | "price-desc" | "name";

function FilterGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-[10px] font-semibold uppercase tracking-[.12em]">
    <span>{label}</span>
    <select className="w-full border border-black/15 bg-transparent px-3 py-3 text-xs font-normal normal-case tracking-normal outline-none focus:border-black" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">All {label.toLowerCase()}</option>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  </label>;
}

export function ShopCatalog({ initialQuery = "", products }: { initialQuery?: string; products: Product[] }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState<Sort>(initialQuery ? "relevance" : "name");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categories = useMemo(() => [...new Set(products.map((product) => product.collection))], [products]);
  const sizes = useMemo(() => [...new Set(products.flatMap((product) => product.variants.map((variant) => variant.size)))], [products]);
  const materials = useMemo(() => [...new Set(products.map((product) => product.material).filter(Boolean))], [products]);

  const results = useMemo(() => {
    const filtered = searchProducts(products, query).filter((product) => {
      const amount = productPrice(product);
      return (!category || product.collection === category)
        && (!size || product.variants.some((variant) => variant.size === size && variant.stock > 0))
        && (!material || product.material === material)
        && (!price || (price === "under-500" ? amount < 50000 : price === "500-1000" ? amount >= 50000 && amount <= 100000 : amount > 100000));
    });
    if (sort === "price-asc") return filtered.toSorted((a, b) => productPrice(a) - productPrice(b));
    if (sort === "price-desc") return filtered.toSorted((a, b) => productPrice(b) - productPrice(a));
    if (sort === "name") return filtered.toSorted((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [category, material, price, products, query, size, sort]);

  const hasFilters = Boolean(query || category || size || material || price);
  const activeFilterCount = [category, size, material, price].filter(Boolean).length;
  const clearFilters = () => { setQuery(""); setCategory(""); setSize(""); setMaterial(""); setPrice(""); setSort("name"); };

  return <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-20">
    <header className="border-b border-black/10 pb-6 md:pb-10">
      <h1 className="font-editorial text-4xl font-bold md:text-6xl">Shop</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-black/60 md:mt-4 md:text-base">Explore every available ALAS piece.</p>
    </header>

    <div className="mt-5 flex items-center gap-3 border-b border-black/10 pb-4 md:mt-8">
      <button type="button" aria-expanded={filtersOpen} aria-controls="shop-filters" onClick={() => setFiltersOpen((open) => !open)} className="flex items-center gap-2 border border-black/20 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.12em] md:hidden">
        <span aria-hidden="true">☷</span> Filters{activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">{activeFilterCount}</span>}
      </button>
      <label className="flex min-w-0 flex-1 items-center gap-3"><span aria-hidden="true">⌕</span><span className="sr-only">Search shop</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setSort("relevance"); }} placeholder="Search products…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35" /></label>
      <span className="hidden text-[10px] uppercase tracking-[.12em] text-black/50 sm:block">{results.length} {results.length === 1 ? "piece" : "pieces"}</span>
      <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="max-w-32 bg-transparent text-xs font-medium outline-none sm:max-w-none"><option value="relevance">Relevant</option><option value="name">Name</option><option value="price-asc">Price: low</option><option value="price-desc">Price: high</option></select>
    </div>

    <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr] md:gap-16">
      <aside id="shop-filters" className={`${filtersOpen ? "block" : "hidden"} border-b border-black/10 pb-6 md:block md:border-0 md:pb-0`}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
          <FilterGroup label="Category" options={categories} value={category} onChange={setCategory} />
          <FilterGroup label="Size" options={sizes} value={size} onChange={setSize} />
          <FilterGroup label="Material" options={materials} value={material} onChange={setMaterial} />
          <label className="grid gap-2 text-[10px] font-semibold uppercase tracking-[.12em]"><span>Price</span><select className="w-full border border-black/15 bg-transparent px-3 py-3 text-xs font-normal normal-case tracking-normal outline-none focus:border-black" value={price} onChange={(event) => setPrice(event.target.value)}><option value="">All prices</option><option value="under-500">Under ₱500</option><option value="500-1000">₱500–₱1,000</option><option value="over-1000">Over ₱1,000</option></select></label>
        </div>
        {hasFilters && <button type="button" onClick={clearFilters} className="mt-5 text-[10px] font-semibold uppercase tracking-[.14em] underline underline-offset-4">Clear all filters</button>}
      </aside>

      <section aria-live="polite">
        <p className="mb-5 text-[10px] uppercase tracking-[.12em] text-black/50 sm:hidden">{results.length} {results.length === 1 ? "piece" : "pieces"}</p>
        {results.length > 0 ? <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-14">{results.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          : <div className="py-20 text-center"><h2 className="text-2xl">No matching pieces</h2><p className="mt-3 text-sm text-black/55">Try a broader search or clear your filters.</p><button type="button" onClick={clearFilters} className="mt-6 border border-black px-6 py-3 text-[10px] font-semibold uppercase tracking-[.14em]">Clear filters</button></div>}
      </section>
    </div>
  </main>;
}
