import { Container } from "@markala/ui";
import { KARGO_SURESI, TOPLAM_SURE } from "@/lib/delivery";
import {
  CursorClick, PaintBrush, Printer, Package as PackageIcon, Truck,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Adım renkleri — her adım kendi gradient kimliğine sahip (soluk tek-renk görünümün
 * yerine canlı, modern bir süreç şeridi). Zemin: hero/topbar ailesindeki koyu mor.
 */
const steps = [
  {
    n: "01",
    icon: CursorClick,
    title: "Sipariş Ver",
    desc: "Konfigüratörden paket, ebat ve adet seç. Anında fiyat gör.",
    duration: "60 sn",
    grad: "from-[#F5B800] to-[#FF8A00]",
    glow: "shadow-[0_8px_24px_rgba(245,184,0,0.35)]",
  },
  {
    n: "02",
    icon: PaintBrush,
    title: "Tasarım",
    desc: "Hazır dosyanı yükle veya ücretsiz tasarım desteği iste.",
    duration: "0-24 sa",
    grad: "from-[#FF6B9D] to-[#C94BC9]",
    glow: "shadow-[0_8px_24px_rgba(201,75,201,0.35)]",
  },
  {
    n: "03",
    icon: Printer,
    title: "Üretim",
    desc: "Onaylı tasarım kalite kontrolünden geçer, üretime alınır.",
    duration: "2-3 iş günü",
    grad: "from-[#00D9FF] to-[#0091FF]",
    glow: "shadow-[0_8px_24px_rgba(0,217,255,0.35)]",
  },
  {
    n: "04",
    icon: PackageIcon,
    title: "Paketleme",
    desc: "Hasarsız ulaşması için özel ambalaj. Fotoğraflı tutanak.",
    duration: "Üretim sonrası",
    grad: "from-[#9F7BFF] to-[#6C4BE0]",
    glow: "shadow-[0_8px_24px_rgba(159,123,255,0.35)]",
  },
  {
    n: "05",
    icon: Truck,
    title: "Kargo",
    desc: "DHL veya Aras Kargo ile 81 ile teslim. Takip linki SMS/e-posta.",
    duration: KARGO_SURESI,
    grad: "from-[#3DDC84] to-[#00A86B]",
    glow: "shadow-[0_8px_24px_rgba(61,220,132,0.35)]",
  },
];

/**
 * Numaralandırılmış 5 adımlı üretim süreci timeline'ı.
 * Kurumsal güven sinyali — "biz nasıl çalışırız" şeffaflığı.
 * 2026-08: soluk light görünüm → koyu mor zemin + adım başına gradient
 * ikon rozetleri + glow (modern/renkli yenileme).
 */
export function ProcessTimeline() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-[#1B1540] via-[#241C54] to-[#322768]">
      {/* Dekoratif glow'lar — köşelerde yumuşak renk vurgusu */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#F5B800]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#00D9FF]/15 blur-3xl"
      />

      <Container className="relative">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-sm text-brand-400 font-semibold uppercase tracking-wider">
            Üretim Süreci
          </p>
          <h2 className="mt-2 text-3xl md:text-5xl font-semibold text-paper-50 leading-tight">
            Sipariş ver, üretim biter bitmez{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B800] to-[#00D9FF]">
              kargoya teslim edelim
            </span>
          </h2>
          <p className="mt-4 text-lg text-paper-100/80">
            5 adımlık şeffaf süreç. Her aşamada SMS ve e-posta ile bilgilendirme.
            Üretimi atölyemizde, denetimi 324 Ajans disipliniyle yapıyoruz.
          </p>
        </div>

        {/* Desktop: yatay timeline */}
        <div className="hidden md:block">
          <div className="relative grid grid-cols-5 gap-4">
            {/* Bağlantı çizgisi — adım renklerini takip eden gradient */}
            <div
              className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#F5B800] via-[#00D9FF] to-[#3DDC84] opacity-40"
              aria-hidden="true"
            />
            {steps.map((s) => (
              <article key={s.n} className="relative flex flex-col items-center text-center">
                {/* Numara + gradient ikon rozeti */}
                <div className="relative">
                  <div
                    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${s.grad} ${s.glow} grid place-items-center text-white transition-transform duration-300 hover:scale-105 hover:-rotate-3`}
                  >
                    <s.icon size={36} weight="fill" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-paper-50 text-ink-900 grid place-items-center text-xs font-bold tabular-nums shadow-lg">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold text-paper-50 text-base">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-xs text-paper-100/70 px-2 leading-relaxed">
                  {s.desc}
                </p>
                <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full bg-paper-50/10 border border-paper-50/15 text-paper-50 text-[11px] font-semibold tabular-nums backdrop-blur-sm">
                  ⏱ {s.duration}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Mobile: dikey timeline */}
        <ol className="md:hidden space-y-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="flex gap-4 p-4 bg-paper-50/5 border border-paper-50/10 rounded-xl backdrop-blur-sm"
            >
              <div className="relative shrink-0">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.grad} grid place-items-center text-white`}
                >
                  <s.icon size={22} weight="fill" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-paper-50 text-ink-900 grid place-items-center text-[10px] font-bold tabular-nums shadow">
                  {s.n}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-paper-50">{s.title}</h3>
                  <span className="text-[11px] font-semibold text-paper-50 px-1.5 py-0.5 rounded-full bg-paper-50/10 border border-paper-50/15 tabular-nums shrink-0">
                    ⏱ {s.duration}
                  </span>
                </div>
                <p className="mt-1 text-sm text-paper-100/70 leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Toplam süre özeti — cam efektli bant, gradient vurgu */}
        <div className="mt-12 md:mt-16 p-5 md:p-6 bg-paper-50/10 border border-paper-50/15 backdrop-blur-sm text-paper-50 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-paper-100/60 uppercase tracking-wider">
              Toplam süre (ortalama)
            </div>
            <div className="mt-1 text-2xl md:text-3xl font-semibold tabular-nums">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B800] to-[#FF8A00]">
                {/* Süreler lib/delivery.ts'ten TEK KAYNAKTAN gelir (2026-09-02):
                    daha önce burada elle yazılıydı ve Hasan'ın 2-4 kargo kararından
                    sonra kendi adımlarıyla çelişti. */}
                {TOPLAM_SURE}
              </span>
              <span className="text-base text-paper-100/60 ml-2">
                · sipariş → kapı
              </span>
            </div>
          </div>
          <a
            href="/yardim/siparis-sureci/siparis-nasil-olusturulur"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-[#FF8A00] hover:from-brand-400 hover:to-[#FF9D2E] text-ink-900 rounded-md text-sm font-semibold transition-all shadow-[0_8px_24px_rgba(245,184,0,0.3)] hover:shadow-[0_8px_32px_rgba(245,184,0,0.45)]"
          >
            Detaylı süreç rehberi <ArrowRight size={14} weight="bold" />
          </a>
        </div>
      </Container>
    </section>
  );
}
