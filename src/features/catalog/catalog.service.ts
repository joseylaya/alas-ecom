import "server-only";

import { products as fallbackProducts } from "./catalog.data";
import type { Product } from "../../types/catalog";

type ManagementCatalogResponse = {
  data: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    material: string | null;
    images: Array<{ url: string; alt: string }>;
    variants: Array<{
      id: string;
      sku: string;
      category: string;
      color: string | null;
      size: string | null;
      price_centavos: number;
      available_quantity: number;
    }>;
  }>;
};

function managementUrl() {
  return process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, "");
}

function mapProduct(product: ManagementCatalogResponse["data"][number]): Product {
  const imageUrls = product.images.map((image) => image.url).filter(Boolean);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    material: product.material ?? "",
    collection: product.variants[0]?.category ?? "Uncategorized",
    image: imageUrls[0] ?? "/alas-logo.png",
    gallery: imageUrls.length ? imageUrls : ["/alas-logo.png"],
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      color: variant.color ?? "Default",
      size: variant.size ?? "OS",
      priceCentavos: variant.price_centavos,
      stock: variant.available_quantity,
    })),
  };
}

export async function getCatalog(): Promise<Product[]> {
  const baseUrl = managementUrl();
  const allowFallback = process.env.ALAS_ALLOW_CATALOG_FALLBACK === "true";
  if (!baseUrl) {
    if (allowFallback) return fallbackProducts;
    throw new Error("ALAS_MANAGEMENT_URL is required in production.");
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/storefront/products`, {
      headers: { accept: "application/json" },
      next: { revalidate: 30 },
    });
    if (!response.ok) throw new Error(`Management catalog returned ${response.status}`);
    const payload = await response.json() as ManagementCatalogResponse;
    return payload.data.map(mapProduct).filter((product) => product.variants.length > 0);
  } catch (error) {
    if (!allowFallback) throw error;
    console.error("Using the local catalog fallback because ALAS Management is unavailable.", error);
    return fallbackProducts;
  }
}

export async function getProduct(slug: string) {
  return (await getCatalog()).find((product) => product.slug === slug);
}

export async function getVariant(variantId: string) {
  for (const product of await getCatalog()) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}
