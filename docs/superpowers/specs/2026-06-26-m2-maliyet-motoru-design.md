# m² Maliyet Motoru — Tasarım Dokümanı

**Tarih:** 2026-06-26 · **Branch:** `feat/m2-maliyet-motoru` · **Durum:** tasarım onaylandı, spec inceleme bekliyor

## Amaç

vinilturk.com tedarikçi maliyet listesini (85 ürün, $/m²) markala'nın fiyat motoruna taşımak ve ölçü-değişkenli ürünler için **m² bazlı, özel-ölçü destekli** bir fiyatlama sistemi kurmak. Dört katman:

1. **Özel ölçü konfigüratörü (storefront, canlı):** Müşteri ürün sayfasında malzeme + en×boy + adet + ekstralar seçer, anlık KDV-dahil fiyat görür.
2. **Maliyetten süren satış:** Satış = maliyet × marj × kur — DB'de saklanmaz, anlık türetilir; kur/marj değişince tüm ürünler güncellenir.
3. **Maliyet görünürlüğü:** Admin ızgarasında maliyet + türetilen satış + kâr.
4. **Yeni ürünler:** vinilturk malzemeleri markala ürünlerine **malzeme seçeneği** olarak eklenir.

**Kritik kısıt:** Hiçbir değişiklik onaysız canlıya alınmaz. Tüm iş izole branch + lokal önizlemede yapılır; Hasan bitmiş sistemi görüp onaylayınca tek-kapılı deploy edilir.

## Kapsam dışı (YAGNI)

- Additive ürünler (kartvizit, broşür, bloknot, zarf…) bu işten **etkilenmez**; mevcut hücre-bazlı motor aynen kalır.
- ISG levhaları kapsam dışı.
- Çoklu kur/döviz takibi yok (tek manuel kur).

---

## Bölüm 1 — Veri modeli

**`Product.pricingMode`** (yeni kolon, migration): `"additive"` (default — mevcut davranış) | `"area"` (yeni m² modu). Mevcut ürünler default ile etkilenmez.

**Opsiyon grupları** (mevcut `ProductOption` yeniden kullanılır):
- **Ölçü** — `groupRole:"dimension"`, yeni `kind:"area"` → özel en×boy + hazır ölçü çipleri.
- **Adet** — mevcut adet dimension.
- **Malzeme** — `groupRole:"priced"`; seçenekler (Çin 440, Avrupa 440, Mesh…), her biri `ProductPrice.cost` = $/m².
- **Ekstralar** — `groupRole:"priced"`; kuşgözü, laminasyon, kolon dikiş, CNC…

**Maliyet = tek kaynak, satış türetilir:** `ProductPrice.cost` = vinilturk $/m² (veya takımda TL/adet). `ProductPrice.price` area modunda **kullanılmaz** (satış anlık hesaplanır). Mevcut NOT NULL kısıtı için area satırlarında `price=0` yazılır ve area modunda yok sayılır.

**Opsiyon etki tipi** (vinilturk paritesi) — `ProductOption.rules` (mevcut Json alanı) içine gömülür, şema şişmez:
```json
{ "effect": "perM2|perM2Add|perPerimeter|conditional|perPiece", "birim": "dolar|tl", "maxM2": 50 }
```
- `perM2` — ana malzeme ($/m²)
- `perM2Add` — laminasyon/CNC (+$/m²)
- `perPerimeter` — kolon dikiş ($/çevre-m)
- `conditional` — <1 m² dikiş+kopça (adet başına)
- `perPiece` — takım (sabit $/TL/adet)

**Global ayarlar** — `SiteSetting` group `"pricing"`: `kur=46`, `marj=1.5`, `kdv=0.20`, `minM2=1`.

---

## Bölüm 2 — Fiyat motoru (area modu)

Motor `apps/api/src/orders/pricing.ts` (yetkili — anti-manipülasyon) + `apps/web/src/lib/configurator.ts` (web ikizi) içinde, ikiz mantık korunur. `pricingMode==="area"` ise yeni dal:

```
alan_m2     = en_cm × boy_cm / 10.000
toplam_alan = max(minM2 , alan_m2 × adet)
cevre_m     = ((en_cm + boy_cm) × 2) / 100

maliyet_TL = 0
her SEÇİLİ priced opsiyon için (cost, effect, birim = rules'tan):
   tl = (birim==="dolar") ? cost × kur : cost
   perM2 | perM2Add  → maliyet_TL += tl × toplam_alan
   perPerimeter      → maliyet_TL += tl × cevre_m × adet
   conditional(<1m²) → if alan_m2 < 1: maliyet_TL += tl × adet
   perPiece          → maliyet_TL += tl × adet

satis_haric = maliyet_TL × marj          // marj=1.5
satis_dahil = satis_haric × (1 + kdv)     // efektif ×1.8
```

- Müşteriye **KDV dahil** gösterilir; "KDV hariç" toggle `satis_haric`.
- **Yetki sunucuda:** sipariş anında API fiyatı yeniden hesaplar; client fiyatına güvenilmez.
- `getDisplayPrice` (kart "…'den"): en ucuz malzeme × 1 m² × marj × kur.
- Additive ürünler bu dala girmez.

---

## Bölüm 3 — Konfigüratör UI (storefront)

Mevcut `components/product/configurator.tsx` kabuğu; area modunda yeni `configurator-fields/area-field.tsx`:

1. **Malzeme** (dropdown).
2. **Ölçü** — hazır çipler + "✎ Özel ölçü" → En (cm) × Boy (cm).
3. **Adet**.
4. **Ekstralar** — ürüne uygun checkbox/select.
5. **Fiyat kartı** — büyük KDV-dahil fiyat + kırılım (alan m², min-1m² rozeti, birim, ekstralar) + KDV dahil/hariç toggle.

**Doğrulama:**
- En/Boy > 0; **maks alan/parça** = malzeme `maxM2` → aşılırsa uyarı ("tek parça basılamaz, en fazla X m²").
- Adet ≥ 1; aşırı girişte clamp.
- Geçersiz girişte fiyat kartı "Ölçü girin", "Sepete Ekle" pasif.

**Tutarlılık:** fiyat kartı = sepet = API yeniden-hesabı (tek motor).

---

## Bölüm 4 — Admin

1. **Fiyat Ayarları** — yeni `/ayarlar/fiyat`: `kur`, `marj`, `kdv`, `minM2`. Kaydet → tüm area ürünleri anında güncel.
2. **Ürün fiyat editörü (area modu):** ürünü "m² (area)" işaretle; Malzeme satırları (ad + $/m² maliyet + birim + maxM2); Ekstralar (ad + maliyet + etki). **Satış sütunu salt-okunur** (`maliyet×marj×kur`).
3. **Maliyet görünürlüğü:** ızgarada maliyet ₺ + satış ₺ + kâr.
4. **vinilturk içe aktarma yardımcısı:** çıkarılan liste bir JSON seed → "İçe Aktar" malzemeleri/maliyetleri tohumlar.

---

## Bölüm 5 — Ürün eşleme & migrasyon

**Migrasyon:** `Product.pricingMode` kolonu (default `additive`); veri kaybı yok.

**Konsolidasyon (karar):** Malzeme=seçenek modeli gereği, eski ayrı ürünler (örn. "Vinil Branda 440gr", "Mesh Branda") tek ana ürün altında **malzeme seçeneği** olur. Eski ürünler `isActive=false` + **301 yönlendirme** (SEO korunur, silinmez).

**Area ana ürünleri:**

| markala ana ürünü | Malzeme seçenekleri (vinilturk) | Tip |
|---|---|---|
| Branda / Afiş | Çin 280/440, Avrupa 440/510 (Solvent/UV), Işıklı, Arkası Siyah, Reflektif, Mesh, Blackout, Fibermark | m² |
| Folyo / Sticker | Normal/Mat/Şeffaf/Kumlama/Gri Folyo, One Way Vision, Reflektif, Baskes'ler, Laminasyonlu | m² |
| Dekota & Levha | Dekota 3/5/7/10mm, Pleksi 3/5mm, 3mm Kompozit, Magnet, Magnet CNC | m² |
| Canvas / Duvar Kağıdı | Canvas Solvent/UV, Duvar Kağıdı Solvent/UV, Lümen, Duratrans | m² |
| Bayrak & Tekstil | Raşel/Saten Gönder, Kırlangıç, Saten/Raşel Kumaş, Makam kumaş, Lightbox kumaş | m² |
| DTF Baskı | DTF 0-2 / 2-5 / 5-20 / 20m+ | m² |
| Display (takım) | Roll-Up, X-Banner, Makam Gold/Krom, Billboard, Yelken, Masa bayrağı takımları, Raket | adet (perPiece) |

**Seed:** vinilturk listesi (85 satır: $/m² + effect + birim + maxM) → JSON seed → import ana ürünlere + Malzeme/Ekstra opsiyonlarına + `ProductPrice.cost`'a yazar. **Idempotent.**

---

## Bölüm 6 — Teslim & canlıya alma

1. **İzole çalışma:** `feat/m2-maliyet-motoru` branch; main'e ve canlıya dokunulmaz.
2. **Lokal önizleme:** dev DB + vinilturk seed → çalışan konfigüratör (canlı lokal URL ve/veya ekran kaydı).
3. **Onay kapısı:** Hasan onaylayana kadar production'a hiçbir şey gitmez.
4. **Tek-kapılı deploy (onay sonrası):** prod DB yedeği → migration + seed + 301'ler → health → nginx reload.
5. **Güvenlik ağı:** migration geri-alınabilir; seed idempotent; eski ürünler silinmez (`isActive=false`+redirect).

---

## Test stratejisi

- **Birim (motor):** `pricing.spec.ts` + `configurator.spec.ts` — area modu: perM2/perPerimeter/conditional/perPiece, min-1m², dolar/tl, marj×kur; ikiz parite (api==web). vinilturk gerçek örnekleriyle doğrulama (Çin 440 = 2,20$/m² → 1m² = 101,20₺ KDV hariç maliyet).
- **Entegrasyon:** sipariş akışı area ürünüyle (sunucu fiyatı = gösterilen fiyat).
- **Regresyon:** additive ürünlerde fiyat değişmediğini doğrula (kartvizit/broşür snapshot).
- **E2E (lokal):** ürün sayfası → özel ölçü → fiyat → sepet → ödeme özeti tutarlılığı.

## Açık riskler

- **Eski ürün URL'leri:** konsolidasyonda 301 haritası eksiksiz olmalı (mevcut indeksli ürünler kaybolmasın).
- **maxM2 davranışı:** aşımda "engelle" mi "uyar+devam" mı — v1: engelle (tek parça basılamayan ölçü sipariş edilemez).
- **Kur senkronu:** kur tek manuel sayı; otomatik döviz beslemesi v1 dışı.
