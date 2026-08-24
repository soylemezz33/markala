"use client";

import { useState } from "react";
import { Button } from "@markala/ui";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { useCartStore, itemUnitCount } from "@/lib/cart-store";
import { getSessionId } from "@/lib/visitor-analytics";

/**
 * Sepet terk hatırlatması — misafir e-posta yakalama (2026-08-24, Hasan talebi).
 * Sadece misafir kullanıcılara gösterilir (bkz. sepet/page.tsx) — üyelerin e-postası
 * zaten sistemde var, ayrı bir yakalamaya gerek yok.
 *
 * Onay kutucuğu VARSAYILAN İŞARETSİZ — ETK/KVKK açık rıza şartı. İşaretlenmezse kayıt
 * yine tutulur ama backend hiçbir zaman hatırlatma göndermez (consent=false).
 */
export function CartEmailCapture() {
  const items = useCartStore((s) => s.items);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState(""); // honeypot — bot doldurursa sunucu sessizce reddeder
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
      const res = await fetch("/api/sepet-hatirlatma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          email: value,
          consent,
          cart: items.map((i) => ({
            productSlug: i.productSlug,
            productName: i.productName,
            quantity: i.quantity * itemUnitCount(i),
          })),
          _hp: hp,
        }),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
      if (res.ok && d.ok) {
        setState("ok");
        setMsg(d.message || "E-postana kaydedildi.");
      } else {
        setState("err");
        setMsg(d.error || "Şu an kaydedilemedi, lütfen tekrar dene.");
      }
    } catch {
      setState("err");
      setMsg("Bağlantı hatası — lütfen tekrar dene.");
    }
  }

  if (state === "ok") {
    return (
      <div className="p-4 bg-success/10 border border-success/30 rounded-xl text-sm text-success">
        ✓ {msg}
      </div>
    );
  }

  return (
    <div className="p-4 bg-paper-50 border border-paper-200 rounded-xl">
      <p className="text-sm font-semibold text-ink-900 flex items-center gap-2">
        <EnvelopeSimple size={16} /> Sepetini kaybetme
      </p>
      <p className="mt-1 text-xs text-ink-500">E-postanı bırak, unutursan hatırlatalım.</p>
      <form onSubmit={submit} className="mt-3 space-y-2.5">
        {/* Honeypot — görsel gizli, klavye/okuyucu erişimi kapalı. Gerçek kullanıcı görmez/doldurmaz. */}
        <input
          type="text"
          name="company"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />
        <div className="flex gap-2">
          <label htmlFor="cart-lead-email" className="sr-only">
            E-posta adresi
          </label>
          <input
            id="cart-lead-email"
            type="email"
            required
            aria-label="E-posta adresi"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "err") setState("idle");
            }}
            placeholder="e-posta adresin"
            className="flex-1 min-w-0 px-3 py-2 rounded border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30"
          />
          <Button type="submit" variant="outline" size="md" disabled={state === "loading" || !email.trim()} className="flex-none">
            {state === "loading" ? "…" : "Gönder"}
          </Button>
        </div>
        <label className="flex items-start gap-2 text-xs text-ink-500 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 flex-none"
          />
          <span>Kampanya ve hatırlatma e-postaları almak istiyorum</span>
        </label>
      </form>
      {state === "err" && (
        <p role="alert" className="mt-2 text-xs text-error">
          {msg}
        </p>
      )}
    </div>
  );
}
