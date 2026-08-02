# Markala.com.tr — Kapsamlı Teknik & Pazarlama Analizi

> **Hazırlayan:** Claude (Anthropic) — Kaynak kod incelemesi  
> **Tarih:** Ağustos 2026  
> **Kapsam:** `apps/web` (Next.js 14), layout, header, footer, ana sayfa, fiyat listesi, README, env yapılandırması  
> **Durum:** Proje Faz 2 tamamlandı / Faz 3 iskelet hazır (canlı entegrasyonlar henüz bağlanmadı)

---

## 1. Teknoloji Stack

### Frontend
| Katman | Teknoloji | Versiyon | Not |
|--------|-----------|----------|-----|
| Framework | Next.js (App Router) | ^14.2.18 | ISR destekli, server components ağırlıklı |
| Dil | TypeScript | ^5.6.3 | Tüm paketlerde strict mode |
| Stil | Tailwind CSS | ^3.4.14 | Özel tasarım token'ları (`brand-500`, `paper-50`, `ink-900`) |
| Animasyon | Framer Motion | ^11.11.17 | Header, mega menü, search modal, mobile drawer |
| Smooth Scroll | Lenis | ^1.1.16 | Sayfa geneli akıcı kaydırma |
| 3D Hero | React Three Fiber | — | Uçuşan A4 kağıtlar + sarı mürekkep damlası animasyonu |
| State (Sepet) | Zustand | ^5.0.14 | CartDrawer + CartStore |
| İkonlar | Phosphor Icons | ^2.1.7 | |
| Font | DM_Sans (runtime) | — | ⚠️ README Fraunces+Jakarta Sans diyor — tutarsızlık var |
| Görseller | Sharp | ^0.33.5 | Next.js image optimization |

### Backend & Altyapı
| Katman | Teknoloji | Durum |
|--------|-----------|-------|
| API | NestJS + Prisma + PostgreSQL | İskelet hazır, canlıda değil |
| Paket Yöneticisi | pnpm@10.33.3 (workspaces) | Aktif |
| CDN / DNS | Cloudflare | Aktif |
| Nesne Depolama | Cloudflare R2 (`uploads.markala.com.tr`) | Yapılandırıldı |
| Hosting | Hetzner CX22 + Nginx (SSL) | Aktif |
| CI/CD | GitHub Actions → Hetzner VPS | Aktif |
| Hata Takibi | Sentry (`@sentry/nextjs ^8.40.0`) | Entegre |
| E-posta | SendGrid | ❌ BAĞLI DEĞİL — `console.log` fallback |
| Ödeme | iyzico | ❌ BAĞLI DEĞİL — mock 3D Secure |
| SMS | NetGSM | ❌ BAĞLI DEĞİL |
| E-Fatura | Paraşüt | ❌ BAĞLI DEĞİL |
| Kargo | DHL Express | ❌ BAĞLI DEĞİL |
| AI | Anthropic Claude (claude-haiku-4-5) | Opsiyonel — bağlantı hazır |

### Analytics & İzleme
- **GA4** (`NEXT_PUBLIC_GA4_ID`)
- **Microsoft Clarity** (`NEXT_PUBLIC_CLARITY_ID`)
- **Hotjar** (`NEXT_PUBLIC_HOTJAR_ID`)
- **Google Tag Manager** (`NEXT_PUBLIC_GTM_ID`)
- **Web Vitals** bileşeni (Core Web Vitals otomatik raporlama)
- **Cloudflare Turnstile** (bot koruması — bileşen mevcut)

### Test Altyapısı
- **Vitest** — birim testler
- **Playwright** — E2E + görsel regresyon testleri

### Monorepo Paketleri
```
markala/
├── apps/web         → Next.js 14 (port 3000)
├── apps/admin       → Admin paneli (port 3001)
├── apps/api         → NestJS API (port 4000)
└── packages/
    ├── @markala/ui          → Paylaşılan UI bileşenleri
    ├── @markala/types       → TypeScript tipleri
    ├── @markala/mock-data   → Geliştirme mock verisi
    ├── @markala/api-client  → API istemcisi
    └── @markala/config      → Paylaşılan yapılandırma
```

---

## 2. Site Yapısı ve Sayfalar

### Ana Sayfalar
| URL | Sayfa | ISR | Durum |
|-----|-------|-----|-------|
| `/` | Anasayfa | 300 sn | ✅ Tam |
| `/urunler` | Ürün kataloğu | — | ✅ Hazır |
| `/urun/[slug]` | Ürün detayı | — | ✅ Hazır |
| `/kategori` | Kategori listesi | — | ✅ Hazır |
| `/fiyat-listesi` | Fiyat listesi | — | ✅ Tam (860 ürün) |
| `/sepet` | Sepet | — | ✅ Hazır |
| `/giris` | Giriş | — | ⚠️ Mock auth |
| `/kayit` | Kayıt | — | ⚠️ Mock auth |
| `/hesabim/*` | Hesap (10 alt sayfa) | — | ⚠️ Mock |
| `/odeme/basarili` | Ödeme başarılı | — | ⚠️ Mock |
| `/odeme/hata` | Ödeme hatası | — | ⚠️ Mock |

### Pazarlama Sayfaları
| URL | İçerik | Durum |
|-----|--------|-------|
| `/hakkimizda` | Kurumsal tanıtım | ✅ |
| `/iletisim` | İletişim | ✅ |
| `/referanslar` | Referanslar | ✅ |
| `/portfolio` | Portfolyo | ✅ |
| `/hizmetler/[slug]` | Hizmet detayları | ✅ |
| `/kampanyalar` | Kampanyalar | ❌ Kasıtlı gizlendi (2026-07-06) |
| `/teklif-al` | Teklif formu | ✅ |
| `/numune-talebi` | Numune talebi | ✅ |
| `/kurumsal/basvuru` | Kurumsal başvuru | ✅ |

### SEO & İçerik Sayfaları
| URL | İçerik | Durum |
|-----|--------|-------|
| `/blog/[slug]` | Blog yazıları | ⚠️ Stub — içerik yok |
| `/blog/kategori` | Blog kategorileri | ⚠️ Stub |
| `/rehber/*` | 4 adet rehber makalesi | ✅ Hazır |
| `/sozluk` | Matbaa terimleri sözlüğü | ✅ |
| `/matbaa/[city]` | Şehre özel SEO sayfaları | ⚠️ İçerik kalitesi bilinmiyor |
| `/fiyat-listesi` | Fiyat listesi + şema | ✅ Kapsamlı |

### Yasal & Destek Sayfaları
| URL | Durum |
|-----|-------|
| `/yasal/mesafeli-satis` | ✅ |
| `/legal/kvkk-aydinlatma` | ✅ |
| `/kvkk-basvuru` | ✅ |
| `/yardim/[slug]` | ✅ |
| `/kargo-takip` | ✅ |
| `/bulten-cikis` | ✅ |
| `/sifre-sifirla` | ✅ |
| `/eposta-dogrula` | ✅ |
| `/favorilerim` | ✅ (localStorage) |

### Anasayfa Bölümleri (Sırasıyla)
1. **HowToProductionJsonLd** — Schema.org yapısal verisi
2. **PremiumHeroSlider** — Admin panelinden yönetilen DB slaytları
3. **HeroCtaBand** — Fiyat çıpası + gerçek ürün CTA'sı
4. **PromoBanner** — Kampanya bandı
5. **TrustBadges** — Güven rozetleri
6. **ProductRail** (En çok satılanlar, 12 ürün)
7. **TrustedBy** — Referans logolar
8. **ProcessTimeline** — Sipariş süreci
9. **ProductRail** (Yeni gelenler, 12 ürün)
10. **CategoryGrid** — Kategori ızgarası
11. **SectorShowcase** — Sektör vitrine
12. **CustomerReviews** — Müşteri yorumları

---

## 3. Eksik Özellikler

### Kritik (Faz 3 — Acil)

**Gerçek Ödeme Altyapısı (iyzico)**  
Şu an tüm ödemeler mock 3D Secure ile simüle ediliyor. Site gerçek satış yapamıyor. Bu tek başına en büyük engeldir.

**E-posta Sistemi (SendGrid)**  
Sipariş onayı, kargo bildirimi, şifre sıfırlama e-postaları `console.log`'a düşüyor. Hiçbir otomatik e-posta müşteriye ulaşmıyor.

**Gerçek Kimlik Doğrulama**  
Auth sistemi her e-postayı şifresiz kabul ediyor. Google Sign-In bileşeni mevcut ama gerçek OAuth bağlantısı yok.

**Kargo Entegrasyonu (DHL)**  
Kargo takip altyapısı var (`/kargo-takip` sayfası), ancak gerçek DHL API bağlantısı yok.

**SMS Bildirimleri (NetGSM)**  
Sipariş/kargo SMS stub durumunda. `NETGSM_HEADER=MARKALA` .env'de tanımlı ama bağlı değil.

**E-Fatura (Paraşüt)**  
E-ticaret için e-fatura zorunluluğu var. Paraşüt stub durumunda, vergi uyumu riski oluşturuyor.

### Önemli (Faz 4 — Yakın Dönem)

**Blog İçeriği**  
`/blog/[slug]` ve `/blog/kategori` rotaları mevcut ama içerik yok. Blog, organik trafik için kritik bir SEO kanalı.

**Gerçek Müşteri Yorumları**  
`CustomerReviews` bileşeni muhtemelen mock veri kullanıyor. Gerçek review entegrasyonu (Google Reviews API veya kendi sistemi) yok.

**ETBİS Kaydı**  
Footer'da ETBİS rozeti `<!-- ETBİS rozeti -->` olarak yoruma alınmış. Kayıt tamamlanmamış. E-ticaret siteleri için zorunlu.

**KEP E-posta Adresi**  
Footer'da KEP adresi yoruma alınmış. PTT KEP kaydı bekliyor. Resmi bildirimler için gerekli.

**Wishlist Sunucu Entegrasyonu**  
Favori listesi yalnızca `localStorage`'da tutuluyor (`markala_wishlist`). Kullanıcı tarayıcı değiştirdiğinde veya çıkış yaptığında kayboluyor. Hesap tabanlı sunucu senkronizasyonu yok.

**Ürün Karşılaştırma**  
Rakip matbaa sitelerinde standart olan ürün karşılaştırma özelliği yok.

**Canlı Stok Takibi**  
Stok durumu ve gerçek zamanlı envanter yönetimi API bağlantısı yok.

**Terk Edilmiş Sepet E-postası**  
Otomatik sepet hatırlatma e-postası sistemi yok. Yüksek ROI'lu bir dönüşüm aracı.

**Kupon Sistemi**  
Yalnızca 1 kupon kodu çalışıyor: `HOSGELDIN` (%10 indirim). Çok kuponlu, segmentlere göre kampanya altyapısı yok.

**Canlı Destek**  
WhatsApp linki var ama bot/otomatik yanıt yok. Canlı chat widget entegrasyonu (Tawk.to, Intercom vb.) yok.

**AI Özellikleri**  
`ANTHROPIC_MODEL=claude-haiku-4-5` .env'de tanımlı. Ürün önerileri, tasarım asistanı veya sipariş destek botu için potansiyel var ama hiçbiri implemente edilmemiş.

---

## 4. Pazarlama Hataları

### Marka Tutarsızlığı — Font Sorunu
README, marka fontunu **Fraunces (serif başlık) + Plus Jakarta Sans (gövde)** olarak belirliyor. Ancak `apps/web/src/app/layout.tsx` yalnızca **DM_Sans** yüklüyor. Fraunces ve Plus Jakarta Sans hiçbir yerde kullanılmıyor. Bu, tasarım direktifi ile implementasyon arasında ciddi bir kopukluk. Marka kimliği tutarsız.

### Kampanyalar Sayfası Gizlendi
`/kampanyalar` rotası mevcut ama header'da `{false && <Link href="/kampanyalar">}` ile kasıtlı gizlendi (Hasan talebi 2026-07-06 notu). Kullanıcılar kampanyalara menüden ulaşamıyor. Kampanyalar sayfası dönüşüm için kritik bir araç — ya aktif tutulmalı ya da tamamen kaldırılmalı.

### Yalnızca Bir İndirim Kodu
Tek çalışan kupon: `HOSGELDIN` (%10). Segmentlere özgü kampanyalar (B2B, sezonluk, doğum günü, yeniden aktivasyon) oluşturulamamıyor. Sepet terk oranını düşürmek için fırsat kaçırılıyor.

### TrustedBy / CustomerReviews — Mock Veri Riski
`TrustedBy` (referans logolar) ve `CustomerReviews` (müşteri yorumları) bileşenleri büyük olasılıkla `@markala/mock-data` kullanıyor. Canlı sitede mock sosyal kanıt gösterilmesi güven kaybı yaratır ve potansiyel olarak yanıltıcıdır.

### "324 Ajans Güvencesiyle" Mesajı — Çift Kimlik Sorunu
Header, footer ve meta açıklamada hem "Markala" hem "324 Ajans" markaları öne çıkarılıyor. Bu, müşterinin kim olduğunu anlaması için kafa karışıklığı yaratabilir. Markala bağımsız bir marka olarak konumlandırılıyorsa 324 Ajans referansı ikincil plana itilmeli; yoksa doğrudan "324 Ajans matbaa" olarak gitmeli.

### Ücretsiz Kargo Eşiği İletişimi
Ücretsiz kargo eşiği 1.500 TL, altında 79 TL. Bu bilgi fiyat listesi sayfasında var ama anasayfada, ürün sayfalarında ve sepette ne kadar daha eklenince ücretsiz kargo kazanılacağını gösteren dinamik bir progress bar veya mesaj yok. Bu eksiklik ortalama sipariş değerini düşürüyor.

### Hizmet Alanı Çelişkisi — "81 İle" vs. "Mersin"
Header üst bandında "81 ile teslimat" yazarken, footer'da Mersin ilçe linkleri ağırlıklı. SEO metadatasında `mersin matbaa` anahtar kelimesi var. Bu yerel-ulusal gerilim müşteri zihninde konumlandırma belirsizliği yaratıyor. Birini seçip tutarlı olmak gerekiyor.

### Sektör Görseli — İçerik Eksikliği
`SectorShowcase` bileşeni sektörel hedefleme yapıyor (restoran, otel, ISG vb.) ama bu sektörlere yönelik landing page veya özelleştirilmiş içerik yok. Tıklayıp giden kullanıcıya ilgili içerik sunulmuyor.

---

## 5. Satış Engelleri

### En Büyük Engel: Ödeme Sistemi Çalışmıyor
Ziyaretçi sepete ürün ekleyip ödeme ekranına geliyor, ancak gerçek para tahsilatı yapılamıyor. Bu, site canlıya alınmadan önce çözülmesi gereken #1 öncelik.

### Auth Güvenlik Açığı
Herhangi bir e-posta adresi, şifre olmadan hesap açabiliyor. Bu canlı ortamda kabul edilemez. Gerçek kimlik doğrulama sistemine geçilmeden müşteri verileri güvende değil.

### Checkout Güveni — Eksik Sosyal Kanıtlar
Ödeme akışında sertifika/güven rozetleri yetersiz. Footer'da iyzico ve Troy logolar var ama ödeme sayfasında SSL, iyzico, 3D Secure rozetlerinin görünür olması dönüşümü artırır.

### Ürün Görseli Zinciri — Kırık Fallback Riski
Header mega menüde ürün görselleri `https://api.markala.com.tr/uploads/products/${slug}.jpg?v=3` adresinden çekiliyor, başarısız olursa `/api/mockup?slug=...` mock görsel servis ediliyor. API canlıya alınmadan gerçek görseller yüklenmiyor. Kullanıcılar placeholder görseller görüyor.

### Fiyat Listesi — Satın Alma Akışına Geçiş Yok
`/fiyat-listesi` sayfası 860 ürün fiyatını gösteriyor ama ürünleri doğrudan sepete ekleme özelliği yok. WhatsApp ve telefon CTA'sına yönlendiriyor. Bu, sipariş vermek isteyen dijital alışveriş yapan kullanıcıyı manuel sürece itiyor ve dönüşümü öldürüyor.

### Arama Deneyimi — Gerçek Zamanlı Sonuç Güvencesi
`SearchModal` 2+ karakterden sonra debounced (250ms) server search yapıyor. Ancak API henüz canlıda değilse arama sonuçsuz dönüyor. Kullanıcı arama yapıp sonuç bulamazsa güven kaybı yaşıyor.

### Wishlist Kalıcılığı Yok
Favori listesi localStorage'da — kullanıcı başka cihazdan girdiğinde veya çıkış yaptığında kayboluyor. B2B müşteriler birden fazla cihazdan giriyor, bu önemli bir UX kaybı.

### Sepet Hatırlatması Yok
Sepete ürün ekleyip ayrılan kullanıcıya herhangi bir hatırlatma e-postası veya SMS gitmiyor (entegrasyonlar bağlı değil). Ortalama e-ticaret terk sepet kurtarma oranı %15'tir — bu tamamen kaçırılıyor.

### Tek Kupon — İndirim Stratejisi Yok
Yalnızca `HOSGELDIN` kuponu var. Tekrar müşteriye yönelik sadakat kuponu, B2B müşteriye toplu sipariş kuponu, sezonluk indirim vb. oluşturulamıyor.

### Numune + Teklif Süreci — Manuel
`/numune-talebi` ve `/teklif-al` sayfaları form gönderiyor ama otomatik takip e-postası gitmiyor (SendGrid yok). Talep gönderen müşteri sessizliğe gömülüyor.

---

## 6. SEO Sorunları

### Güçlü Yönler (Doğru Yapılanlar)

**Schema.org Yapısal Verisi**  
- `OrganizationJsonLd` + `LocalBusinessJsonLd` her sayfada `<head>`'de
- `HowToProductionJsonLd` anasayfada (sipariş süreci adımları)
- `BreadcrumbJsonLd` fiyat listesinde
- `ItemList` fiyat listesinde (yalnızca `name+url` — GSC "Satıcı girişleri" uyarısından kaçınmak için bilinçli tercih, doğru karar)

**Teknik SEO Temeli**  
- `<html lang="tr">` — doğru
- `metadataBase: https://markala.com.tr` — canonical kök tanımlı
- `%s · Markala` title şablonu tutarlı
- Robots meta: `index: true, follow: true, max-image-preview: large, max-snippet: -1`
- OG image: `/og-default.png` (1200×630 PNG — SVG değil, crawler uyumlu)
- Twitter card: `summary_large_image`
- Google + Yandex + Bing doğrulama desteği

**Local SEO**  
- Footer'da Mersin ilçeleri + komşu şehirler linkleri (Antalya, Adana, Gaziantep, Hatay, Şanlıurfa, Osmaniye)
- `/matbaa/[city]` dinamik şehir sayfaları
- `LocalBusinessJsonLd` fiziksel adres ile (Yenişehir / Mersin)
- WhatsApp: `905319004102`, Tel: `0324 433 33 51`

**ISR Yapılandırması**  
- Anasayfa: `revalidate = 300` (5 dakika)
- Katalog: `revalidate: 30` (30 saniye — güncel fiyat için)

**Sayfa Hızı Önlemleri**  
- `preconnect` + `dns-prefetch` → `api.markala.com.tr`
- `DM_Sans` — `display: swap` ile next/font (layout shift minimize)
- `sharp` image optimization
- LCP için cross-origin bağlantı önceden kurduruluyor

### Sorunlar

**Font Tutarsızlığı → Marka Sinyali**  
README'de belirtilen Fraunces (serif) başlık fontu hiç yüklenmiyor. Arama motorları içerik sinyali için başlık hiyerarşisini değerlendirir — serif başlık fontu olmadan premium matbaa markası mesajı görsel düzeyde verilemiyor.

**Blog İçerik Eksikliği — Büyük Kaçırılan Fırsat**  
Blog rotaları var ama içerik yok. Matbaa sektöründe "kartvizit tasarım ipuçları", "broşür baskı kaç gün sürer", "ISO 9001 matbaa nedir" gibi long-tail sorguları yüksek arama hacmine sahip. Her boş blog sayfası, indexlenen ince içerik (thin content) riski taşır.

**MAX_ROWS_PER_CATEGORY = 20 — Crawl Bütçesi Geçici Çözümü**  
Fiyat listesi sayfasında 860 ürünün tamamı gösterilince sayfa 2.17MB oluyor ve Googlebot'un 2MB crawl limitini aşıyor. Bu yüzden her kategoride maksimum 20 satır gösteriliyor. Bu akıllıca bir geçici çözüm ama gerçek çözüm paginated veya ayrı ürün sayfaları.

**Şehir Sayfaları — İçerik Kalitesi Bilinmiyor**  
`/matbaa/[city]` sayfaları var ama içerik kalitesi kontrol edilmedi. Eğer bu sayfalar birbirinden kopyalanmış ince içerik içeriyorsa Google tarafından duplicate content olarak cezalandırılabilir.

**Rehber Sayısı Yetersiz**  
Yalnızca 4 statik rehber makalesi var (`branda-baski-m2-fiyati-2026`, `brosur-baski-fiyatlari-2026`, `isg-zorunlu-uyari-levhalari`, `kartvizit-fiyatlari-2026`). Matbaa kategorisinde onlarca niyet tabanlı sorgu karşılanmayı bekliyor.

**Backlink Profili Bilinmiyor**  
Kod analizinden backlink durumu değerlendirilemiyor ama domain markala.com.tr yeni görünüyor. DR (Domain Rating) muhtemelen düşük. İçerik + link building stratejisi olmadan organik büyüme sınırlı kalır.

**ETBİS Yokluğu — Güven & Teknik SEO**  
ETBİS rozeti yorumda. E-ticaret sitelerinde ETBİS, Türk kullanıcılar için önemli bir güven sinyali. Ayrıca bu resmi kayıt, belirli arama motorlarında sıralama sinyali olabilir.

**Keywords Meta Tag — Değersiz ama Gürültülü**  
`layout.tsx`'te 22 anahtar kelime `keywords` meta tag'inde listeleniyor. Google bu tag'i 2009'dan beri ignore ediyor. Zararlı değil ama işlevsiz — kaldırılabilir veya bırakılabilir.

---

## 7. Öneriler

### Faz 3 — Hemen Yapılacaklar (Canlı Önkoşullar)

**iyzico Entegrasyonu**  
Ödeme sistemi bağlanmadan site ticaret yapamaz. iyzico sandbox testlerini tamamlayıp canlıya alınması en yüksek öncelik. Mock 3D Secure kaldırılmalı.

**SendGrid Entegrasyonu**  
`console.log` yerine gerçek e-posta gönderimine geçilmeli. Minimum gereksinimler:
- Sipariş onay e-postası
- Kargo bildirimi
- Şifre sıfırlama
- Numine/teklif talebi otomatik yanıtı

**Gerçek Auth (JWT + bcrypt)**  
Her e-postanın şifresiz giriş yapabilmesi canlı ortamda kabul edilemez. Google OAuth entegrasyonu için bileşen zaten var — aktive edilmeli.

**ETBİS Kaydı**  
Zorunlu yasal gereksinim. Başvuru yapılmalı ve rozet aktif edilmeli.

**KEP E-posta Kaydı**  
PTT KEP adresi alınmalı, footer'daki yorum kaldırılmalı.

### Faz 4 — Kısa Vadeli (1-3 Ay)

**Blog İçerik Stratejisi**  
Minimum 20 adet orijinal içerik yayınlanmalı. Önerilen konular:
- "Kartvizit baskı kaç günde teslim edilir?"
- "Broşür kağıt gramajı nasıl seçilir?"
- "Branda baskı m² fiyatı 2026"
- "İSG levhaları zorunlu mu?"
- Sektörel rehberler (restoran, inşaat, sağlık)

**Fiyat Listesine Sepet Butonu**  
`/fiyat-listesi` sayfasındaki ürünlere doğrudan "Sepete Ekle" veya "Sipariş Ver" butonu eklenmeli. WhatsApp'a yönlendirme kayıp sinyali.

**Wishlist → Sunucu Senkronizasyonu**  
Giriş yapmış kullanıcıların favorileri veritabanında tutulmalı. LocalStorage-only yaklaşım cihazlar arası deneyimi kırıyor.

**Kupon Sistemi Genişletme**  
Admin panelinden çoklu kupon oluşturulabilmeli: minimum sipariş miktarı, kullanım limiti, segment kısıtlaması, geçerlilik tarihi.

**Ürün Görselleri**  
API canlıya alındıktan sonra tüm kategoriler için gerçek ürün fotoğrafları yüklenmeli. Mock görsel fallback üretim ortamında kaldırılmalı.

**Sepet Terk Bildirimi**  
SendGrid entegrasyonu sonrası: kullanıcı sepet doluyken 24 saat ayrılırsa otomatik hatırlatma e-postası.

### Faz 4+ — Orta Vadeli (3-6 Ay)

**Font Düzeltme**  
README'deki marka direktifine uyulmalı: **Fraunces** (serif başlıklar) + **Plus Jakarta Sans** (gövde metni) yüklenmeli. DM_Sans kaldırılabilir veya ikincil role indirilebilir. Bu hem marka tutarlılığı hem de premium görünüm için kritik.

**Google Reviews Entegrasyonu**  
`CustomerReviews` bileşenine gerçek Google My Business yorumları çekilmeli. Alternatif olarak Trustpilot veya Yotpo.

**AI Ürün Önerileri**  
Anthropic API altyapısı hazır — sipariş geçmişine veya kategori ziyaretlerine göre "Bunları da beğenebilirsin" önerileri implemente edilebilir.

**Terk Edilmiş Sepet SMS**  
NetGSM entegrasyonu sonrası: e-posta açılmayan kullanıcılara SMS hatırlatma.

**Ürün Karşılaştırma**  
Aynı kategorideki ürünleri yan yana karşılaştırma özelliği — özellikle B2B müşteriler için değerli.

**B2B Portal**  
Kurumsal müşteriler için özel fiyatlandırma, toplu sipariş yönetimi ve fatura entegrasyonu arayüzü. `/kurumsal/basvuru` sayfası mevcut — geliştirilebilir.

**Kampanyalar Sayfasının Aktivasyonu**  
Header'da gizlenen kampanyalar linki açılmalı — ya gerçek içerikle doldurulmalı ya da silinmeli. Gizli tutmak SEO açısından değer kaybı.

**Paragmatik İçerik Pazarlaması**  
`/rehber/` bölümü 4 makaleden 20+'ya çıkarılmalı. `/sozluk` sayfası (`matbaa terimleri`) backlink çeken değerli bir kaynak olabilir — genişletilmeli.

**Performans İzleme**  
Sentry aktif, Web Vitals takibi var. Ancak Hotjar ve Clarity heatmap verileri düzenli analiz edilmeli, "kullanıcı nerede kayboldu" sorusu cevaplanmalı.

---

## 8. Özet Değerlendirme

| Kriter | Puan | Açıklama |
|--------|------|----------|
| Teknik Mimari | 9/10 | Monorepo, Next.js 14 App Router, ISR, TypeScript — çok sağlam |
| Kod Kalitesi | 8/10 | Temiz, iyi yorumlanmış, WCAG uyumlu |
| UI/UX Tasarımı | 8/10 | Premium görünüm, 3D hero, Framer Motion — etkileyici |
| SEO Altyapısı | 7/10 | Güçlü teknik temel, içerik eksikliği önemli fırsat kaybı |
| Pazarlama Etkinliği | 5/10 | Konumlandırma var ama kampanyalar, kuponlar, sosyal kanıt eksik |
| Dönüşüm Optimizasyonu | 3/10 | Ödeme yok, e-posta yok, sepet hatırlatması yok |
| E-ticaret Olgunluğu | 3/10 | Faz 2 mock aşaması — gerçek ticaret yapılabilir değil |
| Yasal Uyum | 5/10 | KVKK var, ETBİS yok, KEP yok, e-fatura yok |

**Genel Durum:** Site teknik açıdan olağanüstü iyi tasarlanmış ve görsel olarak etkileyici. Ancak iyzico, SendGrid ve gerçek auth entegrasyonları olmadan ziyaretçiyi müşteriye dönüştürme kapasitesi sıfır. Bu üç entegrasyon tamamlanana kadar site bir pazarlama demo'sundan ibaret. Canlı ticaret için Faz 3 entegrasyonları en yüksek öncelik.

---

*Bu analiz `apps/web` kaynak kodu, README.md, .env.production.example ve ana bileşenlerin doğrudan incelenmesine dayanmaktadır. Backend (apps/api) ve admin (apps/admin) paketleri bu analize dahil edilmemiştir.*
