import { notFound } from "next/navigation";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { MobileProductView } from "@/components/commerce/mobile-product-view";
import { getCatalog } from "@/features/catalog/catalog.service";
import { formatPeso } from "@/lib/money";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getCatalog();
  const product = products.find((candidate) => candidate.slug === slug);
  if (!product) notFound();

  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const price = Math.min(...product.variants.map((variant) => variant.priceCentavos));
  const alternatives = products
    .filter((candidate) => candidate.id !== product.id)
    .toSorted((a, b) => Number(b.collection === product.collection) - Number(a.collection === product.collection))
    .slice(0, 3);

  return <>
    <MobileProductView images={gallery} product={product} alternatives={alternatives} />
    <main className="mx-auto hidden max-w-[1440px] lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,.85fr)]">
      <ProductGallery images={gallery} productName={product.name} />
      <aside className="bg-white px-5 py-8 sm:px-8 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:px-10 lg:py-10 xl:px-14">
        <div className="mx-auto max-w-md">
          <p className="text-[10px] uppercase tracking-[.16em] text-black/55">{product.collection} / ALAS</p>
          <h1 className="font-editorial mt-5 text-3xl leading-tight lg:text-[2rem]">{product.name}</h1>
          <p className="mt-2 text-[13px] leading-5 text-black/55">Structured precision. Modern restraint.</p>
          <p className="mt-5 text-[15px] font-medium">{formatPeso(price)}</p>
          <div className="mt-7"><p className="text-[10px] uppercase tracking-[.1em]">Color: {product.variants[0].color}</p><div className="mt-3 flex gap-2.5"><span className="h-7 w-7 rounded-full border border-black bg-neutral-900 ring-2 ring-white" /><span className="h-7 w-7 rounded-full border border-black/15 bg-stone-200" /><span className="h-7 w-7 rounded-full border border-black/15 bg-slate-500" /></div></div>
          <AddToCart product={product} />
          <div className="mt-8 border-t border-black/10">
            <details open className="border-b border-black/10 py-4"><summary className="cursor-pointer list-none text-[10px] uppercase tracking-[.12em]">Description <span className="float-right">⌃</span></summary><p className="mt-3 text-[13px] leading-6 text-black/60">{product.description} Crafted with careful attention to proportion, finish, and everyday wearability.</p></details>
            <details className="border-b border-black/10 py-4"><summary className="cursor-pointer list-none text-[10px] uppercase tracking-[.12em]">Details & care <span className="float-right">⌄</span></summary></details>
            <details className="border-b border-black/10 py-4"><summary className="cursor-pointer list-none text-[10px] uppercase tracking-[.12em]">Shipping & returns <span className="float-right">⌄</span></summary></details>
          </div>
        </div>
      </aside>
    </main>
    {alternatives.length > 0 && <section aria-labelledby="recommendations-heading" className="border-t border-black/10 bg-[#fcf8f8] px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-6 md:mb-14"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/45">Continue exploring</p><h2 id="recommendations-heading" className="mt-2 text-3xl md:text-4xl">You may also like</h2></div><a href="/shop" className="border-b border-black pb-1 text-[10px] font-semibold uppercase tracking-[.14em]">View all</a></div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-7">{alternatives.map((alternative) => <ProductCard key={alternative.id} product={alternative} />)}</div>
      </div>
    </section>}
  </>;
}
