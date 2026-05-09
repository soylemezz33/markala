import { Container } from "@markala/ui";
import { Star, ShieldCheck, Quotes } from "@phosphor-icons/react/dist/ssr";
import { getFeaturedReviews } from "@/lib/reviews";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CustomerReviews() {
  const reviews = getFeaturedReviews(6);

  return (
    <section className="bg-paper-50 py-16 md:py-24 border-t border-paper-200">
      <Container>
        <div className="max-w-2xl mb-10 md:mb-14">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Müşteri Yorumları
          </p>
          <h2 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            12.000+ memnun müşteri
          </h2>
          <p className="mt-3 text-lg text-ink-700">
            Hepsi doğrulanmış sipariş — Trustpilot, Google Reviews ve doğrudan müşteri
            geri bildirimleri.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="p-6 bg-paper-50 border border-paper-200 rounded-xl flex flex-col hover:border-ink-300 hover:shadow-md transition-all"
            >
              <Quotes size={20} weight="fill" className="text-brand-500" />

              <div className="mt-3 flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    weight={i < r.rating ? "fill" : "regular"}
                    className={i < r.rating ? "text-brand-500" : "text-paper-200"}
                  />
                ))}
              </div>

              {r.title && (
                <h3 className="mt-3 font-semibold text-ink-900 text-base">{r.title}</h3>
              )}
              <p className="mt-2 text-sm text-ink-700 leading-relaxed line-clamp-5 flex-1">
                {r.comment}
              </p>

              <div className="mt-5 pt-4 border-t border-paper-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-sm font-bold">
                  {r.authorName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-ink-900 truncate">
                      {r.authorName}
                    </span>
                    {r.verified && (
                      <ShieldCheck
                        size={12}
                        weight="fill"
                        className="text-success shrink-0"
                        aria-label="Doğrulanmış sipariş"
                      />
                    )}
                  </div>
                  <div className="text-[11px] text-ink-500 truncate">
                    {r.authorCompany ?? r.authorRole ?? formatDate(r.createdAt)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Trust summary */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
          <Stat value="4.8" label="ortalama puan" sub="2.450 yorum" />
          <Stat value="%97" label="memnuniyet" sub="son 12 ay" />
          <Stat value="12.000+" label="müşteri" sub="Türkiye geneli" />
          <Stat value="48 saat" label="ortalama teslim" sub="Mersin & çevresi" />
        </div>
      </Container>
    </section>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-semibold text-ink-900 tabular-nums">
        {value}
      </div>
      <div className="text-sm text-ink-700">{label}</div>
      <div className="text-[11px] text-ink-500 mt-0.5">{sub}</div>
    </div>
  );
}
