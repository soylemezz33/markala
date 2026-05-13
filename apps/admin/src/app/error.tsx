"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[Markala Admin Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center bg-paper-50 px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-error/10 grid place-items-center text-error mb-5 text-3xl">
          !
        </div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Admin panelinde bir hata oluştu
        </h1>
        <p className="mt-3 text-ink-700 text-sm">
          Hata kaydı sistemimize iletildi. Sayfayı yeniden yüklemeyi deneyin —
          devam ederse sistem yöneticisine bildirin.
        </p>

        {error.digest && (
          <code className="inline-block mt-4 px-3 py-1.5 rounded bg-paper-100 text-xs text-ink-500 font-mono">
            Hata kodu: {error.digest}
          </code>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold transition-colors"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-paper-200 hover:border-ink-300 text-ink-900 rounded-md text-sm font-semibold transition-colors"
          >
            Panele Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
