# Eksik Kaynak Master Listesi (girdi bağımlılığı)

> AJA-387'nin **ilk iş**i: master ürün görsellerinin nerede olduğunu tespit et. Sonuç aşağıda.
> Master = ürünün gerçek fotoğrafı/mockup'ı. AI yalnız sahne/ışık/renk yapar; **ürünün kendisi
> master'dan gelir** (governance). Master olmadan reçete çalışmaz.

## Tespit sonucu

- **Repo'da ürün master'ı YOK.** `apps/web/public/images/products/` klasörü mevcut değil; sadece
  33 **kategori** görseli (`images/categories/*.jpg`) ve 3 kampanya görseli var. Kategori görselleri
  ürün mockup'ı değildir (kart/hero için stok tarzı).
- **Master'lar repo dışında:** `docs/urun-gorsel-eslestirme-ve-eksikler.md`'ye göre 30 mockup
  `C:\Users\Hasan\Downloads\markala-mockup` + `_upload-ready/` (29 slug-adlı) ve prod R2/yerel diskte
  (`products/<slug>.jpg`, canlıda ~900 görsel). **Multica sandbox'ı bu yolların hiçbirini görmez** →
  bu koşuda erişilemez.
- **Adobe MCP'ye yükleme yolu da kapalı** (bu etkileşimsiz koşuda): yerel dosya `asset_add_file`
  seçicisi (insan) ister. Bkz. `production-recipe.md` §Ortam kısıtları.

## İhtiyaç — 3 kategori

### A) TAM eksik — hiç master yok (hero dahil 5 açı gerekli)
Kaynak fotoğraf çekilmeli/tedarik edilmeli:

| Slug | Ürün | Not |
|---|---|---|
| `sertifika-diploma` | Sertifika/Diploma | **Ürün katalogda da YOK** — önce ürün+slug açılmalı (Frontend/PM) |
| `makbuz` | Makbuz (NCR kopyalı) | 2026-06 gap listesinde |
| `notluk` | Notluk 7.8×14 | 2026-06 gap listesinde |
| `kapaksiz-bloknot` | Kapaksız Bloknot | 2026-06 gap listesinde |
| `guvenlik-levhasi-sigorta` | İSG Levhası | 2026-06 gap listesinde · **ISO 7010 rengi kilitli** |
| `lanyard-15mm`, `lanyard-10mm` | Lanyard | Katalog 42→62 büyümesinde eklendi; master doğrulanmalı |
| `yaka-karti-sert`, `yaka-karti-standart` | Yaka Kartı | aynı |
| `kurumsal-davetiye`, `dugum-davetiyesi` | Davetiye | aynı |
| `katalog-perfect`, `katalog-saddle` | Katalog | aynı |
| `duvar-takvimi`, `masa-takvimi` | Takvim | aynı |
| `pvc-uyelik-karti` | PVC Kart (öğrenci kimlik) | aynı |
| `kanvas-tablo-60x40`, `kanvas-tablo-100x70` | Kanvas Tablo | aynı |
| `magnet-promosyon` | Promosyon Magnet | aynı |
| `stiker-beyaz-vinyl`, `stiker-seffaf-vinyl` | Vinyl Stiker | aynı |
| `pro-brosur`, `selefonlu-brosur` | Broşür varyantları | aynı |
| `bez-tote-140gr`, `bez-tote-canvas-180gr` | Bez Tote | aynı |
| `kraft-torba-baskili` | Kraft Torba | aynı |

### B) Kapak var, 2–5 açı eksik (prod R2'de `products/<slug>.jpg` kapak mevcut)
Bu ürünlerde 5'li set için **bağlam/doku/önden/varyant** (angle 2–5) üretilmeli; kapak yeniden
kullanılabilir. Manifest'te `prod_r2_cover` işaretli 20 satır:
`kristal-plaket, madalya-7cm-kurdela, klasik-beyaz-kupa, klasik-kartvizit, trodat-printy-4912,
antetli-kagit, zarf-diplomat-tek-renk, zarf-diplomat-renkli, zarf-torba, cepli-dosya, etiket,
brosur, el-ilani, afis-105gr, kapakli-bloknot, kup-bloknot, spiralli-bloknot, canta,
rollup-standart, yelken-bayrak-damla, kirlangic-bayrak-3m, masa-bayragi-krom,
makam-bayragi-puskullu, lightbox-led-100cm`.

### C) Ürün gap — katalogda ürün yok
- `sertifika-diploma` — okul dikeyi için **kritik**; ürün oluşturma + slug ataması gerekli (Frontend/PM işi).

## Hasan / PM'den istenen (blocker'ı açmak için)
1. **Master erişimi:** `Downloads/markala-mockup` + prod `products/*` görsellerini agent'ın erişebileceği
   bir yere ver (repo `assets/masters/` klasörü **veya** public R2 URL listesi). InDesign data-merge
   URL ister; yerel dosya bu koşuda yüklenemez.
2. **Preset kararı:** Studio (marka-uyumlu, önerilen) mi, Cinematic (sapma, golden-rule güncellemesi
   gerektirir) mi? Bkz. `markala-preset.md`.
3. **`sertifika` ürünü** açılsın mı? Açılırsa slug + kategori.
4. **R2 mı yerel disk mi** teslim edilsin (prod şu an yerel disk sürücüsünde).
