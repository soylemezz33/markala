/**
 * İş güvenliği kataloğu importu (idempotent, upsert-by-slug).
 *
 * Çalıştırma (prod, api container içinde — @prisma/client /app/node_modules'tan çözülür):
 *   docker cp import-safety-catalog.cjs  markala-api:/tmp/import-safety-catalog.cjs
 *   docker cp safety-catalog-import.json markala-api:/tmp/safety-catalog-import.json
 *   docker exec -w /app markala-api node /tmp/import-safety-catalog.cjs /tmp/safety-catalog-import.json
 *
 * Veri dosyası (safety-catalog-import.json) C:/tmp/safety-catalog-build.mjs ile üretilir.
 * Mevcut kayıtlara DOKUNMAZ (create-if-missing) — admin elle düzenlemeleri korunur.
 */
const fs = require("node:fs");
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const jsonPath = process.argv[2] || "/tmp/safety-catalog-import.json";
  const { categories, products } = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`[katalog] Veri: ${categories.length} kategori, ${products.length} ürün (${jsonPath})`);

  // 1) Kategoriler — upsert; mevcutsa dokunma.
  const catIdBySlug = {};
  for (const c of categories) {
    const res = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        name: c.name,
        shortDescription: c.shortDescription,
        longDescription: c.longDescription,
        imageUrl: c.imageUrl,
        accentColor: c.accentColor ?? null,
        startingPrice: new Prisma.Decimal(c.startingPrice ?? 0),
        productionTime: c.productionTime,
        sortOrder: c.sortOrder ?? 0,
        isActive: c.isActive ?? true,
      },
    });
    catIdBySlug[c.slug] = res.id;
  }
  console.log(`[katalog] Kategori upsert tamam (${categories.length}).`);

  // 2) Ürünler — create-if-missing (mevcut admin düzenlemelerini ezme).
  let created = 0;
  let skipped = 0;
  let i = 0;
  for (const p of products) {
    const categoryId = catIdBySlug[p.categorySlug];
    if (!categoryId) {
      console.warn(`[katalog] ATLANDI (kategori yok): ${p.slug} → ${p.categorySlug}`);
      skipped++;
      continue;
    }
    const existing = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
    if (existing) {
      skipped++;
    } else {
      await prisma.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          categoryId,
          shortDescription: p.shortDescription,
          description: p.description,
          basePrice: new Prisma.Decimal(p.basePrice ?? 0),
          startingPrice: p.startingPrice != null ? new Prisma.Decimal(p.startingPrice) : null,
          productionTime: p.productionTime,
          images: p.images ?? [],
          badges: p.badges ?? [],
          bestseller: p.bestseller ?? false,
          isActive: p.isActive ?? true,
          parameters: p.parameters ?? [],
          content: p.content ?? Prisma.JsonNull,
        },
      });
      created++;
    }
    if (++i % 100 === 0) console.log(`[katalog] ${i}/${products.length}… (yeni ${created}, atlanan ${skipped})`);
  }

  console.log(`[katalog] BİTTİ. Ürün: yeni ${created}, atlanan(mevcut) ${skipped}, toplam ${products.length}.`);
}

main()
  .catch((e) => {
    console.error("[katalog] HATA:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
