import { ShopCatalog } from "@/components/commerce/shop-catalog";
import { getCatalog } from "@/features/catalog/catalog.service";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  const products = await getCatalog();
  return <ShopCatalog initialQuery={query} products={products} />;
}
