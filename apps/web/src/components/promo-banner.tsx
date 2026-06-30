"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@markala/ui";
import { apiClient, type BannerLocation, type Banner } from "@/lib/api";

interface Props {
  location: BannerLocation;
  /** Dış sarmalayıcı sınıfı (opsiyonel) — anasayfa/sepet farklı boşluk verir. */
  className?: string;
}

/** Admin girdisi href'i için XSS guard: yalnız güvenli şemaları/yolları geçir, aksi halde "#". */
function safeHref(href: string): string {
  return /^(https?:|\/|#|mailto:|tel:)/i.test(href) ? href : "#";
}

/**
 * Admin Banner kayıtlarını siteye bağlar (client).
 * - apiClient.banners.listPublic() ile çeker (backend zaten pasif/süresi geçeni filtreler).
 * - prop location ile filtreler ("cart" | "hero" | …), sortOrder'a göre sıralar.
 * - mobileImageUrl varsa responsive (mobilde mobil görsel, masaüstünde ana görsel).
 * - Banner yoksa HİÇBİR ŞEY render etmez (null) → boş alan oluşmaz.
 */
export function PromoBanner({ location, className }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    let active = true;
    apiClient.banners
      .listPublic()
      .then((list) => {
        if (!active || !Array.isArray(list)) return;
        const filtered = list
          .filter((b) => b.location === location && b.imageUrl)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setBanners(filtered);
      })
      .catch(() => {
        /* banner yoksa sessizce boş kalır */
      });
    return () => {
      active = false;
    };
  }, [location]);

  if (banners.length === 0) return null;

  return (
    <div className={className ?? "py-4"}>
      <Container>
        <div className="space-y-3">
          {banners.map((b) => {
            const media = (
              <picture>
                {b.mobileImageUrl && (
                  <source media="(max-width: 640px)" srcSet={b.mobileImageUrl} />
                )}
                <Image
                  src={b.imageUrl}
                  alt={b.title || b.ctaLabel || "Kampanya"}
                  width={1280}
                  height={360}
                  className="w-full h-auto rounded-xl object-cover"
                  priority={false}
                />
              </picture>
            );

            const cta =
              b.ctaLabel && b.ctaHref ? (
                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex items-center px-4 py-2 bg-ink-900 text-paper-50 text-sm font-semibold rounded-lg shadow-md">
                    {b.ctaLabel}
                  </span>
                </div>
              ) : null;

            // ctaHref varsa tüm banner tıklanabilir; yoksa düz görsel.
            return b.ctaHref ? (
              <Link
                key={b.id}
                href={safeHref(b.ctaHref)}
                className="relative block overflow-hidden rounded-xl"
                aria-label={b.ctaLabel || b.title || "Kampanya"}
              >
                {media}
                {cta}
              </Link>
            ) : (
              <div key={b.id} className="relative overflow-hidden rounded-xl">
                {media}
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
