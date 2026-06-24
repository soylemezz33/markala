# Anasayfa Bölümleri — Değerlendirme & Öneri (2026-06-24)

Hasan'ın sorusu: "Şu bölümler anasayfada olmalı mı? Öne Çıkan Ürünler / Sektörlere Göre Ürünler / Sezonun Favorileri / Referanslar / Blog İçerikleri."

## Mevcut anasayfa sırası (page.tsx)
1. PremiumHeroSlider (yeni, dark, 3 slayt) ✅
2. PromoBanner (hero konumu)
3. TrustBadges (güven şeridi)
4. ProductRail — **Çok satılanlar** (bestseller)
5. TrustedBy (referans/logo şeridi)
6. ProcessTimeline (nasıl çalışır)
7. ProductRail — **Katalogdaki yenilikler** (yeni gelenler)
8. CategoryGrid (kategori ızgarası)
9. CustomerReviews (müşteri yorumları)

## Bölüm bazında karar

| Bölüm | Mevcut? | Karar | Gerekçe |
|---|---|---|---|
| **Öne Çıkan Ürünler** | ✅ "Çok satılanlar" | **KAL** | En güçlü dönüşüm bloğu; matbaada "ne basılır" sorusuna ilk cevap. |
| **Sektörlere Göre Ürünler** | ❌ yok | **EKLE (yüksek değer)** | Matbaa müşterisi "ben restoranım, ne lazım?" diye düşünür. B2B'ye birebir uyar + yeni /teklif-al sektör alanını besler. |
| **Sezonun Favorileri** | ~ "Yeni gelenler" | **BİRLEŞTİR** | Matbaada mevsimsellik zayıf. Ayrı kalıcı bölüm yerine "Yeni Gelenler" + kampanyalar yeterli. Kalıcı "sezon" bölümü boş/yapay durur. |
| **Referanslar** | ✅ TrustedBy (logo) | **KAL (logo)** | Logo şeridi güven verir. Detaylı vaka/yorum ayrı `/referanslar` sayfasında kalsın; anasayfada logo şeridi yeterli. |
| **Blog İçerikleri** | ❌ yok | **ERTELE** | Blogda şu an 1 yazı var. 3+ kaliteli yazı olana kadar anasayfaya koymak boş/zayıf görünür. İçerik birikince ekle. |

## Önerilen aksiyon (uygulanırsa)
**Tek yüksek-değerli ekleme: "Sektörünüze Özel" bölümü.**
- 6 sektör kartı: Restoran & Kafe / Otel & Konaklama / Mağaza & Perakende / İnşaat & Sanayi / Etkinlik & Organizasyon / Kurumsal & Ofis.
- Ürünler sektör-etiketli olmadığından, her kart → `/teklif-al?sektor=X` (sektör ön-seçili teklif formu) → güçlü lead toplama.
- Konum: CategoryGrid'den sonra, CustomerReviews'tan önce.
- Tamamen kodlu/görselsiz (slider/kampanyalar diliyle tutarlı), bakım kolay.

## Yönetim (Faz 3b — opsiyonel, sonraki)
Bölümlerin admin'den aç/kapa + sırala edilmesi = `home_sections` SiteSetting + page.tsx'in bu ayara göre render etmesi. Değerli ama büyük iş; sektör bölümü canlıya alındıktan sonra ayrı ele alınmalı.
