import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sepetim",
  description: "Markala alışveriş sepetiniz.",
  alternates: { canonical: "/sepet" },
  robots: { index: false, follow: true, nocache: true },
};

export default function SepetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
