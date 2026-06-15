"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/lib/analytics";

interface Props {
  slug: string;
  name: string;
  categorySlug?: string;
  price?: number;
}

/**
 * Ürün detay sayfası açıldığında GA4 view_item + Meta ViewContent ateşler.
 * Server component olan sayfa içinde client-side tracking için null-render pattern.
 */
export function TrackViewItem({ slug, name, categorySlug, price }: Props) {
  useEffect(() => {
    trackViewItem({ slug, name, categorySlug, price });
  }, [slug, name, categorySlug, price]);
  return null;
}
