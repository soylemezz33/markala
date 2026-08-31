import type { Metadata } from "next";
import { Container } from "@markala/ui";

/**
 * Hesabım alanı arama motorlarına KAPALI (2026-08-31 denetimi).
 *
 * Neden layout: hesabim/page.tsx bir istemci bileşeni ("use client") olduğu için
 * `metadata` dışa aktaramıyor. Denetimde /giris, /kayit, /odeme ve /favorilerim
 * noindex'ti ama /hesabim açıktaydı — üyeye özel bir alanın indekslenmeye açık
 * durması hem gereksiz hem de arama sonuçlarında boş/yetkisiz sayfa üretir.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * SARMALAYICI (2026-08-31, Hasan bildirdi: "her şey çok dağınık çok boşluklu").
 *
 * Kök layout içeriği yalnız `<main className="flex-1">` ile sarıyor ve kendi yorumunda
 * "bölümlerin kendi <Container>'ı (max-w-content) sınırlar" diyor. Hesap alanındaki
 * 15 sayfanın HİÇBİRİ Container kullanmıyordu (sitenin geri kalanı kullanıyor, ör.
 * favorilerim/page.tsx:39) → yatay padding SIFIR, max-width YOK. Sonuç: 1920px ekranda
 * kartlar bir uçtan bir uca yayılıyor, başlıklar viewport'un sol kenarına yapışıyordu.
 *
 * Container tek yerde uygulanıyor; her sayfaya tek tek eklemek 15 dosyada tekrar
 * demekti ve yeni eklenen sayfada yine unutulurdu.
 *
 * NOT: Alt sayfalar kendi genişlik sınırlarını (ör. bilgilerim `max-w-2xl`) korur;
 * Container yalnız dış çerçeveyi ve okunabilir satır uzunluğunu verir.
 */
export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  return <Container className="py-8 md:py-12">{children}</Container>;
}
