"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "@phosphor-icons/react";
import { Button } from "@markala/ui";
import { apiClient, withRefresh } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

interface Props {
  productSlug: string;
}

/**
 * Ürün yorumu bırakma formu (client).
 * - Giriş yoksa: "yorum yapmak için giriş yapın" + /giris linki.
 * - Giriş varsa: yıldız (1-5) + başlık (ops.) + metin → apiClient.reviews.createPublic.
 * - Yorum onaysız doğar → başarıda "onay sonrası yayınlanacak" mesajı; sayfada hemen görünmez.
 */
export function ReviewForm({ productSlug }: Props) {
  const user = useAuthStore((s) => s.user);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
        <h3 className="font-semibold text-ink-900">Bu ürünü kullandınız mı?</h3>
        <p className="mt-1.5 text-sm text-ink-700">
          Yorum yapmak için{" "}
          <Link href="/giris" className="text-brand-700 font-medium hover:underline">
            giriş yapın
          </Link>
          . Yalnızca üyeler değerlendirme bırakabilir.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="p-5 bg-success/10 border border-success/30 rounded-xl">
        <h3 className="font-semibold text-success">Yorumunuz alındı, teşekkürler!</h3>
        <p className="mt-1.5 text-sm text-ink-700">
          Yorumunuz onay sonrası yayınlanacak.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Lütfen 1-5 arası bir puan seçin.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Yorum metni en az 10 karakter olmalı.");
      return;
    }
    setStatus("submitting");
    try {
      await withRefresh(() =>
        apiClient.reviews.createPublic({
          productSlug,
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
        }),
      );
      setStatus("success");
    } catch {
      setStatus("idle");
      setError("Yorum gönderilemedi. Lütfen tekrar deneyin.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
      <h3 className="font-semibold text-ink-900">Yorum Yap</h3>

      {/* Yıldız seçimi */}
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Puan">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} yıldız`}
            aria-pressed={rating === n}
            className="p-0.5"
          >
            <Star
              size={26}
              weight={(hover || rating) >= n ? "fill" : "regular"}
              className={(hover || rating) >= n ? "text-brand-500" : "text-paper-300"}
            />
          </button>
        ))}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Başlık (opsiyonel)"
        maxLength={120}
        className="mt-3 w-full px-3 py-2 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Bu ürünle ilgili deneyiminizi paylaşın…"
        rows={4}
        maxLength={2000}
        className="mt-2 w-full px-3 py-2 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm leading-relaxed focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30 resize-y"
      />

      {error && <p className="mt-2 text-xs text-error">{error}</p>}

      <div className="mt-3">
        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Gönderiliyor…" : "Yorumu Gönder"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-ink-500">
        Yorumlar moderasyon sonrası yayınlanır.
      </p>
    </form>
  );
}
