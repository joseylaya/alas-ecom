"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QrPhPayment, type QrPaymentOrder } from "@/components/checkout/qrph-payment";
import { useCartStore } from "@/features/cart/cart-store";
import { formatPeso } from "@/lib/money";

type Address = { country: "Philippines"; region: string; regionCode: string; province: string; city: string; cityCode: string; barangay: string; barangayCode: string; postalCode: string; streetAddress: string };
type AddressOption = { code: string; name: string; postalCode?: string };
type ShippingQuote = { provider: "jnt" | "maxim"; service_name: string; available: boolean; fee: number | null; currency: "PHP"; quote_source: "provider_api" | "configured_rate"; estimated_delivery?: string; quote_id?: string; expires_at?: string; reason_unavailable?: string };
const emptyAddress: Address = { country: "Philippines", region: "", regionCode: "", province: "", city: "", cityCode: "", barangay: "", barangayCode: "", postalCode: "", streetAddress: "" };
const fieldClass = "w-full border-0 border-b border-black/15 bg-transparent px-0 py-4 outline-none transition focus:border-black";

function checkoutSessionId() {
  if (typeof window === "undefined") return "00000000-0000-4000-8000-000000000000";
  const existing = sessionStorage.getItem("alas_shipping_session");
  if (existing) return existing;
  const value = crypto.randomUUID(); sessionStorage.setItem("alas_shipping_session", value); return value;
}

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [sessionId] = useState(checkoutSessionId);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [regions, setRegions] = useState<AddressOption[]>([]);
  const [provinces, setProvinces] = useState<AddressOption[]>([]);
  const [cities, setCities] = useState<AddressOption[]>([]);
  const [barangays, setBarangays] = useState<AddressOption[]>([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [addressMessage, setAddressMessage] = useState("");
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [payment, setPayment] = useState<QrPaymentOrder | null>(null);
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const cartSignature = useMemo(() => items.map((item) => `${item.variantId}:${item.quantity}`).sort().join("|"), [items]);
  const subtotal = items.reduce((sum, item) => sum + item.displayPriceCentavos * item.quantity, 0);
  const selectedQuote = quotes.find((quote) => quote.quote_id === selectedQuoteId);
  const shippingCentavos = selectedQuote?.fee == null ? 0 : Math.round(selectedQuote.fee * 100);
  const addressComplete = /^\d{10}$/.test(address.regionCode) && /^\d{10}$/.test(address.cityCode) && /^\d{10}$/.test(address.barangayCode) && address.province.length > 1 && address.postalCode.length > 2 && address.streetAddress.length > 3;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/address/options?level=regions", { signal: controller.signal }).then((response) => response.json()).then((body) => {
      if (!body.data) throw new Error(body.error?.message ?? "Address options are unavailable.");
      setRegions(body.data); setAddressMessage("");
    }).catch((error) => { if (error.name !== "AbortError") setAddressMessage(error.message); }).finally(() => { if (!controller.signal.aborted) setIsLoadingAddress(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!addressComplete || !items.length) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      idempotencyKey.current = null; setSelectedQuoteId(""); setQuotes([]); setIsQuoting(true); setQuoteMessage("");
      try {
        const response = await fetch("/api/shipping/quotes", { method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ sessionId, address, items: items.map(({ variantId, quantity }) => ({ variantId, quantity })) }) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? body.message ?? "Delivery quotes are unavailable.");
        const available = (body.data.quotes as ShippingQuote[]).filter((quote) => quote.available && quote.quote_id);
        setQuotes(available);
        if (available.length) setSelectedQuoteId(available[0].quote_id!); else setQuoteMessage("No delivery courier is available for this address.");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setQuoteMessage(error instanceof Error ? error.message : "Delivery quotes are unavailable.");
      } finally { if (!controller.signal.aborted) setIsQuoting(false); }
    }, 700);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [address, addressComplete, cartSignature, items, sessionId]);

  function updateAddress(field: keyof Address, value: string) {
    idempotencyKey.current = null; setSelectedQuoteId(""); setQuotes([]); setQuoteMessage("");
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function loadOptions(url: string, setter: (options: AddressOption[]) => void) {
    setIsLoadingAddress(true); setAddressMessage("");
    try {
      const response = await fetch(url); const body = await response.json();
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Address options are unavailable.");
      setter(body.data);
    } catch (error) { setAddressMessage(error instanceof Error ? error.message : "Address options are unavailable."); }
    finally { setIsLoadingAddress(false); }
  }

  function selectRegion(code: string) {
    const option = regions.find((item) => item.code === code);
    setAddress({ ...emptyAddress, regionCode: code, region: option?.name ?? "" }); setProvinces([]); setCities([]); setBarangays([]); setQuotes([]); setSelectedQuoteId("");
    if (code) void loadOptions(`/api/address/options?level=provinces&regionCode=${encodeURIComponent(code)}`, setProvinces);
  }

  function selectProvince(name: string) {
    setAddress((current) => ({ ...current, province: name, city: "", cityCode: "", barangay: "", barangayCode: "", postalCode: "" })); setCities([]); setBarangays([]); setQuotes([]); setSelectedQuoteId("");
    if (name) void loadOptions(`/api/address/options?level=cities&regionCode=${encodeURIComponent(address.regionCode)}&province=${encodeURIComponent(name)}`, setCities);
  }

  function selectCity(code: string) {
    const option = cities.find((item) => item.code === code);
    setAddress((current) => ({ ...current, cityCode: code, city: option?.name ?? "", barangay: "", barangayCode: "", postalCode: option?.postalCode ?? "" })); setBarangays([]); setQuotes([]); setSelectedQuoteId("");
    if (code) void loadOptions(`/api/address/options?level=barangays&cityCode=${encodeURIComponent(code)}`, setBarangays);
  }

  function selectBarangay(code: string) {
    const option = barangays.find((item) => item.code === code);
    setAddress((current) => ({ ...current, barangayCode: code, barangay: option?.name ?? "" })); setQuotes([]); setSelectedQuoteId("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedQuote?.quote_id) { setQuoteMessage("Select a delivery method before continuing."); return; }
    setIsChecking(true); setMessage(""); idempotencyKey.current ??= crypto.randomUUID();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/checkout/create", {
      method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey.current },
      body: JSON.stringify({
        customer: { name: `${form.get("firstName") ?? ""} ${form.get("lastName") ?? ""}`.trim(), email: form.get("email"), phone: form.get("mobile") },
        shippingAddress: [address.streetAddress, address.barangay, address.city, address.province, address.postalCode, address.country].join(", "),
        deliveryAddress: address, shippingQuoteId: selectedQuote.quote_id, shippingSessionId: sessionId,
        items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
      }),
    });
    const body = await response.json(); setIsChecking(false);
    if (!response.ok) {
      setMessage(body.error?.message ?? body.message ?? "We could not create your order.");
      if (body.errors?.shipping_quote_id) setQuoteMessage(body.errors.shipping_quote_id[0]);
      body.corrections?.forEach((correction: { variantId: string; quantity: number }) => updateQuantity(correction.variantId, correction.quantity)); return;
    }
    if (body.data.checkout_url) { window.location.assign(body.data.checkout_url); return; }
    if (body.data.qr_image_url) { setPayment(body.data); return; }
    setMessage(`Order ${body.data.order_number} was created, but payment is not ready. Use its private tracking link to continue.`);
  }

  if (payment) return <QrPhPayment initialOrder={payment} />;
  if (!items.length) return <main className="mx-auto min-h-[70vh] max-w-xl px-5 py-20"><Link href="/" className="font-editorial text-5xl font-bold">ALAS</Link><h1 className="font-editorial mt-16 text-4xl">Your bag is empty</h1><Link className="mt-8 inline-block bg-black px-7 py-4 text-xs uppercase tracking-[.14em] text-white" href="/shop">Return to shop</Link></main>;

  return <main className="bg-[#fcf8f8] px-5 py-12 md:px-12 md:py-24"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.1fr_.9fr]">
    <form onSubmit={submit} className="lg:border-r lg:border-black/10 lg:pr-14">
      <Link href="/" className="font-editorial text-5xl font-bold tracking-tight md:text-6xl">ALAS</Link>
      <nav className="mt-4 flex flex-wrap gap-3 text-[10px] uppercase tracking-[.12em]"><Link href="/cart">Bag</Link><span>›</span><span>Information</span><span>›</span><span>Delivery</span><span>›</span><span className="border-b border-black">QR Ph</span></nav>
      <div className="my-12 border border-black/15 px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-[.14em]">▦ &nbsp; Secure Dynamic QR Ph via PayMongo</div>

      <section><h2 className="font-editorial text-2xl font-semibold">Contact information</h2><input required name="email" type="email" placeholder="Email address" className={`mt-7 ${fieldClass}`} /></section>
      <section className="mt-14">
        <h2 className="font-editorial text-2xl font-semibold">Delivery address</h2>
        <label className="mt-7 block text-[9px] uppercase tracking-[.14em]">Country/Region<select className={fieldClass} value={address.country} disabled><option>Philippines</option></select></label>
        <div className="grid grid-cols-2 gap-4"><input required name="firstName" placeholder="First name" className={fieldClass} /><input required name="lastName" placeholder="Last name" className={fieldClass} /></div>
        <input required value={address.streetAddress} onChange={(event) => updateAddress("streetAddress", event.target.value)} placeholder="Street address" className={fieldClass} />
        <select required aria-label="Region" value={address.regionCode} onChange={(event) => selectRegion(event.target.value)} className={fieldClass} disabled={isLoadingAddress && !regions.length}><option value="">Region</option>{regions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><select required aria-label="Province" value={address.province} onChange={(event) => selectProvince(event.target.value)} className={fieldClass} disabled={!address.regionCode || !provinces.length}><option value="">Province</option>{provinces.map((option) => <option key={option.code} value={option.name}>{option.name}</option>)}</select><select required aria-label="City or municipality" value={address.cityCode} onChange={(event) => selectCity(event.target.value)} className={fieldClass} disabled={!address.province || !cities.length}><option value="">City / Municipality</option>{cities.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><select required aria-label="Barangay" value={address.barangayCode} onChange={(event) => selectBarangay(event.target.value)} className={fieldClass} disabled={!address.cityCode || !barangays.length}><option value="">Barangay</option>{barangays.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select><input required value={address.postalCode} onChange={(event) => updateAddress("postalCode", event.target.value)} placeholder="Postal code" inputMode="numeric" className={fieldClass} /></div>
        {isLoadingAddress && <p className="mt-3 text-xs text-black/50">Loading Philippine address options…</p>}
        {addressMessage && <p role="status" className="mt-3 text-sm text-rose-700">{addressMessage}</p>}
        <input required name="mobile" type="tel" placeholder="Phone" className={fieldClass} />
      </section>

      <section className="mt-14" aria-live="polite">
        <h2 className="font-editorial text-2xl font-semibold">Delivery method</h2>
        {!addressComplete && <p className="mt-4 text-sm text-black/55">Complete your address to see available couriers.</p>}
        {isQuoting && <p className="mt-4 text-sm text-black/55">Calculating delivery fee…</p>}
        {!isQuoting && quotes.length > 0 && <div className="mt-6 divide-y divide-black/10 border-y border-black/10">{quotes.map((quote) => <label key={quote.quote_id} className="flex cursor-pointer items-start gap-4 py-5"><input type="radio" name="shippingQuote" className="mt-1 accent-black" checked={selectedQuoteId === quote.quote_id} onChange={() => setSelectedQuoteId(quote.quote_id!)} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{quote.service_name}</span><span className="mt-1 block text-xs text-black/55">{quote.estimated_delivery}{quote.quote_source === "configured_rate" ? " · Estimated rate" : ""}</span></span><span className="text-sm font-semibold">{formatPeso(Math.round((quote.fee ?? 0) * 100))}</span></label>)}</div>}
        {quoteMessage && <p role="status" className="mt-4 text-sm text-rose-700">{quoteMessage}</p>}
      </section>

      <p className="mt-8 text-xs leading-6 text-black/50">Your products and selected delivery fee are recalculated securely before PayMongo generates a single-use QR code.</p>
      <div className="mt-10 flex items-center justify-between gap-5"><Link href="/cart" className="flex items-center gap-2 text-sm text-black/65"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg> Return to bag</Link><button disabled={isChecking || isQuoting || !selectedQuote} className="bg-black px-7 py-4 text-[10px] font-semibold uppercase tracking-[.14em] text-white disabled:opacity-50">{isChecking ? "Creating secure QR…" : "Continue to QR Ph"}</button></div>
      {message && <p role="status" className="mt-5 text-sm text-rose-700">{message}</p>}
    </form>

    <aside className="h-fit lg:sticky lg:top-12"><h2 className="font-editorial text-2xl font-semibold">Order summary</h2>
      <div className="mt-8 space-y-6">{items.map((item) => <div className="grid grid-cols-[72px_1fr_auto] gap-4" key={item.variantId}><div className="relative aspect-square bg-[#e5e2e1]"><img src={item.image} alt="" className="h-full w-full object-cover grayscale" /><span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#e5e2e1] text-[10px]">{item.quantity}</span></div><div><h3 className="text-sm">{item.productName}</h3><p className="mt-1 text-xs text-black/55">{item.color} / {item.size}</p></div><p className="text-sm">{formatPeso(item.displayPriceCentavos * item.quantity)}</p></div>)}</div>
      <div className="mt-10 border-t border-black/10 pt-6"><div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPeso(subtotal)}</span></div><div className="mt-3 flex justify-between text-sm"><span>Shipping</span><span>{selectedQuote ? formatPeso(shippingCentavos) : "Calculated after address"}</span></div><div className="mt-3 flex justify-between text-sm"><span>Discount</span><span>{formatPeso(0)}</span></div><div className="mt-7 flex items-end justify-between border-t border-black/15 pt-7"><span className="font-editorial text-2xl">Total</span><div><span className="mr-2 text-[9px] uppercase tracking-[.12em]">PHP</span><span className="text-3xl font-semibold">{formatPeso(subtotal + shippingCentavos)}</span></div></div></div>
    </aside>
  </div></main>;
}
