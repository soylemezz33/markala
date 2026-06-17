import { Star, ShieldCheck, ThumbsUp } from "@phosphor-icons/react/dist/ssr";
import { getProductReviews, getProductRatingStats } from "@/lib/reviews";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  productSlug: string;
}

export function ProductReviewsSection({ productSlug }: Props) {
  const reviews = getProductReviews(productSlug, 6);
  const stats = getProductRatingStats(productSlug);

  if (stats.count === 0) {
    return (
      <section className="mt-10 py-10 border-t border-paper-200">
        <h2 className="text-2xl font-semibold text-ink-900 mb-4">Müşteri Yorumları</h2>
        <p className="text-ink-500">
          Bu ürün için henüz yorum yok. Sipariş sonrası ilk yorumu sen yaz!
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 py-10 border-t border-paper-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Özet sol */}
        <div className="lg:col-span-4">
          <h2 className="text-2xl font-semibold text-ink-900">Müşteri Yorumları</h2>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-ink-900 tabular-nums">
              {stats.average.toFixed(1)}
            </span>
            <span className="text-ink-500">/ 5</span>
          </div>

          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                weight="fill"
                className={
                  i < Math.round(stats.average)
                    ? "text-brand-500"
                    : "text-paper-200"
                }
              />
            ))}
            <span className="ml-1.5 text-sm text-ink-500">
              {stats.count} yorum
            </span>
          </div>

          {/* Dağılım */}
          <div className="mt-6 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = stats.distribution[star];
              const percent = (count / stats.count) * 100;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-ink-500 tabular-nums">{star}★</span>
                  <div className="flex-1 h-1.5 bg-paper-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-ink-500 tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Yorumlar listesi */}
        <div className="lg:col-span-8 space-y-5">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="p-5 bg-paper-50 border border-paper-200 rounded-xl"
            >
              <header className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-sm font-bold shrink-0">
                  {r.authorName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-ink-900">{r.authorName}</span>
                    {r.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded">
                        <ShieldCheck size={10} weight="fill" /> Doğrulanmış
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {r.authorCompany ?? r.authorRole ?? ""} · {formatDate(r.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      weight={i < r.rating ? "fill" : "regular"}
                      className={i < r.rating ? "text-brand-500" : "text-paper-200"}
                    />
                  ))}
                </div>
              </header>

              {r.title && (
                <h3 className="mt-3 font-semibold text-ink-900">{r.title}</h3>
              )}
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">{r.comment}</p>

              <footer className="mt-3 flex items-center gap-3 text-[11px] text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp size={11} /> {r.helpful} kişi faydalı buldu
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
