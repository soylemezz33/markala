"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container, Button } from "@markala/ui";
import { CheckCircle, WarningCircle, EnvelopeSimple } from "@phosphor-icons/react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.markala.com.tr").replace(/\/$/, "");

export default function NewsletterUnsubscribePage() {
  return (
    <Container className="py-16 md:py-24 max-w-md">
      <Suspense fallback={<div className="text-center text-ink-500 text-sm">Yükleniyor…</div>}>
        <UnsubscribeFlow />
      </Suspense>
    </Container>
  );
}

function UnsubscribeFlow() {
  const params = useSearchParams();
  const email = params.get("email");
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ok" | "error" | "noparams">(
    email && token ? "loading" : "noparams",
  );

  useEffect(() => {
    if (!email || !token) return;
    let cancelled = false;
    fetch(
      `${API_BASE}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
    )
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        if (r.ok && d?.ok) setState("ok");
        else setState("error");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [email, token]);

  if (state === "loading") {
    return <div className="text-center text-ink-500 text-sm py-8">Talebin işleniyor…</div>;
  }

  if (state === "ok") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 grid place-items-center text-success">
          <CheckCircle size={36} weight="fill" />
        </div>
        <h1 className="mt-5 text-2xl md:text-3xl font-semibold text-ink-900">E-posta listemizden çıkarıldın</h1>
        <p className="mt-3 text-ink-700">
          Bu adrese artık bülten göndermeyeceğiz. Fikrini değiştirirsen sitedeki bülten formundan yeniden abone
          olabilirsin.
        </p>
        <div className="mt-6">
          <Link href="/"><Button size="lg">Anasayfaya Dön</Button></Link>
        </div>
      </div>
    );
  }

  // error / noparams
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
        {state === "noparams" ? <EnvelopeSimple size={32} /> : <WarningCircle size={32} />}
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-ink-900">
        {state === "noparams" ? "Çıkış bağlantısı gerekiyor" : "İşlem şu an tamamlanamadı"}
      </h1>
      <p className="mt-3 text-ink-700">
        {state === "noparams"
          ? "Bültenden çıkmak için sana gönderdiğimiz maildeki çıkış bağlantısına tıkla."
          : "Bağlantı geçersiz görünüyor ya da geçici bir sorun oluştu. Lütfen maildeki bağlantıyı yeniden dene."}
      </p>
      <div className="mt-6">
        <Link href="/"><Button variant="outline" size="lg">Anasayfaya Dön</Button></Link>
      </div>
    </div>
  );
}
