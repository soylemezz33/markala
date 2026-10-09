import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Markala hesabınıza giriş yapın.",
  alternates: { canonical: "/giris" },
  robots: { index: false, follow: true },
};

/**
 * ELLE SUSPENSE KALDIRILDI (2026-10-09).
 *
 * Burada `<Suspense fallback={null}>` vardı: 2026-08-20'de sayfa `useSearchParams()`
 * kullandığı için zorunluydu. 31 Ağustos'ta `next` parametresi SUNUCUYA taşındı
 * (page.tsx), yani hook kalmadı — ama boş fallback kaldı. Sonucu: sayfa dinamik olduğu
 * için her yumuşak navigasyonda RSC yükü beklenirken orta alan BOMBOŞ kalıyordu; geçiş
 * takıldığında müşteri "beyaz sayfa" görüp yenilemek zorunda kalıyordu.
 *
 * Artık sınırı Next'in kendi `loading.tsx` dosyası kuruyor ve fallback olarak görünür bir
 * form iskeleti gösteriyor.
 */
export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
