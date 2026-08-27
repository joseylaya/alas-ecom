"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { useCartStore } from "@/features/cart/cart-store";
import { formatPeso } from "@/lib/money";
import type { Product } from "@/types/catalog";

export function MobileProductView({ images, product, alternatives }: { images: string[]; product: Product; alternatives: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const sheetStartY = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const price = Math.min(...product.variants.map((variant) => variant.priceCentavos));
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));

  function move(direction: number) {
    setActiveIndex((index) => Math.max(0, Math.min(images.length - 1, index + direction)));
  }

  return <><section className={`mobile-product-experience fixed inset-0 z-[55] h-[100dvh] min-h-0 overflow-hidden bg-[#eee9e7] transition-transform duration-500 ease-[cubic-bezier(.22,.8,.25,1)] lg:hidden ${recommendationsOpen ? "-translate-y-[38dvh]" : "translate-y-0"}`}>
    <div
      className="absolute inset-0 touch-pan-y"
      onClick={() => { if (!didSwipe.current) setOptionsOpen((open) => !open); didSwipe.current = false; }}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; touchStartY.current = event.touches[0]?.clientY ?? null; didSwipe.current = false; setDragging(true); }}
      onTouchMove={(event) => {
        if (touchStartX.current === null) return;
        const distance = (event.touches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        const verticalDistance = touchStartY.current === null ? 0 : (event.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
        if (Math.abs(verticalDistance) > Math.abs(distance) && Math.abs(verticalDistance) > 12) { didSwipe.current = true; setDragOffset(0); return; }
        if (Math.abs(distance) > 12) didSwipe.current = true;
        const atStart = activeIndex === 0 && distance > 0;
        const atEnd = activeIndex === images.length - 1 && distance < 0;
        setDragOffset((atStart || atEnd) ? distance * 0.22 : distance);
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current !== null) {
          const distance = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          const verticalDistance = touchStartY.current === null ? 0 : (event.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
          if (Math.abs(verticalDistance) > Math.abs(distance) && Math.abs(verticalDistance) > 55) {
            setRecommendationsOpen(verticalDistance < 0);
            if (verticalDistance < 0) setOptionsOpen(false);
          } else if (images.length > 1 && Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
        }
        touchStartX.current = null;
        touchStartY.current = null;
        setDragOffset(0);
        setDragging(false);
      }}
    >
      <div className={`flex h-full w-full ${dragging ? "transition-none" : "transition-transform duration-500 ease-[cubic-bezier(.22,.8,.25,1)]"}`} style={{ transform: `translate3d(calc(${-activeIndex * 100}% + ${dragOffset}px), 0, 0)` }}>
        {images.map((image, index) => <div key={`${image}-${index}`} className="relative h-full w-full flex-none"><Image src={image} alt={`${product.name} photo ${index + 1}`} fill priority={index === 0} loading={index === 0 ? "eager" : "lazy"} draggable={false} className="select-none object-cover" sizes="100vw" /></div>)}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-all duration-300 ${optionsOpen ? "h-40 opacity-30" : "h-72 opacity-100"}`} />
    </div>

    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/75">{product.collection} / ALAS</p><h1 className="font-editorial mt-1 text-2xl drop-shadow-sm">{product.name}</h1><p className="mt-1.5 text-sm font-semibold text-white drop-shadow-sm">{formatPeso(price)}</p></div>
      <Link href="/cart" aria-label={`Shopping bag with ${cartCount} items`} className="pointer-events-auto relative grid h-11 w-11 place-items-center rounded-2xl border border-white/25 bg-black/25 text-white shadow-[0_8px_22px_rgba(0,0,0,.18)] backdrop-blur-md"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 8.5h13l-1 12h-11l-1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></svg>{cartCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black shadow-sm">{cartCount}</span>}</Link>
    </div>

    {images.length > 1 && <div className={`absolute inset-x-0 flex justify-center gap-1.5 transition-all duration-300 ${optionsOpen ? "bottom-[calc(48dvh+12px)]" : "bottom-[calc(env(safe-area-inset-bottom)+6.75rem)]"}`} style={optionsOpen && sheetOffset > 0 ? { transform: `translateY(${sheetOffset}px)` } : undefined} aria-label={`Photo ${activeIndex + 1} of ${images.length}`}>
      {images.map((_, index) => <button key={index} type="button" onClick={(event) => { event.stopPropagation(); setActiveIndex(index); }} aria-label={`Show photo ${index + 1}`} className={`h-1.5 rounded-full shadow-sm transition-all ${index === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/55"}`} />)}
    </div>}

    {!optionsOpen && <button type="button" onClick={() => setOptionsOpen(true)} className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-[5.25rem] flex min-h-[64px] items-center gap-2.5 rounded-[22px] border border-white bg-white p-2 text-left text-black shadow-[0_18px_45px_rgba(0,0,0,.24)]">
      <span className="relative h-12 w-12 flex-none overflow-hidden rounded-[14px] bg-[#eee9e7]"><Image src={images[activeIndex]} alt="" fill sizes="48px" draggable={false} className="object-cover" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate font-editorial text-[15px] font-semibold leading-tight text-[#171717]">{product.name}</span><span className="mt-1 block text-[10px] font-medium uppercase tracking-[.08em] text-black/45">Choose size · {formatPeso(price)}</span></span>
      <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-gradient-to-br from-black via-[#202020] to-[#454545] text-white shadow-[0_8px_18px_rgba(0,0,0,.22)]"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
    </button>}

    <div className={`absolute inset-x-0 bottom-0 h-[48dvh] overflow-y-auto rounded-t-[30px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_70px_rgba(0,0,0,.24)] ease-out ${sheetDragging ? "transition-none" : "transition-transform duration-300"}`} style={{ transform: optionsOpen ? `translateY(${sheetOffset}px)` : "translateY(105%)" }} aria-hidden={!optionsOpen}>
      <button
        type="button"
        onClick={() => setOptionsOpen(false)}
        onTouchStart={(event) => { sheetStartY.current = event.touches[0]?.clientY ?? null; setSheetDragging(true); }}
        onTouchMove={(event) => { if (sheetStartY.current !== null) setSheetOffset(Math.max(0, (event.touches[0]?.clientY ?? sheetStartY.current) - sheetStartY.current)); }}
        onTouchEnd={() => { if (sheetOffset > 80) setOptionsOpen(false); setSheetOffset(0); setSheetDragging(false); sheetStartY.current = null; }}
        aria-label="Drag down or tap to close product options"
        className="mx-auto block touch-none px-8 py-3"
      ><span className="block h-1.5 w-14 rounded-full bg-black/15" /></button>
      <div className="mt-1 flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.14em] text-black/45">{product.collection}</p><h2 className="font-editorial mt-1 text-xl">{product.name}</h2></div><p className="pt-1 text-sm font-semibold">{formatPeso(price)}</p></div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-black/55">{product.description}</p>
      <AddToCart product={product} showCheckout />
    </div>
  </section>
    {alternatives.length > 0 && <section className={`fixed inset-x-0 bottom-0 z-[56] h-[38dvh] rounded-t-[30px] bg-[#fcf8f8] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-22px_65px_rgba(0,0,0,.18)] transition-transform duration-500 ease-[cubic-bezier(.22,.8,.25,1)] lg:hidden ${recommendationsOpen ? "translate-y-0" : "translate-y-full"}`}>
      <button type="button" onClick={() => setRecommendationsOpen(false)} className="mx-auto block px-8 pb-3" aria-label="Return to product"><span className="block h-1.5 w-14 rounded-full bg-black/15" /></button>
      <div className="mb-3 flex items-end justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-black/40">Continue exploring</p><h2 className="font-editorial mt-1 text-xl">You may also like</h2></div><span className="text-[9px] uppercase tracking-[.12em] text-black/40">Swipe</span></div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {alternatives.map((alternative) => <Link key={alternative.id} href={`/products/${alternative.slug}`} className="w-[42vw] max-w-44 flex-none snap-start"><span className="relative block aspect-[4/3] overflow-hidden rounded-[18px] bg-stone-200"><Image src={alternative.image} alt={alternative.name} fill sizes="42vw" className="object-cover transition duration-500 active:scale-[1.02]" /></span><span className="mt-2 block truncate font-editorial text-sm font-semibold">{alternative.name}</span><span className="mt-0.5 block text-[10px] text-black/50">{formatPeso(Math.min(...alternative.variants.map((variant) => variant.priceCentavos)))}</span></Link>)}
      </div>
    </section>}
  </>;
}
