import type { CategorySeoSection } from "@markala/types";

/**
 * Yapılandırılmış SEO bölümleri (baslik + paragraflar + liste + tablo) — kategori ve ÜRÜN
 * sayfalarının ortak bileşeni (2026-09-10). Kategori sayfasındaki 2026-08-30 işaretlemesi
 * buraya taşındı; ürün sayfaları (789) aynı bölümleri content.seoBolumler'den basar
 * (Faz 1 son parça: kategori bazlı teknik şablon). Ham HTML değil, yapılandırılmış veri.
 */
export function SeoSections({ bolumler, className = "" }: { bolumler?: CategorySeoSection[] | null; className?: string }) {
  if (!bolumler || bolumler.length === 0) return null;
  return (
    <div className={`max-w-3xl space-y-8 ${className}`}>
      {bolumler.map((b, i) => (
        <section key={i}>
          <h2 className="text-xl md:text-2xl font-semibold text-ink-900 mb-3">{b.baslik}</h2>
          {b.paragraflar?.map((p, j) => (
            <p key={j} className="text-sm text-ink-700 leading-relaxed mb-3">
              {p}
            </p>
          ))}
          {b.liste && b.liste.length > 0 && (
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-ink-700 mb-3">
              {b.liste.map((m, j) => (
                <li key={j}>{m}</li>
              ))}
            </ul>
          )}
          {b.tablo && (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm border-collapse min-w-[480px]">
                <thead>
                  <tr>
                    {b.tablo.basliklar.map((h, j) => (
                      <th key={j} className="text-left font-semibold text-ink-900 border-b-2 border-ink-900 py-2 pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.tablo.satirlar.map((satir, j) => (
                    <tr key={j} className="border-b border-paper-200">
                      {satir.map((h, k) => (
                        <td key={k} className="py-2 pr-4 text-ink-700 align-top">
                          {h}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {b.tablo.not && <p className="mt-2 text-xs text-ink-500">{b.tablo.not}</p>}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
