import type { Brand } from "@markala/types";

/**
 * Markala referansları — Hasan tarafından iletildikçe eklenecek.
 * Her referans:
 *   - logoUrl: SVG/PNG (tercihen monochrome, beyaz arka planda)
 *   - name: müşteri/firma adı
 *   - sector?: opsiyonel sektör etiketi (filtre için)
 *   - testimonialId?: bu firma için testimonials.ts'te yorum varsa id
 *
 * NOT: Sahte/placeholder logo KOYULMAZ — gerçek müşteri izniyle eklenir.
 */
export const brands: Brand[] = [
  // Örnek format (boş — gerçek referans geldikçe doldurulacak):
  // { name: "Lisan Fen Eğitim", logoUrl: "/images/brands/lisanfen.svg" },
  // { name: "324 Ajans", logoUrl: "/images/brands/324ajans.svg" },
];
