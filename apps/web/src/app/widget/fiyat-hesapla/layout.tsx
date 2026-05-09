import type { Metadata, Viewport } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Fiyat Hesaplayıcı · Markala",
  description: "Matbaa ürünleri için anlık fiyat hesaplayıcı widget'ı.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

/**
 * Embeddable widget layout — site header/footer YOK.
 * <iframe src="https://markala.com.tr/widget/fiyat-hesapla" /> ile partner sitelere gömülür.
 */
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-white">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
