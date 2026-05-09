import { Container } from "@markala/ui";

/**
 * Bize güvenenler — kurumsal müşteri logoları stripi.
 * Şu an SVG-text mockup (gerçek logolar geldikçe Image ile değiştirilir).
 *
 * Tasarım kararı: tüm logolar grayscale + opacity, brand-rengi
 * çatışmasını önler ve "ortak/eşit önem" hissi verir.
 */

const TRUSTED_BRANDS: { name: string; sector: string }[] = [
  { name: "Lisan Fen", sector: "Eğitim" },
  { name: "Akdeniz Otel", sector: "Turizm" },
  { name: "324 Ajans", sector: "Reklam" },
  { name: "Mersin Marina", sector: "Restoran" },
  { name: "Kara Mimarlık", sector: "Mimarlık" },
  { name: "Şen Emlak", sector: "Gayrimenkul" },
  { name: "Yıldız Catering", sector: "Yiyecek" },
  { name: "Doğan İnşaat", sector: "İnşaat" },
];

export function TrustedBy() {
  return (
    <section className="bg-paper-50 py-12 md:py-16 border-y border-paper-200">
      <Container>
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 font-medium">
            BİZE GÜVENENLER
          </p>
          <h2 className="mt-2 text-lg md:text-xl text-ink-700">
            Türkiye'nin önde gelen markaları matbaa ihtiyaçlarını Markala'dan karşılıyor
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-2 gap-y-6 items-center">
          {TRUSTED_BRANDS.map((b) => (
            <BrandPlaceholder key={b.name} name={b.name} sector={b.sector} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-ink-500">
          Logonu burada görmek ister misin?{" "}
          <a href="/kurumsal/basvuru" className="text-brand-700 font-medium hover:underline">
            Kurumsal hesap aç →
          </a>
        </p>
      </Container>
    </section>
  );
}

function BrandPlaceholder({ name, sector }: { name: string; sector: string }) {
  return (
    <div
      className="group flex flex-col items-center justify-center py-3 px-2 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
      title={`${name} — ${sector}`}
    >
      <div className="font-serif text-base md:text-lg text-ink-700 group-hover:text-ink-900 transition-colors text-center leading-tight">
        {name}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-500">
        {sector}
      </div>
    </div>
  );
}
