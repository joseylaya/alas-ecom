"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/features/cart/cart-store";
import { formatPeso } from "@/lib/money";

export type QrPaymentOrder = {
  order_number: string;
  tracking_token: string;
  payment_status: string;
  order_status: string;
  total_centavos: number;
  qr_image_url: string | null;
  qr_expires_at: string | null;
  payment_error_code?: string | null;
};

export function QrPhPayment({ initialOrder }: { initialOrder: QrPaymentOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [secondsLeft, setSecondsLeft] = useState(() => remaining(initialOrder.qr_expires_at));
  const [message, setMessage] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const clearCart = useCartStore((state) => state.clear);
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    async function load(reconcile = false) {
      const suffix = reconcile ? "/reconcile" : "/payment-status";
      const response = await fetch(`/api/orders/${order.tracking_token}${suffix}`, {
        method: reconcile ? "POST" : "GET", cache: "no-store",
      }).catch(() => null);
      if (!response?.ok || stopped) return;
      const body = await response.json();
      setOrder(body.data);
      setSecondsLeft(remaining(body.data.qr_expires_at));
      if (body.data.payment_status === "paid") {
        clearCart();
        router.replace(`/checkout/success?order=${order.tracking_token}`);
      }
    }
    void load(true);
    const statusTimer = window.setInterval(() => void load(false), 3000);
    const reconcileTimer = window.setInterval(() => void load(true), 30000);
    return () => { stopped = true; window.clearInterval(statusTimer); window.clearInterval(reconcileTimer); };
  }, [clearCart, order.tracking_token, router]);

  useEffect(() => {
    const timer = window.setInterval(() => setSecondsLeft(remaining(order.qr_expires_at)), 1000);
    return () => window.clearInterval(timer);
  }, [order.qr_expires_at]);

  async function regenerate() {
    setRegenerating(true); setMessage("");
    const response = await fetch(`/api/orders/${order.tracking_token}/regenerate-qr`, { method: "POST" });
    const body = await response.json();
    setRegenerating(false);
    if (!response.ok) { setMessage(body.message ?? "Unable to generate a new QR code."); return; }
    setOrder(body.data); setSecondsLeft(remaining(body.data.qr_expires_at));
  }

  const expired = secondsLeft <= 0 || order.payment_error_code === "qr_expired";
  return <main className="mx-auto min-h-[75vh] max-w-xl px-5 py-16 text-center">
    <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/45">Secure checkout</p>
    <h1 className="font-editorial mt-4 text-5xl font-semibold">Pay with QR Ph</h1>
    <div className="mt-9 border border-black/15 bg-white p-6 shadow-sm sm:p-9">
      {order.payment_status === "paid" ? <p className="py-16 text-lg font-semibold text-emerald-700">Payment confirmed ✓</p>
        : expired ? <div className="py-12"><p className="text-lg font-semibold">This QR code has expired.</p><button onClick={regenerate} disabled={regenerating} className="mt-6 bg-black px-7 py-4 text-[10px] font-semibold uppercase tracking-[.14em] text-white disabled:opacity-50">{regenerating ? "Generating…" : "Generate a new QR"}</button></div>
        : order.payment_status === "failed" ? <div className="py-12"><p className="text-lg font-semibold text-rose-700">Payment could not be completed.</p><button onClick={regenerate} disabled={regenerating} className="mt-6 bg-black px-7 py-4 text-[10px] font-semibold uppercase tracking-[.14em] text-white">Try again</button></div>
        : <>{order.qr_image_url && <img src={order.qr_image_url} alt={`QR Ph payment code for ${order.order_number}`} className="mx-auto aspect-square w-full max-w-[320px] object-contain" />}<p className="mt-5 text-sm leading-6 text-black/65">Scan using GCash, Maya, or a participating QR Ph banking app.</p><p className="mt-4 text-xs font-semibold uppercase tracking-[.14em]">Expires in {formatCountdown(secondsLeft)}</p><p className="mt-6 animate-pulse text-xs text-amber-700">Waiting for payment…</p></>}
      <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-black/10 pt-6 text-left text-sm"><div><dt className="text-[9px] uppercase tracking-[.14em] text-black/45">Order</dt><dd className="mt-1 font-medium">{order.order_number}</dd></div><div className="text-right"><dt className="text-[9px] uppercase tracking-[.14em] text-black/45">Total</dt><dd className="mt-1 font-semibold">{formatPeso(order.total_centavos)}</dd></div></dl>
      {message && <p role="alert" className="mt-5 text-sm text-rose-700">{message}</p>}
    </div>
    <p className="mt-6 text-xs leading-6 text-black/50">Payment is confirmed only after ALAS receives verification from PayMongo. You may safely return using your private order link.</p>
    <div className="mt-7 flex justify-center gap-3"><Link href={`/orders/${order.tracking_token}`} className="border border-black/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.12em]">Track order</Link><Link href="/shop" className="border border-black/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.12em]">Continue shopping</Link></div>
  </main>;
}

function remaining(value: string | null) { return value ? Math.max(0, Math.floor((new Date(value).getTime() - Date.now()) / 1000)) : 0; }
function formatCountdown(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
