/**
 * gen-content-sql.ts — mock-data'daki ürün zengin içeriğini (features/useCases/specifications/
 * faqs/relatedSlugs/seo/brand/sku/rating) prod products tablosundaki `content` (jsonb) kolonuna
 * yazacak UPDATE ifadelerini üretir.
 *
 * GÜVENLİK: Bu script SADECE `content` kolonunu güncelleyen SQL üretir. Fiyat/isim/açıklama
 * dahil başka HİÇBİR kolona dokunmaz. Eşleştirme slug üzerinden yapılır.
 *
 * content nesnesinin şekli prisma/seed.ts ile birebir aynıdır (canonical kaynak):
 *   { features, useCases, specifications, faqs, relatedSlugs, seo, brand, sku, rating }
 * Her alan üründe varsa o değer, yoksa null.
 *
 * Çalıştırma:
 *   pnpm --filter @markala/api exec tsx prisma/gen-content-sql.ts > /tmp/content-updates.sql
 */
import { products } from "@markala/mock-data";

for (const p of products) {
  const pa = p as unknown as Record<string, unknown>;
  const content = {
    features: pa.features ?? null,
    useCases: pa.useCases ?? null,
    specifications: pa.specifications ?? null,
    faqs: pa.faqs ?? null,
    relatedSlugs: pa.relatedSlugs ?? null,
    seo: pa.seo ?? null,
    brand: pa.brand ?? null,
    sku: pa.sku ?? null,
    rating: pa.rating ?? null,
  };

  const json = JSON.stringify(content);
  const slug = p.slug;

  // Dollar-quoting: JSON içindeki tırnak/ters-eğik çizgi kaçışı derdi olmasın.
  // Etiketler ($JSON$, $SLUG$) JSON/slug içinde geçmediğinden çakışma riski yok.
  process.stdout.write(
    `UPDATE products SET content = $JSON$${json}$JSON$::jsonb WHERE slug = $SLUG$${slug}$SLUG$;\n`,
  );
}
