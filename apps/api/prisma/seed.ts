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
    { key: "seo.defaultTitle", group: "seo", value: "Markala, Matbaa & Reklam Ürünleri" },
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
    {
      slug: "haber",
      name: "Haberler",
      description: "Matbaa, baskı ve reklam sektöründen güncel haberler ve gelişmeler.",
      sortOrder: 5,
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
      seoTitle: "Etkili Kartvizit Tasarımı 2026 | Boyut, Kağıt, Renk Rehberi",
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

Standart boyut dışında üretim mümkün ama maliyet **%30-50** artar, özel ihtiyaç yoksa standartta kalın.

## Kağıt Seçimi: Gramaj ve Doku

**Gramaj**, kağıdın metrekare ağırlığı:

- **300 gr Mat Kuşe**, en çok tercih edilen, hem ekonomik hem dolgun his
- **350 gr Bristol**, daha sert, kurumsal
- **400-600 gr Lüks Karton**, premium markalar için
- **Kraft / Geri Dönüştürülmüş**, sürdürülebilirlik vurgusu

Doku tercihleri:

- **Selefonlu (Mat/Parlak)**, leke ve çizilmeye dayanıklı
- **UV Lak**, logo veya isim üzerinde **lokal vurgu**, dramatik etki
- **Yaldız (Altın/Gümüş)**, kuyumculuk, butik, premium hizmetler
- **Gofre / Kabartma**, dokunsal hissiyat

> **İpucu:** Selefonlu kartvizitin üzerine yazı yazmak isteyenler "yazılabilir mat selefon" tercih etmeli. Standart parlak selefonda mürekkep tutmaz.

## Renk: CMYK ile Çalışın

Ekran RGB, baskı **CMYK**. Tasarımınızı RGB'de yapıp dönüştürürseniz canlı kırmızılar matlaşır, parlak maviler kararır. Adobe Illustrator/Photoshop'ta dosya açarken "CMYK Color" seçin.

Sık yapılan hata: **#000000 yerine** zengin siyah (Rich Black) kullanın, C:60 M:40 Y:40 K:100. Düz K:100 baskıda donuk gri görünür.

## Taşma Payı (Bleed)

85×55 kartınız varsa kesim sırasında 1-2mm sapma olur. Bu yüzden tasarımı **87×57 mm** olarak hazırlayın, kenarlardan 2mm taşma payı bırakın. Kritik metinler (telefon, e-posta) kenardan **5mm içeride** olmalı.

## Dosya Formatı

- **PDF/X-1a** (önerilen), hazır baskı standardı
- **AI / EPS**, vektörel düzenlenebilir
- **TIFF / PDF (300 dpi)**, fotoğraf ağırlıklı tasarımlar

JPEG göndermeyin, sıkıştırma kayıpları metni bulanıklaştırır.

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

**500'ün altı zaten birim maliyeti bozar**, minimum 1.000 ile başlamak en mantıklı.

## Markala'da Kartvizit Sipariş Süreci

1. [Klasik Kartvizit](/urun/klasik-kartvizit) sayfasına gir
2. Paket (selefonlu/UV/yaldız) ve adet seç
3. Tasarım dosyanı yükle ya da ücretsiz tasarım talep et
4. Onay sonrası 1-2 iş günü içinde üretim, DHL ile kapına teslim

Sorularınız için [WhatsApp](https://wa.me/905057417028) ya da [yardım merkezi](/yardim).`,
    },
    {
      slug: "cmyk-rgb-fark-baski-renk-yonetimi",
      title: "CMYK mi RGB mi? Baskı İçin Doğru Renk Modu Seçimi",
      excerpt:
        "Ekrandaki canlı renkler baskıda neden solar? CMYK ile RGB arasındaki temel fark, ICC profil yönetimi, Pantone kullanımı ve dosya teslim öncesi eksiksiz kontrol listesi.",
      coverImage: "brochure",
      authorName: "Markala Ekibi",
      authorRole: "Markala Blog Editörü",
      categorySlug: "tasarim",
      tags: ["cmyk", "rgb", "renk", "tasarım", "pantone", "baskı"],
      readingTime: 5,
      seoTitle: "CMYK mi RGB mi? Baskı İçin Doğru Renk Modu | Markala",
      seoDescription:
        "CMYK ve RGB farkı nedir, baskıda hangi renk modu kullanılmalı? ICC profil yönetimi, Pantone ve dosya hazırlama kontrol listesi.",
      content: `## CMYK mi RGB mi? Temel Fark

Renk iki farklı yöntemle üretilir: ışık karışımı ve pigment karışımı.

**RGB (Red-Green-Blue)** ışık karışımıdır. Ekranlar, monitör, telefon, tablet, kırmızı, yeşil ve mavi ışığı farklı yoğunluklarda birleştirerek renk üretir. Üç ışık bir araya gelince beyaz oluşur; hiçbiri yokken siyah. Bu yüzden RGB "eklenebilir" (additive) bir renk sistemidir.

**CMYK (Cyan-Magenta-Yellow-Key/Black)** pigment karışımıdır. Matbaa makineleri kağıda dört mürekkep katmanı bırakır: cam göbeği, eflatun, sarı ve siyah. Pigmentler ışığı emer; katmanlar birleşince daha koyu renkler elde edilir. Bu yüzden CMYK "çıkarmalı" (subtractive) bir renk sistemidir.

## Renk Gamı Farkı Neden Önemli?

RGB, CMYK'dan çok daha geniş bir renk yelpazesi kapsar. Ekranda gördüğünüz neon turuncu, fosforlu yeşil veya elektrik mavisi, mürekkep teknolojisiyle tam olarak üretilemeyebilir. Bu yüzden RGB tasarımınızı CMYK'ya dönüştürdüğünüzde bazı renkler matlaşır, bazıları ton değiştirir.

Dikkat gerektiren renkler:
- **Canlı maviler:** #0080FF tonu baskıda %20-30 soluklaşabilir.
- **Parlak kırmızılar ve turuncular:** Ekrandaki "neon" etki kaybolur.
- **Fosforlu yeşiller:** CMYK bu gamı üretemez; en yakın tona düşer.

## Tasarım Aşamasındaki Yaygın Hatalar

### Hata 1: RGB'de tasarım yapıp son anda CMYK'ya dönüştürmek
Tasarım programları RGB'den CMYK'ya otomatik dönüşüm yapar; ancak sonuç her zaman tahmin edilebilir değildir. Canlı tonlar beklentinin altında çıkabilir. **Doğrusu:** belgeyi baştan CMYK modunda açmak.

### Hata 2: Düz siyah (K:100) kullanmak
Sadece K:100 mürekkepten oluşan siyah, geniş alanlarda baskıda donuk gri görünür. Daha derin bir siyah için "zengin siyah" (Rich Black) formülü kullanılır: **C:60 M:40 Y:40 K:100**. Not: bu formülü ince metinlere uygulamayın, harfler kayar.

### Hata 3: Pantone renklerini CMYK olarak göndermek
Pantone (PMS), özel tek bileşenli mürekkepler kullanır. Markanızın logo rengi bir Pantone koduna sahipse ve baskıda tam renk uyumu kritikse, CMYK dönüşümü yeterli olmaz. Bu durumlarda 5+1 renkli (CMYK + Pantone) baskı yaptırın.

### Hata 4: Görsellerin çözünürlüğünü atlamak
Web için 72 DPI yeterlidir; baskıda **300 DPI** zorunludur. Düşük çözünürlüklü görsel, A4 boyutuna çekildiğinde pikselli görünür. Piksel ölçüsünden DPI hesabı: 3508 × 2480 piksel = A4 @ 300 DPI.

## ICC Renk Profili Yönetimi

Matbaalar, renklerini standart bir profil çerçevesinde kalibre eder. Türkiye'deki ofset matbaalar büyük çoğunlukla **ISO Coated v2 (ECI)** profilini kullanır. Bu profili Adobe uygulamalarına eklemek için:

1. [eci.org](https://www.eci.org) adresinden "ECI Offset" profil paketini indirin.
2. Windows: \`C:\\Windows\\System32\\spool\\drivers\\color\\\`
3. Photoshop/Illustrator: Edit > Color Settings > Working Spaces > CMYK > "ISO Coated v2 (ECI)" seçin.

Profil eşleştiğinde yazıcı ve ekran arasındaki renk farkı önemli ölçüde daralır.

## Soft Proof ve Hard Proof

- **Soft proof:** Ekranda CMYK simülasyonu görmektir. Adobe programlarında View > Proof Colors ile etkinleştirilir. Yaklaşık %85 doğrulukla fikir verir.
- **Hard proof:** Matbaanın gerçek makinesinde bir test baskısı alınır. Renk kritikliği yüksek işlerde (kurumsal kimlik, ambalaj) **mutlaka** isteyin. Markala'da kurumsal kimlik baskılarında hard proof ücretsiz, dijital baskılarda 25 ₺ ek ücretle sunulur.

## Dosya Teslim Öncesi Kontrol Listesi

- [ ] Belge renk modu CMYK olarak ayarlandı mı?
- [ ] Tüm görseller 300 DPI mi?
- [ ] Düz siyah gereken yerlerde K:100 yerine Rich Black kullanıldı mı?
- [ ] Pantone renkleri ayrı kanalda tanımlandı mı?
- [ ] Yazılar dış hat (outline) haline getirildi mi?
- [ ] 2-3 mm taşma payı bırakıldı mı?
- [ ] Renk profili gömülü PDF/X-1a olarak kaydedildi mi?

## Hangi Programda Çalışmalısınız?

- **Adobe Illustrator / InDesign:** Vektörel işler, kurumsal kimlik, broşür, CMYK desteği eksiksiz.
- **Adobe Photoshop:** Fotoğraf ağırlıklı işler, CMYK modunda çalışabilir.
- **Canva (ücretsiz):** Yalnızca RGB çıktı verir; profesyonel baskı için yeterli değildir.
- **Affinity Publisher/Designer:** CMYK desteği var, bütçe dostu bir alternatif.

Ayrıntılı teknik rehber için [Dosya Hazırlama Kılavuzu](/yardim/dosya-hazirlama) sayfasına göz atabilirsiniz. Sorularınız için [destek hattımıza](/iletisim) ulaşın.`,
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

- **Ana logo** (renkli), pozitif zemin
- **Beyaz/Tek renk versiyon**, koyu zemin için
- **Yatay + Dikey** varyantlar
- **İkon-only**, favicon, sosyal medya avatarı için
- **Vektörel formatlar**: AI, EPS, SVG (her zaman dosyada bulunsun)
- **Raster formatlar**: PNG (transparent), JPG (web)

## 2. Renk Paleti

- **Ana renk** (1-2 adet, marka kimliği)
- **Yardımcı renkler** (3-4 adet, hiyerarşi için)
- **Nötr tonlar** (siyah/beyaz/gri varyantları)
- Her renk için: **HEX, RGB, CMYK, Pantone** kodları

## 3. Tipografi Sistemi

- **Başlık fontu**, kurumsal güç ifadesi
- **Metin fontu**, okunabilirlik
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
Ofset baskıda ilk birkaç forma "ayar baskı" olarak gider, renk dengeleme. Dijital baskıda bu yok ama yerini **toner farkı** alır.

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
    {
      slug: "kartvizit-baski-rehberi-fiyatlar-cesitler",
      title: "Kartvizit Baskı Rehberi 2024: Fiyatlar, Kağıt Seçenekleri ve Sipariş",
      excerpt:
        "Kartvizit baskısında doğru boyut, kağıt gramajı ve yüzey işlemi nasıl seçilir? 2024 güncel fiyatları, baskı teknikleri ve sipariş adımları bu rehberde.",
      coverImage: "card",
      authorName: "Markala Ekibi",
      authorRole: "Markala Blog Editörü",
      categorySlug: "rehber",
      tags: ["kartvizit", "baskı", "fiyat", "kağıt", "sipariş"],
      readingTime: 4,
      seoTitle: "Kartvizit Baskı Rehberi 2024: Fiyat ve Kağıt Seçimi | Markala",
      seoDescription:
        "Kartvizit baskısında kağıt gramajı, selefon çeşidi ve fiyat rehberi. 2024 güncel fiyatlarla 250'den 2.500 adede sipariş kılavuzu.",
      content: `## Kartvizit Boyutları

Türkiye'de en yaygın kartvizit boyutu 85 × 55 mm'dir. Uluslararası standart olarak bilinen bu ölçü, cüzdan ve kartvizitlik kutularına tam olarak sığar.

| Boyut | Ölçü | Kullanım Alanı |
|---|---|---|
| Türkiye Standardı | 85 × 55 mm | Her sektör |
| Avrupa (CR80) | 85 × 54 mm | Uluslararası çalışan markalar |
| Mini | 70 × 28 mm | Aksesuar, mücevher etiketleri |
| Kare | 60 × 60 mm | Yaratıcı sektörler, fotoğrafçılar |

Standart boyut dışına çıkmak üretim maliyetini %30-50 artırabilir. Özel bir ihtiyaç olmadığı sürece 85 × 55 mm'de kalmak hem ekonomik hem pratiktir.

## Kağıt Seçenekleri

**Gramaja göre seçim:**
- **300 gr**, ekonomik, sık dağıtılan kartlar için
- **350 gr**, kurumsal kullanımın en popüler seçeneği
- **400 gr**, hukuk bürosu, mimar, üst düzey yönetici gibi prestij gerektiren işler
- **600 gr**, iki farklı kağıdın yapıştırılmasıyla elde edilen ultra kalın, özel üretim

**Yüzey kaplama seçenekleri:**
- **Mat selefon:** parmak izi tutmaz, modern ve sade görünüm
- **Parlak selefon:** renkleri canlılaştırır, fotoğraf ağırlıklı tasarımlarda tercih edilir
- **Kadife (soft touch) selefon:** dokunsal etki, lüks hissiyat
- **Lak baskı:** seçili bölgelere parlaklık; logo ve başlıklarda dramatik kontrast

## Baskı Teknikleri

**Dijital baskı:** 1-500 adet arası ekonomik ve hızlıdır. Renk kalibrasyonu mükemmel; küçük metin ve ince çizgiler net çıkar. Hızlı ihtiyaçlar ve kısa süreli kampanyalar için idealdir.

**Ofset baskı:** 500 adetten itibaren birim maliyet düşer. Pantone renklere tam uyum, altın/gümüş özel renkler ve yüksek adet için tercih edilir.

**Folyo (yaldız) baskı:** Logo veya özel alanlara altın, gümüş ya da renkli folyo uygulanır. Görsel etkisi güçlüdür, kurumsal kartvizitlerde sık kullanılır.

**Kabartma (embossing):** Tasarımın belirli bölümlerine üç boyutlu doku verilir. Lüks ve el emeği hissiyatı oluşturur.

## Fiyat Rehberi

| Adet | 350 gr Mat Selefonlu | 400 gr Mat + Lak | Folyo Eklenirse |
|---|---|---|---|
| 250 | ~350 – 450 ₺ | ~550 – 700 ₺ | +%30-40 |
| 500 | ~480 – 650 ₺ | ~750 – 950 ₺ | +%25-35 |
| 1.000 | ~650 – 900 ₺ | ~1.100 – 1.400 ₺ | +%20-30 |
| 2.500 | ~1.200 – 1.600 ₺ | ~2.000 – 2.600 ₺ | +%15-25 |

> Tasarım ücreti dahil değildir. Hazır dosya getirirseniz ek ücret alınmaz.

## Sipariş Süreci

Markala'da kartvizit siparişi birkaç adımda tamamlanır:

1. **Ürün sayfasını açın:** [Klasik Kartvizit](/urun/klasik-kartvizit) veya [UV Lak Kartvizit](/urun/uv-lak-kartvizit) sayfasından istediğiniz ürünü seçin.
2. **Konfigüratörde seçimlerinizi yapın:** Adet, kağıt gramajı, selefon türü ve baskı yüzü (tek/çift) seçeneklerini belirleyin; anlık fiyatı görün.
3. **Dosyanızı yükleyin:** PDF, AI veya yüksek çözünürlüklü PNG/JPG formatında hazır tasarımınızı sisteme ekleyin.
4. **Ödemeyi tamamlayın:** Kartla, havale ya da kurumsal fatura seçenekleriyle ödeme yapın.
5. **Üretim ve teslimat:** Üretim tamamlandığında kargo takip numarası e-posta ile iletilir.

Sorunuz varsa [destek hattımız](/iletisim) üzerinden bize ulaşabilirsiniz.`,
    },
    {
      slug: "brosur-baski-cesitleri-fiyatlari",
      title: "Broşür Baskı Çeşitleri ve Fiyatları: A4, A5, Üçlü Katlama",
      excerpt:
        "A4, A5, üçlü katlama, Z-katlama... Doğru broşür formatını nasıl seçersiniz? Kağıt gramajı, katlama seçenekleri ve 2024 baskı fiyatları.",
      coverImage: "brochure",
      authorName: "Markala Ekibi",
      authorRole: "Markala Blog Editörü",
      categorySlug: "rehber",
      tags: ["broşür", "baskı", "katlama", "fiyat", "a4", "a5"],
      readingTime: 4,
      seoTitle: "Broşür Baskı Çeşitleri ve Fiyatları 2024 | Markala",
      seoDescription:
        "A4, A5 ve üçlü katlama broşür fiyatları, kağıt gramajı seçimi ve tasarım ipuçları. 250 adetten 1.000 adede güncel fiyat tablosu.",
      content: `## Broşür Çeşitleri

Broşür, ürün veya hizmetlerin kısa ve görsel bir biçimde anlatıldığı en temel pazarlama materyallerinden biridir. Boyut ve katlama şekline göre farklı adlar alır.

**A4 broşür (düz, katlama yok):** 210 × 297 mm boyutunda, ürün kataloğu veya kapsamlı tanıtım için kullanılır. Standart dosyaya sığdığı için ticari görüşmelerde ve fuar paketlerinde tercih edilir.

**A5 broşür:** 148 × 210 mm boyutunda. El broşürü olarak da bilinen A5, etkinlik dağıtımı, mağaza içi promosyon ve kafe-restoran bilgilendirmeleri için idealdir. Hafiftir ve cebe sığar.

**Üçlü katlama (trifold):** A4 kağıt üç eşit parçaya katlanır; kapalı haliyle A5 boyutunu alır. Her panel ayrı bir bölüm gibi tasarlanır. Turizm, sağlık ve gayrimenkul sektörlerinde en çok tercih edilen broşür formatıdır.

**Z-katlama:** Kağıt Z şeklinde katlanır. Her panel bağımsız okunabilir; adım adım süreç anlatımı için uygundur.

**Kapı katlama:** Kağıdın iki yanı ortaya doğru kapanır, ardından ikiye katlanır. Etkileyici bir açılış etkisi yaratır; ürün lansmanlarında tercih edilir.

## Kağıt Gramajı

| Gramaj | Kullanım | His |
|---|---|---|
| 90-115 gr | Ekonomik dağıtım | İnce, hafif |
| 135-150 gr | Genel tanıtım broşürü | Standart, dengeli |
| 170-200 gr | Ürün kataloğu, prestij broşür | Dolgun, kaliteli |
| 250-300 gr | Kapak sayfaları, özel davetler | Sert, premium |

İç sayfalar için 135-150 gr mat kuşe, kapak için 250-300 gr kullanımı yaygın bir kombinasyondur.

## Katlama Seçenekleri

**Üçlü katlama:** Sıralı anlatım için mükemmeldir. Okuyucu broşürü çevirirken önce giriş, sonra içerik, en son arka kapağı okur.

**Z-katlama:** Her panel bağımsız anlam taşıdığından ürün karşılaştırması veya SSS formatı için idealdir.

**İkili katlama (bifold):** A4 kağıt ortadan ikiye katlanarak 4 panel oluşturur. En sade ve ekonomik seçenek.

**Dönüşlü katlama (roll fold):** 4 veya daha fazla panelden oluşur; harita ve kampanya takvimi gibi çok bilgi içeren materyallerde kullanılır.

## Fiyatlar

135-150 gr mat kuşe, 4+4 renkli baskı için 2024 yılı ortalama fiyat aralıkları:

| Boyut / Katlama | 250 Adet | 500 Adet | 1.000 Adet |
|---|---|---|---|
| A5 düz | ~300 – 400 ₺ | ~400 – 550 ₺ | ~550 – 750 ₺ |
| A4 düz | ~450 – 600 ₺ | ~600 – 800 ₺ | ~800 – 1.100 ₺ |
| A4 Üçlü Katlama | ~600 – 800 ₺ | ~800 – 1.050 ₺ | ~1.100 – 1.450 ₺ |

Fiyatlar çift yönlü baskı (4+4) içindir; tek yüz baskı yaklaşık %15-20 daha uygun fiyatlıdır.

## Tasarım ve Baskı İpuçları

**Kenar boşluklarını koruyun:** Katlama çizgisi yakınındaki metinler katlandıktan sonra kısmen kapanabilir. Katlama çizgisinden en az 5 mm uzakta tutun.

**Her panel ayrı mesaj taşısın:** Okuyucu broşürü çevirirken her panel bağımsız anlam ifade etmelidir.

**Görsel ile metin dengesini gözetin:** Metnin yoğun olduğu paneller okuyucuyu yorar. Her panelde en az bir görsel veya grafik unsurun bulunması tavsiye edilir.

**Önce test edin:** Sayfayı kendiniz katlamak, tasarım hatalarını gönderim öncesinde fark ettirir.

Broşür siparişi için [Broşür / El İlanı](/urun/brosur-el-ilani) sayfasını ziyaret edebilirsiniz.`,
    },
    {
      slug: "roll-up-banner-baski-olculer-fiyatlar",
      title: "Roll-Up Banner Baskı: Ölçüler, Materyaller ve Fiyat Rehberi",
      excerpt:
        "Roll-up banner seçerken hangi ölçü, hangi materyal ve hangi mekanizma kalitesi tercih edilmeli? 2024 fiyat tablosu ve uzun ömür ipuçları.",
      coverImage: "rollup",
      authorName: "Markala Ekibi",
      authorRole: "Markala Blog Editörü",
      categorySlug: "rehber",
      tags: ["roll-up", "banner", "baskı", "fiyat", "stand", "fuar"],
      readingTime: 4,
      seoTitle: "Roll-Up Banner Baskı Ölçüleri ve Fiyatları 2024 | Markala",
      seoDescription:
        "Roll-up banner standart ölçüleri, materyal seçimi ve 2024 fiyat rehberi. 80x200 cm'den büyük formata ekonomik ve kurumsal seçenekler.",
      content: `## Roll-Up Banner Nedir?

Roll-up banner, içine sarılmış grafikten oluşan ve açılıp kapanabilen taşınabilir tanıtım materyalidir. Alt kutusundaki per mekanizması sayesinde grafik dakikalar içinde kurulabilir.

Ticaret fuarları, seminerler, mağaza içi tanıtımlar ve bayi toplantılarında en yaygın kullanılan grafik materyal haline gelmiştir.

## Standart Ölçüler

| Genişlik | Yükseklik | Kullanım |
|---|---|---|
| 60 cm | 160 cm | Küçük stantlar, showroom köşeleri |
| 80 cm | 200 cm | Standart (en yaygın seçenek) |
| 85 cm | 200 cm | Biraz daha geniş sunum alanı |
| 100 cm | 200 cm | Geniş stant, ana mesaj panosu |
| 120 cm | 200 cm | Büyük fuar standı, dekoratif arka plan |

En çok tercih edilen ölçü **80 × 200 cm**'dir. Hem taşınabilirlik hem görünürlük açısından dengeli bir seçimdir. İki roll-up yan yana kullanılacaksa 80 cm genişlik ideal bütünlük sağlar.

## Materyal Seçenekleri

**PP (Polipropilen) Film:** En yaygın kullanılan malzemedir. Hafiftir, kırılmaz; renk yoğunluğu iyidir. Tek seferlik ya da sınırlı kullanım için ekonomik seçenektir.

**Polyester Kumaş (Tex):** Daha premium görünüm sunar. Renk derinliği yüksektir. Uzun dönem kullanımda yüzey çizilmez; kurumsal stant için tercih edilir.

**PET Film:** Yüzeyi pürüzsüz ve parlaktır; renk koyuluğu en yüksek seçenektir. Ağır kullanım koşullarında yıpranmaz.

**Mekanizma kalitesi de önemlidir:** Ekonomik kasalarda tel per mekanizması bulunur; sık kullanımda arızalanabilir. Kurumsal standartlar için alüminyum kasalı, çift per mekanizmalı modeller tercih edilmelidir.

## Tasarım Kuralları

Ortalama bir izleyici banneri üçte birlik üst bölümüne odaklanır.

**Üst bölüm (%30):** Logo, slogan veya ana mesaj. Uzaktan okunabilirlik için font boyutu minimum 80-100 punto.

**Orta bölüm (%50):** Ürün görseli, temel bilgiler, avantajlar listesi.

**Alt bölüm (%20):** İletişim bilgileri, telefon, web adresi, QR kod. Bu alan stant kasası tarafından kısmen örtülebilir; kritik bilgileri buraya taşımaktan kaçının.

**Taşma payı:** Grafiği her kenara 5 mm taşıra tasarlayın.

**Çözünürlük:** 80 × 200 cm boyutunda en az 96 DPI kullanın; 150 DPI ile mükemmel baskı netliği elde edersiniz.

## Fiyat Rehberi

| Model | Ölçü | Fiyat Aralığı |
|---|---|---|
| Ekonomik (PP + standart kasa) | 80 × 200 cm | ~600 – 900 ₺ |
| Orta sınıf (PP + alüminyum kasa) | 80 × 200 cm | ~900 – 1.400 ₺ |
| Kurumsal (Tex kumaş + çift per) | 80 × 200 cm | ~1.500 – 2.200 ₺ |

Birden fazla adet alındığında birim fiyat düşer; 5 ve üzeri sipariş için toplu fiyat teklifi alınabilir.

## Uzun Ömür İçin Kullanım Önerileri

- Kurulum sırasında grafiği yavaşça çekin; ani kuvvet mekanizmaya zarar verebilir.
- Grafiği sarmadan önce yüzeyini kuru bir bezle temizleyin.
- Saklama çantasına yerleştirirken grafiğin tam sarıldığından emin olun.
- Rutubetli ortamlara ve doğrudan güneş ışığına maruz bırakmayın.

Roll-up banner siparişi için [Roll-Up Banner](/urun/roll-up-banner) sayfasını ziyaret edebilir, ölçü ve materyal seçiminde ücretsiz yardım için [destek ekibimizle](/iletisim) iletişime geçebilirsiniz.`,
    },
    {
      slug: "online-matbaa-nasil-calisir-avantajlar",
      title: "Online Matbaa Nasıl Çalışır? Geleneksel vs Online Baskı Karşılaştırması",
      excerpt:
        "Online matbaa nedir, nasıl çalışır? Geleneksel matbaayla farkları, avantajları ve dezavantajları: kimler tercih etmeli, kimler için geleneksel daha iyi?",
      coverImage: "brochure",
      authorName: "Markala Ekibi",
      authorRole: "Markala Blog Editörü",
      categorySlug: "haber",
      tags: ["online matbaa", "baskı", "matbaa", "dijital baskı", "fiyat"],
      readingTime: 5,
      seoTitle: "Online Matbaa Nasıl Çalışır? Avantajlar ve Karşılaştırma | Markala",
      seoDescription:
        "Online matbaa ile geleneksel matbaanın farkı nedir? Sipariş süreci, fiyat şeffaflığı, hız ve kalite karşılaştırması ile kimler için hangisi daha iyi.",
      content: `## Geleneksel Matbaa Nasıl Çalışır?

Geleneksel matbaa modeli onlarca yıldır aynı temele dayanır: müşteri fiziksel olarak matbaaya gider, tasarımını getirir, fiyat alır ve teslim tarihini bekler. Süreç genellikle şu adımları içerir:

1. Fiziksel ziyaret ve yüz yüze görüşme
2. Tasarım dosyasının USB veya e-posta ile iletilmesi
3. Ön kontrol, dosyanın baskıya uygunluğunun elle incelenmesi
4. Fiyat teklifi ve baskı onayı
5. Üretim süreci (birkaç gün ila hafta)
6. Matbaadan teslim alma veya kargolama

Bu model küçük şehirler ve yerel ilişki ağı olan işletmeler için hâlâ geçerliliğini korurken, ölçeklenemez ve fiyat karşılaştırması yapmak için elverişsizdir.

## Online Matbaa Nasıl Çalışır?

Online matbaa, siparişin internet üzerinden uçtan uca tamamlandığı dijital bir üretim modelidir.

**1. Ürün ve konfigürasyon seçimi:** Web sitesinde adet, kağıt gramajı, selefon türü ve baskı yüzü gibi parametreler seçilir. Fiyat anlık güncellenir.

**2. Dosya yükleme:** Hazır tasarım dosyası (PDF, AI, PSD) sisteme yüklenir. Gelişmiş platformlarda otomatik ön kontrol, CMYK modu, taşma payı, çözünürlük, yazılım tarafından kontrol edilir.

**3. Ödeme:** Kredi kartı, havale ya da kurumsal fatura ile tamamlanır.

**4. Üretim ve kargo:** Sipariş onaylandıktan sonra makine devreye girer. Üretim tamamlandığında kargo takip numarası otomatik olarak e-postayla iletilir.

## Geleneksel vs Online Matbaa Karşılaştırması

| Kriter | Geleneksel Matbaa | Online Matbaa |
|---|---|---|
| Sipariş kanalı | Yüz yüze | 7/24 web |
| Fiyat şeffaflığı | Görüşmeye bağlı | Anlık, konfigüratörde |
| Hız | Koordinasyon süresi dahil yavaş | Dijital ön kontrol ile hızlı |
| Küçük adet esnekliği | Sınırlı | Çoğunlukla esnek |
| Yerel ilişki | Güçlü | Yok |
| Hard proof imkânı | Kolay | Platform bağımlı |

## Online Matbaanın Avantajları

**Zaman ve yer bağımsızlığı:** Gece 2'de sipariş verilebilir. Müşteri görüşmelerine zaman ayırmak gerekmez.

**Anlık fiyat karşılaştırması:** Farklı adetleri ve gramajları anında fiyatlayabilirsiniz. Geleneksel matbaada bu bilgiyi almak günler sürebilir.

**Standardize kalite:** İyi online matbaalar ISO standartlarında kalibre çalışır. Aynı dosya her seferinde tutarlı renk ve kesim kalitesinde üretilir.

**Fatura ve sipariş geçmişi:** Tüm siparişler kayıt altında tutulur; muhasebeye fatura iletimi otomatiktir.

**Geniş ürün yelpazesi:** Fiziksel matbaanın stoklamadığı özel boyutlu etiketler, vinil baskılar veya nadir katlama seçenekleri online platformlarda bulunabilir.

## Online Matbaanın Dezavantajları

**Fiziksel dosya teslimi yok:** Tasarımınızı kendiniz hazırlayabilmelisiniz. Dosya kalitesini kontrol etmek kullanıcıya düşer.

**Renk onayı sınırlıdır:** Hard proof almak için ek ödeme gerekebilir.

**Yüz yüze danışmanlık yok:** Özel projeler ve alışılmadık baskı teknikleri için telefon veya canlı sohbet desteği gerekir.

**Kargo bağımlılığı:** Aynı gün teslim gereken acil durumlarda dezavantajlı olabilir.

## Kimler Online Matbaa Kullanmalı?

Online matbaa özellikle şu profiller için avantajlıdır:

- **Küçük ve orta ölçekli işletmeler:** Düzenli kartvizit, broşür ve afiş ihtiyacı olan, ama yerel matbaalarla fiyat pazarlığı yapmak istemeyen şirketler.
- **Ajanslar:** Çok sayıda müşterinin baskı işlerini tek panelden yönetmek isteyenler.
- **E-ticaret girişimcileri:** Ürün etiketleri ve promosyon materyalleri için ölçeklenebilir baskı çözümü arayanlar.
- **Hızlı dönüş isteyen kullanıcılar:** Tasarım hazır ve baskı süresinin minimuma inmesi kritikse.

## Markala'da Online Baskı

Markala, online matbaa modelinin tüm avantajlarını Türkiye'ye özel bir hizmet anlayışıyla sunar. Konfigüratör üzerinde anlık fiyat görüntüleme, otomatik dosya kontrolü, kargo takibi ve kurumsal hesap seçenekleriyle geleneksel matbaa deneyimini dijital çağa taşır.

Ürün yelpazesi ve detaylı rehberler için [Ürünlerimize](/urunler) göz atabilir, sorularınız için [destek hattımıza](/iletisim) ulaşabilirsiniz.`,
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
