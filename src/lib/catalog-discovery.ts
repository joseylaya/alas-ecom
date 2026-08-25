import type { Product } from "../types/catalog";

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function searchableProductText(product: Product) {
  const variantTerms = product.variants.flatMap(({ color, size, sku }) => [color, size, sku]);
  return normalize([product.name, product.collection, product.description, product.material, ...variantTerms].join(" "));
}

export function searchProducts(catalog: Product[], query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return catalog;

  const terms = normalizedQuery.split(" ");
  return catalog
    .map((product, index) => {
      const name = normalize(product.name);
      const collection = normalize(product.collection);
      const material = normalize(product.material);
      const searchable = searchableProductText(product);
      if (!terms.every((term) => searchable.includes(term))) return null;

      let score = 0;
      if (name === normalizedQuery) score += 100;
      if (name.startsWith(normalizedQuery)) score += 60;
      if (name.includes(normalizedQuery)) score += 40;
      if (collection.includes(normalizedQuery)) score += 25;
      if (material.includes(normalizedQuery)) score += 20;
      score += terms.reduce((total, term) => total + (name.split(" ").some((word) => word.startsWith(term)) ? 12 : 0), 0);
      return { product, score, index };
    })
    .filter((result): result is { product: Product; score: number; index: number } => result !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ product }) => product);
}

export function productPrice(product: Product) {
  return Math.min(...product.variants.map((variant) => variant.priceCentavos));
}
