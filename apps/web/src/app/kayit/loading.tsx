import { Container } from "@markala/ui";

/**
 * Üye ol sayfası yükleme iskeleti (2026-10-09) — /giris ile aynı gerekçe.
 * Sayfa baştan sona `"use client"`; JavaScript inene kadar orta alan boş kalabiliyordu.
 * Bu iskelet sayesinde müşteri boş ekran yerine yüklenen bir form görür.
 */
export default function KayitLoading() {
  return (
    <div className="min-h-[80vh] grid lg:grid-cols-12" aria-busy="true" aria-live="polite">
      <div className="lg:col-span-6 xl:col-span-5 flex items-start">
        <Container className="py-8 md:py-12 max-w-md mx-auto w-full">
          <span className="sr-only">Üyelik sayfası yükleniyor…</span>
          <div className="mb-6 animate-pulse">
            <div className="h-4 w-24 rounded bg-paper-200" />
            <div className="mt-2 h-9 w-56 rounded bg-paper-200" />
            <div className="mt-3 h-4 w-full max-w-sm rounded bg-paper-200" />
          </div>
          <div className="animate-pulse space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 w-full rounded-lg bg-paper-200" />
            ))}
            <div className="h-10 w-full rounded bg-paper-100 border border-paper-200" />
            <div className="h-12 w-full rounded-lg bg-paper-200" />
          </div>
        </Container>
      </div>
      <div className="hidden lg:block lg:col-span-6 xl:col-span-7 bg-paper-100" />
    </div>
  );
}
