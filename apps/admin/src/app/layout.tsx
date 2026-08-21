import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { PermsProvider } from "@/components/perms-provider";
import { getAdminApi, getAdminSession } from "@/lib/api";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // İzinler SUNUCUDA çözülür → menü ilk boyamada doğru çıkar, sayfa geçişlerinde
  // "tam menü parlaması" olmaz (2026-08-21, bkz. PermsProvider notu).
  // Rol→izin haritası panele KOPYALANMIYOR; API tek doğruluk kaynağı olarak kalıyor.
  let perms: string[] | null = null;
  const session = await getAdminSession();
  if (session) {
    try {
      const api = await getAdminApi();
      const me = (await api.auth.me()) as unknown as { permissions?: string[] };
      if (Array.isArray(me?.permissions)) perms = me.permissions;
    } catch {
      // API'ye ulaşılamadı — AdminShell kendi client fetch'ine düşer.
    }
  }
  return (
    <html lang="tr" className={fontSans.variable}>
      <body>
        <PermsProvider value={perms}>{children}</PermsProvider>
      </body>
    </html>
  );
}
