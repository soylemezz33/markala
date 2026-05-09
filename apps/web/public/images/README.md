# Markala Görsel Klasör Yapısı

Bu klasöre görselleri **belirtilen path ve isimle** yükle. Site otomatik olarak okur.

## 📁 Klasör Yapısı

```
public/images/
├── hero/                    Anasayfa slider — sağ ürün alanı (4 slide)
│   ├── kartvizit.jpg        1040×1040 px (1:1, max 500KB, WebP/JPG)
│   ├── branda.jpg
│   ├── kupa.jpg
│   └── tasarim.jpg
│
├── categories/              Kategori kartları + kategori sayfası hero
│   ├── kartvizit.jpg        800×600 px (4:3)
│   ├── vinil-branda-afis.jpg
│   ├── rollup.jpg
│   ├── yelken-bayrak.jpg
│   ├── kirlangic-bayrak.jpg
│   ├── masa-bayragi.jpg
│   ├── makam-bayragi.jpg
│   ├── arac-magneti.jpg
│   ├── arac-sticker.jpg
│   ├── brosur.jpg
│   ├── folyo.jpg
│   ├── fosforlu-folyo.jpg
│   ├── dekota-baski.jpg
│   ├── guvenlik-uyari-levhalari.jpg
│   ├── plaket.jpg
│   ├── madalya.jpg
│   ├── kupa.jpg
│   ├── kase.jpg
│   ├── lightbox.jpg
│   ├── plastik-reklam-dubasi.jpg
│   └── emlak-urunleri.jpg
│
├── products/                Ürün galerileri (her ürün için klasör)
│   ├── klasik-kartvizit/
│   │   ├── 1.jpg            900×900 px (kare ana görsel)
│   │   ├── 2.jpg            (galeri 2. görsel)
│   │   ├── 3.jpg
│   │   └── 4.jpg
│   ├── ozel-kesim-kartvizit/
│   │   ├── 1.jpg
│   │   └── 2.jpg
│   ├── transparan-kartvizit/
│   ├── vinil-branda-440gr/
│   ├── mesh-branda/
│   ├── rollup-standart/
│   ├── yelken-bayrak-damla/
│   ├── kirlangic-bayrak-3m/
│   ├── masa-bayragi-krom/
│   ├── makam-bayragi-puskullu/
│   ├── arac-magneti-30x40/
│   ├── arac-sticker-yan/
│   ├── brosur-a4-3-katli/
│   ├── cam-folyosu-kesimli/
│   ├── fosforlu-cikis-folyo/
│   ├── dekota-baski-5mm/
│   ├── guvenlik-levhasi-sigorta/
│   ├── kristal-plaket/
│   ├── madalya-7cm-kurdela/
│   ├── klasik-beyaz-kupa/
│   ├── trodat-printy-4912/
│   ├── lightbox-led-100cm/
│   ├── plastik-duba-baskili/
│   ├── vinil-emlak-afisi-440gr/
│   ├── buyuk-ebat-vinil-emlak-afisi/
│   ├── mesh-delikli-emlak-afisi/
│   └── emlak-kagit-afisi/
│
├── campaigns/               Kampanya banner görselleri (anasayfa CampaignStrip)
│   ├── kartvizit-firsat.jpg
│   ├── branda-firsat.jpg
│   └── rollup-firsat.jpg
│
├── bundles/                 Bundle paketler (kampanyalar sayfası)
│   ├── esnaf-destek-paketi-10.jpg
│   ├── kurumsal-baslangic-paketi.jpg
│   ├── etkinlik-tanitim-paketi.jpg
│   ├── promosyon-firmasi-paketi.jpg
│   ├── mini-kafe-paketi.jpg
│   └── emlak-acente-paketi.jpg
│
└── brands/                  Referans firma logoları (referanslar sayfası — boş)
```

## 🖼 Boyut & Format Standartları

| Tür | Boyut | Format | Max KB | Aspect |
|---|---|---|---|---|
| Hero slider | 1040×1040 (retina) / min 520×520 | WebP > JPG | 500 KB | 1:1 |
| Kategori | 800×600 | WebP > JPG | 200 KB | 4:3 |
| Ürün galeri | 900×900 | WebP > JPG | 300 KB | 1:1 |
| Bundle / Kampanya | 800×600 | WebP > JPG | 250 KB | 4:3 |
| Brand logo | 200×100 (transparent PNG) | PNG/SVG | 50 KB | 2:1 |

## ⚠ Şu an: Görseller Yokken

Görseller yüklenene kadar tüm `<Image>` bileşenlerinde `unoptimized` prop'u açık. Bu Next/Image'in 404 görsele 500 atmasını engeller — broken icon görünür ama site çöker.

**Görselleri yükledikten sonra:**
```bash
# 15 dosyada `unoptimized` prop'unu kaldır (toplu)
node scripts/remove-unoptimized.mjs
```
veya manuel olarak `<Image ... unoptimized />` → `<Image ... />` dönüşümünü yap.

Optimization (WebP/AVIF dönüşümü, responsive resize) tekrar aktif olur, sayfa hızı yükselir.

---

## ⚙ Optimizasyon Önerileri

- **Önce WebP yükle** (JPG'ye göre %30 daha küçük, kalite aynı)
- Next/Image otomatik optimize ediyor (resize, format dönüşümü, lazy load)
- Çok büyük dosya yükleme — sunucu bant genişliği israfı
- Squoosh.app veya tinypng.com'dan sıkıştır

## 🚫 Görsel yoksa ne olur?

Next/Image broken image ikonu gösterir + alt text okunur (accessibility için OK).
Site çökmez, sadece o kart/sahne boş görünür.

## 🔗 Path → URL Mapping

`public/images/products/klasik-kartvizit/1.jpg` dosyası site'da **`/images/products/klasik-kartvizit/1.jpg`** URL'i ile servis edilir.
Mock-data'daki `prodImg("slug", 1)` helper'ı aynı path'i üretir — sen sadece dosyayı doğru yere koy, yeter.
