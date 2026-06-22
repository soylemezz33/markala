# Markala — Fiyat Sistemi Yeniden Tasarımı + Tam De-Mock (Tasarım)

**Tarih:** 2026-06-22
**Sahip:** Hasan Söylemez
**Durum:** Tasarım onaylandı (brainstorming); spec gözden geçirme aşamasında.

## 1. Amaç ve Gereksinimler

1. Tüm **fiyatlar tek tabloda** (`product_prices`). Yapı (seçenek/açıklama/var-yok) ayrı, fiyat içermez.
2. Fiyat güncellemeleri **ürün-bazlı** ve **toplu** yapılabilmeli.
3. **Kargo bedeli + ücretsiz-kargo eşiği** admin'den yönetilir, DB'de tutulur.
4. **Fiyat kırımları** (matris hücreleri / seçenek fiyatları) **ekle-sil-güncelle** edilebilmeli.
5. **Toplu zam/indirim** eski (saklı) fiyatı **referans alır** — mevcut hatalı hesaplama düzelir.
6. **Aynı kategorideki basit ürünlere tek fiyat** topluca atanabilmeli (İSG levhalar).
7. **Kartvizit/broşür** matrisli (paket × adet, açıklama metinli, adet seçimli) — eskisi gibi.
8. **İSG ürünleri** toplamsal varyant konfigüratörü (Ebat × [Malzeme + Etiket]); **var/yok ve seçenekler admin kontrolünde** (ekle/çıkar).
9. **Hiçbir mock yok** — ürün/fiyat/kategori + blog/yorum/referans/hero/arama → hepsi DB; API yoksa boş/hata durumu, asla sahte veri.

## 2. Veri Modeli

### `product_options` — konfigüratör yapısı (FİYAT YOK; var/yok + ekle-çıkar admin kontrolünde)
| alan | açıklama |
|---|---|
| id, product_id | |
| group_key | "ebat" / "malzeme" / "etiket" / "paket" / "adet" |
| group_label | "Ebat" / "Malzeme / Zemin" / "Etiket / Folyo Tipi" |
| group_role | `dimension` (fiyatları indeksler, kendi fiyatı yok) \| `priced` (seçenekleri fiyatlı) |
| group_sort | grup sırası |
| option_key | "25x35" / "dekota" / "reflektif" / "eko-nk" |
| option_label | "25×35 cm" / "3mm Dekota/Foreks" |
| option_sublabel | açıklama metni (matris satır açıklaması) |
| option_sort | seçenek sırası |

### `product_prices` — TÜM fiyatlar (tek kaynak)
| alan | açıklama |
|---|---|
| id, product_id | |
| group_key | fiyatlı grup ("paket"/"malzeme"/"etiket"); basit üründe null |
| option_key | "eko-nk"/"dekota"/"reflektif"; basit üründe null |
| dim_key | boyut seçeneği ("1000"/"25x35"); boyutsuzsa null |
| cost | maliyet (opsiyonel, iç kâr takibi) |
| price | satış (₺) — müşterinin ödediği |
| @@index([product_id]) | |

### `settings` — key-value yapılandırma
`shipping_fee`="79", `free_shipping_threshold`="750" (ileride başka config de buraya).

### Fiyatlama motoru (tek "toplamsal" mantık)
`Toplam = Σ (fiyatlı gruplar) price[seçili option][seçili dim]`
- **İSG levha:** dim=Ebat; fiyatlı=Malzeme+Etiket → Malzeme[Ebat]+Etiket[Ebat]. "Yok"=0. (25×35 dekota 70 + reflektif 110 = 180.)
- **Kartvizit/broşür:** dim=Adet; tek fiyatlı grup=Paket → Paket[Adet] = matris hücresi.
- **Basit ürün:** grup yok → tek `price` satırı.
- **Vitrin fiyatı** = `MIN(price)`; fiyat yoksa "Teklif Al".

### Eski alanlar
`products.parameters` / `base_price` / `starting_price` ve `categories.starting_price` → okunmaz/yazılmaz. Kolonlar DROP edilmez (canlıda risksiz); fiyat yalnız `product_prices`'tan.

## 3. API (yeni `prices` modülü, admin-korumalı)
| Uç | İş |
|---|---|
| `GET /products/:id/prices` | yapı (options) + fiyat satırları |
| `PUT /products/:id/options` | konfigüratör yapısı (var/yok, grup/seçenek ekle-çıkar) |
| `PUT /products/:id/prices` | fiyat satırları upsert (kırım ekle/sil/güncelle, maliyet+satış) |
| `POST /prices/bulk-adjust` | toplu zam/indirim: kapsam (tümü/kategori), %/sabit, artır/düşür, yuvarlama → `price = ROUND(price × katsayı)` (saklı fiyat referans) |
| `POST /prices/category-set` | kategoriye tek satış fiyatı (basit ürünler; matrisli ürünler atlanır+sayılır) |
| `GET/PUT /settings/shipping` | kargo bedeli + ücretsiz eşik |

Public: `GET /products` ve `GET /products/:slug` yanıtına `options` + `prices` eklenir (parameters JSON yerine).

## 4. Storefront (konfigüratör + no-mock)
- Konfigüratör motoru `options`+`prices` okur; boyut + fiyatlı grupları radio (açıklamalı) render eder; canlı toplam = toplamsal motor. Basit ürün = sabit fiyat.
- `getDisplayPrice = MIN(price)`; fiyat yoksa "Teklif Al" (sipariş edilemez, çökme yok).
- **De-mock (TAM):** `catalog.ts` (ürün/kategori/hero), `blog.ts` (blog), yorum, referans/marka, header arama → mock fallback'leri KALDIRILIR. API/DB tek kaynak; veri yoksa boş/uygun durum gösterilir. `mock-data` paketi veri amaçlı kullanılmaz (yalnız tip gerekiyorsa tipler `@markala/types`'a taşınır).
- Kategoriler DB'den (`categories` tablosu); eksik SEO alanları için kategori tablosuna alan eklenir (admin yönetir).

## 5. Migration (geçiş)
1. Prisma migration: `product_options`, `product_prices`, `settings` tabloları.
2. **Yapı restore scripti:** yedek `products_fiyat_yedek_20260622_141009.sql` içindeki eski `parameters` JSON → tüm ürünler için `product_options` + `product_prices` satırları (fiyatlar BOŞ). Kartvizit/broşür matrisi + İSG Ebat/Malzeme/Etiket yapısı geri gelir.
3. `settings` tohum: kargo 79, eşik 750.
4. Eski alanlar okunmaz (kolonlar kalır).
5. Geri alma: yeni tablolar drop + eski yedek restore.

## 6. Test
- Birim: fiyat motoru (kartvizit matris / İSG toplamsal / basit), bulk-adjust (eski-fiyat referans + yuvarlama modları), category-set, shipping read.
- API e2e: yeni uçlar (auth + doğru hesap).
- Storefront: fiyatsız ürün "Teklif Al"; konfigüratör render; de-mock sonrası boş-durum gösterimi.

## 7. Uç Durumlar
- Fiyatsız ürün → "Teklif Al", sipariş akışına girmez.
- "Yok" seçeneği = 0.
- Yuvarlama: en yakın 1/5/10₺ veya yok.
- `settings` yoksa kod-içi varsayılan (79/750) — ama her zaman seed'li.
- Mock kaldırılınca API hatası → storefront boş/uygun durum (asla sahte).

## 8. Riskler / Koordinasyon
- ⚠️ **Paralel oturum:** Bu şema migration'ı + geniş dosya değişikliği aktif ikinci oturumla ÇAKIŞIR. **Uygulamaya başlamadan o oturum durmalı.** (Bugün 2 kez çakışıldı.)
- Canlı sistem: migration + deploy dikkatli; ürünler zaten fiyatsız (satış duruyor), bu yüzden geçiş penceresi düşük riskli.
- De-mock geniş: blog/yorum/referans DB'de boşsa o bölümler boş görünür (Hasan içerik girene kadar) — "no mock" ilkesiyle tutarlı.

## 9. Fazlama (uygulama sırası)
1. **Faz A — Şema + Migration:** 3 tablo + yapı restore (fiyatlar boş) + settings seed.
2. **Faz B — API:** prices modülü (CRUD/bulk/category/shipping) + public products yanıtına options/prices.
3. **Faz C — Storefront konfigüratör:** toplamsal motor + getDisplayPrice + kargo settings okuma.
4. **Faz D — Admin:** ürün editörü (konfigüratör kurucu + fiyat ızgarası), toplu araç (düzeltilmiş), kategori-tek-fiyat, kargo ayarları.
5. **Faz E — Tam de-mock:** catalog/blog/yorum/referans/arama/kategori mock'larının kaldırılması.
6. Her faz: typecheck + test + deploy + canlı doğrulama.
