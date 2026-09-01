import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { ArrowLeft, CaretRight, ChatCircle, Question } from "@phosphor-icons/react/dist/ssr";
import { BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/seo/json-ld";

/**
 * Sıkça Sorulan Sorular — ADMIN PANELİNDEN YÖNETİLİR (SSS Yönetimi).
 *
 * Bu statik rota, yardim/[slug] içindeki eski kod-gömülü "sss" makalesinin yerini aldı
 * (2026-08-21): sorular artık DB'de (GET /api/faqs/public), panelden eklenen her soru
 * deploy'suz yayına girer. Sayfa FAQPage JSON-LD üretir — hem Google zengin sonuçları
 * hem de AI asistanlarının (ChatGPT/Perplexity) alıntılaması için; görünen metin ile
 * şema tek kaynaktan birebir aynıdır.
 */

const API =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

export const revalidate = 300;

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  productSlug?: string | null;
  sortOrder: number;
}

/** Kategori sırası ve görünen başlıklar — DTO enum'u ile aynı küme. */
const KATEGORILER: Array<{ key: string; label: string }> = [
  { key: "genel", label: "Genel" },
  { key: "urun", label: "Ürün & Baskı" },
  { key: "tasarim", label: "Tasarım & Dosya" },
  { key: "kargo", label: "Kargo & Teslimat" },
  { key: "odeme", label: "Ödeme & Fatura" },
  { key: "iade", label: "İade & İptal" },
];

async function sssGetir(): Promise<Faq[]> {
  // Hata build'i ÖLDÜRMEMELİ: bu sayfa docker build sırasında prerender edilir ve
  // canlı API'yi çağırır — yeni API ucu aynı deploy'da geldiğinden ilk build anında
  // henüz 404'tür (tavuk-yumurta; 2026-08-21'de deploy bu yüzden düştü). Hatada boş
  // liste döner, sayfa "yüklenemedi" durumunu gösterir; ISR (300sn) kendini iyileştirir.
  try {
    const res = await fetch(`${API}/api/faqs/public`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular | Baskı, Kargo, Ödeme ve İade",
  description:
    "Online matbaa hakkında merak edilenler: dosya formatı, üretim ve kargo süreleri, KDV dahil fiyatlar, ödeme güvenliği, kişiye özel üründe iade koşulları.",
  alternates: { canonical: "/yardim/sss" },
  openGraph: {
    type: "article",
    title: "Sıkça Sorulan Sorular | Markala Yardım",
    description:
      "Tasarım, ürün, kargo, ödeme ve iade hakkında en çok sorulan sorular ve net cevapları.",
    url: "/yardim/sss",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Sıkça Sorulan Sorular" }],
  },
};

export default async function SssPage() {
  const sss = await sssGetir();

  const breadcrumbs = [
    { name: "Anasayfa", href: "/" },
    { name: "Yardım Merkezi", href: "/yardim" },
    { name: "Sıkça Sorulan Sorular", href: "/yardim/sss" },
  ];

  const gruplar = KATEGORILER.map((k) => ({
    ...k,
    sorular: sss.filter((f) => f.category === k.key),
  })).filter((g) => g.sorular.length > 0);

  return (
    <>
      {/* Görünen metin ile şema TEK kaynaktan — tüm sorular tek FAQPage bloğunda. */}
      {sss.length > 0 && (
        <FAQPageJsonLd
          questions={sss.map((f) => ({ q: f.question, a: f.answer }))}
          url="/yardim/sss"
        />
      )}
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-500">
            <Link href="/" className="hover:text-ink-900 transition-colors">
              Anasayfa
            </Link>
            <CaretRight size={12} />
            <Link href="/yardim" className="hover:text-ink-900 transition-colors">
              Yardım Merkezi
            </Link>
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">Sıkça Sorulan Sorular</span>
          </nav>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-semibold text-ink-900 mb-3">
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-ink-600 leading-relaxed mb-10">
            Tasarım dosyasından kargo takibine, ödemeden iade koşullarına: en çok sorulan
            sorular ve net cevapları. Aradığınızı bulamazsanız{" "}
            <Link href="/iletisim" className="text-brand-700 hover:text-brand-900 font-medium">
              bize ulaşın
            </Link>
            .
          </p>

          {sss.length === 0 && (
            <p className="text-ink-500 text-sm bg-paper-100 border border-paper-200 rounded-lg px-4 py-3">
              Sorular şu anda yüklenemiyor, birkaç dakika içinde tekrar deneyin veya{" "}
              <Link href="/iletisim" className="text-brand-700 font-medium">
                bize ulaşın
              </Link>
              .
            </p>
          )}

          {gruplar.map((g) => (
            <section key={g.key} className="mb-10">
              <header className="flex items-center gap-2 mb-4">
                <Question size={20} weight="fill" className="text-brand-700" />
                <h2 className="text-xl font-semibold text-ink-900">{g.label}</h2>
              </header>
              <div className="space-y-3">
                {g.sorular.map((f) => (
                  <details
                    key={f.id}
                    className="group bg-paper-50 border border-paper-200 rounded-lg overflow-hidden open:shadow-sm"
                  >
                    <summary className="cursor-pointer px-4 py-3 font-medium text-ink-900 text-sm flex items-center justify-between hover:bg-paper-100 transition-colors">
                      <span>{f.question}</span>
                      <CaretRight
                        size={14}
                        weight="bold"
                        className="transition-transform group-open:rotate-90 text-ink-500 shrink-0 ml-3"
                      />
                    </summary>
                    <div className="px-4 pb-4 pt-3 text-sm text-ink-700 leading-relaxed border-t border-paper-200/50 bg-paper-100/30">
                      {f.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-paper-200 pt-8">
            <Link
              href="/yardim"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 transition-colors"
            >
              <ArrowLeft size={16} /> Yardım Merkezi
            </Link>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors"
            >
              <ChatCircle size={16} weight="fill" /> Sorunuz mu var? Bize yazın
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
