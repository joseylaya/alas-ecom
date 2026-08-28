"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function AccountPage() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [username, setUsername] = useState("");
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { if (!data.user?.email_confirmed_at) return router.replace("/login"); setEmail(data.user.email ?? ""); setUsername(String(data.user.user_metadata.username ?? "")); }); }, [router]);
  async function signOut() { await supabase.auth.signOut(); router.replace("/"); }
  return <main className="mx-auto min-h-[70vh] max-w-xl px-5 py-16"><h1 className="font-editorial text-4xl">Your account</h1><p className="mt-3 text-sm text-black/60">Verified ALAS customer</p><dl className="mt-10 divide-y divide-black/10 border-y border-black/10"><div className="py-5"><dt className="text-xs text-black/50">Username</dt><dd className="mt-1">{username || "Not set"}</dd></div><div className="py-5"><dt className="text-xs text-black/50">Email</dt><dd className="mt-1">{email}</dd></div></dl><Link href="/checkout" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">Continue to checkout</Link><button onClick={signOut} className="ml-4 text-sm underline">Sign out</button></main>;
}
