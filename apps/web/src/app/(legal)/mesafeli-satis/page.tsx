import Link from "next/link";
import { Container } from "@markala/ui";
import { getLegalPage } from "@/lib/legal";
import { FileText, ArrowRight, Info } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description:
    "Markala (markala.com.tr) — Mesafeli Sözleşmeler Yönetmeliği (RG: 27/11/2014) kapsamında hazırlanmış mesafeli satış sözleşmesi taslağı.",
  robots: { index: false, follow: false },
};

export default async function MesafeliSatisPage() {
  const page = await getLegalPage("mesafeli-satis");

  return (
    <Container className="py-12 md:py-16 max-w-4xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-none w-12 h-12 rounded-xl bg-brand-100 text-brand-700 grid place-items-center">
          <FileText size={24} weight="regular" />
        </div>
        <div>
          <p className="text-xs text-brand-700 font-semibold uppercase tracking-wider">Yasal Sözleşme</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-ink-900">
            Mesafeli Satış Sözleşmesi
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Son güncelleme: {page?.lastUpdated ?? "2026-05-05"} · Türk Tüketici Hukuku (6502 sayılı TTK) uyumlu
          </p>
        </div>
      </div>

      {/* Yasal kapsam notu */}
      <div className="mb-8 flex gap-3 p-4 rounded-xl bg-paper-100 border border-paper-200">
        <Info size={16} weight="fill" className="shrink-0 text-ink-500 mt-0.5" />
        <p className="text-sm text-ink-700 leading-relaxed">
          Bu sözleşme; 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
          Sözleşmeler Yönetmeliği (R.G.: 27.11.2014-29188) kapsamında hazırlanmıştır.
          Sipariş tamamlandığında geçerli sözleşme metnini e-posta ile alırsınız.
        </p>
      </div>

      <article className="prose prose-ink max-w-none legal-content">
        {page ? (
          // XSS güvenli: içerik build-time statik TypeScript dosyasından gelir
          // (packages/mock-data/src/legal.ts), kullanıcı girdisi değildir.
          // Dış kaynak ya da DB'den gelen içerik için DOMPurify kullanılmalıdır.
          <div dangerouslySetInnerHTML={{ __html: page.body }} />
        ) : (
          <p className="text-ink-500">İçerik yüklenemedi.</p>
        )}
      </article>

      <footer className="mt-12 pt-8 border-t border-paper-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="text-sm text-ink-500">
          İade ve değişim talepleriniz için{" "}
          <Link href="/iletisim" className="text-brand-700 hover:underline font-medium">
            iletişim sayfasını
          </Link>{" "}
          kullanın.
        </div>
        <Link
          href="/yasal/mesafeli-satis"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-paper-200 text-ink-700 text-sm font-medium rounded-lg hover:border-ink-300 transition-colors"
        >
          Tam yasal metin <ArrowRight size={14} weight="bold" />
        </Link>
      </footer>
    </Container>
  );
}
