import Link from "next/link";
import { Container } from "@markala/ui";
import {
  ForkKnife,
  Bed,
  Storefront,
  Wrench,
  Confetti,
  Briefcase,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

/**
 * "Sektörünüze Özel" — matbaa müşterisi sektörel düşünür ("ben restoranım, ne lazım?").
 * Ürünler sektör-etiketli olmadığından her kart → /teklif-al?sektor=X (sektör ön-seçili
 * teklif formu): güçlü B2B lead toplama. Sektör etiketleri /teklif-al SECTORS ile birebir.
 *
 * 2026-08: soluk tek-renk kartlar → sektör başına gradient ikon + renkli zemin/çerçeve
 * (modern/renkli yenileme). Her sektörün kendi renk kimliği var.
 */
const SECTORS = [
  {
    label: "Restoran & Kafe",
    desc: "Menü, masa giydirme, tabela",
    icon: ForkKnife,
    grad: "from-[#FF6B35] to-[#F5B800]",
    tint: "bg-[#FF6B35]/5 hover:bg-[#FF6B35]/10 border-[#FF6B35]/15 hover:border-[#FF6B35]/40",
    arrow: "text-[#E85A25]",
  },
  {
    label: "Otel & Konaklama",
    desc: "Kapı kartı, yönlendirme, branda",
    icon: Bed,
    grad: "from-[#0091FF] to-[#00D9FF]",
    tint: "bg-[#0091FF]/5 hover:bg-[#0091FF]/10 border-[#0091FF]/15 hover:border-[#0091FF]/40",
    arrow: "text-[#0080E0]",
  },
  {
    label: "Mağaza & Perakende",
    desc: "Vitrin, etiket, poşet, sticker",
    icon: Storefront,
    grad: "from-[#FF4D8D] to-[#C94BC9]",
    tint: "bg-[#FF4D8D]/5 hover:bg-[#FF4D8D]/10 border-[#FF4D8D]/15 hover:border-[#FF4D8D]/40",
    arrow: "text-[#E03A78]",
  },
  {
    label: "İnşaat & Sanayi",
    desc: "İSG levhası, branda, baret baskı",
    icon: Wrench,
    grad: "from-[#F5B800] to-[#FF8A00]",
    tint: "bg-[#F5B800]/5 hover:bg-[#F5B800]/10 border-[#F5B800]/20 hover:border-[#F5B800]/50",
    arrow: "text-[#C77700]",
  },
  {
    label: "Etkinlik & Organizasyon",
    desc: "Rollup, davetiye, yaka kartı",
    icon: Confetti,
    grad: "from-[#9F7BFF] to-[#6C4BE0]",
    tint: "bg-[#9F7BFF]/5 hover:bg-[#9F7BFF]/10 border-[#9F7BFF]/15 hover:border-[#9F7BFF]/40",
    arrow: "text-[#7A55E8]",
  },
  {
    label: "Kurumsal / Ofis",
    desc: "Kartvizit, antetli, kaşe, dosya",
    icon: Briefcase,
    grad: "from-[#00A86B] to-[#3DDC84]",
    tint: "bg-[#00A86B]/5 hover:bg-[#00A86B]/10 border-[#00A86B]/15 hover:border-[#00A86B]/40",
    arrow: "text-[#008F5B]",
  },
];

export function SectorShowcase() {
  return (
    <section className="relative overflow-hidden bg-paper-50 py-14 md:py-20 border-t border-paper-200">
      {/* Dekoratif renk vurgusu — sağ üstte yumuşak gradient leke */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-brand-300/20 to-[#00D9FF]/10 blur-3xl"
      />

      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
              Sektörünüze Özel
            </p>
            <h2 className="mt-1.5 text-3xl md:text-4xl font-serif text-ink-900">
              İşinize göre{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D99A00] via-[#FF6B35] to-[#C94BC9]">
                hazır çözümler
              </span>
            </h2>
            <p className="mt-2 text-ink-700 max-w-xl">
              Sektörünüzü seçin, en çok kullanılan ürünler için size özel teklif hazırlayalım.
            </p>
          </div>
          <Link
            href="/teklif-al"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:gap-2.5 transition-all"
          >
            Tüm sektörler için teklif al <ArrowRight size={15} weight="bold" />
          </Link>
        </div>

        {/* Mobilde TEK sütun (2026-08-20): iki sütunda her kart ~190px'e sıkışıyor, ikon
            (48px) + boşluk düşünce metne ~85px kalıyordu → "İnşaat & Sanayi" üç satıra
            bölünüyor, açıklamalar 4-5 satıra çıkıyor ve kartlar orantısız duruyordu.
            Tam genişlikte başlık tek satıra sığar, açıklama 1-2 satırda biter. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {SECTORS.map((s) => (
            <Link
              key={s.label}
              href={`/teklif-al?sektor=${encodeURIComponent(s.label)}`}
              className={`group flex items-start gap-4 p-4 sm:p-5 md:p-6 border rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${s.tint}`}
            >
              <div
                className={`flex-none w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${s.grad} text-white grid place-items-center shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}
              >
                <s.icon size={24} weight="fill" />
              </div>
              <div className="min-w-0">
                {/* Başlık tek satırda kalsın — dar ekranda "İnşaat & Sanayi" bölünüp
                    kart yüksekliğini oynatıyordu. */}
                <div className="font-semibold text-ink-900 flex items-center gap-1.5">
                  {/* min-w-0: flex öğesi varsayılan olarak daralmaz, truncate çalışmazdı. */}
                  <span className="min-w-0 truncate">{s.label}</span>
                  <ArrowRight
                    size={14}
                    weight="bold"
                    className={`${s.arrow} opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all`}
                  />
                </div>
                <div className="mt-1 text-sm text-ink-500 leading-snug">{s.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobil: tüm sektörler linki */}
        <div className="md:hidden mt-5 text-center">
          <Link
            href="/teklif-al"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
          >
            Tüm sektörler için teklif al <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
