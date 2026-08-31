import Link from "next/link";
import { Container } from "@markala/ui";
import {
  CursorClick, PaintBrush, Printer, Package as PackageIcon, Truck,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Üretim süreci şeridi.
 *
 * 2026-08-31 — SİTENİN PALETİNE ÇEVRİLDİ. Önceki hâli koyu mor gradyan zemin + adım
 * başına ayrı gradyan ikon (amber/pembe/camgöbeği/mor/yeşil) + köşe ışık lekeleri +
 * gradyan metinli başlık kullanıyordu. Üç sorunu vardı:
 *  1) Sitenin geri kalanı krem/ink/amber; bu tek bölüm başka bir ürün gibi duruyordu.
 *  2) Beş renk hiçbir şey KODLAMIYORDU — anlam taşımayan renk süstür, üstelik markanın
 *     sarısını beş renkten birine indirip ayırt ediciliğini eritiyordu.
 *  3) Hiyerarşi tersti: 96px dekoratif rozet en büyük öğe, asıl bilgi (açıklama/süre) 12px.
 *
 * Şimdi renk GERÇEK bir ayrım taşıyor: müşterinin yapacağı adımlar marka sarısı,
 * bizim yaptıklarımız koyu. "İlk iki adım sende, kalan üçü bizde" cümlesi bunun karşılığı.
 */
type Taraf = "musteri" | "biz";

const steps: Array<{
  n: string;
  icon: typeof CursorClick;
  title: string;
  desc: string;
  duration: string;
  taraf: Taraf;
}> = [
  {
    n: "01",
    icon: CursorClick,
    title: "Sipariş Ver",
    desc: "Konfigüratörden paket, ebat ve adet seç. Anında fiyat gör.",
    duration: "60 sn",
    taraf: "musteri",
  },
  {
    n: "02",
    icon: PaintBrush,
    title: "Tasarım",
    desc: "Hazır dosyanı yükle veya ücretsiz tasarım desteği iste.",
    duration: "0-24 sa",
    taraf: "musteri",
  },
  {
    n: "03",
    icon: Printer,
    title: "Üretim",
    desc: "Onaylı tasarım kalite kontrolünden geçer, üretime alınır.",
    duration: "2-3 iş günü",
    taraf: "biz",
  },
  {
    n: "04",
    icon: PackageIcon,
    title: "Paketleme",
    desc: "Hasarsız ulaşması için özel ambalaj. Fotoğraflı tutanak.",
    duration: "Üretim sonrası",
    taraf: "biz",
  },
  {
    n: "05",
    icon: Truck,
    title: "Kargo",
    desc: "DHL veya Aras Kargo ile 81 ile teslim. Takip linki SMS/e-posta.",
    duration: "1-3 iş günü",
    taraf: "biz",
  },
];

/** Rozet stili — tek vurgu rengi, gradyan/glow yok. */
const rozet = (t: Taraf) =>
  t === "musteri"
    ? "bg-brand-500 text-ink-900"
    : "bg-ink-900 text-brand-400";

export function ProcessTimeline() {
  return (
    <section className="py-14 md:py-20 bg-paper-100 border-y border-paper-200">
      <Container>
        <div className="max-w-2xl mb-10 md:mb-14">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Üretim Süreci
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-ink-900 leading-tight text-balance">
            Sipariş ver, üretim biter bitmez kargoya teslim edelim
          </h2>
          <p className="mt-4 text-lg text-ink-700 leading-relaxed">
            5 adımlık şeffaf süreç. Her aşamada SMS ve e-posta ile bilgilendirme.
            Üretimi atölyemizde, denetimi 324 Ajans disipliniyle yapıyoruz.
          </p>
          {/* Renk kodlamasının açıklaması — rozet renkleri bunu kodluyor. */}
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-700">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand-500" />
              İlk iki adım sende
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-ink-900" />
              Kalan üçü bizde
            </span>
          </p>
        </div>

        {/* Masaüstü: yatay şerit */}
        <div className="hidden md:block">
          <div className="relative grid grid-cols-5 gap-5">
            {/* Bağlantı çizgisi — düz, nötr. Rozet merkezi hizası: py-0 + h-14 → top-7. */}
            <div
              className="absolute top-7 left-[10%] right-[10%] h-px bg-paper-300"
              aria-hidden="true"
            />
            {steps.map((s) => (
              <article key={s.n} className="relative flex flex-col items-center text-center">
                <div className="relative">
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-xl ${rozet(s.taraf)}`}
                  >
                    <s.icon size={24} weight="fill" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-paper-50 border border-paper-200 text-ink-900 text-[10px] font-bold tabular-nums">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">{s.desc}</p>
                <div className="mt-3 inline-flex items-center rounded-full border border-paper-300 bg-paper-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-ink-700">
                  {s.duration}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Mobil: dikey liste */}
        <ol className="md:hidden space-y-2.5">
          {steps.map((s) => (
            <li
              key={s.n}
              className="flex gap-3.5 rounded-xl border border-paper-200 bg-paper-50 p-3.5"
            >
              <div className="relative shrink-0">
                <div className={`grid h-11 w-11 place-items-center rounded-lg ${rozet(s.taraf)}`}>
                  <s.icon size={20} weight="fill" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-paper-50 border border-paper-200 text-ink-900 text-[10px] font-bold tabular-nums">
                  {s.n}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink-900">{s.title}</h3>
                  <span className="shrink-0 rounded-full border border-paper-300 bg-paper-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-ink-700">
                    {s.duration}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-700 leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Toplam süre + rehber. 2026-08-31: "3-5 iş günü" KENDİ ADIMLARIYLA çelişiyordu
            (üretim 2-3 + kargo 1-3 = 3-6) ve yardım merkezindeki teslimat maddesiyle de
            uyuşmuyordu. Aritmetiğe göre düzeltildi. */}
        <div className="mt-10 md:mt-14 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-paper-300 bg-paper-50 p-5 md:p-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500">
              Toplam süre (ortalama)
            </div>
            <div className="mt-1 text-2xl md:text-3xl font-semibold tabular-nums text-ink-900">
              3-6 iş günü
              <span className="ml-2 text-base font-normal text-ink-500">· sipariş → kapı</span>
            </div>
          </div>
          <Link
            href="/yardim/siparis-sureci/siparis-nasil-olusturulur"
            className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
          >
            Detaylı süreç rehberi <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
