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
 */
const SECTORS = [
  { label: "Restoran & Kafe", desc: "Menü, masa giydirme, tabela", icon: ForkKnife },
  { label: "Otel & Konaklama", desc: "Kapı kartı, yönlendirme, branda", icon: Bed },
  { label: "Mağaza & Perakende", desc: "Vitrin, etiket, poşet, sticker", icon: Storefront },
  { label: "İnşaat & Sanayi", desc: "İSG levhası, branda, baret baskı", icon: Wrench },
  { label: "Etkinlik & Organizasyon", desc: "Roll-up, davetiye, yaka kartı", icon: Confetti },
  { label: "Kurumsal / Ofis", desc: "Kartvizit, antetli, kaşe, dosya", icon: Briefcase },
];

export function SectorShowcase() {
  return (
    <section className="bg-paper-100 py-14 md:py-20 border-t border-paper-200">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
              Sektörünüze Özel
            </p>
            <h2 className="mt-1.5 text-3xl md:text-4xl font-serif text-ink-900">
              İşinize göre hazır çözümler
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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {SECTORS.map((s) => (
            <Link
              key={s.label}
              href={`/teklif-al?sektor=${encodeURIComponent(s.label)}`}
              className="group flex items-start gap-4 p-5 md:p-6 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-lg transition-all"
            >
              <div className="flex-none w-12 h-12 rounded-lg bg-brand-100 text-brand-700 grid place-items-center group-hover:bg-brand-500 group-hover:text-ink-900 transition-colors">
                <s.icon size={24} weight="fill" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-ink-900 flex items-center gap-1.5">
                  {s.label}
                  <ArrowRight
                    size={14}
                    weight="bold"
                    className="text-brand-700 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  />
                </div>
                <div className="mt-1 text-sm text-ink-500 leading-snug">{s.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
