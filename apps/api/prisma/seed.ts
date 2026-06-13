import { PrismaClient, Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import { categories as mockCategories, products as mockProducts, heroSlides } from "@markala/mock-data";

const prisma = new PrismaClient();

async function main() {
  // === Adminler ===
  await prisma.user.upsert({
    where: { email: "admin@markala.com.tr" },
    update: {},
    create: {
      email: "admin@markala.com.tr",
      passwordHash: await argon2.hash("ChangeMe123!"),
      fullName: "Markala Admin",
      role: "admin",
    },
  });
  await prisma.user.upsert({
    where: { email: "hasansylemezz@gmail.com" },
    update: { role: "super_admin" },
    create: {
      email: "hasansylemezz@gmail.com",
      passwordHash: await argon2.hash("Markala2026!"),
      fullName: "Hasan Söylemez",
      role: "super_admin",
    },
  });

  // === Örnek müşteriler (liste/dashboard boş görünmesin) ===
  const sampleCustomers = [
    { email: "ali@firma.com", fullName: "Ali Yıldız", phone: "+905330000000" },
    {
      email: "mehmet@kurumsal.com",
      fullName: "Mehmet Kara",
      phone: "+905340000000",
      accountType: "corporate" as const,
      companyName: "Kara Teknoloji A.Ş.",
    },
    { email: "zeynep@gmail.com", fullName: "Zeynep Aksoy", phone: "+905350000000" },
  ];
  for (const c of sampleCustomers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, passwordHash: await argon2.hash("Customer123!"), role: "customer" },
    });
  }

  // === Test kupon ===
  await prisma.coupon.upsert({
    where: { code: "HOSGELDIN" },
    update: {},
    create: { code: "HOSGELDIN", type: "percentage", value: 10, minOrderAmount: 0, isActive: true },
  });

  // === Kategoriler (mock-data) ===
  for (const [i, cat] of mockCategories.entries()) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        name: cat.name,
        shortDescription: cat.shortDescription,
        longDescription: cat.longDescription,
        imageUrl: cat.imageUrl,
        accentColor: cat.accentColor,
        startingPrice: new Prisma.Decimal(cat.startingPrice),
        productionTime: cat.productionTime,
        sortOrder: i,
      },
    });
  }

  // === Ürünler (mock-data) — categorySlug ile bağla ===
  let productCount = 0;
  for (const p of mockProducts) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (!category) {
      console.warn(`⚠ Ürün ${p.slug} için kategori bulunamadı: ${p.categorySlug} — atlanıyor`);
      continue;
    }
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        categoryId: category.id,
        shortDescription: p.shortDescription,
        description: p.description,
        basePrice: new Prisma.Decimal(p.basePrice),
        startingPrice: p.startingPrice !== undefined ? new Prisma.Decimal(p.startingPrice) : null,
        productionTime: p.productionTime,
        sizeLabel: p.sizeLabel ?? null,
        images: p.images ?? [],
        badges: (p as { badges?: string[] }).badges ?? [],
        bestseller: (p as { bestseller?: boolean }).bestseller ?? false,
        parameters: ((p as { parameters?: unknown }).parameters ?? []) as Prisma.InputJsonValue,
      },
    });
    productCount++;
  }

  // === Hero slides (mock-data) ===
  for (const [i, s] of heroSlides.entries()) {
    await prisma.heroSlide.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        title: s.title,
        subtitle: s.description,
        imageUrl: s.productImage,
        ctaLabel: s.ctaLabel,
        ctaHref: s.ctaHref,
        sortOrder: i,
      },
    });
  }

  // === Temel site ayarları ===
  const settings: Array<{ key: string; group: string; value: Prisma.InputJsonValue }> = [
    { key: "general.siteName", group: "general", value: "Markala" },
    { key: "general.siteUrl", group: "general", value: "https://markala.com.tr" },
    { key: "general.companyName", group: "general", value: "324 Ajans" },
    { key: "general.taxOffice", group: "general", value: "Yenişehir VD" },
    { key: "general.taxNumber", group: "general", value: "4270601001" },
    { key: "seo.defaultTitle", group: "seo", value: "Markala — Matbaa & Reklam Ürünleri" },
    { key: "seo.defaultDescription", group: "seo", value: "Online matbaa ve reklam ürünleri." },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    });
  }

  console.log("✅ Seed tamamlandı:", {
    admins: 2,
    customers: sampleCustomers.length,
    categories: mockCategories.length,
    products: productCount,
    heroSlides: heroSlides.length,
    settings: settings.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
