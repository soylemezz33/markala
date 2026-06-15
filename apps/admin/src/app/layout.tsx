import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const fontSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Markala Admin",
  description: "Markala yönetim paneli",
};

// Admin paneli tamamen dinamik — sayfalar request-time'da API'den veri çeker.
// Build sırasında prerender DENENMEZ (aksi halde API'ye ECONNREFUSED ile build patlar).
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={fontSans.variable}>
      <body>{children}</body>
    </html>
  );
}
