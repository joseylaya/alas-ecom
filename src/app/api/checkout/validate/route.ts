import { NextResponse } from "next/server";
import { getCatalog } from "@/features/catalog/catalog.service";
import { checkoutValidationSchema } from "@/lib/validation/checkout.schema";

export async function POST(request: Request) {
  const parsed = checkoutValidationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_CART", message: "Your cart could not be checked." } }, { status: 400 });

  const catalog = await getCatalog();
  const variants = new Map(catalog.flatMap((product) => product.variants.map((variant) => [variant.id, { product, variant }] as const)));
  const corrections: { variantId: string; quantity: number; message: string }[] = [];
  const items = parsed.data.items.flatMap((line) => {
    const result = variants.get(line.variantId);
    if (!result || result.variant.stock < 1) {
      corrections.push({ variantId: line.variantId, quantity: 0, message: "An item in your cart is no longer available." });
      return [];
    }
    const quantity = Math.min(line.quantity, result.variant.stock);
    if (quantity !== line.quantity) corrections.push({ variantId: line.variantId, quantity, message: `Only ${quantity} item${quantity === 1 ? " is" : "s are"} currently available.` });
    return [{
      variantId: result.variant.id,
      productName: result.product.name,
      size: result.variant.size,
      color: result.variant.color,
      quantity,
      unitPriceCentavos: result.variant.priceCentavos,
      lineTotalCentavos: quantity * result.variant.priceCentavos,
    }];
  });

  if (!items.length) return NextResponse.json({ error: { code: "EMPTY_CART", message: "Please add an available item before checkout." }, corrections }, { status: 409 });
  const subtotalCentavos = items.reduce((sum, item) => sum + item.lineTotalCentavos, 0);
  return NextResponse.json({ items, subtotalCentavos, shippingCentavos: 0, totalCentavos: subtotalCentavos, corrections });
}
