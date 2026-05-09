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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={fontSans.variable}>
      <body>{children}</body>
    </html>
  );
}
