export type ProductVariant = { id: string; size: string; color: string; sku: string; priceCentavos: number; stock: number };
export type Product = { id: string; slug: string; name: string; description: string; image: string; gallery?: string[]; variants: ProductVariant[]; collection: string; material: string };
export type CartItem = { variantId: string; productSlug: string; productName: string; image: string; size: string; color: string; displayPriceCentavos: number; quantity: number };
