import { Container } from "@markala/ui";

/**
 * Kategori loading skeleton — getProductsByCategory() canlı API beklenirken gösterilir.
 * Hero şeridi + ürün grid'i gerçek sayfanın geometrisini izler.
 */
export default function CategoryLoading() {
  return (
    <div role="status" aria-label="Kategori yükleniyor" aria-busy="true">
      <span className="sr-only">Kategori yükleniyor…</span>

      {/* Hero şeridi */}
      <section className="bg-paper-100 border-b border-paper-200" aria-hidden="true">
        <Container className="py-12 md:py-20">
          <div className="animate-pulse space-y-5 max-w-3xl">
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 bg-paper-200 rounded" />
              <div className="h-3 w-20 bg-paper-200 rounded" />
            </div>
            <div className="h-6 w-32 bg-paper-200 rounded-full" />
            <div className="h-12 w-2/3 bg-paper-200 rounded" />
            <div className="h-5 w-full max-w-2xl bg-paper-200 rounded" />
            <div className="h-5 w-3/4 max-w-xl bg-paper-200 rounded" />
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="h-4 w-28 bg-paper-200 rounded" />
              <div className="h-4 w-32 bg-paper-200 rounded" />
              <div className="h-4 w-24 bg-paper-200 rounded" />
            </div>
          </div>
        </Container>
      </section>

      {/* Ürün grid'i */}
      <Container className="py-12 md:py-16" aria-hidden="true">
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="h-4 w-20 bg-paper-200 rounded" />
          <div className="h-9 w-36 bg-paper-200 rounded-lg" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-paper-200 rounded-lg" />
              <div className="h-4 w-3/4 bg-paper-200 rounded" />
              <div className="h-3 w-1/2 bg-paper-200 rounded" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
