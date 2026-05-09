import { Container } from "@markala/ui";

/** Root loading skeleton — sayfalar arası geçişte gösterilir */
export default function Loading() {
  return (
    <Container className="py-12 md:py-16">
      <div className="animate-pulse space-y-8">
        {/* Hero skeleton */}
        <div className="h-12 w-64 bg-paper-200 rounded" />
        <div className="h-5 w-full max-w-2xl bg-paper-200 rounded" />
        <div className="h-5 w-3/4 max-w-xl bg-paper-200 rounded" />

        {/* Grid skeleton */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mt-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-paper-200 rounded-lg" />
              <div className="h-4 bg-paper-200 rounded w-3/4" />
              <div className="h-3 bg-paper-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
