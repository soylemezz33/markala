# Kategori Mockup Şablonları

> Şablon = tekrar kullanılabilir **sahne omurgası**: preset zemin/ışık + **boş ürün alanı** (image
> frame) + Markala çerçeve/rozet + ölçek referansı. Ürün master'ı frame'e InDesign **data-merge** ile
> yerleştirilir (`document_merge_data_layout`) → toplu render (`document_render_layout`).
> Her şablon iki varyantta kurulur: **Studio** (Preset A) ve **Cinematic** (Preset B) — bkz. `markala-preset.md`.

Öncelik: **okul dikeyi** (plaket, madalya, sertifika) + kartvizit/kaşe. 6 şablon:

## T1 · Plaket (`plaket`)
- Sahne: alçak kaide + hafif yansıma yüzeyi; ürün dikey, 3/4 açı.
- Boş alan: merkez, dikey dikdörtgen frame (kristal/ahşap plaket oranı ~3:4).
- Marka: alt-sağ `markala.com.tr` rozet; sarı köşe çizgisi.
- Ölçek referansı: kaide genişliği + opsiyonel el/masaüstü bağlam görseli (angle 2).
- Not: kristal için yansıma/parlama önemli — cutout kenarları temiz alfa gerektirir.

## T2 · Madalya (`madalya`)
- Sahne: kurdela asılı sunum (kanca/stand) veya düz masa üstü.
- Boş alan: madalya diski merkez + kurdela dikey akış alanı.
- Marka: rozet alt-orta; sarı halka deseni kenardan taşar (marka desen dili).
- Ölçek: 7 cm disk için el/kurdela uzunluğu referansı.

## T3 · Sertifika / Diploma (`sertifika`) — ⚠️ ürün katalogda YOK (gap)
- Sahne: çerçeveli sertifika duvarda veya masada açılı; hafif kağıt dokusu.
- Boş alan: A4 yatay/dikey frame (baskı önizleme birebir gerçek dosya → AI ile içerik uydurulmaz).
- Marka: dış çerçeve + rozet; sertifika içeriği MÜŞTERİ dosyası.
- **Aksiyon:** `sertifika`/`diploma` ürünü ve slug'ı Frontend/PM ile açılmalı (bkz. `missing-masters.md`).

## T4 · Kartvizit (`kartvizit`)
- Sahne: istifli deste + tek kart öne yaslı; hafif gölge.
- Boş alan: kart yüzü frame (85×55 oranı) + deste hacmi.
- Marka: rozet alt-sağ; ölçek = parmak/deste kalınlığı (bağlam angle 2).
- Doku (angle 3): kuşe/selefon/kabartma yakın çekim.

## T5 · Kaşe (`kase`)
- Sahne: kaşe gövdesi + basılı iz (ıstampa) örneği yan yana.
- Boş alan: kaşe gövde frame + iz alanı (iz = temsili, müşteri metni uydurulmaz).
- Marka: rozet; ölçek = masa/el.

## T6 · Kupa / Ödül (`kupa`)
- Sahne: silindir kupa 3/4 açı, yansımalı yüzey.
- Boş alan: kupa gövde sarma alanı (baskı alanı wrap).
- Marka: rozet alt-sağ; ölçek = tabak/masa bağlamı.

---

## Şablon kurulum adımları (Adobe MCP — InDesign hattı)

1. Boş sahne + frame + marka overlay'i **InDesign/PDF** olarak tasarla (Preset A ve B için ayrı).
2. PDF → INDD: `convert_pdf_to_indd`.
3. Frame'leri placeholder yap: `generate_indd_mapping_prompt` → `prepare_indd_merge_template`.
4. Ürün görselleri CSV'siyle birleştir: `document_merge_data_layout` (CSV kolonu = ürün image URL'i).
5. Toplu render: `document_render_layout` → PNG/JPEG → WebP'ye çevir (`scripts/gorsel-webp-donustur.mjs`).

> ⚠️ **Ortam kısıtı:** InDesign data-merge ürün görselini **URL** olarak ister; master'ın erişilebilir
> (R2/prod public) URL'i gerekir. Yerel dosya bu koşuda MCP'ye yüklenemez (bkz. `production-recipe.md`
> §Ortam kısıtları). Şablonlar hazır; master URL'leri gelince merge çalışır.
