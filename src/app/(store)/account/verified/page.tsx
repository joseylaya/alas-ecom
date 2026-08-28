import Link from "next/link";

export default function AccountVerifiedPage() {
  return <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-5 py-16 text-center"><div><span className="inline-grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-800" aria-hidden>✓</span><h1 className="mt-7 font-editorial text-4xl">Email verified</h1><p className="mt-3 text-sm leading-6 text-black/60">Your ALAS account is ready. Continue to checkout whenever you’re ready.</p><Link href="/checkout" className="mt-8 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">Continue to checkout</Link><Link href="/" className="mt-5 block text-sm text-black/55 underline">Continue shopping</Link></div></main>;
}
