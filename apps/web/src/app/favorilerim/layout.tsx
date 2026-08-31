import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { AccountShell } from "@/components/account/account-shell";

// Favoriler kişisel/geçici liste — robots.txt engelli; sayfa seviyesinde de noindex.
export const metadata: Metadata = {
  title: "Favorilerim",
  robots: { index: false, follow: false },
};

/**
 * Hesap kabuğu BURADA DA uygulanır (2026-08-31, Hasan bildirdi: "Favorilerim'e
 * geldiğimde soldaki menü kayboluyor").
 *
 * Favorilerim hesap menüsünde listeleniyor ama rotası /hesabim ALTINDA DEĞİL —
 * üst seviye /favorilerim. Rota bilerek taşınmadı (yer imi + mevcut bağlantılar).
 * Bu yüzden hesabim/layout.tsx'teki kabuk buraya uygulanmıyordu ve kullanıcı
 * menüden favorilere geçince kenar çubuğu kayboluyordu.
 *
 * AccountShell oturum yoksa yalnız children döndürür; favoriler cihaza kayıtlı ve
 * giriş gerektirmediği için oturumsuz ziyaretçide sayfa eskisi gibi çalışmaya devam eder.
 */
export default function FavorilerimLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-8 md:py-12">
      <AccountShell>{children}</AccountShell>
    </Container>
  );
}
