import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPeso } from "@/lib/money";
import { QrPhPayment } from "@/components/checkout/qrph-payment";

type Order = {
  order_number: string;
  tracking_token: string;
  order_status: string;
  payment_status: string;
  payment_error_code?: string | null;
  qr_image_url: string | null;
  qr_expires_at: string | null;
  currency: string;
  total_centavos: number;
  created_at: string | null;
  delivery_method: string;
  delivery_provider?: string | null;
  delivery_service?: string | null;
  shipping_status?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  subtotal_centavos?: number;
  shipping_centavos?: number;
  updated_at?: string | null;
  items: Array<{ name: string; sku: string; quantity: number; unit_price_centavos: number }>;
};

async function loadOrder(token: string): Promise<Order> {
  const baseUrl = process.env.ALAS_MANAGEMENT_URL?.replace(/\/$/, "");
  if (!baseUrl || !/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const response = await fetch(`${baseUrl}/api/v1/storefront/orders/${token}`, { cache: "no-store" });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Order tracking is temporarily unavailable.");
  return (await response.json()).data;
}

export default async function GuestOrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await loadOrder(token);
  if (order.payment_status !== "paid" && (order.qr_image_url || order.payment_error_code === "qr_expired")) {
    return <QrPhPayment initialOrder={order} />;
  }
  const steps = order.order_status === "cancelled" ? ["cancelled"] : ["pending", "confirmed", "preparing", "packed", "shipped", "completed"];
  const activeStep = Math.max(0, steps.indexOf(order.order_status));
  return <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-20">
    <Link href="/" className="font-editorial text-4xl font-bold">ALAS</Link>
    <div className="mt-14 flex flex-wrap items-end justify-between gap-5 border-b border-black/15 pb-7">
      <div><p className="text-[10px] uppercase tracking-[.18em] text-black/50">Guest order</p><h1 className="font-editorial mt-2 text-4xl font-semibold">{order.order_number}</h1>{order.created_at && <p className="mt-2 text-sm text-black/50">Placed {new Date(order.created_at).toLocaleString("en-PH")}</p>}</div>
      <div className="text-right"><p className="text-[10px] uppercase tracking-[.16em] text-black/45">Payment</p><p className="mt-1 capitalize">{order.payment_status}</p></div>
    </div>
    <section className="mt-10 border-y border-black/10 py-8"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.16em] text-black/45">Where your order is</p><h2 className="font-editorial mt-2 text-2xl capitalize">{statusLabel(order.order_status)}</h2></div>{order.updated_at && <p className="text-right text-xs text-black/45">Updated<br />{new Date(order.updated_at).toLocaleString("en-PH")}</p>}</div>
      <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-6">{steps.map((step, index) => <li key={step} className={`border-t-2 pt-3 text-[10px] font-semibold uppercase tracking-[.1em] ${index <= activeStep ? "border-black text-black" : "border-black/15 text-black/35"}`}>{statusLabel(step)}</li>)}</ol>
      {order.order_status === "shipped" && !order.tracking_number && <p className="mt-6 text-sm text-black/55">Your parcel has left ALAS. Courier tracking details will appear here once recorded.</p>}
    </section>
    <div className="mt-10 grid gap-10 md:grid-cols-[1fr_280px]">
      <section><h2 className="text-xs font-semibold uppercase tracking-[.15em]">Items</h2><div className="mt-5 divide-y divide-black/10">{order.items.map((item) => <div key={item.sku} className="flex justify-between gap-5 py-5"><div><p>{item.name}</p><p className="mt-1 text-xs text-black/50">{item.sku} · Qty {item.quantity}</p></div><p>{formatPeso(item.unit_price_centavos * item.quantity)}</p></div>)}</div></section>
      <aside className="h-fit bg-black/[.035] p-5 text-sm"><div className="flex justify-between"><span>Payment</span><span className="capitalize">{order.payment_status}</span></div><div className="mt-4 flex justify-between gap-4"><span>Courier</span><span className="text-right">{order.delivery_service ?? order.delivery_provider?.toUpperCase() ?? "To be assigned"}</span></div><div className="mt-4 flex justify-between"><span>Shipping</span><span className="capitalize">{statusLabel(order.shipping_status ?? "pending")}</span></div>{order.tracking_number && <div className="mt-4 border-t border-black/10 pt-4"><p className="text-[9px] uppercase tracking-[.14em] text-black/45">Tracking number</p><p className="mt-1 break-all font-semibold">{order.tracking_number}</p>{order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="mt-3 inline-block underline underline-offset-4">Open courier tracking ↗</a>}</div>}<div className="mt-5 space-y-2 border-t border-black/10 pt-5"><div className="flex justify-between"><span>Subtotal</span><span>{formatPeso(order.subtotal_centavos ?? order.total_centavos)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{formatPeso(order.shipping_centavos ?? 0)}</span></div><div className="flex justify-between pt-3 text-base font-semibold"><span>Total</span><span>{formatPeso(order.total_centavos)}</span></div></div></aside>
    </div>
    <p className="mt-12 text-xs leading-6 text-black/45">Keep this private tracking link. For your security, ALAS does not display your complete email, phone number, or delivery address here.</p>
  </main>;
}

function statusLabel(status: string) {
  return ({ pending: "Order received", confirmed: "Confirmed", preparing: "Preparing", packed: "Packed", shipped: "With courier", completed: "Delivered", cancelled: "Cancelled", booking: "Booking courier", booked: "Courier booked", picked_up: "Picked up", in_transit: "In transit", out_for_delivery: "Out for delivery", delivered: "Delivered", failed: "Delivery issue" } as Record<string, string>)[status] ?? status.replaceAll("_", " ");
}
