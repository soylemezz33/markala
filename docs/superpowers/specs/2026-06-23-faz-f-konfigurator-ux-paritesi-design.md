# Faz F — Konfigüratör UX Paritesi (Tasarım)

**Tarih:** 2026-06-23
**Sahip:** Hasan Söylemez
**Durum:** Gereksinimler + kararlar Hasan'dan alındı (bidolubaski karşılaştırması).

## 1. Amaç
Markala ürün detay sayfasını rakip (bidolubaski) seviyesine çıkarmak: seçenek fiyat ipuçları, KDV toggle, panelden kilitlenebilir seçenekler, koşullu/bağımlı seçenekler, ürün yıldız+yorum (doğrulanmış), güven rozeti, uzun seçenek listesi UX, masaüstü-sabit + mobil-alt-bar CTA.

## 2. Hasan'ın kararları (netleşti)
- **CTA:** masaüstü sabit (sticky) + mobilde ekran altında sabit "Sepete Ekle" barı.
- **Yorum:** sadece **o ürünü satın almış üyeler** yorum/yıldız verebilir (doğrulanmış — backend zaten uyguluyor).
- **Görsel galeri/mockup:** ERTELENDİ (grafiker brief'i sonra).
- **Fiyatlar:** her an düzenlenebilir; canlıda rastgele fiyat = sipariş riski (ürünü pasif yap veya gerçekçi gir).

## 3. Özellikler ve teknik model

### 3.1 Veri modeli (yeni alanlar — `product_options`)
- `locked Boolean @default(false)` — grup kilitli mi (admin kontrolünde). Grup-seviye: grubun TÜM option satırlarına aynı değer yazılır.
- `rules Json?` — koşullu kurallar (bu option seçilince): `{ disablesGroups?: string[]; forcesOption?: { groupKey: string; optionKey: string } }`.
- Migration: `ALTER TABLE product_options ADD COLUMN locked BOOLEAN NOT NULL DEFAULT false, ADD COLUMN rules JSONB;` (yıkıcı değil). Tipler: `PricingOption`'a `locked?: boolean`, `rules?: OptionRules` eklenir (@markala/types + api-client).

### 3.2 Seçenek fiyat ipucu (kartta fiyat)
- `priced` grup option'ları: kartta **fiyat katkısı** gösterilir. `product_prices`'tan `{groupKey, optionKey, dimKey=seçili fiyat-boyutu}` satırının `price`'ı = o option'ın katkısı. Grup içi en ucuza göre delta "+X TL" (en ucuz "+0" veya gizli).
- `adet` dimension (matris ürün): her adet kartında o adet için **toplam fiyat** (computeConfiguredPrice ile o adet seçiliyken). bidolubaski adet merdiveni gibi.
- Fiyat yoksa ipucu gösterilmez (boş). KDV toggle'a saygılı (aşağı).

### 3.3 KDV dahil/hariç toggle
- Ürün sayfasında toggle. DB fiyatları KDV-DAHİL. "Hariç" seçilince gösterim `price / 1.20` (KDV çıkarılır), etiket "KDV hariç". Toplam + kart ipuçları + mobil bar hepsi toggle'a uyar. Varsayılan: KDV dahil.
- `VAT_RATE=0.20` paylaşılan sabit (`apps/web/src/lib/vat.ts` — sepet/ödeme'deki tekrar da buraya).

### 3.4 Kilitli seçenek (🔒, panelden)
- Admin "Fiyat Yönetimi → Konfigüratör Yapısı"nda her grup için **Kilitle** toggle. Kilitliyse grup, storefront'ta **salt-okunur** alan: seçili/ilk option + 🔒 ikonu, tıklanamaz (bidolubaski "400 gr Mat Kuşe 🔒" gibi). Fiyat hesabında kilitli grubun seçili (ilk) option'ı kullanılır.

### 3.5 Koşullu/bağımlı seçenek
- Admin her option için kural tanımlar: "bu seçilince şu grupları pasifleştir" (+opsiyonel "şu grubu şu değere zorla").
- Storefront: her seçim değişiminde aktif seçimlerin kurallarını uygula → **pasif gruplar** grileşir/tıklanamaz (bidolubaski "Sopa Tipi" disabled gibi); zorlanan option otomatik seçilir. Pasif grup fiyata katılmaz (veya zorlanan değerle katılır). Motor (`computeConfiguredPrice`) efektif (pasif-hariç / zorlanmış) seçimlerle çağrılır.

### 3.6 Ürün yıldız + yorum (doğrulanmış)
- Backend ZATEN hazır: `canUserReview`/`createPublic` o ürünü sipariş etmiş üyeyi kontrol eder; `GET /reviews/public` onaylı yorumları döner.
- KALAN: ürün sayfasında **aggregate rating** gösterimini AÇ. `getProductRatingStats(slug)` → `urun/[slug]/page.tsx`'te çekilip Configurator'a `rating={count? {average,count}:undefined}` geçilir (catalog.ts `rating:undefined` yerine sayfa-seviye gerçek istatistik). reviews-section + review-form zaten render ediliyor.

### 3.7 "Hızlı Tasarım Kontrolü" güven rozeti
- Ürün sayfasına statik güven rozeti/kartı ("Ücretsiz hızlı tasarım kontrolü" + kısa açıklama). Mevcut trust-badge kalıbıyla.

### 3.8 Uzun seçenek listesi UX (kartvizit 19 paket)
- `OptionGroup`: option sayısı eşiği (>8) aşılırsa radio-kart listesi yerine **aranabilir açılır liste (dropdown/select)** render edilir (optionLabel + sublabel + fiyat ipucu). Az option'da radio kart kalır. bidolubaski Ebat dropdown gibi.

### 3.9 CTA: masaüstü sabit + mobil alt bar
- Masaüstü: mevcut `lg:sticky lg:top-24` korunur (içerik üstüne binmez — doğrulanır). Mobil: mevcut `mobile-cta.tsx` (lg:hidden fixed bottom) canlı toplam + Sepete Ekle gösterir; KDV toggle + Teklif-Al durumuna uyum. Polislenir.

## 4. Fazlama (uygulama sırası)
1. **F1 — Şema + API + tipler:** product_options.locked/rules migration + getForProduct/setOptions + OptionInputDto + @markala/types/api-client tipleri.
2. **F2 — Admin editör:** pricing-structure-editor'a grup Kilitle toggle + option kural editörü (pasifleştir/zorla).
3. **F3 — Storefront veri-bağımlı:** kilitli grup salt-okunur+🔒, koşullu pasif/zorla mantığı (motor efektif seçim).
4. **F4 — Storefront bağımsız:** seçenek fiyat ipucu, KDV toggle (+vat.ts), uzun-liste dropdown.
5. **F5 — Yorum/yıldız:** aggregate rating gösterimini aç (sayfa→Configurator), reviews-section doğrula.
6. **F6 — Güven rozeti + CTA polisleme** (masaüstü sabit doğrula, mobil bar).
7. Her faz: typecheck/test + deploy + canlı doğrulama.

## 5. Kapsam dışı
Görsel galeri/mockup (grafiker brief'i sonra). Online "Kendin Tasarla" editörü (büyük ayrı proje — şimdilik yok).

## 6. Riskler
- Koşullu seçenek (3.5) en karmaşık: motor + UI efektif-seçim mantığı dikkatli test edilmeli (pasif grup fiyata sızmamalı).
- Fiyat ipucu + KDV toggle prices BOŞken görünmez (Hasan fiyatlayınca aktif) — regresyon değil.
- locked/rules eklenince setOptions full delete+recreate olduğundan admin kaydı bu alanları korumalı.
