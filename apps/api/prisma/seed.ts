import { PrismaClient, Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import { categories as mockCategories, products as mockProducts, heroSlides } from "@markala/mock-data";

const prisma = new PrismaClient();

async function main() {
  // GÜVENLİK: Bu seed yalnızca geliştirme/test içindir. Prod'a karşı yanlışlıkla
  // çalıştırılmasını engelle — gerçek kullanıcı/şifre basmaz, rol zorlamaz.
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PRODUCTION_SEED) {
    throw new Error(
      "Bu seed production'da çalıştırılamaz. Gerekiyorsa ALLOW_PRODUCTION_SEED=1 ile bilinçli çalıştır.",
    );
  }

  // === Super admin (env'den okunur; dev varsayılanı GERÇEK kimlik değildir) ===
  const superAdminEmail = process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@markala.local";
  const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD ?? "DevAdmin!2026";
  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {}, // mevcut hesabın rolünü ZORLAMA (privilege escalation önlemi)
    create: {
      email: superAdminEmail,
      passwordHash: await argon2.hash(superAdminPassword),
      fullName: "Markala Super Admin",
      role: "super_admin",
    },
  });

  // === Demo admin + örnek müşteriler — YALNIZCA SEED_DEMO=1 ile (prod'da ASLA) ===
  // Bilinen şifreli (DevAdmin!2026 / Customer123!) hesaplar GÜVENLİK AÇIĞI; prod'da oluşturulmaz.
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
  const seedDemo = process.env.SEED_DEMO === "1";
  if (seedDemo) {
    await prisma.user.upsert({
      where: { email: "admin@markala.local" },
      update: {},
      create: {
        email: "admin@markala.local",
        passwordHash: await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? "DevAdmin!2026"),
        fullName: "Markala Admin",
        role: "admin",
      },
    });
    for (const c of sampleCustomers) {
      await prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: { ...c, passwordHash: await argon2.hash("Customer123!"), role: "customer" },
      });
    }
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

  // === Blog kategorileri + örnek yazı ===
  const blogCats = [
    { slug: "rehber", name: "Rehber", sortOrder: 1 },
    { slug: "karsilastirma", name: "Karşılaştırma", sortOrder: 2 },
    { slug: "sektor", name: "Sektör", sortOrder: 3 },
  ];
  for (const bc of blogCats) {
    await prisma.blogCategory.upsert({ where: { slug: bc.slug }, update: {}, create: bc });
  }
  const rehber = await prisma.blogCategory.findUnique({ where: { slug: "rehber" } });
  await prisma.blogPost.upsert({
    where: { slug: "kartvizit-tasariminda-10-kritik-detay" },
    update: {},
    create: {
      slug: "kartvizit-tasariminda-10-kritik-detay",
      title: "Kartvizit Tasarımında 10 Kritik Detay",
      excerpt: "Profesyonel bir kartvizit için dikkat edilmesi gereken tasarım ve baskı detayları.",
      content: "Kartvizit, markanızın elden ele dolaşan en küçük ama en etkili tanıtım aracıdır...",
      authorName: "Hasan Söylemez",
      categoryId: rehber?.id ?? null,
      tags: ["kartvizit", "tasarım"],
      status: "draft",
    },
  });

  // === Faz 2: Banner örnekleri ===
  const banners = [
    { id: "ban_hero_welcome", title: "İlk Sipariş %10", location: "hero", imageUrl: "/api/mockup?slug=hero-welcome&w=1600&h=600", ctaLabel: "ALIŞVERİŞE BAŞLA", ctaHref: "/kampanyalar", sortOrder: 1 },
    { id: "ban_cart_ramazan", title: "Ramazan Kampanya", location: "cart", imageUrl: "/api/mockup?slug=ramazan&w=1200&h=300", ctaLabel: "KAMPANYAYI GÖR", ctaHref: "/kampanyalar", sortOrder: 2, isActive: false },
  ];
  for (const b of banners) {
    await prisma.banner.upsert({ where: { id: b.id }, update: {}, create: b });
  }

  // === Faz 2: SSS örnekleri ===
  const faqs = [
    { id: "faq_dosya", question: "Tasarım dosyamı hangi formatta göndermeliyim?", answer: "PDF (baskıya hazır, CMYK, 3mm taşma payı) tercih edilir. AI, PSD ve yüksek çözünürlüklü JPG de kabul edilir.", category: "tasarim", sortOrder: 1 },
    { id: "faq_selefon", question: "Selefon ile UV lak farkı nedir?", answer: "Selefon tüm yüzeyi kaplar; UV lak ise seçili bölgelere parlaklık verir.", category: "urun", productSlug: "klasik-kartvizit", sortOrder: 2 },
    { id: "faq_kargo", question: "Kaç günde elime ulaşır?", answer: "Üretim süresi + 1-3 iş günü kargo. Ürün sayfasında belirtilen üretim süresine kargo eklenir.", category: "kargo", sortOrder: 3 },
  ];
  for (const f of faqs) {
    await prisma.faq.upsert({ where: { id: f.id }, update: {}, create: f });
  }

  // === Faz 2: Yasal sayfalar ===
  const legals = [
    { slug: "kvkk", title: "KVKK Aydınlatma Metni", content: "<p>6698 sayılı KVKK kapsamında kişisel verileriniz...</p>", version: "v3.1" },
    { slug: "mesafeli-satis", title: "Mesafeli Satış Sözleşmesi", content: "<p>İşbu sözleşme mesafeli satışlara ilişkin...</p>", version: "v2.4" },
    { slug: "gizlilik", title: "Gizlilik İlkesi", content: "<p>Gizliliğiniz bizim için önemlidir...</p>", version: "v2.0" },
  ];
  for (const l of legals) {
    await prisma.legalPage.upsert({ where: { slug: l.slug }, update: {}, create: l });
  }

  // === Faz 2: Kampanya paketleri ===
  const packages = [
    { slug: "esnaf-baslangic", name: "Esnaf Başlangıç", category: "esnaf", contents: "1.000 kartvizit + 1 kaşe + 250 broşür", listPrice: new Prisma.Decimal(950), packagePrice: new Prisma.Decimal(749), sortOrder: 1 },
    { slug: "restoran-acilis", name: "Restoran Açılış", category: "acilis", contents: "Vinil branda + 2.000 menü + amerikan servis", listPrice: new Prisma.Decimal(6500), packagePrice: new Prisma.Decimal(4999), designSupport: true, sortOrder: 2 },
  ];
  for (const p of packages) {
    await prisma.campaignPackage.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  console.log("✅ Seed tamamlandı:", {
    admins: seedDemo ? 2 : 1,
    customers: seedDemo ? sampleCustomers.length : 0,
    categories: mockCategories.length,
    products: productCount,
    heroSlides: heroSlides.length,
    settings: settings.length,
    blogCategories: blogCats.length,
    blogPosts: 1,
    banners: banners.length,
    faqs: faqs.length,
    legalPages: legals.length,
    campaignPackages: packages.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
