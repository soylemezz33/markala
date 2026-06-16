import { Container } from "@markala/ui";

/**
 * Tüm ürünler loading skeleton — getProducts() canlı API beklenirken gösterilir.
 * Sayfa başlığı + filtre/arama çubuğu + ürün grid'i gerçek layout'u izler.
 */
export default function AllProductsLoading() {
  return (
    <div role="status" aria-label="Ürünler yükleniyor" aria-busy="true">
      <span className="sr-only">Ürünler yükleniyor…</span>

      <Container className="py-10 md:py-14" aria-hidden="true">
        {/* Başlık */}
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-9 w-2/3 bg-paper-200 rounded" />
          <div className="h-5 w-full bg-paper-200 rounded" />
          <div className="h-5 w-1/2 bg-paper-200 rounded" />
        </div>

        {/* Filtre / arama çubuğu */}
        <div className="mt-8 flex flex-wrap items-center gap-3 animate-pulse">
          <div className="h-11 w-full sm:w-72 bg-paper-200 rounded-lg" />
          <div className="h-11 w-32 bg-paper-200 rounded-lg" />
          <div className="h-11 w-36 bg-paper-200 rounded-lg ml-auto" />
        </div>

        {/* Ürün grid'i */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
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
