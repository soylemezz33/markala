import Link from "next/link";
import { Container } from "@markala/ui";
import { getLegalPage } from "@/lib/legal";
import { sanitizeHtml } from "@/lib/sanitize";
import { Shield, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni [TASLAK]",
  description:
    "Markala (markala.com.tr), 6698 sayılı KVKK kapsamında hazırlanmış aydınlatma metni taslağı. Hukuk müşaviri onayı beklenmektedir.",
  robots: { index: false, follow: false },
};

export default async function KvkkAydinlatmaPage() {
  const page = await getLegalPage("kvkk");

  return (
    <Container className="py-12 md:py-16 max-w-4xl">
      <div className="flex items-start gap-4 mb-8">
        <div className="flex-none w-12 h-12 rounded-xl bg-brand-100 text-brand-700 grid place-items-center">
          <Shield size={24} weight="regular" />
        </div>
        <div>
          <p className="text-xs text-brand-700 font-semibold uppercase tracking-wider">Kişisel Veri Koruma</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-ink-900">
            KVKK Aydınlatma Metni
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Son güncelleme: {page?.lastUpdated ?? "2026-05-05"} · Yürürlük: yayın sonrası
          </p>
        </div>
      </div>

      <article className="prose prose-ink max-w-none legal-content">
        {page ? (
          // sanitizeHtml ZORUNLU — mesafeli-satis ile aynı gerekçe: eski yorumun aksine
          // içerik API'den (panelden düzenlenebilir) geliyor, statik dosyadan değil.
          // Bu rota şu an 308 ile /yasal/kvkk-aydinlatma'ya yönleniyor ama dosya durduğu
          // sürece aynı riski taşıyor (2026-08-31 denetim bulgusu).
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body) }} />
        ) : (
          <p className="text-ink-500">İçerik yüklenemedi.</p>
        )}
      </article>

      <footer className="mt-12 pt-8 border-t border-paper-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="text-sm text-ink-500">
          Haklarınız hakkında soru için{" "}
          <Link href="/iletisim" className="text-brand-700 hover:underline font-medium">
            iletişim sayfasını
          </Link>{" "}
          ziyaret edin.
        </div>
        <Link
          href="/kvkk-basvuru"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink-900 text-paper-50 text-sm font-semibold rounded-lg hover:bg-ink-700 transition-colors"
        >
          KVKK Başvuru Formu <ArrowRight size={14} weight="bold" />
        </Link>
      </footer>
    </Container>
  );
}
