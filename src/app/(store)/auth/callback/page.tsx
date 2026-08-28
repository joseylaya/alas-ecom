"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  useEffect(() => { const next = new URL(window.location.href).searchParams.get("next") || "/checkout"; void supabase.auth.exchangeCodeForSession(window.location.href).then(() => router.replace(next)); }, [router]);
  return <main className="grid min-h-[60vh] place-items-center text-sm text-black/60">Verifying your email…</main>;
}
