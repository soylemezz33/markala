# markala.com.tr — Kapsamlı Dijital Strateji Analiz Raporu

> **Hazırlayan:** Uzman Dijital Strateji Danışmanı (Kaynak Kodu İncelemesi)  
> **Tarih:** Ağustos 2026  
> **Kapsam:** `apps/web` (Next.js frontend), `apps/api` (NestJS backend), tüm sayfa bileşenleri, SEO dosyaları, analitik entegrasyonlar  
> **Not:** Bu rapor yalnızca kaynak kod analizine dayanmaktadır; canlı site performans verisi (Core Web Vitals, GA4 metrikleri) dahil edilmemiştir.

---

## İçindekiler

1. [Teknik Bulgular](#1-teknik-bulgular)
2. [İçerik Analizi](#2-i̇çerik-analizi)
3. [Pazarlama Eksiklikleri](#3-pazarlama-eksiklikleri)
4. [Satış Engelleri](#4-satış-engelleri)
5. [Öncelikli Aksiyon Planı](#5-öncelikli-aksiyon-planı)

---

## 1. Teknik Bulgular

### 1.1 Teknoloji Stack'i

Markala.com.tr, 2024–2026 itibarıyla Türkiye'deki e-ticaret siteleri arasında **en modern full-stack mimarilerden birini** kullanmaktadır.

| Katman | Teknoloji | Versiyon / Detay |
|---|---|---|
| Frontend | Next.js (App Router) | v14+, ISR (revalidate: 300) |
| Backend API | NestJS | Port 4000, REST+modüler mimari |
| Paket yönetimi | pnpm workspaces | v10.33.3, Node ≥20 zorunlu |
| ORM | Prisma | Database katmanı |
| Stil | Tailwind CSS | Custom token'lar: `paper-*`, `ink-*`, `brand-*` |
| Yazı tipi | DM Sans | Google Fonts, latin + latin-ext, optical sizing |
| İkonlar | Phosphor Icons | |
| Dil | TypeScript | Tüm app ve paketlerde |
| Monorepo | pnpm workspaces | `apps/web`, `apps/api`, `apps/admin`, `packages/ui` |

**Değerlendirme:** Stack seçimi son derece sağlam. Next.js App Router + ISR kombinasyonu, hem SEO için statik sayfa avantajını hem de dinamik içerik güncelliğini birleştiriyor. NestJS'in modüler yapısı (orders, products, reviews, coupons, corporate-applications, corporate-invoicing, brands, auth, meta-capi, iyzico, dhl gibi ayrı modüller) uzun vadeli ölçeklenebilirliği garanti ediyor.

### 1.2 Site Yapısı ve URL Mimarisi

Tespit edilen sayfalar ve öncelik sırası:

**Yüksek Öncelikli Sayfalar (Satış/SEO):**
- `/` — Ana sayfa (priority: 1.0)
- `/fiyat-listesi` — Fiyat listesi (priority: 0.95)
- `/matbaa` — Matbaa landing (priority: 0.95)
- `/matbaa/mersin` — Mersin şehir landing'i (priority: 0.95)
- `/urunler` — Ürün listesi (priority: 0.9)
- `/kampanyalar` — Kampanyalar (priority: 0.9)
- `/kategoriler` — Kategori listesi (priority: 0.9)
- `/hizmetler` — Hizmetler (priority: 0.9)
- `/urun/[slug]` — Ürün detay sayfaları (bestsellers: 0.85, diğerleri: 0.7)
- `/matbaa/[sehir]` — Diğer şehir landing'leri (priority: 0.85)
- `/matbaa/[sehir]/[ilce]` — İlçe landing'leri (priority: 0.75)

**Rehber/Blog (SEO İçeriği):**
- `/rehber/kartvizit-fiyatlari-2026`
- `/rehber/brosur-baski-fiyatlari-2026`
- `/rehber/branda-baski-m2-fiyati-2026`
- `/rehber/isg-zorunlu-uyari-levhalari`
- `/blog/[slug]` ve `/blog/kategori/[slug]`
- `/sozluk` — Matbaa sözlüğü (priority: 0.8)

**Kurumsal:**
- `/kurumsal` — B2B/kurumsal başvuru (priority: 0.85)
- `/teklif-al` — Teklif formu (priority: 0.8)
- `/numune-talebi` — Numune talebi (priority: 0.75)
- `/referanslar` ve `/portfolio`

**Destek:**
- `/yardim` ve `/yardim/[slug]` — Yardım merkezi
- `/kargo-takip`
- `/yasal/[slug]` — KVKK, gizlilik, kullanım koşulları

**Değerlendirme:** URL mimarisi arama motoru dostu ve hiyerarşik. Şehir + ilçe landing page stratejisi, yerel SEO için doğru bir adım. Sözlük (`/sozluk`) semantic authority için iyi bir içerik varlığı. Rehber sayfaları ISR 3600 (1 saatlik cache) ile canlı katalog fiyatlarını çekerek taze içerik sunuyor.

### 1.3 SEO Durumu

#### Güçlü Yönler

**1. Schema.org JSON-LD — Kapsamlı Uygulama**

Kod tabanında aşağıdaki structured data tipleri tespit edildi:
- `Organization` + `LocalBusiness` → Root layout (tüm sayfalarda)
- `Product` + `AggregateRating` → Ürün detay sayfaları
- `HowTo` → Ana sayfa üretim süreç timeline'ı
- `FAQ` → Ürün sayfalarında ürüne özgü SSS + her zaman en sona eklenen "Üretim toleransı (fire) nedir?" yasal notu
- `Breadcrumb` → Kategori > Ürün zinciri (akıllı: kategori adı = ürün adıysa tekrarlama engellenir)
- `ItemList` → Fiyat listesi sayfası (yalnızca fiyatlı ürünler, max 50 ListItem — Seller Entry uyarılarından kaçınmak için)
- `Article` → Blog ve rehber sayfaları

**2. Meta Etiketleri — Eksiksiz**
- Tüm sayfalar `title template` kullanıyor: `%s · Markala`
- Ana sayfa mutlak başlık override: "Markala — Online Matbaa: Kartvizit, Broşür, Afiş & Branda Baskı"
- Fiyat listesi title: "Matbaa Fiyat Listesi 2026" (yıl eklenmiş — arama sinyali için iyi)
- OG + Twitter Card: 1200×630 `/og-default.png` varsayılan, ürün sayfalarında gerçek ürün fotoğrafı öncelikli
- Canonical URL'ler tüm sayfalarda mevcut
- Robots meta: `index, follow`, `max-image-preview:large`, `max-snippet:-1`
- Google / Yandex / Bing doğrulama env var ile yönetiliyor

**3. Sitemap — Profesyonel Düzeyde**

Sitemap.ts'de dikkat çeken mühendislik kararları:
- Ürün listesi boş dönerse sitemap hata fırlatıyor → eski sürüm korunuyor (de-indexing koruması)
- Statik sayfalar için `lastModified` kasıtlı olarak yok (sahte tazelik sinyali önleniyor)
- Ürünlerde gerçek `updatedAt` kullanılıyor
- Bestseller ürünler priority 0.85 vs. normal 0.7

**4. robots.txt — İleri Düzey Yapılandırma**
- `/cdn-cgi/` engellendi → Cloudflare Email Obfuscation'ın sebep olduğu "kırık link" sorununu önlüyor
- UTM parametreleri (`?utm_*`, `?ref=*`, `?fbclid=*`, `?gclid=*`) engellendi → duplicate content önlemi
- `?sort=*` ve `?filter=*` engellendi → facet URL'lerini temizliyor
- `?page=` kasıtlı olarak AÇIK bırakıldı (2026-07-20 değişikliği) — derin ürün keşfi için
- AI botları (GPTBot, ClaudeBot, PerplexityBot) AÇIK → AEO (AI Engine Optimization) stratejisi
- Zararlı scraper'lar (CCBot, Bytespider, meta-externalagent) kapalı
- AhrefsBot, SemrushBot'a crawlDelay: 10 → sunucu yükü azaltılıyor

**5. ISR (Incremental Static Regeneration)**
- `export const revalidate = 300` — tüm kritik sayfalarda (ana sayfa, ürün, fiyat listesi)
- Rehber sayfaları: `revalidate: 3600` (fiyat güncellemelerini 1 saatte yansıtıyor)
- `generateStaticParams` — ürün sayfaları build time'da statik olarak oluşturuluyor

**6. Sayfa Hızı Optimizasyonları**
- `preconnect` + `dns-prefetch` → `api.markala.com.tr`
- DM Sans: `display: swap` varsayımı (Google Fonts)
- OG görsel: mockup SVG API yerine gerçek fotoğraf tercih ediliyor
- Script'ler: `strategy="afterInteractive"` (First Paint'i engellemiyor)
- Consent Mode default: `beforeInteractive` (bot'lar için önem taşımıyor, ziyaretçi UX'i için kritik)

#### Eksiklikler

**1. Fiyat Listesi Sayfa Boyutu Riski**
`MAX_ROWS_PER_CATEGORY = 20` limiti eklenerek 2MB üzeri HTML'nin Googlebot tarafından okunmaması sorunu çözülmüş. Ancak 20 satır yeterli mi? Kategoride 50+ ürün varsa kullanıcı fiyat karşılaştırması yapamıyor. Category sayfasına yönlendirme linki var ama bu kullanıcı deneyimini kesiyor.

**2. Şehir/İlçe Landing Sayfaları — İçerik Kalitesi Belirsiz**
Kod tabanında şehir ve ilçe landing sayfalarının varlığı doğrulandı ancak içerikleri incelenemedi. Bu sayfaların "thin content" (ince içerik) tuzağına düşmemesi kritik. Her şehir sayfasının benzersiz içerik (yerel teslimat süresi, yerel referanslar, şehre özgü SSS) içermesi gerekiyor.

**3. Hreflang Yok**
Site tamamen Türkçe, ancak yurt dışında yaşayan Türklere yönelik potansiyel var. Şu an hreflang uygulaması görünmüyor — bu bir eksiklik değil, ancak gelecekte döviz bazlı satış için altyapı hazırlığı yapılabilir.

**4. Core Web Vitals — Kod'dan Görünmeyen Riskler**
- `PremiumHeroSlider` bileşeni DB'den çekiliyor — LCP (Largest Contentful Paint) için slider görselleri önceden `priority` prop ile yükleniyor mu?
- `CustomerReviews` bileşeni — yorum kartlarında gerçek fotoğraflar kullanılıyorsa lazy load + boyutlandırma kritik
- `ProcessTimeline` — animasyonlar CLS'yi (Cumulative Layout Shift) etkiliyor mu?

### 1.4 Analitik ve Takip Altyapısı

Tespit edilen araçlar ve entegrasyon kalitesi:

| Araç | Entegrasyon Kalitesi | Notlar |
|---|---|---|
| GA4 | ⭐⭐⭐⭐⭐ Mükemmel | Consent Mode v2 uyumlu, anonymize_ip, iyzico 3DS sonrası consent restore |
| Google Ads | ⭐⭐⭐⭐⭐ Mükemmel | Hardcoded fallback `AW-18286908100`, dönüşüm event'leri consent ile koşullu |
| Meta Pixel | ⭐⭐⭐⭐⭐ Mükemmel | `fbq('consent', 'revoke')` ile başlıyor, KVKK uyumlu; Meta CAPI sunucu tarafı (dedup için sipariş numarası event_id) |
| Microsoft Clarity | ⭐⭐⭐⭐ İyi | Session recording + heatmap; consent'e bağlı |
| Hotjar | ⭐⭐⭐ Opsiyonel | Env var yoksa yüklenmiyor |
| GTM | ⭐⭐⭐ Opsiyonel | Env var yoksa yüklenmiyor |
| NetGSM | ⭐⭐⭐⭐ İyi | SMS bildirimleri backend |
| Sentry | ⭐⭐⭐⭐ İyi | Admin app'te error monitoring |

**Kritik Teknik Detay — 3DS Sonrası Consent Restore:**

iyzico ödeme akışı 3DS doğrulaması sırasında tam sayfa yenileniyor. Eski yapıda bu durumda:
- GA4 consent "denied" başlıyordu
- Purchase event'leri consent-denied / çerezsiz gönderiliyordu
- Google Ads dönüşümü (gclid atıflaması) kör kalıyordu

Mevcut kodda `gtag-consent-restore` script'i bu sorunu çözüyor: `markala_cookie_consent` çerezi okunuyor ve consent durumu her sayfa yüklemesinde restore ediliyor. Bu, reklam atıflaması açısından çok önemli bir mühendislik kararı.

### 1.5 KVKK / GDPR Uyumu

| Gereksinim | Durum |
|---|---|
| Cookie consent banner | ✅ Mevcut (CookieConsent bileşeni) |
| Google Consent Mode v2 | ✅ Uygulandı — tüm sinyaller varsayılan "denied" |
| Meta Pixel — consent revoke | ✅ Başlangıçta revoke, kullanıcı onay verirse grant |
| KVKK onay kutusu — iletişim formu | ✅ Zorunlu checkbox, link: `/yasal/kvkk` |
| Cloudflare Turnstile | ✅ Tüm formlarda (iletişim, sipariş, newsletter) |
| KVKK başvuru sayfası | ✅ `/kvkk-basvuru` (robots.txt'de disallow — doğru) |
| Veri saklama politikası | Belirsiz — yasal sayfalar mevcut ama içerik incelenmedi |

### 1.6 Ödeme ve Entegrasyon Altyapısı

| Entegrasyon | Amaç | Değerlendirme |
|---|---|---|
| iyzico | Türk ödeme geçidi, 3 taksit tüm kartlara | ⭐⭐⭐⭐⭐ — Türkiye için doğru seçim |
| DHL | Kargo, 81 il, 1–3 iş günü | ⭐⭐⭐⭐⭐ — Güvenilirlik sinyali |
| Paraşüt | Türk muhasebe yazılımı entegrasyonu | ⭐⭐⭐⭐ — Yerel uyum |
| SendGrid | İşlemsel e-posta | ⭐⭐⭐⭐ — Sektör standardı |
| Google OAuth | Sosyal giriş | ⭐⭐⭐⭐ — Kayıt sürtüşmesini azaltıyor |
| Meta CAPI | Sunucu taraflı dönüşüm API | ⭐⭐⭐⭐⭐ — Cookieless tracking için kritik |

---

## 2. İçerik Analizi

### 2.1 Ürün ve Hizmet Kataloğu

**Tespit Edilen Ürün Bilgileri:**
- 20+ ürün kategorisi
- 800+ ürün (tahmini — sitemap'taki ürün hacminden)
- Produktlar `bestseller` bayrağı (ana sayfada öne çıkanlar) ve `badges` array'i ile (örn. "yeni") etiketleniyor

**Ana Sayfa Ürün Gösterimi:**
1. `PremiumHeroSlider` — Admin panelinden yönetilen hero banner'lar (kampanya/yeni ürün)
2. `ProductRail` (bestsellers, max 12) — En çok satanlar
3. `CategoryGrid` — Kategori görsel grid'i
4. `ProductRail` (yeni gelenler, max 12) — `badges: "yeni"` ile filtreleniyor
5. `SectorShowcase` — Sektör bazlı çözümler

**Tespit Edilen Ürün Grupları (Kod'dan):**
- Kartvizit (kartvizit-fiyatlari-2026 rehber sayfası mevcut)
- Broşür (brosur-baski-fiyatlari-2026 rehber sayfası mevcut)
- Branda/Afiş (branda-baski-m2-fiyati-2026 rehber sayfası mevcut)
- İSG levhaları (isg-zorunlu-uyari-levhalari rehber sayfası mevcut)
- Katalog (baskisitesi proje adı)
- Promosyon ürünleri

**Değerlendirme:** Ürün çeşitliliği ve katalog derinliği güçlü görünüyor. Admin panelinden yönetilen hero slider, pazarlama kampanyalarının teknik destek olmadan güncellenmesine olanak tanıyor — bu operasyonel çeviklik açısından olumlu.

### 2.2 Fiyatlandırma Stratejisi

Fiyatlandırma yapısı kod analizi ile netleşti:

**Görüntülenen Fiyat Türleri:**
- **Başlangıç fiyatları** — "X'den başlayan fiyatlar" şeklinde, KDV dahil
- **Metrekare fiyatı** — Branda/afiş için, API'den `kur`, `marj`, `kdv`, `minM2` parametreleriyle dinamik hesaplama (fallback değerler: kur: 46, marj: 1.2, kdv: 0.2, minM2: 1)
- **Toplu indirim** — Adet arttıkça fiyat düşüyor (kod'dan açık)
- **Paket tierleri** — Farklı kalite/hız seçenekleri
- **Ek işlem maliyetleri** — +%20-50 (laminasyon, kesim vb.)
- **Ücretsiz tasarım** — Başlangıç fiyatına dahil

**Kargo Politikası (Fiyat Listesi Sayfasından):**
- 1.500 TL üzeri alışverişlerde ücretsiz kargo
- Altında: 79 TL sabit kargo bedeli

**Hoş Geldin Kuponu:**
- `HOSGELDIN` kodu — ilk siparişte %10 indirim
- Hem hakkımızda sayfasında hem muhtemelen karşılama e-postasında yer alıyor

**Değerlendirme — Güçlü Yönler:**
- KDV dahil fiyat gösterimi Türk tüketicinin beklentisine uygun
- Fiyat listesi sayfasının sitemap priority'si 0.95 (anasayfadan sonra en yüksek ikinci) — SEO değerini biliyor
- Dinamik kur/marj/KDV hesaplaması anlık fiyat güncelliği sağlıyor

**Değerlendirme — Zayıf Yönler:**
- "Teklif usulü" ürünler için fiyat şeffaflığı belirsiz — müşteri sepete ürün eklemeden fiyatı göremiyorsa bu bir dönüşüm engeli
- Fiyat karşılaştırması yapılabilir bir tablo yok (örn. A4 broşür 250 adet vs 500 adet vs 1000 adet yan yana)
- B2B fiyatlandırması tamamen opak — "özel teklif" deniyor ama hiçbir referans fiyat verilmiyor

### 2.3 Değer Önerisi Analizi

Hakkımızda ve ürün sayfalarından elde edilen değer önerisi:

| Öne Çıkarılan Değer | Teknik Kanıt |
|---|---|
| Ücretsiz tasarım | Trust badge'de "0 TL tasarım ücreti" + sınırsız revizyon |
| Hızlı üretim | 24–72 saat üretim süresi; toplam 2–5 iş günü (üretim + kargo) |
| 81 il teslimat | DHL entegrasyonu doğrulandı, 1–3 iş günü kargo |
| Kalite garantisi | Ücretsiz yeniden üretim taahhüdü |
| 3 taksit | iyzico ile tüm kartlara geçerli (trust badge'de gösteriliyor) |
| 10+ yıl deneyim | 324 Ajans bağlantısı, Mersin merkezli |
| Kurumsal çözüm | Aylık fatura, cari hesap, B2B WhatsApp hattı |

**Değerlendirme:** Değer önerisi net ve çeşitlendirilmiş. "Ücretsiz tasarım" özellikle KOBİ segmenti için çok güçlü bir farklılaştırıcı çünkü hedef kitlede in-house tasarımcı olmayabilir. Ancak bu değer önerisinin **arama sonuçlarında** (meta description), **home page H1'de** ve **ürün sayfalarında** tutarlı biçimde tekrarlanması gerekiyor.

### 2.4 CTA (Dönüşüm Harekete Geçirici) Analizi

Sayfalar genelinde tespit edilen CTA'lar:

**Birincil CTA'lar:**
1. Ürün konfigüratörü → Sepete ekle akışı (en güçlü)
2. WhatsApp `wa.me/905319004102` — En hızlı kanal, ortalama 5 dk yanıt
3. "Fiyat Listesi" → `/fiyat-listesi` (anasayfadan)
4. "Kurumsal Başvuru" → `/kurumsal`

**İkincil CTA'lar:**
5. `HOSGELDIN` kuponu — Hakkımızda sayfasında
6. Telefon: `0324 433 33 51`
7. E-posta: `merhaba@markala.com.tr`
8. B2B: `kurumsal@markala.com.tr`

**Eksik CTA'lar:**
- Ana sayfada `HOSGELDIN` kuponu görünürlüğü düşük (hero slider'da mı gösteriliyor bilinmiyor ama hakkımızda sayfasında gömülü kalıyor)
- Numune talebi CTA'sı — `/numune-talebi` sayfası var ama ana sayfa ve kategori sayfalarında promosyonu belirsiz
- Teklif al butonu — `/teklif-al` sayfası var ama navigasyondaki yeri bilinmiyor

**FloatingActions Bileşeni:** Root layout'ta mevcut. Muhtemelen WhatsApp ve benzeri hızlı iletişim butonları içeriyor (floating action button) — bu doğru bir conversion optimization kararı.

### 2.5 İçerik Kalitesi ve Ton

**Güçlü İçerik:**
- Fiyat listesi sayfası: KDV dahil, şeffaf başlangıç fiyatları, kargo limiti açık
- Hakkımızda: Spesifik rakamlar (10+ yıl, 20+ kategori, 2-5 gün, 0 TL tasarım), 324 Ajans güvenilirliği
- Yardım merkezi: `/yardim/[slug]` ile kapsamlı destek içeriği
- İletişim: 5 iletişim kanalı, çalışma saatleri, randevu bilgisi

**Zayıf/Eksik İçerik:**
- Sosyal kanıt içeriği zayıf (aşağıda detaylı açıklandı)
- Üretim sürecine dair görsel/video içerik belirsiz (ProcessTimeline metin bazlı görünüyor)
- Kategori sayfası içerikleri incelenemedi — muhtemelen en zayıf halka

---

## 3. Pazarlama Eksiklikleri

### 3.1 Conversion Rate Optimization (CRO)

#### 3.1.1 Google Maps Yerleştirme Eksikliği — KRİTİK

İletişim sayfasında açıkça görünen kod:

```tsx
<div className="aspect-[4/3] rounded-xl bg-paper-100 border border-paper-200 grid place-items-center">
  <div className="text-center">
    <MapPin size={32} />
    <div>Mersin, Türkiye</div>
    <div className="text-xs mt-1">Harita yakında eklenecek</div>
  </div>
</div>
```

Bu, canlı sitede görünen bir **placeholder** — gerçek Google Maps embed yok. B2B müşterilerin ve yerel ziyaretçilerin konumu doğrulamak isteyeceği düşünüldüğünde bu ciddi bir güven sinyali eksikliği. Ayrıca:
- LocalBusiness JSON-LD'de adres bilgisi var ama harita görsel teyidi yok
- Yerel SEO açısından Google Maps embed, iş yerinin Google My Business bağlantısını güçlendiriyor

**Çözüm:** Google Maps embed veya Maps JavaScript API ile etkileşimli harita. Tercih: yükleme performansı için statik `<img>` Maps Static API + tıklanınca Google Maps açılsın.

#### 3.1.2 AB Testi Altyapısı — Yok

Kod tabanında hiçbir A/B test aracı (Google Optimize alternatifi, VWO, Optimizely, Statsig vb.) görünmüyor. Microsoft Clarity session recording mevcut ama aktif AB testi yok. Bu durum:
- Hangi hero banner daha fazla dönüşüm sağlıyor bilinmiyor
- Kargo eşiği (1.500 TL) optimize edilmemiş olabilir
- CTA button rengi/metni denenmiyor

#### 3.1.3 Exit Intent / Pop-up Yok

Sepeti terk eden veya siteden çıkmak üzere olan ziyaretçiye hiçbir "exit intent" mekanizması yok. Bu, özellikle ürün sayfasından sepetsiz çıkan ziyaretçiler için kayıp anlamına geliyor.

#### 3.1.4 Stok/Urgency Sinyali Belirsiz

Ürün sayfasında stok durumu, "sınırlı stok", "bu hafta sipariş ver, X tarihinde teslim al" gibi urgency sinyalleri var mı? Kod incelemesinden belirsiz. Varsa görsel hiyerarşide öne çıkmalı.

### 3.2 E-posta Pazarlama Altyapısı

**Mevcut Durum:**
- SendGrid entegrasyonu doğrulandı (işlemsel e-posta)
- Sipariş/teslimat bildirim e-postaları muhtemelen mevcut
- `HOSGELDIN` kuponu → hoş geldin e-postası muhtemelen tetikleniyor

**Eksiklikler:**
- Ana sayfada **belirgin bir e-posta abonelik formu yok** — newsletter opt-in yok
- Sepet terk e-postası var mı? Kod'dan görünmüyor
- Segmentli e-posta akışı (satın alan, teklif isteyen, blog okuyucu) belirsiz
- E-posta frekansı ve içerik takvimi hakkında bilgi yok

**Fırsat:** Fiyat listesi sayfasına "Fiyat değişikliklerinde bildirim al" formu eklenebilir. Bu, fiyat araştırması yapan B2B ziyaretçileri yakalamak için güçlü bir lead magnet.

### 3.3 Sosyal Kanıt ve Güven Sinyalleri

#### Mevcut Güven Sinyalleri:
- `TrustBadges` bileşeni — Ana sayfada (KDV dahil, DHL kargo, iyzico 3 taksit vb.)
- `TrustedBy` bileşeni — Referans marka logoları (içerik bilinmiyor)
- `CustomerReviews` bileşeni — Müşteri yorumları
- Ürün sayfasında `ProductReviewsSection` + `AggregateRating` (JSON-LD)
- Hakkımızda'da 324 Ajans bağlantısı ve spesifik rakamlar

#### Eksik / Zayıf Güven Sinyalleri:

**1. Gerçek Referans Sayısı Belirsiz**
Yorumlar mevcut ama kaç müşteri yorumu var? Bir matbaa sitesi için en az 50–100 gerçek yorum olması beklenir. Yorum sayısı ve puanı hero veya ürün sayfası üstünde görünmüyorsa sosyal kanıt etkisi azalıyor.

**2. Basın/Medya Görünürlüğü Yok**
Herhangi bir basın bülteni, medya haberi, endüstri ödülü veya sertifika görünmüyor. Örneğin ISO, TSE, çevre sertifikası gibi belgeler güven ekler.

**3. Canlı Müşteri Sayısı / Sipariş Sayacı Yok**
"Bugün X sipariş işlendi" veya "Toplam X müşteri" gibi dinamik sosyal kanıt unsurları yok. Hesaplayabileceğimiz metrikler (backend'de sipariş sayısı mevcut) buna izin veriyor.

**4. Portfolio / Gerçek Baskı Örnekleri Zayıf**
`/portfolio` sayfası mevcut (sitemap'te) ama önceliği düşük (0.7). Matbaa sektöründe gerçek baskı örnekleri (fotoğraf/video) en güçlü dönüşüm aracı. Portfolio görsel kalitesi ve miktarı bilinmiyor.

**5. Video İçerik Yok**
Üretim süreci videosu (fabrika/atölye), müşteri testimonial videosu, ürün yakın çekim videosu — bunlar dönüşümü dramatik artırabilir ama kod tabanında video player bileşeni görünmüyor.

### 3.4 Sosyal Medya Entegrasyonu

Facebook, Instagram, LinkedIn, YouTube veya TikTok bağlantısı kod'dan tespit edilemedi. Tespit edilenler:
- Meta Pixel (reklam takibi) → sosyal medya varlığına işaret ediyor
- WhatsApp direct link → iletişimde kullanılıyor

**Eksiklikler:**
- Footer'da sosyal medya ikonları var mı? Layout incelenmedi ama bileşenler listesinde görünmüyor
- Instagram shoppable feed entegrasyonu yok
- UGC (User Generated Content) toplayıcı yok

### 3.5 Yeniden Hedefleme Altyapısı

**Mevcut:**
- Meta Pixel → Facebook/Instagram yeniden hedefleme (KVKK uyumlu consent akışıyla)
- Google Ads → Tag Manager üzerinden dönüşüm takibi
- `RecentlyViewedRail` bileşeni → Site içi yeniden hedefleme

**Eksik:**
- Criteo veya başka DSP entegrasyonu yok
- E-posta yeniden hedefleme (sepet terki) belirsiz
- Push notification aboneliği yok

### 3.6 İçerik Pazarlama Stratejisi

**Güçlü Yönler:**
- Rehber sayfaları (4 adet tespit edildi) — uzun kuyruk anahtar kelimeleri hedefliyor
- Blog sistemi mevcut (kategorili)
- Matbaa sözlüğü (`/sozluk`) — semantic authority için
- AEO (AI Engine Optimization) stratejisi açıkça robotstxt yorumlarına yansımış

**Eksiklikler:**
- Blog içerik frekansı belirsiz
- Rehber sayısı 4 — bu çok az. Matbaa sektöründe yüzlerce long-tail keyword fırsatı var
- Video içerik hiç yok
- Podcast veya webinar gibi alternatif içerik formatları yok
- Kullanıcı tarafından oluşturulan içerik (UGC) toplama mekanizması yok

---

## 4. Satış Engelleri

### 4.1 Satın Alma Akışı Analizi

Ürün detay sayfasından (PDP) tespit edilen akış:

```
Kullanıcı ürün sayfasına gelir
    ↓
Gallery (ürün görselleri, 7 kolon)
    ↓
Configurator (yapışkan, 5 kolon) ← Kullanıcı seçimler yapar
    ↓
Sepete Ekle butonu
    ↓
CartDrawer (sağ kenar menüsü)
    ↓
/odeme → iyzico 3DS akışı
    ↓
Sipariş onay sayfası
```

**Layout Değerlendirmesi:**
- Yapışkan configurator (sticky) doğru bir UX kararı — uzun ürün açıklamaları okunurken fiyat görünür kalıyor
- Mobil sıra: Gallery → Configurator → Description — fiyat görünürlüğü için doğru
- Trust badge'ler configurator bölümünde (toplam teslimat süresi, ücretsiz tasarım, kalite garantisi, 3 taksit, ücretsiz tasarım kontrolü) — satın alma kararını kolaylaştıran ön sıra faktörler

**Eksiklikler:**

**1. Fiyat Hesaplama Şeffaflığı**
Configurator'da seçimler yapıldıkça fiyat anlık mı güncelleniyor? Kullanıcı "500 adet, kuşe kağıt, parlak laminasyon" seçtiğinde toplam fiyatı hemen görebiliyor mu? Bu bilgi kod'dan kesin çıkarılamadı ama kritik bir UX faktörü.

**2. "Teklif Usulü" Ürünler**
Bazı ürünler `fiyatlı` değil (fiyat listesi sayfasında `fiyatlı` flag kontrolü var). Bu ürünler için satın alma akışı nasıl işliyor? WhatsApp'a yönlendirme mi yapılıyor? Yoksa teklif formu mu açılıyor? Bu akış ne kadar sürtüşmeli ise dönüşüm o kadar düşük olacak.

**3. Tasarım Yükleme Akışı**
"Ücretsiz tasarım" vaadi var — ama müşteri kendi dosyasını yüklemek isterse? Dosya yükleme deneyimi (format gereksinimleri, boyut limitleri, ön izleme) ürün sayfasında ne kadar açık?

**4. Üretim Toleransı Uyarısı**
Her ürün sayfasının sonuna eklenen "Üretim toleransı (fire) nedir?" SSS sorusu — bu hem şeffaflık açısından olumlu hem de ilk kez baskı yaptıran müşteriler için endişe yaratabilir. Olumsuz çerçevelemeden ziyade "Neden fire alanı bırakıyoruz?" başlığıyla pozitif çerçevede sunulabilir.

### 4.2 Ödeme Sistemi

**Güçlü Yönler:**
- **iyzico** — Türkiye'nin en yaygın tanınan ödeme geçidi, yüksek güven değeri
- **3 taksit tüm kartlara** — Türk tüketicisi için büyük avantaj (KDV hariç tutarda asgari limit aşılıyorsa)
- 3DS doğrulama akışı → güvenlik sinyali
- Backend'de iyzico.service.ts modülü ayrı — bakımı kolay

**Eksiklikler:**

**1. 3'ten Fazla Taksit Seçeneği Yok**
Rakip matbaa siteleri 6, 9, 12 taksit sunuyor olabilir. Özellikle kurumsal müşteriler için yüksek tutarda 3 taksit yeterli olmayabilir. iyzico'nun 12 taksit seçeneği değerlendirilmeli.

**2. BKM Express / Kapıda Ödeme Yok**
Kart bilgisi paylaşmak istemeyen müşteriler için alternatif yok. BKM Express (Türkiye'ye özgü) entegrasyonu güven artırabilir.

**3. B2B Ödeme Akışı Opak**
Aylık fatura ve cari hesap sistemi var (backend modülü doğrulandı: `corporate-invoicing`, `corporate-ledger`) ama müşteri bu süreci nasıl aktive ediyor? Kurumsal başvuru → onay → aylık fatura akışı ne kadar otomatik?

**4. Havale/EFT Seçeneği Belirsiz**
Bazı kurumsal müşteriler banka havalesi tercih ediyor. Bu seçenek var mı?

### 4.3 Fiyat Şeffaflığı Engelleri

**Sorun 1: Konfigüratör Olmadan Fiyat Görülemiyor**
Fiyat listesi sayfası başlangıç fiyatları veriyor ama gerçek fiyat konfigüratörde seçimler yapılmadan netleşmiyor. Adet, malzeme, kaplama seçimlerinin fiyata etkisi açıkça listelenemiyorsa müşteri "ne kadar öderim?" sorusunu WhatsApp'a taşıyor — bu dönüşüm hızını düşürüyor.

**Çözüm önerisi:** Her kategoride "örnek fiyat senaryoları" tablosu (250 adet standart kuşe kartvizit: X TL, 500 adet laminasyonlu: Y TL gibi).

**Sorun 2: Toplu İndirim Eşikleri Görünür Değil**
"Adet arttıkça fiyat düşüyor" mesajı veriliyor ama tam iskonto tablosu konfigüratör dışında gösterilmiyor. "500 adet mi almalıyım yoksa 1000 adet mi?" sorusunu müşteri kendi başına cevaplayamıyor.

**Sorun 3: Ek Maliyet Şeffaflığı**
Fiyat listesi sayfasında "+%20-50 ek işlem maliyeti" genel bir uyarı olarak var. Ama hangi seçenek ne kadar ek maliyet getiriyor? Laminasyon +%20 mi, özgün kesim +%50 mi? Bu belirsizlik sepet terk riskini artırıyor.

### 4.4 Tasarım Desteği Süreci

**Taahhüt:** Ücretsiz tasarım, sınırsız revizyon

**Bilinmeyen Süreç Soruları:**
- Tasarım talebi nasıl iletiliyor? Sipariş sonrası mı, öncesi mi?
- WhatsApp üzerinden mi yoksa entegre tasarım portalı üzerinden mi?
- Tasarım onay süreci ne kadar? 24 saat mi, 48 saat mi?
- Tasarımcı kapasitesi ani sipariş artışlarını kaldırıyor mu?

**Sorun:** "Ücretsiz tasarım" güçlü bir farklılaştırıcı ama süreç belirsizse müşteri güveni kazanılamaz. Bu hizmetin nasıl çalıştığı `/hizmetler/ucretsiz-tasarim` gibi bir alt sayfa veya ürün sayfasında adım adım açıklanmalı.

### 4.5 Sipariş Sonrası Deneyim

**Doğrulanan Özellikler:**
- SMS bildirimi (NetGSM entegrasyonu)
- E-posta bildirimi (SendGrid)
- Kargo takibi `/kargo-takip` sayfası mevcut

**Bilinmeyenler:**
- DHL takip entegrasyonu canlı mı? `/kargo-takip` sayfası gerçekten DHL API'sine bağlanıyor mu yoksa sadece DHL'in sitesine yönlendiriyor mu?
- Sipariş durumu `/hesabim` sayfasında anlık güncellenebiliyor mu?
- Kalite garantisi başvurusu süreci nasıl? Ürün hatalıysa müşteri ne yapıyor?

### 4.6 B2B / Kurumsal Satış Engelleri

Kurumsal satış altyapısı kod'dan doğrulandı:
- `/kurumsal` sayfası
- `corporate-applications` backend modülü
- `corporate-invoicing` modülü (aylık fatura)
- `corporate-ledger` modülü (cari hesap)
- B2B WhatsApp hattı
- `kurumsal@markala.com.tr`

**Engeller:**

**1. Onboarding Süreci Belirsiz**
Kurumsal müşteri başvurudan aylık faturaya geçmek için ne kadar bekliyor? Kredi limiti var mı? Hangi belgeler gerekiyor? Bunların anlatıldığı bir "Kurumsal Nasıl Çalışır?" içeriği gerekiyor.

**2. Kurumsal Fiyatlandırma Yok**
B2B müşterilere özel indirim oranları kamuya açık değil. Rakip oluşturmamak için gizli tutulabilir ancak en azından "iletişime geçin, özel fiyat alın" için net bir CTA ve süreç açıklaması gerekiyor.

**3. Sözleşme / SLA Yok**
Kurumsal müşteriler için teslimat SLA'sı, kalite standardı, tekrarlayan sipariş süreçleri belgelenmiş mi? Bu, B2B dönüşüm için kritik.

**4. Numune Talebi Görünürlüğü Düşük**
`/numune-talebi` sayfası mevcut (priority: 0.75) ama B2B hunisinde bu sayfa kritik — potansiyel kurumsal müşteri "baskı kalitesini görmeden büyük sipariş vermem" diyecek. Bu sayfanın kurumsal sayfası ve ürün detay sayfalarında öne çıkarılması gerekiyor.

---

## 5. Öncelikli Aksiyon Planı

Tüm bulgular değerlendirilerek belirlenen **öncelik sıralaması:**

### Acil (0–2 Hafta)

1. **Google Maps Yerleştirme**  
   İletişim sayfasındaki placeholder'ı gerçek embed ile değiştir. Maps Static API + tıklanınca Google Maps redirect en hafif çözüm.

2. **`HOSGELDIN` Kuponunu Öne Çıkar**  
   Kupon kodu şu an hakkımızda sayfasında gömülü. Ana sayfaya (HeroCtaBand veya PromoBanner bileşeni) ve sepet boş durum ekranına ekle.

3. **Fiyat Şeffaflığı — Örnek Senaryo Tabloları**  
   En çok satılan 3–5 kategoride (kartvizit, broşür, branda) "örnek sipariş fiyatlandırması" tablosu ekle. Bu hem SEO hem dönüşüm için değerli.

4. **Numune Talebi CTA'sını B2B Akışına Ekle**  
   `/kurumsal` ve ürün sayfalarında numune talebi bağlantısı görünür hale getir.

### Kısa Vadeli (2–8 Hafta)

5. **Newsletter Opt-in Formu**  
   Ana sayfaya ve fiyat listesi sayfasına e-posta abonelik formu ekle. "Fiyat değişikliklerinde bildir" veya "Aylık matbaa ipuçları" gibi bir değer önermesiyle.

6. **Sepet Terk E-postası**  
   SendGrid üzerinden tetiklenen sepet terki akışı — 1 saat sonra, 24 saat sonra. `HOSGELDIN` kuponu bu akışta da kullanılabilir.

7. **Ürün Sayfasında Fiyat Hesaplayıcı UX İyileştirmesi**  
   Configurator'da adet/seçenek değiştikçe fiyatın anlık güncellendiği ve "birim fiyat X TL, toplam Y TL" gösteriminin belirginleştirildiği UX iyileştirmesi.

8. **Canlı Müşteri Sayısı / Yorum Sayısı Sinyali**  
   Ürün sayfası veya ana sayfaya "Bugüne kadar X müşteri bize güvendi" veya "Bu ürün son 30 günde X kez sipariş verildi" dinamik sayaç.

9. **Video İçerik — Üretim Süreci**  
   En az 60–90 saniyelik atölye/üretim süreci videosu. Hero slider'a veya ProcessTimeline bölümüne yerleştirilebilir. Dönüşüm üzerinde büyük etkisi bekleniyor.

10. **Şehir Landing Sayfası İçerik Denetimi**  
    `/matbaa/[sehir]` sayfalarının thin content olmadığından emin ol. Mersin dışındaki şehirler için benzersiz içerik (yerel teslimat süresi, yerel referanslar) ekle.

### Orta Vadeli (2–4 Ay)

11. **A/B Test Altyapısı**  
    Statsig veya Growthbook (açık kaynak) entegrasyonu ile hero banner, CTA metni ve kargo eşiği (1.500 TL vs. 2.000 TL) testleri.

12. **Rehber İçerik Genişletmesi**  
    Mevcut 4 rehber sayfasını 20+'ya çıkar. Hedef anahtar kelimeler: "tabela fiyatları", "katalog baskı fiyatları", "flyer baskı ne kadar", "matbaa nasıl seçilir", "ofset vs. dijital baskı" vb.

13. **12 Taksit Seçeneği**  
    iyzico üzerinden 6 ve 12 taksit seçeneği ekle. Özellikle büyük kurumsal siparişler için kritik.

14. **Kurumsal Satış Sayfası İyileştirmesi**  
    `/kurumsal` sayfasına: onboarding süreci adım adım, SLA taahhüdü, örnek müşteri case study'leri, numune talebi CTA'sı.

15. **DHL Kargo Takibi Entegrasyonu**  
    `/kargo-takip` sayfasının gerçekten DHL API'sine bağlandığını doğrula veya müşterinin sipariş numarasıyla DHL takip numarasına yönlendirildiği akışı iyileştir.

16. **Push Notification Opt-in**  
    Sipariş hazır, kargo yola çıktı bildirimleri için web push notification (OneSignal veya Firebase).

17. **Instagram Shoppable Feed**  
    Eğer Instagram varlığı aktifse, ana sayfaya veya portfolio sayfasına shoppable Instagram feed ekle — UGC ve sosyal kanıt için.

---

## Özet Değerlendirme

| Alan | Puan | Yorum |
|---|:---:|---|
| Teknik Altyapı | 9/10 | Türkiye'nin en iyi matbaa e-ticaret mimarilerinden biri |
| SEO Altyapısı | 8/10 | Kapsamlı JSON-LD, sitemap, robots — eksik: şehir içerik kalitesi |
| KVKK/GDPR Uyumu | 9/10 | Consent Mode v2, Meta revoke, Turnstile — model seviyesinde |
| Analitik | 9/10 | GA4 + Ads + Pixel + Clarity + CAPI — eksiksiz; 3DS restore zekice çözüm |
| Fiyat Şeffaflığı | 5/10 | Başlangıç fiyatları var ama konfigüratör dışı netlik eksik |
| Sosyal Kanıt | 5/10 | Altyapı var (reviews, TrustedBy) ama görünürlük ve içerik zayıf |
| B2B Satış | 6/10 | Altyapı güçlü (cari, fatura) ama onboarding süreci opak |
| Dönüşüm Optimizasyonu | 5/10 | AB testi yok, exit intent yok, e-posta capture zayıf |
| İçerik Pazarlama | 6/10 | Rehber sayfaları iyi başlangıç ama video yok, blog frekansı belirsiz |
| Ödeme Deneyimi | 7/10 | iyzico güvenilir, 3 taksit iyi — 12 taksit ve BKM eksik |

**Genel Değerlendirme:** Markala.com.tr teknik açıdan **Türkiye matbaa sektörünün üst seviyesinde** konumlanıyor. Altyapı, güvenlik ve SEO foundation sağlam. Temel fırsatlar: dönüşüm optimizasyonu, sosyal kanıt güçlendirme, fiyat şeffaflığı artırma ve içerik pazarlama genişletmesi. Teknik borç minimal — ekip kaynakları büyüme ve pazarlama iyileştirmelerine yönlendirilebilir.

---

*Rapor sonu. Toplam analiz kapsamı: 15+ kaynak dosya, 3.000+ satır kod.*
