"use client";

import { useState } from "react";

/**
 * Bülten abone formu — client-side fetch ile (JSON), sayfa içi geri bildirimli.
 * ÖNCEDEN: native <form action="/api/newsletter" method="post"> → 303 redirect
 * `new URL(..., req.url)` proxy arkasında dahili origin (localhost:3000) üretiyordu →
 * tarayıcı ulaşılamayan adrese yönleniyordu ("sayfa patlıyor"). Artık fetch + inline mesaj.
 */
export function NewsletterForm({ source = "blog" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    const value = email.trim();
    if (!value.includes("@") || value.length < 5) {
      setState("err");
      setMsg("Geçerli bir e-posta adresi girin.");
      return;
    }
    setState("loading");
    setMsg("");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
      if (r.ok && d.ok) {
        setState("ok");
        setMsg(d.message || "Abone olundun, teşekkürler!");
        setEmail("");
      } else {
        setState("err");
        setMsg(d.error || "Abonelik şu an yapılamadı, lütfen tekrar deneyin.");
      }
    } catch {
      setState("err");
      setMsg("Bağlantı hatası — lütfen tekrar deneyin.");
    }
  }

  if (state === "ok") {
    return (
      <p className="mt-6 text-brand-400 font-medium" role="status">
        ✓ {msg}
      </p>
    );
  }

  return (
    <div className="mt-6 max-w-md mx-auto">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "err") setState("idle");
          }}
          placeholder="ornek@firma.com"
          className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-paper-50 placeholder:text-paper-100/40 outline-none focus:border-brand-400 text-sm"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold whitespace-nowrap disabled:opacity-60"
        >
          {state === "loading" ? "Gönderiliyor…" : "Abone Ol"}
        </button>
      </form>
      {state === "err" && <p className="mt-2 text-sm text-red-300">{msg}</p>}
    </div>
  );
}
