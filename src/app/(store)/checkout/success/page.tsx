import Link from "next/link";
import { ClearCartOnPaid } from "@/components/checkout/clear-cart-on-paid";

type OrderStatus = { order_number: string; payment_status: string; payment_error_code?: string | null };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const status = order ? await loadStatus(order) : null;
  const paid = status?.payment_status === "paid";
  const expired = status?.payment_error_code === "qr_expired";

  return <main className="mx-auto min-h-[65vh] max-w-2xl px-5 py-24 text-center">
    <ClearCartOnPaid confirmed={paid} />
    <p className={`text-[10px] font-semibold uppercase tracking-[.2em] ${paid ? "text-emerald-700" : "text-amber-700"}`}>{paid ? "Payment confirmed" : "Payment verification"}</p>
    <h1 className="font-editorial mt-5 text-5xl font-semibold">{paid ? "Thank you for your order." : expired ? "Your QR code expired." : "We're still confirming your payment."}</h1>
    <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-black/65">{paid
      ? `PayMongo confirmed payment for ${status?.order_number}. Your order is now recorded as paid.`
      : expired ? "Payment was not confirmed before the QR expired. Open your private order link to generate a new QR."
      : "This page does not mark an order paid by itself. ALAS will show confirmation only after the server verifies the payment with PayMongo."}</p>
    {order && <p className="mt-5 break-all text-xs text-black/45">Private tracking token: {order}</p>}
    <div className="mt-10 flex flex-wrap justify-center gap-3">
      {order && <Link href={`/orders/${order}`} className="bg-black px-7 py-4 text-[10px] font-semibold uppercase tracking-[.14em] text-white">Track order</Link>}
      <Link href="/shop" className="border border-black/20 px-7 py-4 text-[10px] font-semibold uppercase tracking-[.14em]">Continue shopping</Link>
    </div>
  </main>;
}

async function loadStatus(token: string): Promise<OrderStatus | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const baseUrl = process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;
  await fetch(`${baseUrl}/api/v1/storefront/orders/${token}/refresh-payment`, { method: "POST", cache: "no-store" }).catch(() => undefined);
  const response = await fetch(`${baseUrl}/api/v1/storefront/orders/${token}`, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  return (await response.json()).data;
}
