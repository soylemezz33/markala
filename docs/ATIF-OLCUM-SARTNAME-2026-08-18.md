# Atıf (Attribution) Ölçüm Şartnamesi — 2026-08-18

> **Amaç:** "Hangi sipariş nereden geldi?" sorusunu çerez onayından bağımsız olarak
> kesin cevaplayabilmek. Şu an cevaplayamıyoruz ve reklam bütçesini kör harcıyoruz.
>
> **Devir:** A Bölümü → geliştirici oturumu. B Bölümü → SEO/reklam oturumu (Claude, Ads API tarafı).

---

## Sorun (kanıtla)

Sistemdeki **6 siparişin 4'ünde** müşteri pazarlama onayı vermemiş. Onay yoksa:

- GA4'e `purchase` düşmüyor (`lib/analytics.ts` → `track()` onay yoksa yutuyor)
- Google Ads dönüşümü ateşlenmiyor (`fireAdsConversion` → `consentFor("marketing")`)
- Meta CAPI'ye gitmiyor
- **Ve `_gcl_aw` çerezi hiç yazılmıyor** → sipariş kaydındaki `gclid` boş kalıyor

Sonuç: 18 Ağustos'ta 3 sipariş geldi, hiçbirinin kaynağını bilmiyoruz. Reklamlar 2 günde
73 tıklama / 480 TL harcadı; "satış getirdi mi" sorusunun cevabı **ölçülemiyor**.

### Mevcut `gclid` yakalama neden yetersiz

`apps/web/src/app/api/siparis-kaydet/route.ts:145-158`

1. `_gcl_aw` çerezi → **yalnız `ad_storage: granted` iken** gtag tarafından yazılır. Onay yoksa yok.
2. Fallback: `referer` başlığındaki `?gclid=` → ödeme adımında referer **site içi** bir sayfadır
   (`/odeme`), üzerinde `?gclid=` bulunmaz. Pratikte hiç çalışmıyor.

Yani onay vermeyen kullanıcıda **her iki yol da başarısız**.

---

# A BÖLÜMÜ — Geliştirici oturumu

## A1. Yeni dosya: `apps/web/src/lib/attribution.ts`

Reklam tıklama kimliklerini iniş anında yakalayıp saklar. Çerezden ve onaydan bağımsız.

**Gerekli davranış:**

- `captureFromUrl()` — sayfa açılışında çağrılır. `window.location.search` içinde şu
  parametrelerden biri varsa kaydeder: **`gclid`, `gbraid`, `wbraid`** (Google) ve
  `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.
  - `gbraid`/`wbraid` iOS/uygulama kampanyalarında `gclid` yerine gelir — atlanmamalı.
- Depolama: **`localStorage`**, anahtar `markala_attribution`, değer:
  ```json
  { "gclid": "...", "gbraid": null, "wbraid": null,
    "utm": { "source": "...", "medium": "...", "campaign": "..." },
    "ts": 1755500000000 }
  ```
- **TTL 90 gün.** Okuma sırasında `ts` 90 günden eskiyse kayıt silinir ve `null` döner.
  (Google Ads dönüşüm penceresi varsayılan 30 gün; 90 gün üst sınır için güvenli pay.)
- **Son-tıklama (last touch):** yeni bir `gclid` gelirse eskisinin üzerine yazılır.
  Google Ads dönüşümleri `gclid` ile tekilleştirdiği için doğru olan budur.
- `readAttribution()` — geçerli kaydı döner, yoksa `null`.
- `localStorage` erişilemezse (gizli sekme, kapalı depolama) **sessizce `null`** dönmeli;
  akış asla kırılmamalı. `lib/reorder.ts` içindeki `try/catch` deseni örnek alınabilir.

## A2. Yakalamayı tetikle

`captureFromUrl()` her sayfa açılışında bir kez çalışmalı. Öneri: mevcut bir client
bileşenine bağlamak (ör. `components/analytics.tsx` yanına küçük bir client bileşen ya da
`components/web-vitals.tsx` deseni). **Kök layout server component olduğu için doğrudan
oraya konulamaz.**

Kritik: bu çağrı **onay kontrolünden geçmemeli**. Amacı reklam takibi değil, kendi
siparişimizin kaynağını bilmek (birinci taraf, kendi alan adımız).

## A3. Ödeme adımında gönder

`apps/web/src/app/odeme/page.tsx:552` — `body` nesnesine ekle:

```ts
attribution: readAttribution() ?? undefined,
```

## A4. Route'ta öncelik sırası

`apps/web/src/app/api/siparis-kaydet/route.ts:145` — mevcut mantığı **koru**, araya body'yi ekle:

1. `_gcl_aw` çerezi (onay verilmişse en güvenilir)
2. **YENİ:** `body.attribution.gclid` / `.gbraid` / `.wbraid`
3. `referer` üzerindeki `?gclid=` (mevcut fallback)

`gbraid`/`wbraid` için backend'de ayrı alan yoksa şimdilik `gclid` alanına yazılabilir —
ama **tercih edilen**, Prisma şemasına `gbraid`/`wbraid` kolonlarının eklenmesi
(`Order` modeli, `gclid`'in hemen yanına, `String?`). Migration gerekir.

Ayrıca `utm_source/medium/campaign` de siparişe yazılırsa reklam dışı kanallar
(AI asistan, e-posta, sosyal) da ölçülebilir hale gelir — **şiddetle önerilir**.

## A5. KVKK notu

`gclid` bir reklam tıklama kimliğidir; tek başına kişiyi tanımlamaz ve **zaten** sipariş
kaydında saklanıyor (mevcut `Order.gclid` kolonu). Bu değişiklik yeni bir veri türü
toplamıyor, var olanın **güvenilir yakalanmasını** sağlıyor.

Yine de: `packages/mock-data/src/legal.ts` çerez politikası metnine, birinci-taraf
depolamada sipariş kaynağı bilgisi tutulduğuna dair bir cümle eklenmesi uygun olur.
Üçüncü taraflara aktarım hâlâ `marketingConsent`'e bağlı kalmalı — **o kapı değişmeyecek.**

## A6. Kabul kriterleri (test)

1. Tarayıcıda `https://markala.com.tr/?gclid=TEST_12345` aç
2. Çerez banner'ında **"Reddet"** de (bilerek onay verme)
3. Sepete ürün ekle, siparişi tamamla
4. Doğrula:
   ```bash
   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/siparis/kaynak.mjs <YENI-SIPARIS-NO>
   ```
   → `Google Ads gclid : TEST_12345` görünmeli

Ek kontrol: onay **verildiğinde** de çalışmalı (çerez yolu bozulmamış olmalı).

## A7. Dokunulan dosyalar

| Dosya | İşlem |
|---|---|
| `apps/web/src/lib/attribution.ts` | **yeni** |
| `apps/web/src/components/*` (client) | `captureFromUrl()` tetikleyici |
| `apps/web/src/app/odeme/page.tsx` | body'ye `attribution` ekle |
| `apps/web/src/app/api/siparis-kaydet/route.ts` | öncelik sırasına body'yi ekle |
| `apps/api/prisma/schema.prisma` | *(opsiyonel)* `gbraid`, `wbraid`, `utm*` kolonları |
| `apps/api/src/orders/orders.dto.ts` + `orders.service.ts` | yeni alanlar eklenirse |
| `packages/mock-data/src/legal.ts` | çerez politikasına bir cümle |

---

# B BÖLÜMÜ — SEO/reklam oturumu (Claude yapacak)

A Bölümü canlıya çıktıktan **sonra** anlamlı.

1. Google Ads'te **çevrimdışı dönüşüm işlemi** oluştur (`UPLOAD_CLICKS` tipi, "Markala Satın Alma — Çevrimdışı").
2. `markala-google` toolkit'ine yükleme betiği: admin API'den siparişleri çek → `gclid` +
   sipariş zamanı + tutar ile `ClickConversion` olarak Ads'e yükle.
3. Tekilleştirme: sipariş numarası `order_id` olarak gönderilir; aynı sipariş iki kez yüklenmez.
4. Sonuç: **çerez onayı olsun olmasın** Ads gerçek satışları öğrenir. Raporlama düzelir ve
   ileride akıllı teklif stratejisine (Maximize Conversions / tCPA) güvenle geçilebilir.

---

## Öncelik gerekçesi

Bu iş, reklam bütçesinden **önce** gelir. Şu an günde 400 TL harcıyoruz ve dönüşün olup
olmadığını göremiyoruz. A Bölümü olmadan hiçbir reklam kararı veriyle alınamaz —
bütçe artırmak da azaltmak da kör atış olur.
