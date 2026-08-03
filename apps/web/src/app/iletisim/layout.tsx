import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İletişim | Markala',
  description: 'Markala matbaa ile iletişime geçin. WhatsApp, e-posta veya iletişim formu.',
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
