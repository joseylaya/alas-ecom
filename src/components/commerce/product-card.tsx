import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/catalog";
import { formatPeso } from "@/lib/money";
export function ProductCard({ product }: { product: Product }) { const lowestPrice = Math.min(...product.variants.map((variant) => variant.priceCentavos)); return <Link href={`/products/${product.slug}`} className="group block text-center"><div className="relative aspect-[3/4] overflow-hidden bg-stone-200"><Image src={product.image} alt={product.name} fill className="object-cover transition duration-700 group-hover:scale-[1.025]" sizes="(max-width: 768px) 50vw, 33vw" /></div><p className="font-editorial mt-5 text-lg">{product.name}</p><p className="mt-2 text-sm text-black/65">{formatPeso(lowestPrice)}</p></Link>; }
