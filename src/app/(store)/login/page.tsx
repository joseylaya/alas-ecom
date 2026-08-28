"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState(1); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [username, setUsername] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("");
    if (mode === "register" && step === 1) { if (!username.trim() || !email.includes("@") || password.length < 8) return setMessage("Enter a username, valid email, and password with at least 8 characters."); setStep(2); return; }
    if (mode === "register" && password !== confirm) return setMessage("Passwords do not match.");
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/account/verified`;
    const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { username: username.trim() }, emailRedirectTo: redirectTo } });
    setBusy(false);
    if (result.error) {
      const reason = result.error.message.toLowerCase();
      if (reason.includes("redirect") || reason.includes("url")) return setMessage("Registration is set up, but the verification redirect URL is not allowed in Supabase yet. Add http://localhost:3000/auth/callback to Supabase Auth redirect URLs.");
      if (reason.includes("rate limit")) return setMessage("Too many verification emails were requested. Please wait a few minutes, then try again.");
      if (reason.includes("already registered") || reason.includes("already been registered")) return setMessage("An account already exists with this email. Sign in instead, or reset its password.");
      console.error("Supabase authentication error", result.error);
      return setMessage(process.env.NODE_ENV === "development" ? `Registration error: ${result.error.message}` : mode === "login" ? "We couldn’t sign you in with those details." : "Registration is temporarily unavailable. Please check the Supabase email settings and try again.");
    }
    if (mode === "login") { window.location.assign("/checkout"); return; }
    setMessage(`Check ${email} for your verification link. You can close this page after verifying.`);
  }
  async function resend() { setBusy(true); const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account/verified` } }); setBusy(false); setMessage(error ? "We couldn’t resend the email yet. Please try again in a minute." : "A new verification email has been sent."); }
  const input = "mt-3 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black";
  return <main className="mx-auto min-h-[70vh] max-w-md px-5 py-16"><Link href="/" className="text-sm text-black/55">← Continue shopping</Link><h1 className="mt-10 font-editorial text-4xl">{mode === "login" ? "Welcome back" : step === 1 ? "Create your account" : "Confirm your password"}</h1><p className="mt-3 text-sm leading-6 text-black/60">{mode === "login" ? "Sign in to use your saved details at checkout." : "A verified email keeps your ALAS account secure."}</p><form onSubmit={submit} className="mt-8"><label className="block text-sm">Email<input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>{mode === "register" && <label className="mt-5 block text-sm">Username<input className={input} required value={username} onChange={(e) => setUsername(e.target.value)} /></label>}<label className="mt-5 block text-sm">Password<input className={input} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>{mode === "register" && step === 2 && <label className="mt-5 block text-sm">Confirm password<input className={input} type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>}<button disabled={busy} className="mt-7 w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : step === 1 ? "Continue" : "Create account"}</button></form>{message && <p className="mt-5 text-sm leading-6 text-black/70">{message}</p>}{mode === "register" && message.startsWith("Check") && <button onClick={resend} disabled={busy} className="mt-3 text-sm underline">Resend verification email</button>}<button onClick={() => { setMode(mode === "login" ? "register" : "login"); setStep(1); setMessage(""); }} className="mt-8 text-sm underline">{mode === "login" ? "Create an account" : "Already have an account? Sign in"}</button></main>;
}
