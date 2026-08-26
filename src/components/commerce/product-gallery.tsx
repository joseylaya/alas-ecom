"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return <section className="bg-[#f1edec] lg:grid lg:grid-cols-[88px_minmax(0,1fr)] lg:gap-px">
    {images.length > 1 && <div className="order-1 flex gap-2 overflow-x-auto bg-white p-3 lg:flex-col lg:justify-start lg:overflow-y-auto lg:p-2">
      {images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setActiveIndex(index)} aria-label={`View ${productName} photo ${index + 1}`} aria-current={activeIndex === index ? "true" : undefined} className={`relative aspect-[4/5] w-16 flex-none overflow-hidden rounded-xl bg-[#f1edec] transition duration-300 lg:w-full ${activeIndex === index ? "ring-2 ring-black ring-offset-2" : "opacity-65 hover:opacity-100"}`}>
        <Image src={image} alt="" fill sizes="80px" className="select-none object-cover" draggable={false} loading={index === 0 ? "eager" : "lazy"} />
      </button>)}
    </div>}
    <div className="relative aspect-[4/5] max-h-[820px] overflow-hidden bg-[#f1edec] lg:order-2 lg:aspect-[4/4.65]">
      <Image key={activeImage} src={activeImage} alt={`${productName}${activeIndex ? ` detail ${activeIndex + 1}` : ""}`} fill priority draggable={false} className="select-none animate-[galleryFade_.35s_ease-out] object-cover" sizes="(max-width: 1024px) 100vw, 58vw" />
      {images.length > 1 && <span className="absolute bottom-4 right-4 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-semibold tracking-[.12em] text-black/65 shadow-sm backdrop-blur-md">{activeIndex + 1} / {images.length}</span>}
    </div>
    <style jsx global>{`@keyframes galleryFade { from { opacity: .72; transform: scale(1.006); } to { opacity: 1; transform: scale(1); } }`}</style>
  </section>;
}
