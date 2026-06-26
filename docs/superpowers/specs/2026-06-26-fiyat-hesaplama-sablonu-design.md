# Fiyat Hesaplama Şablonu — Tasarım

- **Tarih:** 2026-06-26
- **Rota:** `admin.markala.com.tr/fiyat-hesaplama-sablonu`
- **Durum:** Onaylandı (Hasan), uygulanıyor

## Amaç

Alan (m²) bazlı ürünler (branda, afiş, sert zemin/CNC kesim vb.) için en/boy + malzeme +
opsiyon + adet girilince anlık $ ve ₺ fiyat hesaplayan, modern/responsive bir **şablon**
sayfası. Storefront konfigüratörüne taşınabilecek bir prototip; admin'de önizlenir.

## Kapsam Kararları (Hasan)

1. **Sayfada düzenlenebilir** — malzeme listesi, CNC m fiyatı ve dolar kuru sayfadaki açılır
   "Ayarlar" panelinden anlık değiştirilebilir. **Veritabanı yok, kaydetme yok** (sayfa
   yenilenince varsayılana döner). Bir fiyat oyun alanı + hesap makinesi.
2. **Dolar kuru** — manuel, düzenlenebilir alan; varsayılan **46.00 TL**. Dış API yok.
3. **Yayın** — güncel `origin/main` klonunda (`C:\tmp\markala-main`) yazılır, admin'e deploy
   edilip canlı doğrulanır.

## Dosyalar

- `apps/admin/src/app/fiyat-hesaplama-sablonu/page.tsx` — tek client component (`"use client"`).
  Veri çağrısı yok; tüm hesap istemci tarafında `useState` + `useMemo` ile.
- `apps/admin/src/components/admin-shell.tsx` — Katalog nav grubuna link
  (`Toplu Fiyat Güncelleme` altına, `Calculator` ikonu).

## Girdiler

| Girdi | Tip | Varsayılan | Not |
|---|---|---|---|
| En (cm) | sayı | boş | ≥ 0 |
| Boy (cm) | sayı | boş | ≥ 0 |
| Malzeme/Baskı tipi | segment buton | ilk malzeme | her butonda `$/m²` + hover tooltip |
| CNC Kesim | toggle | kapalı | açıksa `$/m` × çevre |
| Adet | sayı | 1 | min 1 |

## Arka Plan Değişkenleri (Ayarlar panelinde düzenlenebilir)

- Malzemeler: `[{ etiket, m2Fiyat($) }]` — varsayılan `3mm=8$`, `5mm=11$`, `7mm=14$`
  (7mm örnek; Hasan değiştirebilir). Satır ekle/sil.
- CNC çevre fiyatı: varsayılan `2 $/m` (örnek).
- Dolar kuru: varsayılan `46.00 ₺`.
- "Varsayılana sıfırla" düğmesi.

## Formüller (birebir spec)

```
Alan (m²)      = (En * Boy) / 10000
Çevre (m)      = 2 * (En + Boy) / 100
Malzeme ($)    = Alan * seçili m² fiyatı
Opsiyon ($)    = CNC ? Çevre * CNC_m_fiyatı : 0
Birim ($)      = Malzeme + Opsiyon
Genel ($)      = Birim * Adet
Genel (₺)      = Genel ($) * Kur
```

## UI Yerleşimi

- Sayfa başlığı + "Şablon" rozeti + kısa açıklama.
- Üstte açılır **⚙ Ayarlar (Şablon)** paneli: malzeme tablosu, CNC `$/m`, dolar kuru, sıfırla.
- Ana ızgara `lg:grid-cols-3`:
  - **Sol (2 kolon):** form kartı — En/Boy, malzeme segment butonları (tooltip'li), CNC toggle, adet.
  - **Sağ (1 kolon, yapışkan):** özet kartı:
    1. Ölçüler: En, Boy, **Alan (m²)**, **Çevre (m)** (dinamik).
    2. Maliyet tablosu — **Birim / Toplam** sütunları: Malzeme, CNC opsiyon, Toplam $, Toplam ₺.
    3. Büyük sonuç: **"Toplam: X $ (Y ₺)"**.
    4. **Sepete Ekle** butonu.
- Admin tasarım token'ları (paper/ink/brand sarı), Phosphor ikon. Tam responsive.

## Davranış / Sınır Durumları

- Sayı alanları boş/NaN → 0 kabul; negatif girilemez (`min`).
- Adet min 1.
- Malzeme silinip seçili kalırsa → ilk mevcut malzemeye düşülür (boşsa hesap 0).
- **Sepete Ekle:** admin'de gerçek sepet yok → girdileri doğrular; en/boy 0 ise `toast.error`,
  değilse `toast.success` ile özet ("Sepete eklendi · 150×100 cm · 5mm · CNC · 1 adet · 1.234,00 ₺").
  Storefront'a taşındığında gerçek sepete ekleme buraya gelir.
- Sayı formatı: tr-TR (`1.234,56`), para birimi sembolü sonda (`… $`, `… ₺`).

## Kapsam Dışı (YAGNI)

- Veritabanı / kalıcı kayıt, gerçek sepet entegrasyonu, canlı kur API'si, ürün kataloğu bağlama.
  (İleride storefront'a taşınırken ayrı iş.)

## Doğrulama

1. `pnpm --filter @markala/admin type-check` (veya admin dizininde `tsc --noEmit`) yeşil.
2. Build → deploy (`C:\tmp\markala_deploy.ps1` / mevcut prosedür) → nginx reload.
3. Canlı: `admin.markala.com.tr/fiyat-hesaplama-sablonu` açılır, nav linki görünür, hesap
   doğru (örn. 150×100, 5mm → Alan 1,5 m² → 16,5 $ → 759 ₺ @46), Sepete Ekle toast'u çalışır.
