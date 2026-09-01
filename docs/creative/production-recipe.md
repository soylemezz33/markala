# Ürün Başına 5'li Üretim Reçetesi

> Galeri 5 görsel gösterir (`docs/grafik-tasarim-brief.md` §4). `-1` = kapak (kart bu görseli kullanır).
> Sıra: **kahraman → bağlam/ölçek → doku → önden → varyant**.

| # | Görsel | Amaç | Adobe MCP aracı (bu ortamda gerçekten mevcut) |
|---|---|---|---|
| 1 | Kahraman (kapak) | Master'ı presetli sahneye yerleştir | `image_remove_background` (cutout) → şablona `document_merge_data_layout` → `document_render_layout` |
| 2 | Bağlam / ölçek | Boyut algısı (el/masa/ortam) | Bağlam şablonu + merge; gerekiyorsa `image_generative_expand` (kenar genişletme) |
| 3 | Doku / malzeme | Kuşe/selefon/lak/kabartma yakın | `image_crop_and_resize` (yakın kadraj) + `image_apply_adjustments` |
| 4 | Düz önden | Net, dümdüz ürün | `image_crop_to_bounds` / `image_apply_auto_tone` |
| 5 | Varyant / açık hâl | Renk/malzeme varyantı, katlı-açık | `image_apply_color_overlay` (renk varyantı) / ayrı master |

**Preset uygulaması:** her adım sonrası ton/renk preset'e çekilir (`image_apply_adjustments`;
Lightroom preseti için `image_list_presets` → `image_apply_preset`). Öznel adımlarda
`asset_inline_preview` ile doğrula.

## Yönetişim (reçetenin her adımında geçerli)
- AI = yalnız **sahne/zemin/ışık/renk**. **Ürün + müşteri içeriği (logo/metin/baskı) AI ile
  üretilmez.** Renk varyantı (adım 5) yalnız **ürün malzemesi/gövde rengi** için; baskı içeriği değil.
- İSG levhaları: ISO 7010 renginde kalır (color overlay uygulanmaz).

## ⚠️ Ortam kısıtları (bu Adobe MCP koşusunda üretimi engelleyen gerçekler)

`adobe_mandatory_init` dokümanından doğrulandı:

1. **Yerel dosya yüklenemez.** `asset_initialize_file_upload` yerel yollar (`C:\`, `~/`) için başarısız;
   tek yol `asset_add_file` **dosya seçici** = interaktif insan gerekir. Bu etkileşimsiz koşuda insan yok
   → master'lar MCP'ye giremiyor. Çözüm: master'lar **erişilebilir public URL** (prod R2) olarak verilmeli.
2. **Generatif/kompozit kapalı.** Arka-plan değiştirme, generative fill, "iki görseli birleştir/sahneye
   yerleştir" bu ortamda **desteklenmiyor** (yalnız `image_generative_expand` açık). "Cutout → sahne"
   kompoziti tek görsel araçlarıyla değil, **InDesign data-merge** (frame'e URL yerleştirme) ile yapılır.
3. **Toplu iş sınırı ~20 dosya.** 50 ürün × 5 = **250 render** MCP pratik sınırının çok üstünde. Bulk için
   önerilen yol: **InDesign data-merge** (CSV → tek `document_merge_data_layout` çağrısı çok kayıt işler)
   ya da lokal Photoshop Actions / Adobe Bridge. MCP tek-tek düzenleme için, bulk için değil.

## Önerilen gerçek üretim yolu (master'lar geldiğinde)

**A) Az sayıda / hero için (MCP uygun):** seçili okul-core ürünlerde (plaket, madalya, kupa,
sertifika) elle: cutout → sahne merge → adjust → preview. ≤20 varlık.

**B) Toplu (50×5) için:** InDesign **data-merge** — `manifest.csv`'yi image-URL kolonuyla genişlet,
her şablon (T1–T6) için bir merge; render çıktısı → `scripts/gorsel-webp-donustur.mjs` ile WebP.

## R2 / anahtar şeması (Backend ile uyumlu)

- Katalog kapak/gale­ri anahtarı: **`products/<slug>-<n>.webp`** (`n`=1..5, `-1` kapak).
  (`scripts/assign-product-images.sh` bugün `products/<slug>.jpg` tek-kapak yazıyor; 5'li galeri +
  WebP için script'in `-<n>.webp` kalıbına güncellenmesi gerekir — küçük Backend/DevOps işi.)
- Public URL: `${R2_PUBLIC_URL}/products/<slug>-<n>.webp` (prod env: `R2_PUBLIC_URL`).
- `mock-data`'daki `prodImg("<slug>", n)` helper'ı bugün `/api/mockup`e düşüyor; gerçek dosyalar
  gelince `images: []` gerçek URL'lerle doldurulur (Frontend işi).
- ⚠️ Prod şu an R2 **değil yerel disk** sürücüsünde (`R2_ACCESS_KEY_ID` yok) — teslim yeri buna göre
  seçilir. R2 hazır değilse: yerel/asset havuzu + `manifest.csv` ile topla.

## Teslim çıktısı
- WebP set (`<slug>-1..5.webp`, 1500², sRGB, <250 KB) + güncel `manifest.csv` (image URL kolonlu).
- R2 hazırsa `products/` altına; değilse asset havuzu + manifest.
