import Image from "next/image";
import Link from "next/link";
import { Container } from "@markala/ui";
import { getBrands } from "@/lib/brands";

/**
 * Bize güvenenler — kurumsal referans markaları.
 * CANLI: admin "Referanslar"dan eklenen GERÇEK markalar gösterilir (getBrands).
 * Marka yoksa bölüm hiç render edilmez — sahte firma adı GÖSTERİLMEZ.
 */
export async function TrustedBy() {
  const brands = await getBrands();
  if (!brands.length) return null;

  return (
    <section className="bg-paper-50 py-12 md:py-16 border-y border-paper-200">
      <Container>
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 font-medium">
            BİZE GÜVENENLER
          </p>
          <h2 className="mt-2 text-lg md:text-xl text-ink-700">
            Kurumsal müşterilerimiz matbaa ihtiyaçlarını Markala'dan karşılıyor
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6 items-center">
          {brands.map((b) => (
            <div
              key={b.name}
              className="flex items-center justify-center py-3 px-2 opacity-70 hover:opacity-100 transition-opacity"
              title={b.name}
            >
              {b.logoUrl ? (
                <Image
                  src={b.logoUrl}
                  alt={b.name}
                  width={140}
                  height={48}
                  className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition"
                />
              ) : (
                <span className="font-serif text-base md:text-lg text-ink-700 text-center leading-tight">
                  {b.name}
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-ink-500">
          Logonu burada görmek ister misin?{" "}
          <Link href="/kurumsal/basvuru" className="text-brand-700 font-medium hover:underline">
            Kurumsal hesap aç →
          </Link>
        </p>
      </Container>
    </section>
  );
}
