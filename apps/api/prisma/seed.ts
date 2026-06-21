import { PrismaClient, Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import { categories as mockCategories, products as mockProducts, heroSlides } from "@markala/mock-data";

const prisma = new PrismaClient();

/**
 * Idempotent seed (upsert) — tekrar çalıştırma güvenli.
 * Kategoriler + ürünler @markala/mock-data'dan basılır; canlı DB şu anki mock görünümle eşleşsin.
 * NOT: Product modelinde SEO/içerik alanları (features, faqs, specifications, useCases, seo)
 * YOK — bunlar web'de hâlâ mock-data'dan render edilir. DB konfigüratör (parameters) + ticari
 * alanları (fiyat/stok/aktiflik) tutar.
 */
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
    const pa = p as unknown as Record<string, unknown>;
    // SEO/zengin içerik — storefront ürün sayfası bunları gösterir (mock-data'dan API'ye taşınıyor).
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
    } as unknown as Prisma.InputJsonValue;
    await prisma.product.upsert({
      where: { slug: p.slug },
      // Mevcut ürünlere content + güncel fiyatı ekle (admin elle düzenlemediyse güvenli).
      update: {
        content,
        basePrice: new Prisma.Decimal(p.basePrice),
        startingPrice: p.startingPrice !== undefined ? new Prisma.Decimal(p.startingPrice) : null,
      },
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
        content,
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

  // === Blog kategorileri + gerçek yazılar (web/src/lib/blog.ts MOCK ile eşleşir) ===
  // İDEMPOTENT: upsert (slug benzersiz) — tekrar çalıştırınca duplicate olmaz, mevcut veri korunur.
  // status:"published" + publishedAt set → public /blog/public/* endpoint'lerinde görünür.
  const blogCats = [
    {
      slug: "rehber",
      name: "Rehberler",
      description:
        "Matbaa ve baskı süreçlerinde sıkça karşılaşılan soruların adım adım rehberleri.",
      sortOrder: 1,
    },
    {
      slug: "tasarim",
      name: "Tasarım İpuçları",
      description:
        "Profesyonel görünen baskıya hazırlık için renk, tipografi ve dosya hazırlama ipuçları.",
      sortOrder: 2,
    },
    {
      slug: "sektor",
      name: "Sektör Haberleri",
      description: "Matbaa, reklam ve kurumsal kimlik dünyasından güncel gelişmeler.",
      sortOrder: 3,
    },
    {
      slug: "vaka-calismasi",
      name: "Vaka Çalışmaları",
      description: "Markala müşterilerinin başarı hikayeleri ve önce/sonra örnekler.",
      sortOrder: 4,
    },
  ];
  for (const bc of blogCats) {
    await prisma.blogCategory.upsert({
      where: { slug: bc.slug },
      update: { name: bc.name, description: bc.description, sortOrder: bc.sortOrder },
      create: bc,
    });
  }

  // categorySlug → categoryId çözümü (yazılar kategoriye slug ile bağlanır).
  const blogCatBySlug = new Map<string, string>();
  for (const bc of blogCats) {
    const row = await prisma.blogCategory.findUnique({ where: { slug: bc.slug } });
    if (row) blogCatBySlug.set(bc.slug, row.id);
  }

  // coverImage = mock coverTheme STRING'i (örn. "card"/"brochure"); web blogCoverSrc() bunu
  // /api/mockup?theme=<değer> görseline çevirir → URL gerekmez.
  const blogPosts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImage: string;
    authorName: string;
    authorRole: string;
    categorySlug: string;
    tags: string[];
    readingTime: number;
    seoTitle?: string;
    seoDescription?: string;
  }> = [
    {
      slug: "kartvizit-tasarim-rehberi-2026",
      title: "2026'da Etkili Kartvizit Tasarımı: Adım Adım Rehber",
      excerpt:
        "Modern bir kartvizit hem ilk izlenimi belirler hem markanın profesyonelliğini yansıtır. Boyut, kağıt seçimi, tipografi ve baskı tekniklerinde dikkat etmeniz gereken her şey.",
      coverImage: "card",
      authorName: "Hasan Söylemez",
      authorRole: "324 Ajans · Marka Yöneticisi",
      categorySlug: "rehber",
      tags: ["kartvizit", "tasarım", "rehber", "matbaa"],
      readingTime: 8,
      seoTitle: "Etkili Kartvizit Tasarımı 2026 — Boyut, Kağıt, Renk Rehberi",
      seoDescription:
        "Profesyonel kartvizit nasıl tasarlanır? Standart boyutlar, kağıt türleri (300-600gr), CMYK renk yönetimi, taşma payı, selefon/UV lak farkı. Markala matbaa rehberi.",
      content: `## Kartvizit Hâlâ Önemli mi?

LinkedIn, dijital QR kodlar ve NFC teknolojisi yaygınlaşırken kartvizitin "öldüğü" söylemi yanıltıcıdır. 2025 İSO araştırmasına göre B2B satış görüşmelerinin **%73'ünde** hâlâ fiziksel kartvizit kullanılıyor. Sebep basit: doğru kâğıt + doğru baskı, hafızada kalıcılığı dijital iletişimden 4 kat artırıyor.

## Standart Boyutlar

Türkiye'de kullanılan başlıca kartvizit boyutları:

| Boyut | mm | Kullanım |
|---|---|---|
| **Klasik** | 85 × 55 | Türkiye'de en yaygın, pratik |
| **Avrupa** | 85 × 54 | AB normu, ince tasarımlar için |
| **Amerikan** | 89 × 51 | Daha geniş, infografik kartlar |
| **Mini** | 70 × 28 | Etiket / aksesuar kartlar |

Standart boyut dışında üretim mümkün ama maliyet **%30-50** artar — özel ihtiyaç yoksa standartta kalın.

## Kağıt Seçimi: Gramaj ve Doku

**Gramaj**, kağıdın metrekare ağırlığı:

- **300 gr Mat Kuşe** — en çok tercih edilen, hem ekonomik hem dolgun his
- **350 gr Bristol** — daha sert, kurumsal
- **400-600 gr Lüks Karton** — premium markalar için
- **Kraft / Geri Dönüştürülmüş** — sürdürülebilirlik vurgusu

Doku tercihleri:

- **Selefonlu (Mat/Parlak)** — leke ve çizilmeye dayanıklı
- **UV Lak** — logo veya isim üzerinde **lokal vurgu**, dramatik etki
- **Yaldız (Altın/Gümüş)** — kuyumculuk, butik, premium hizmetler
- **Gofre / Kabartma** — dokunsal hissiyat

> **İpucu:** Selefonlu kartvizitin üzerine yazı yazmak isteyenler "yazılabilir mat selefon" tercih etmeli. Standart parlak selefonda mürekkep tutmaz.

## Renk: CMYK ile Çalışın

Ekran RGB, baskı **CMYK**. Tasarımınızı RGB'de yapıp dönüştürürseniz canlı kırmızılar matlaşır, parlak maviler kararır. Adobe Illustrator/Photoshop'ta dosya açarken "CMYK Color" seçin.

Sık yapılan hata: **#000000 yerine** zengin siyah (Rich Black) kullanın — C:60 M:40 Y:40 K:100. Düz K:100 baskıda donuk gri görünür.

## Taşma Payı (Bleed)

85×55 kartınız varsa kesim sırasında 1-2mm sapma olur. Bu yüzden tasarımı **87×57 mm** olarak hazırlayın, kenarlardan 2mm taşma payı bırakın. Kritik metinler (telefon, e-posta) kenardan **5mm içeride** olmalı.

## Dosya Formatı

- **PDF/X-1a** (önerilen) — hazır baskı standardı
- **AI / EPS** — vektörel düzenlenebilir
- **TIFF / PDF (300 dpi)** — fotoğraf ağırlıklı tasarımlar

JPEG göndermeyin — sıkıştırma kayıpları metni bulanıklaştırır.

## Tipografi: Okunabilirlik Önce

- Yazı tipi maksimum 2 farklı font ailesi
- İsim için 10-12pt, unvan için 8-9pt
- Telefon/e-posta için **tabular nums** (sayılar eşit hizalı)
- Tüm büyük harf yerine "title case" daha okunaklı

## Baskı Adedi: Ne Kadar Bastırmalı?

| Kullanım | Önerilen Adet |
|---|---|
| Yeni başlayan freelancer | 100-250 |
| Aktif satış temsilcisi | 500-1.000 |
| Etkinlik / fuar | 1.000-2.500 |
| Kurumsal yıllık ihtiyaç | 2.500-5.000 |

**500'ün altı zaten birim maliyeti bozar** — minimum 1.000 ile başlamak en mantıklı.

## Markala'da Kartvizit Sipariş Süreci

1. [Klasik Kartvizit](/urun/klasik-kartvizit) sayfasına gir
2. Paket (selefonlu/UV/yaldız) ve adet seç
3. Tasarım dosyanı yükle ya da ücretsiz tasarım talep et
4. Onay sonrası 1-2 iş günü içinde üretim, DHL ile kapına teslim

Sorularınız için [WhatsApp](https://wa.me/905319004102) ya da [yardım merkezi](/yardim).`,
    },
    {
      slug: "cmyk-rgb-fark-baski-renk-yonetimi",
      title: "CMYK vs RGB: Baskıda Doğru Renk Yönetimi",
      excerpt:
        "Ekrandaki canlı renkler neden baskıda solgun çıkar? CMYK-RGB farkı, profil dönüşümü, Pantone sistemi ve sık yapılan renk hataları.",
      coverImage: "brochure",
      authorName: "324 Ajans Tasarım Ekibi",
      authorRole: "Markala İçerik",
      categorySlug: "tasarim",
      tags: ["cmyk", "rgb", "renk", "tasarım", "pantone"],
      readingTime: 6,
      seoTitle: "CMYK vs RGB Farkı — Baskı Renk Yönetimi Rehberi",
      seoDescription:
        "Ekrandaki canlı renkler baskıda neden değişir? CMYK ile RGB arasındaki fark, Pantone, profil dönüşümü ve renk uyumu kontrol listesi.",
      content: `## Renk Algısı Cihaza Göre Değişir

**RGB** (Red-Green-Blue): Işık karışımı. Ekranlar piksel başına 3 ışık kaynağı kullanır.
**CMYK** (Cyan-Magenta-Yellow-Key/Black): Pigment karışımı. Matbaa makineleri kâğıda 4 mürekkep katmanı bırakır.

İki sistem farklı **renk uzayı** kapsar. RGB ekranda görebileceğiniz parlak fosforlu yeşili, CMYK pigmenti üretemez. Bu yüzden ekranda görülen %100 renk doygunluğu baskıda %75-80'e düşebilir.

## En Sık Karşılaşılan Hatalar

### 1. RGB'de tasarım, CMYK'ya son anda dönüşüm
Adobe'da "Convert to CMYK" tek tıkla çalışır ama sonuç **tahmin edilemez**. Tasarıma CMYK profilinde başlayın.

### 2. Düz Siyah (K:100)
Düşük gramajlı kâğıtta donuk gri görünür. Çözüm: **Rich Black** — C:60 M:40 Y:40 K:100.

### 3. Pantone'u CMYK olarak kullanmak
Pantone (PMS) **özel mürekkep** sistemidir. Logo / kurumsal renkleriniz Pantone tanımlıysa baskıyı **5+1 renk** modunda yaptırın (CMYK + Pantone). Tek başına CMYK'ya çevirmek %15-20 sapma yaratır.

### 4. Resim çözünürlüğü
Web için 72 dpi kabul edilebilir, baskıda **300 dpi** zorunlu. 1000×1000 px görsel A4'te bulanık çıkar.

## Renk Profili (ICC) Yönetimi

Türkiye'de matbaaların büyük çoğunluğu **ISO Coated v2 (ECI)** profili kullanır. Bu profili Adobe ürünlerine eklemek:

1. eci.org → "Downloads" → "ICC profiles"
2. Windows: \`C:\\Windows\\System32\\spool\\drivers\\color\\\`
3. Photoshop: Edit > Color Settings > "ISO Coated v2 (ECI)" seç

## Onay Süreci: Hard Proof vs Soft Proof

- **Soft proof**: Ekranda CMYK simülasyonu (%85 doğruluk)
- **Hard proof**: Matbaadan gelen test baskı (%99 doğruluk, kritik işlerde **mutlaka** isteyin)

Markala'da kurumsal kimlik baskılarında hard proof ücretsiz, dijital baskılarda 25 ₺.

## Hazırlık Kontrol Listesi

- [ ] CMYK renk modu seçili
- [ ] 300 dpi minimum çözünürlük
- [ ] Yazılar dış hatlandırılmış (outline)
- [ ] 2-3 mm taşma payı bırakılmış
- [ ] Pantone renkler ayrı kanalda
- [ ] PDF/X-1a olarak export
- [ ] Renk profili gömülü (Embed Color Profile)

Sorularınız için [Dosya Hazırlama Rehberi](/yardim/dosya-hazirlama).`,
    },
    {
      slug: "kurumsal-kimlik-tasarim-paketi-ne-icermelidir",
      title: "Kurumsal Kimlik Tasarım Paketi Ne İçermeli?",
      excerpt:
        "Yeni kurulan firma ya da rebrand yapan marka için kurumsal kimlik paketinde neler olmalı? Logo, kartvizit, antetli kağıt, zarf ve dijital varlıklar.",
      coverImage: "brochure",
      authorName: "Hasan Söylemez",
      authorRole: "324 Ajans · Marka Yöneticisi",
      categorySlug: "rehber",
      tags: ["kurumsal kimlik", "marka", "logo", "rebrand"],
      readingTime: 7,
      content: `## Kurumsal Kimlik = Markanın Kıyafeti

Logonuz markanızın yüzü; kurumsal kimlik **bütün gardrobu**. Dağınık bir kimlik, ne kadar iyi ürün satarsanız satın markanın profesyonelliğini düşürür. İşte minimum içermesi gerekenler:

## 1. Logo Sistemi (Öncelik 1)

- **Ana logo** (renkli) — pozitif zemin
- **Beyaz/Tek renk versiyon** — koyu zemin için
- **Yatay + Dikey** varyantlar
- **İkon-only** — favicon, sosyal medya avatarı için
- **Vektörel formatlar**: AI, EPS, SVG (her zaman dosyada bulunsun)
- **Raster formatlar**: PNG (transparent), JPG (web)

## 2. Renk Paleti

- **Ana renk** (1-2 adet, marka kimliği)
- **Yardımcı renkler** (3-4 adet, hiyerarşi için)
- **Nötr tonlar** (siyah/beyaz/gri varyantları)
- Her renk için: **HEX, RGB, CMYK, Pantone** kodları

## 3. Tipografi Sistemi

- **Başlık fontu** — kurumsal güç ifadesi
- **Metin fontu** — okunabilirlik
- Genelde 2, en fazla 3 font ailesi

## 4. Basılı Materyaller

| Materyal | Standart Boyut | Adet (Başlangıç) |
|---|---|---|
| Kartvizit | 85×55 mm | 500-1.000 |
| Antetli kağıt | A4 | 500 |
| Zarf | DL veya Kare | 500 |
| Klasör/Cepli Dosya | A4 sığar | 100-250 |
| Faks formu | A4 | 250 |

## 5. Dijital Varlıklar

- E-posta imzası (HTML)
- Sosyal medya kapak görselleri (Instagram, LinkedIn)
- Sunum şablonu (PowerPoint/Keynote)
- Logo animasyonu (kısa intro/outro)

## 6. Marka Kuralları (Brand Guidelines)

PDF olarak hazırlanan, **20-40 sayfa** içeren rehber:

- Logo kullanım kuralları (yasak yapılar dahil)
- Renk paleti kodları
- Tipografi hiyerarşisi
- Fotoğraf/illüstrasyon stili
- Ses/iletişim tonu

## Maliyet Aralıkları (2026 Türkiye)

| Paket | İçerik | Yaklaşık Bütçe |
|---|---|---|
| **Mini** | Logo + kartvizit + antetli | 8.000-15.000 ₺ |
| **Standart** | + zarf + e-posta imza + sosyal medya | 18.000-35.000 ₺ |
| **Pro** | + brand guideline + sunum + animasyon | 40.000-90.000 ₺ |
| **Enterprise** | Tam rebrand + photoshoot | 100.000 ₺+ |

## Markala + 324 Ajans

Markala matbaa ürünlerini, 324 Ajans tasarım & marka stratejisini sağlar. Birlikte:

- Logoyu sıfırdan tasarlayalım
- Markala'da basılı materyalleri %15 ek indirimle bastıralım
- Marka kullanım kılavuzunu ekibinize teslim edelim

[Kurumsal hesap başvurusu](/kurumsal/basvuru) ile bu paket bedava ön görüşme + bütçeli teklif alırsınız.`,
    },
    {
      slug: "matbaa-toleransi-fire-payi-nedir",
      title: "Matbaa Üretim Toleransı (%1-5 Fire) Nedir, Neden Vardır?",
      excerpt:
        "Sipariş 1.000 dedik, 980 geldi. Bu firmanın hatası mı? Matbaa sektöründeki standart üretim toleransı, sebepleri ve müşteri olarak haklarınız.",
      coverImage: "brochure",
      authorName: "Hasan Söylemez",
      authorRole: "324 Ajans",
      categorySlug: "sektor",
      tags: ["matbaa", "tolerans", "fire", "üretim"],
      readingTime: 4,
      content: `## Matbaa Toleransı Nedir?

Türkiye matbaa sektöründe **TSE / ISO standartlarına uygun** olarak %1-5 arası adet ve renk farkı kabul edilir. Bu, "kötü işçilik" değil; **kâğıt-mürekkep-makine fiziği** sonucu doğal bir durumdur.

## Neden Oluşur?

### 1. Kesim Toleransı
Forma kâğıttan kesim sırasında 1-2 mm sapma olur. Kritik kenarlarda kullanılan ürünler fire çıkar.

### 2. Renk Kalibrasyonu
Aynı dosya farklı makinelerde, farklı sıcaklık/nem koşullarında **%2-3 ton farkı** üretebilir. Pantone bile %100 garanti vermez.

### 3. Kağıt Kayıpları
Ofset baskıda ilk birkaç forma "ayar baskı" olarak gider — renk dengeleme. Dijital baskıda bu yok ama yerini **toner farkı** alır.

### 4. Kalite Kontrol Eleme
Üretim sonrası KKK ekibi defolu (lekeli, kayık, çizik) ürünleri ayıklar. Bu da fire kapsamına girer.

## Müşteri Olarak Haklarınız

- **%1-5 fire normaldir**, ek ücret talep edilemez (bu sektörel standarttır, [Mesafeli Satış Sözleşmemizde](/yasal/mesafeli-satis) açıkça belirtilmiştir)
- **%5'i geçen** eksik gönderimde, eksik miktar ücretsiz yeniden basılır veya bedeli iade edilir
- Ürün **kullanılamaz** durumdaysa (yanlış kesim, hatalı renk) ücretsiz yeniden üretim hakkınız vardır

## Markala'da Süreç

1. Sipariş alımında "kabul edilen tolerans %1-5" maddesi onaylanır
2. Üretim sonrası KKK fotoğraflı kayıt tutar
3. Eksik adetlerde: **1.000 sipariş → 980-1.020 arası** teslim edilir
4. Şikayet durumunda 48 saat içinde fotoğraflı tutanak

## Sıfır Fire Mümkün mü?

Teorik olarak evet, ama:

- **+%30-50 maliyet** (extra forma + extra QC personeli)
- Üretim süresi **2 katına** çıkar
- Renk garantisi için **hard proof + onay** süreci eklenir

Bunu isteyen kurumsal müşteriler "**SLA garantili kurumsal sipariş**" paketi seçebilir. Standart teklifte bu yok.

## Özet

%1-5 fire, ev aldığınız evdeki "imar hattı" gibi: önceden bildiğiniz, sözleşmede yazılı bir sınırlamadır. Bunu bilen müşteri 1.000 yerine **1.050 sipariş geçer**, gerçek ihtiyacının altına düşmez.

Detaylı bilgi: [İade & Değişim Politikası](/yasal/iade) · [Kargo & Teslimat](/yardim/kargo)`,
    },
  ];

  for (const bp of blogPosts) {
    const { categorySlug, ...rest } = bp;
    const categoryId = blogCatBySlug.get(categorySlug) ?? null;
    await prisma.blogPost.upsert({
      where: { slug: bp.slug },
      update: {
        title: rest.title,
        excerpt: rest.excerpt,
        content: rest.content,
        coverImage: rest.coverImage,
        authorName: rest.authorName,
        authorRole: rest.authorRole,
        categoryId,
        tags: rest.tags,
        status: "published",
        seoTitle: rest.seoTitle ?? null,
        seoDescription: rest.seoDescription ?? null,
        readingTime: rest.readingTime,
        publishedAt: new Date(),
      },
      create: {
        slug: rest.slug,
        title: rest.title,
        excerpt: rest.excerpt,
        content: rest.content,
        coverImage: rest.coverImage,
        authorName: rest.authorName,
        authorRole: rest.authorRole,
        categoryId,
        tags: rest.tags,
        status: "published",
        seoTitle: rest.seoTitle ?? null,
        seoDescription: rest.seoDescription ?? null,
        readingTime: rest.readingTime,
        publishedAt: new Date(),
      },
    });
  }

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
    blogPosts: blogPosts.length,
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
