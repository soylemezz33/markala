"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@markala/ui";
import { ProductImageFallback } from "@/components/product/product-image-fallback";

export function Gallery({ images, alt, fallbackSrc }: { images: string[]; alt: string; fallbackSrc?: string }) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;
  const safeImages = images;

  return (
    <div>
      <div className="relative aspect-square bg-paper-100 rounded-lg overflow-hidden">
        {hasImages ? (
          <Image
            src={safeImages[active] ?? ""}
            alt={alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : fallbackSrc ? (
          <Image
            src={fallbackSrc}
            alt={alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <ProductImageFallback name={alt} />
        )}
      </div>
      {hasImages && safeImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {safeImages.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} — görsel ${i + 1}`}
              aria-pressed={i === active}
              className={cn(
                "relative aspect-square bg-paper-100 rounded-md overflow-hidden border transition-all",
                i === active
                  ? "border-ink-900 ring-2 ring-ink-900/10"
                  : "border-paper-200 hover:border-ink-300",
              )}
            >
              <Image
                src={src}
                alt={`${alt} — görsel ${i + 1}`}
                fill
                loading="lazy"
                sizes="100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
