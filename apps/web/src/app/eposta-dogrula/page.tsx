"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container, Button } from "@markala/ui";
import { CheckCircle, WarningCircle, EnvelopeSimple } from "@phosphor-icons/react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.markala.com.tr").replace(/\/$/, "");

export default function VerifyEmailPage() {
  return (
    <Container className="py-16 md:py-24 max-w-md">
      <Suspense fallback={<div className="text-center text-ink-500 text-sm">Yükleniyor…</div>}>
        <VerifyFlow />
      </Suspense>
    </Container>
  );
}

function VerifyFlow() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ok" | "error" | "notoken">(token ? "loading" : "notoken");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        if (r.ok && d?.ok) setState("ok");
        else {
          setState("error");
          setMessage(d?.message ?? "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          setMessage("Şu an doğrulanamadı, lütfen birazdan tekrar deneyin.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "loading") {
    return <div className="text-center text-ink-500 text-sm py-8">E-postan doğrulanıyor…</div>;
  }

  if (state === "ok") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 grid place-items-center text-success">
          <CheckCircle size={36} weight="fill" />
        </div>
        <h1 className="mt-5 text-2xl md:text-3xl font-semibold text-ink-900">E-postan doğrulandı 🎉</h1>
        <p className="mt-3 text-ink-700">Hesabın etkin. Alışverişe devam edebilir veya siparişlerini görüntüleyebilirsin.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/urunler"><Button size="lg">Ürünleri Keşfet</Button></Link>
          <Link href="/hesabim/siparislerim"><Button variant="outline" size="lg">Siparişlerim</Button></Link>
        </div>
      </div>
    );
  }

  // error / notoken
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
        {state === "notoken" ? <EnvelopeSimple size={32} /> : <WarningCircle size={32} />}
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-ink-900">
        {state === "notoken" ? "Doğrulama bağlantısı gerekiyor" : "Bağlantı geçersiz"}
      </h1>
      <p className="mt-3 text-ink-700">
        {state === "notoken"
          ? "E-posta doğrulaması için kayıt sırasında gönderdiğimiz maildeki bağlantıya tıkla."
          : (message ?? "Bağlantı geçersiz veya süresi dolmuş.")}
      </p>
      <p className="mt-2 text-sm text-ink-500">
        Bağlantı çalışmıyorsa <Link href="/hesabim/bilgilerim" className="text-brand-700 hover:underline font-medium">hesabından</Link> yeni bir doğrulama maili isteyebilirsin.
      </p>
      <div className="mt-6">
        <Link href="/"><Button variant="outline" size="lg">Anasayfaya Dön</Button></Link>
      </div>
    </div>
  );
}
