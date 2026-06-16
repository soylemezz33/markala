# AI Destekli Özellikler — Markala

> Sahip: AI/ML Operator ajanı · İlk sürüm: 2026-06-16

Markala'ya değer katan AI yetenekleri. İlk teslim: **otomatik ürün açıklaması üretimi (PoC)**.

## Tasarım İlkeleri

| İlke | Uygulama |
|---|---|
| **Maliyet uyumu** | Varsayılan model `claude-haiku-4-5` (in $1 / out $5 per 1M). `max_tokens` 2048 tavanı. Her çağrı `usage` döndürür; route maliyeti loglar (`estimateCostUsd`). |
| **KVKK uyumu** | AI'ye yalnızca ürün metası (ad, kategori, anahtar kelime) gider. TC/telefon/e-posta gibi kişisel veri **asla** prompt'a konmaz. Veri yurt dışına çıkar — bu yüzden yalnızca PII içermeyen ürün metni üretimi için kullanılır. |
| **Zarif düşüş** | `ANTHROPIC_API_KEY` yoksa veya AI hata verirse deterministik şablona düşülür (mevcut `mailer`/`catalog` "mock fallback" deseniyle aynı). Özellik anahtar olmadan da demoda çalışır, CI ağ istemez. |
| **Bağımlılık yok** | Resmi SDK yerine `fetch` ile çağrı — `pnpm-lock.yaml` değişmez, PR küçük kalır, akış denetlenebilir. |

## Mimari

```
apps/web/src/lib/ai/
  claude.ts        → ince Anthropic istemcisi (isAiConfigured, getAiModel,
                     generateText, estimateCostUsd, hata sınıfları)
  product-copy.ts  → buildProductCopyPrompt (saf), templateProductCopy (fallback),
                     generateProductCopy (AI), PRODUCT_COPY_SCHEMA (yapısal çıktı)

apps/web/src/app/api/ai/describe/route.ts
  POST /api/ai/describe → ürün açıklaması üretir; her zaman 200 döner.
```

## Kullanım

```bash
curl -X POST http://localhost:3000/api/ai/describe \
  -H "content-type: application/json" \
  -d '{"name":"Lüks Kartvizit","category":"Kartvizit","keywords":["selefon","kuşe"]}'
```

```jsonc
// Yanıt
{
  "ok": true,
  "source": "ai",        // veya "fallback"
  "copy": {
    "shortDescription": "...",
    "description": "...",
    "seoTitle": "...",
    "seoDescription": "...",
    "keywords": ["..."]
  }
}
```

Admin panelindeki ürün düzenleme formuna (`apps/admin/.../urunler/[slug]`) "AI ile öner"
butonu olarak bağlanabilir — kısa/uzun açıklama + SEO alanlarını tek tıkla doldurur.

## Yol Haritası (sonraki PR'lar)

1. **Mockup metin zenginleştirme** — mevcut `/api/mockup` SVG akışını koruyarak, kart
   için AI üretimi slogan/etiket öneren ayrı endpoint (akışı bozmadan).
2. **Akıllı ürün arama / öneri** — şu an `all-products-client.tsx` substring araması;
   eş anlam/niyet eşleme için sorgu genişletme veya pgvector tabanlı semantik arama.
3. **Maliyet projeksiyonu** — tenant başına aylık AI maliyet tahmini + %80 kota alarmı.
