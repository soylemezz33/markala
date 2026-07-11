import type { Metadata } from "next";

// Favoriler kişisel/geçici liste — robots.txt engelli; sayfa seviyesinde de noindex.
export const metadata: Metadata = {
  title: "Favorilerim",
  robots: { index: false, follow: false },
};

export default function FavorilerimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
