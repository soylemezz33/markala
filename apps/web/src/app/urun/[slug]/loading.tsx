import { Container } from "@markala/ui";

/**
 * Ürün detay loading skeleton — getProductBySlug() canlı API beklenirken gösterilir.
 * Geometri gerçek sayfayı birebir izler (breadcrumb şeridi + 7/5 galeri/konfigüratör
 * grid'i) → içerik gelince layout kaymaz (CLS = 0).
 */
export default function ProductLoading() {
  return (
    <div role="status" aria-label="Ürün yükleniyor" aria-busy="true">
      <span className="sr-only">Ürün yükleniyor…</span>

      {/* Breadcrumb şeridi */}
      <div className="bg-paper-100 border-b border-paper-200" aria-hidden="true">
        <Container className="py-4">
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-3 w-16 bg-paper-200 rounded" />
            <div className="h-3 w-20 bg-paper-200 rounded" />
            <div className="h-3 w-24 bg-paper-200 rounded" />
          </div>
        </Container>
      </div>

      <Container className="py-8 md:py-12" aria-hidden="true">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start animate-pulse">
          {/* Sol: galeri */}
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-square bg-paper-200 rounded-xl" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 w-20 bg-paper-200 rounded-lg" />
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-9 w-28 bg-paper-200 rounded-md" />
              <div className="h-9 w-24 bg-paper-200 rounded-md" />
            </div>
          </div>

          {/* Sağ: başlık + fiyat + konfigüratör */}
          <div className="lg:col-span-5 space-y-5">
            <div className="h-8 w-3/4 bg-paper-200 rounded" />
            <div className="h-4 w-1/3 bg-paper-200 rounded" />
            <div className="h-10 w-40 bg-paper-200 rounded" />
            <div className="border-t border-paper-200 pt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 bg-paper-200 rounded" />
                  <div className="h-11 w-full bg-paper-200 rounded-lg" />
                </div>
              ))}
            </div>
            <div className="h-12 w-full bg-paper-200 rounded-lg mt-2" />
          </div>
        </div>
      </Container>
    </div>
  );
}
