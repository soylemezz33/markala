import { Container } from "@markala/ui";
import {
  CursorClick, PaintBrush, Printer, Package as PackageIcon, Truck,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

const steps = [
  {
    n: "01",
    icon: CursorClick,
    title: "Sipariş Ver",
    desc: "Konfigüratörden paket, ebat ve adet seç. Anında fiyat gör.",
    duration: "60 sn",
  },
  {
    n: "02",
    icon: PaintBrush,
    title: "Tasarım",
    desc: "Hazır dosyanı yükle veya ücretsiz tasarım desteği iste.",
    duration: "0-24 sa",
  },
  {
    n: "03",
    icon: Printer,
    title: "Üretim",
    desc: "Onaylı tasarım kalite kontrolünden geçer, üretime alınır.",
    duration: "1-2 iş günü",
  },
  {
    n: "04",
    icon: PackageIcon,
    title: "Paketleme",
    desc: "Hasarsız ulaşması için özel ambalaj. Fotoğraflı tutanak.",
    duration: "Üretim sonrası",
  },
  {
    n: "05",
    icon: Truck,
    title: "Kargo",
    desc: "DHL veya Aras Kargo ile 81 ile teslim. Takip linki SMS/e-posta.",
    duration: "1-3 iş günü",
  },
];

/**
 * Numaralandırılmış 5 adımlı üretim süreci timeline'ı.
 * Kurumsal güven sinyali — "biz nasıl çalışırız" şeffaflığı.
 */
export function ProcessTimeline() {
  return (
    <section className="py-16 md:py-24 bg-paper-100 border-y border-paper-200">
      <Container>
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Üretim Süreci
          </p>
          <h2 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Sipariş ver, üretim biter bitmez kargoya teslim edelim
          </h2>
          <p className="mt-4 text-lg text-ink-700">
            5 adımlık şeffaf süreç. Her aşamada SMS ve e-posta ile bilgilendirme.
            Üretimi atölyemizde, denetimi 324 Ajans disipliniyle yapıyoruz.
          </p>
        </div>

        {/* Desktop: yatay timeline */}
        <div className="hidden md:block">
          <div className="relative grid grid-cols-5 gap-4">
            {/* Bağlantı çizgisi */}
            <div
              className="absolute top-12 left-[10%] right-[10%] h-px bg-paper-200"
              aria-hidden="true"
            />
            {steps.map((s, i) => (
              <article key={s.n} className="relative flex flex-col items-center text-center">
                {/* Numara + ikon */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-paper-50 border-2 border-paper-200 grid place-items-center text-ink-700 group-hover:border-brand-500">
                    <s.icon size={32} weight="regular" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-brand-500 text-ink-900 grid place-items-center text-xs font-bold tabular-nums">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-ink-900 text-base">
                  {s.title}
                </h3>
                <p className="mt-1 text-xs text-ink-500 px-2 leading-relaxed">
                  {s.desc}
                </p>
                <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full bg-brand-100 text-brand-900 text-[11px] font-semibold tabular-nums">
                  ⏱ {s.duration}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Mobile: dikey timeline */}
        <ol className="md:hidden space-y-4">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className="flex gap-4 p-4 bg-paper-50 border border-paper-200 rounded-xl"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-paper-100 grid place-items-center text-ink-700">
                  <s.icon size={20} />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 text-ink-900 grid place-items-center text-[10px] font-bold tabular-nums">
                  {s.n}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink-900">{s.title}</h3>
                  <span className="text-[11px] font-semibold text-brand-700 px-1.5 py-0.5 rounded-full bg-brand-100 tabular-nums shrink-0">
                    ⏱ {s.duration}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-500 leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Toplam süre özeti — zemin: hero slider'ın koyu mor tonları (topbar ile aynı, bkz. site-header) */}
        <div className="mt-12 md:mt-16 p-5 md:p-6 bg-gradient-to-r from-[#241C54] via-[#322768] to-[#4B3AA0] text-paper-50 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-paper-100/60 uppercase tracking-wider">
              Toplam süre (ortalama)
            </div>
            <div className="mt-1 text-2xl md:text-3xl font-semibold tabular-nums">
              <span className="text-brand-400">3-5 iş günü</span>
              <span className="text-base text-paper-100/60 ml-2">
                · sipariş → kapı
              </span>
            </div>
          </div>
          <a
            href="/yardim/siparis"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold transition-colors"
          >
            Detaylı süreç rehberi <ArrowRight size={14} weight="bold" />
          </a>
        </div>
      </Container>
    </section>
  );
}
