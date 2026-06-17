"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/visitor-analytics";

interface Props {
  slug: string;
}

/**
 * Ürün inceleme süresi (dwell) izleme. Mount'ta zamanlayıcı başlar; sayfa gizlenince
 * (visibilitychange→hidden) veya unmount cleanup'ta stop() ile dwellMs gönderilir.
 * Consent yoksa NO-OP (visitor-analytics içinde). Null-render.
 */
export function ProductViewTracker({ slug }: Props) {
  useEffect(() => {
    const stop = trackProductView(slug);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [slug]);

  return null;
}
