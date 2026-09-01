# Markala — Görsel Üretim Pilotu (Scaffolding)

> Kaynak iş: **AJA-387** — Görsel üretim pilotu (Markala preset + mockup şablon + 50 okul-dikeyi ürün).
> Üreten: AI ML Operator · Tarih: 2026-09-01 · Durum: **scaffolding hazır, üretim bloke** (bkz. §Blocker).

Bu klasör, ürün görseli çoğaltma hattının **yeniden kullanılabilir omurgasıdır**: marka preseti,
kategori mockup şablonları, ürün başına 5'li reçete, SEO isimlendirme + R2 anahtar şeması ve
50 ürünlük pilot manifesti. Master görseller ve preset yönü onaylandığında hat **olduğu gibi** çalışır.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `markala-preset.md` | Marka preseti — zemin/ışık/renk parametreleri (marka kimliğiyle hizalı) |
| `mockup-templates.md` | 6 kategori mockup şablonu (plaket, madalya, sertifika, kartvizit, kaşe, kupa) |
| `production-recipe.md` | Ürün başına 5-adım reçete + gerçek Adobe MCP araç eşlemesi + toplu üretim yolu |
| `manifest.csv` | 50 pilot ürün (okul dikeyi öncelikli) — çıktı adları, R2 anahtarı, master durumu |
| `missing-masters.md` | İsim isim eksik kaynak master listesi (girdi bağımlılığı) |

## ⛔ Blocker özeti (üretim neden bu turda çalışmadı)

1. **Master görsel erişimi yok.** Ürün master'ları repo'da değil (`apps/web/public/images/products/` yok);
   yalnız prod R2/yerel diskte ve `Downloads/markala-mockup`'ta. Multica sandbox'ı bu yolları görmez.
2. **Adobe MCP bu (etkileşimsiz) ortamda master besleyemez.** Yerel dosya yüklemesi `asset_add_file`
   dosya seçici (insan) gerektirir; bu koşuda insan yok. Ayrıca bu ortamda **generatif/kompozit/
   arka-plan-değiştirme kapalı** (yalnız `image_generative_expand` açık) → "cutout → sahneye yerleştir"
   adımı MCP ile yapılamaz; toplu iş de ~20 dosya sınırının çok üstünde (50×5 = 250).
3. **Marka çelişkisi — Hasan kararı gerekli.** Issue'daki "cinematic/charcoal + cyan #00D9FF neon"
   yönü, repo'daki **kilitli ALTIN KURAL** (`docs/marka-kimligi.md`: mor #4B3AA0 + sarı #FFB91C,
   açık zemin, cyan yok) ile çelişiyor. Sapma golden-rule gereği önce dokümana kural olarak işlenmeli.
   Bu klasördeki preset **marka-uyumlu** yazıldı; cinematic/cyan sapması onaya bırakıldı.

Detay ve çözüm yolları: issue AJA-387 yorumu.
