"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@markala/ui";
import { Warning, ArrowClockwise, House, ChatCircle } from "@phosphor-icons/react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Production'da Sentry/Logflare gibi bir error tracker'a gönderilir
    console.error("[Markala Error Boundary]", error);
  }, [error]);

  return (
    <Container className="py-16 md:py-24 max-w-2xl text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-error/10 grid place-items-center text-error mb-6">
        <Warning size={36} weight="fill" />
      </div>
      <h1 className="text-2xl md:text-4xl font-semibold text-ink-900 leading-tight">
        Beklenmeyen bir hata oluştu
      </h1>
      <p className="mt-4 text-ink-700 max-w-lg mx-auto">
        Sistemimizde geçici bir aksaklık var. Sayfayı yeniden yüklemeyi deneyin
        — devam ederse bize bildirin, hemen ilgilenelim.
      </p>

      {error.digest && (
        <code className="inline-block mt-4 px-3 py-1.5 rounded bg-paper-100 text-xs text-ink-500 font-mono">
          Hata kodu: {error.digest}
        </code>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold inline-flex items-center gap-2 transition-colors"
        >
          <ArrowClockwise size={16} weight="bold" /> Tekrar Dene
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 border border-paper-200 hover:border-ink-300 text-ink-900 rounded-md text-sm font-semibold inline-flex items-center gap-2 transition-colors"
        >
          <House size={16} /> Anasayfa
        </Link>
        <Link
          href="/iletisim"
          className="px-5 py-2.5 text-ink-700 hover:text-ink-900 rounded-md text-sm font-semibold inline-flex items-center gap-2 transition-colors"
        >
          <ChatCircle size={16} /> Bize Bildir
        </Link>
      </div>
    </Container>
  );
}
