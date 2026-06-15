import { PrismaClient, Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import { categories as mockCategories, products as mockProducts } from "@markala/mock-data";

const prisma = new PrismaClient();

/**
 * Idempotent seed (upsert) — tekrar çalıştırma güvenli.
 * Kategoriler + ürünler @markala/mock-data'dan basılır; canlı DB şu anki mock görünümle eşleşsin.
 * NOT: Product modelinde SEO/içerik alanları (features, faqs, specifications, useCases, seo)
 * YOK — bunlar web'de hâlâ mock-data'dan render edilir. DB konfigüratör (parameters) + ticari
 * alanları (fiyat/stok/aktiflik) tutar.
 */
async function main() {
  // === Admin kullanıcılar ===
  const adminPass = await argon2.hash("ChangeMe123!");
  await prisma.user.upsert({
    where: { email: "admin@markala.com.tr" },
    update: {},
    create: { email: "admin@markala.com.tr", passwordHash: adminPass, fullName: "Markala Admin", role: "admin" },
  });

  // Hasan — super_admin (kendi hesabıyla giriş). DEV şifresi; prod'da değiştir.
  const hasanPass = await argon2.hash("Markala2026!");
  await prisma.user.upsert({
    where: { email: "hasansylemezz@gmail.com" },
    update: { role: "super_admin" },
    create: { email: "hasansylemezz@gmail.com", passwordHash: hasanPass, fullName: "Hasan Söylemez", role: "super_admin" },
  });

  // === Test kupon ===
  await prisma.coupon.upsert({
    where: { code: "HOSGELDIN" },
    update: {},
    create: { code: "HOSGELDIN", type: "percentage", value: 10, minOrderAmount: 0, isActive: true },
  });

  // === Örnek kurumsal başvuru (bekleyen) — admin onay akışı demosu ===
  await prisma.corporateApplication.upsert({
    where: { id: "seed-corp-1" },
    update: {},
    create: {
      id: "seed-corp-1",
      companyName: "Örnek Reklam Ajansı Ltd. Şti.",
      taxOffice: "Mersin Kurumlar",
      taxNumber: "1234567890",
      sector: "Reklam & Tanıtım",
      annualVolume: "500.000 - 1.000.000 TL",
      contactName: "Örnek Yetkili",
      contactRole: "Satınalma Müdürü",
      email: "ornek@ajans.com.tr",
      phone: "+905001112233",
      address: "Yenişehir / Mersin",
      notes: "Aylık düzenli kartvizit + broşür ihtiyacı.",
      status: "pending",
    },
  });

  // === Kategoriler (mock-data) ===
  const slugToId = new Map<string, string>();
  let catN = 0;
  for (const [i, c] of mockCategories.entries()) {
    const data = {
      slug: c.slug,
      name: c.name,
      shortDescription: c.shortDescription,
      longDescription: c.longDescription,
      imageUrl: c.imageUrl,
      accentColor: c.accentColor ?? null,
      startingPrice: c.startingPrice,
      productionTime: c.productionTime,
      sortOrder: i,
      isActive: true,
    };
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: data, create: data });
    slugToId.set(c.slug, cat.id);
    catN++;
  }

  // === Ürünler (mock-data) ===
  let prodN = 0;
  const skipped: string[] = [];
  for (const p of mockProducts) {
    const categoryId = slugToId.get(p.categorySlug);
    if (!categoryId) {
      skipped.push(`${p.slug} (kategori: ${p.categorySlug})`);
      continue;
    }
    const data = {
      slug: p.slug,
      name: p.name,
      categoryId,
      shortDescription: p.shortDescription,
      description: p.description,
      basePrice: p.basePrice,
      startingPrice: p.startingPrice ?? p.basePrice,
      productionTime: p.productionTime,
      sizeLabel: p.sizeLabel ?? null,
      images: p.images ?? [],
      badges: (p.badges ?? []) as string[],
      bestseller: p.bestseller ?? false,
      ratingAverage: p.rating?.average ?? null,
      ratingCount: p.rating?.count ?? 0,
      parameters: (p.parameters ?? []) as unknown as Prisma.InputJsonValue,
      isActive: true,
    };
    await prisma.product.upsert({ where: { slug: p.slug }, update: data, create: data });
    prodN++;
  }

  console.log("✅ Seed tamamlandı:", {
    kategoriler: catN,
    urunler: prodN,
    atlanan: skipped.length ? skipped : "yok",
    admin: "admin@markala.com.tr / ChangeMe123!",
    superAdmin: "hasansylemezz@gmail.com / Markala2026! (DEV)",
    kupon: "HOSGELDIN (%10)",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
