import type { Metadata } from 'next';
import { BreadcrumbJsonLd, LocalBusinessJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'İletişim | Markala',
  description: 'Markala matbaa ile iletişime geçin. WhatsApp, e-posta veya iletişim formu.',
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Breadcrumb JSON-LD burada (layout), page.tsx'te değil: page "use client".
          Sunucu bileşeninde tutmak işaretlemeyi client bundle'ından uzak tutar. */}
      <BreadcrumbJsonLd
        items={[
          { name: 'Anasayfa', href: '/' },
          { name: 'İletişim', href: '/iletisim' },
        ]}
      />
      {/* LocalBusiness (2026-09-02 SEO denetimi): eskiden kök layout'tan 900+ sayfada
          basılıyordu. İşletme kaydı site başına bir kez bildirilir; artık yalnız anasayfa
          ve burası — Google'ın adres/telefon/çalışma saati beklediği iki sayfa. */}
      <LocalBusinessJsonLd />
      {children}
    </>
  );
}
