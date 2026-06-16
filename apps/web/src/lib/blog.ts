/**
 * Blog data layer — şu an file-based (mock).
 * Postgres bağlandığında bu dosya tek satır değişikliğiyle prisma.blogPost.findMany() kullanacak.
 */

export interface BlogCategory {
  slug: string;
  name: string;
  description: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverTheme: string; // /api/mockup?theme=...
  authorName: string;
  authorRole: string;
  categorySlug: string;
  tags: string[];
  publishedAt: string; // ISO
  readingMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
}

export const blogCategories: BlogCategory[] = [
  {
    slug: "rehber",
    name: "Rehberler",
    description: "Matbaa ve baskı süreçlerinde sıkça karşılaşılan soruların adım adım rehberleri.",
  },
  {
    slug: "tasarim",
    name: "Tasarım İpuçları",
    description: "Profesyonel görünen baskıya hazırlık için renk, tipografi ve dosya hazırlama ipuçları.",
  },
  {
    slug: "sektor",
    name: "Sektör Haberleri",
    description: "Matbaa, reklam ve kurumsal kimlik dünyasından güncel gelişmeler.",
  },
  {
    slug: "vaka-calismasi",
    name: "Vaka Çalışmaları",
    description: "Markala müşterilerinin başarı hikayeleri ve önce/sonra örnekler.",
  },
];

const POSTS: BlogPost[] = [
  {
    slug: "kartvizit-tasarim-rehberi-2026",
    title: "2026'da Etkili Kartvizit Tasarımı: Adım Adım Rehber",
    excerpt:
      "Modern bir kartvizit hem ilk izlenimi belirler hem markanın profesyonelliğini yansıtır. Boyut, kağıt seçimi, tipografi ve baskı tekniklerinde dikkat etmeniz gereken her şey.",
    coverTheme: "card",
    authorName: "Hasan Söylemez",
    authorRole: "324 Ajans · Marka Yöneticisi",
    categorySlug: "rehber",
    tags: ["kartvizit", "tasarım", "rehber", "matbaa"],
    publishedAt: "2026-05-07T09:00:00Z",
    readingMinutes: 8,
    seoTitle: "Etkili Kartvizit Tasarımı 2026 — Boyut, Kağıt, Renk Rehberi",
    seoDescription:
      "Profesyonel kartvizit nasıl tasarlanır? Standart boyutlar, kağıt türleri (300-600gr), CMYK renk yönetimi, taşma payı, selefon/UV lak farkı. Markala matbaa rehberi.",
    content: `
## Kartvizit Hâlâ Önemli mi?

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

Sorularınız için [WhatsApp](https://wa.me/905319004102) ya da [yardım merkezi](/yardim).
    `.trim(),
  },

  {
    slug: "cmyk-rgb-fark-baski-renk-yonetimi",
    title: "CMYK vs RGB: Baskıda Doğru Renk Yönetimi",
    excerpt:
      "Ekrandaki canlı renkler neden baskıda solgun çıkar? CMYK-RGB farkı, profil dönüşümü, Pantone sistemi ve sık yapılan renk hataları.",
    coverTheme: "brochure",
    authorName: "324 Ajans Tasarım Ekibi",
    authorRole: "Markala İçerik",
    categorySlug: "tasarim",
    tags: ["cmyk", "rgb", "renk", "tasarım", "pantone"],
    publishedAt: "2026-05-05T10:00:00Z",
    readingMinutes: 6,
    seoTitle: "CMYK vs RGB Farkı — Baskı Renk Yönetimi Rehberi",
    seoDescription:
      "Ekrandaki canlı renkler baskıda neden değişir? CMYK ile RGB arasındaki fark, Pantone, profil dönüşümü ve renk uyumu kontrol listesi.",
    content: `
## Renk Algısı Cihaza Göre Değişir

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

Sorularınız için [Dosya Hazırlama Rehberi](/yardim/dosya-hazirlama).
    `.trim(),
  },

  {
    slug: "kurumsal-kimlik-tasarim-paketi-ne-icermelidir",
    title: "Kurumsal Kimlik Tasarım Paketi Ne İçermeli?",
    excerpt:
      "Yeni kurulan firma ya da rebrand yapan marka için kurumsal kimlik paketinde neler olmalı? Logo, kartvizit, antetli kağıt, zarf ve dijital varlıklar.",
    coverTheme: "brochure",
    authorName: "Hasan Söylemez",
    authorRole: "324 Ajans · Marka Yöneticisi",
    categorySlug: "rehber",
    tags: ["kurumsal kimlik", "marka", "logo", "rebrand"],
    publishedAt: "2026-05-02T11:00:00Z",
    readingMinutes: 7,
    content: `
## Kurumsal Kimlik = Markanın Kıyafeti

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

[Kurumsal hesap başvurusu](/kurumsal/basvuru) ile bu paket bedava ön görüşme + bütçeli teklif alırsınız.
    `.trim(),
  },

  {
    slug: "matbaa-toleransi-fire-payi-nedir",
    title: "Matbaa Üretim Toleransı (%1-5 Fire) Nedir, Neden Vardır?",
    excerpt:
      "Sipariş 1.000 dedik, 980 geldi. Bu firmanın hatası mı? Matbaa sektöründeki standart üretim toleransı, sebepleri ve müşteri olarak haklarınız.",
    coverTheme: "brochure",
    authorName: "Hasan Söylemez",
    authorRole: "324 Ajans",
    categorySlug: "sektor",
    tags: ["matbaa", "tolerans", "fire", "üretim"],
    publishedAt: "2026-04-29T14:00:00Z",
    readingMinutes: 4,
    content: `
## Matbaa Toleransı Nedir?

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

Detaylı bilgi: [İade & Değişim Politikası](/yasal/iade) · [Kargo & Teslimat](/yardim/kargo)
    `.trim(),
  },
];

export const blogPosts = POSTS.sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
);

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getBlogPostsByCategory(slug: string): BlogPost[] {
  return blogPosts.filter((p) => p.categorySlug === slug);
}

export function getBlogCategoryBySlug(slug: string): BlogCategory | undefined {
  return blogCategories.find((c) => c.slug === slug);
}

export function getRelatedPosts(slug: string, count = 3): BlogPost[] {
  const post = getBlogPostBySlug(slug);
  if (!post) return [];
  return blogPosts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      let score = 0;
      if (p.categorySlug === post.categorySlug) score += 5;
      score += p.tags.filter((t) => post.tags.includes(t)).length * 2;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.post);
}
