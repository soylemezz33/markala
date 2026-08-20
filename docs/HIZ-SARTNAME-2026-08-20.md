# İniş Sayfası Hız Şartnamesi — 2026-08-20

> **Devir:** Geliştirici oturumu. Kaynak: SEO/reklam oturumu ölçümleri.
> **Neden acil:** Google Ads kalite puanı bileşenlerinde 14 kelimenin 12'si
> **"sayfa deneyimi: ortalamanın altında"** — reklam alakası ise hemen hepsinde yüksek.
> Yani Google'a göre reklamlar iyi, SAYFALAR yavaş. Reklam trafiğinin **%90'ı mobil**.
> Düşük kalite puanı = aynı bütçeyle daha az gösterim + daha pahalı tık + dönüşüm kaybı.
> Bu iş, reklam bütçesinin kendisinden daha yüksek getirili.

## Ölçülen durum (Lighthouse 13.4.1, mobil emülasyon, 2026-08-20)

| Sayfa (reklam iniş) | Skor | LCP | TBT | CLS |
|---|---|---|---|---|
| `/kategori/is-guvenligi-uyari-ikaz` | **57** | **8,8 sn** | **580 ms** | 0 |
| `/kategori/vinil-branda-afis` | 67 | **8,8 sn** | 270 ms | 0 |
| `/matbaa/mersin` | 66 | 5,8 sn | 430 ms | 0 |
| `/urun/dikkat-kaygan-zemin` | 70 | 5,4 sn | 360 ms | 0,004 |

Hedef eşikler: LCP ≤ 2,5 sn · TBT ≤ 200 ms · skor ≥ 85. CLS iniş sayfalarında ZATEN iyi — dokunma.

Ham JSON raporları: scratchpad `lh/` klasöründe üretildi; gerekirse yeniden üretim:
`npx lighthouse <url> --only-categories=performance --form-factor=mobile --screenEmulation.mobile --chrome-flags="--headless=new"`

---

## P1 — Kategori kartlarında LCP görseline öncelik (en yüksek etki)

**Bulgu:** Kategori sayfasında ekran üstündeki ürün kartları dahil TÜM görseller
`loading="lazy"` ve hiçbirinde `fetchpriority` yok (canlı HTML'den doğrulandı).
LCP elementi ilk sıradaki ürün görseli; yavaş 4G'de 343 KB JS ile ağ yarışına girip
8,8 sn'ye itiliyor.

**İstenen:**
- `components/product-card.tsx` → `ProductCard`'a opsiyonel `priority?: boolean` prop'u;
  true iken `<Image priority fetchPriority="high" loading="eager">`, değilse mevcut davranış.
- `app/urunler/all-products-client.tsx` → grid render'ında **yalnız 1. sayfanın ilk 4
  kartına** `priority` geçir (mobilde ilk ekran ~2-4 kart). Sayfalama/sort değişince
  priority verilmez (yalnız ilk boyama önemli).
- Aynı kart bileşenini kullanan ana sayfa railleri ETKİLENMEMELİ (orada priority zaten
  hero'ya ait; raillerde lazy doğru).

**Kabul:** Kategori sayfası HTML'inde ilk 4 `<img>` `fetchpriority="high"` taşımalı,
5. ve sonrası lazy kalmalı. Lighthouse mobil LCP < 4 sn'ye inmeli (tek başına bu adımla).

## P2 — JS yükünü düşür (TBT + LCP yarışı)

**Bulgu:** Kategori sayfası ilk yükte **343 KB gzip JS / 21 chunk**; ürün sayfası 354 KB.
Lighthouse "unused JavaScript ~0,8-1,1 sn" diyor; TBT 270-580 ms. En büyük parça 92 KB
(`chunks/2405-*.js`) — içeriği bundle analyzer ile teşhis edilmeli (`ANALYZE=true pnpm build`,
analyzer zaten kurulu: `next.config.mjs`).

**İstenen:**
- 92 KB'lık chunk'ın ne taşıdığını isimlendir (şüpheliler: framer-motion, carousel,
  form/validation kütüphanesi). Ekran-altı ve etkileşim-sonrası bileşenleri
  `next/dynamic` (ssr:false gerekmeyenlerde) ile böl: yorumlar bölümü, cross-sell,
  recently-viewed, cart-drawer, arama overlay'i tipik adaylar.
- `AllProductsClient` içindeki toolbar/sort/filtre mantığının kategori sayfasına
  taşıdığı bağımlılıkları gözden geçir — kategori sayfası için filtreler gizliyken
  bile tüm kod iniyor.
- Hedef: kategori ilk-yük JS ≤ 250 KB gzip, TBT ≤ 200 ms.

**Kabul:** Lighthouse "unused JS" fırsatı < 0,3 sn; TBT dört sayfada da ≤ 200 ms.

## P3 — Üçüncü taraf script erteleme (dikkatli)

**Bulgu:** gtag (GA4+Ads) `afterInteractive`, Meta Pixel `lazyOnload` (`components/analytics.tsx`).

**İstenen:** gtag `afterInteractive` KALMALI (Ads dönüşüm/gclid işleme bozulmasın —
kırmızı çizgi). Clarity/Hotjar/GTM env ile açılırsa `lazyOnload` olduklarını doğrula.
Başka müdahale gerekmiyor; bu madde "bozma" korumasıdır.

## P4 — Ana sayfa CLS 0,292 (ayrı iş, iniş sayfası değil)

Reklamlar ana sayfaya inmiyor ama marka trafiği iniyor. Bulgu (önceki denetim):
`components/home/premium-hero-slider.tsx` → `HeroArtDirectedImage` oran ipucu olarak
masaüstü boyutunu (2120×742) veriyor, mobil görsel ise 0,844 oranlı dikey →
mobilde yükleme sonrası zıplama. Çözüm: `<picture>` içinde mobil `<source>` için de
doğru oran bilgisini ver (CSS `aspect-ratio` media query ile ya da mobil boyutları
admin verisinden geçirerek). Hasan yeni 3840×1344 masaüstü / 1440×1706 mobil
görseller hazırlıyor — oran mantığı bu ölçülerle test edilmeli.

## P5 — Küçük işler

- Kategori sayfalarında font preload yok (ana sayfada var) — layout seviyesine taşınabilir mi bak; değilse geç.
- `api.markala.com.tr` preconnect'i layout'ta — kategori HTML'inde de geldiğini doğrula (muhtemelen tamam).

---

## Doğrulama protokolü (iş bitince)

1. Aynı 4 URL'de Lighthouse mobil → hedef: skor ≥ 85, LCP ≤ 2,5, TBT ≤ 200.
2. Deploy sonrası SEO/reklam oturumuna haber ver → kalite puanı takibi bizde:
   "sayfa deneyimi" bileşeninin BELOW_AVERAGE → AVERAGE'a dönmesi 1-3 hafta sürer
   (Google yeniden tarayınca). QS 3→5-6 = aynı bütçeyle ~%30-50 daha fazla tıklama.
3. CWV alan verisi (gerçek kullanıcı) zaten GA4'e akıyor (web-vitals events) —
   LCP dağılımındaki iyileşme oradan da izlenecek.

## Dokunulacak dosyalar (özet)

| Dosya | İş |
|---|---|
| `apps/web/src/components/product-card.tsx` | `priority` prop |
| `apps/web/src/app/urunler/all-products-client.tsx` | ilk 4 karta priority |
| bundle analyzer çıktısına göre 3-6 bileşen | `next/dynamic` bölme |
| `apps/web/src/components/home/premium-hero-slider.tsx` | mobil oran (P4) |

## Yapılmayacaklar

- Görünür tasarım/yerleşim değişikliği YOK.
- gtag yükleme stratejisine dokunulmayacak.
- CLS'i iyi olan iniş sayfalarında boyut/oran değişikliği yok.

---

## ✅ DOĞRULAMA — 2026-08-20 (iş sonrası, SEO oturumu)

Aynı makine, aynı komut, iş sonrası 2 tur (tek koşu gürültülü olduğu için):

| Sayfa | Önce | Tur 1 | Tur 2 | Hüküm |
|---|---|---|---|---|
| kategori-uyari | 8,8 sn LCP | 3,7 | 6,2 | ✅ **belirgin iyileşme** (~%45) |
| kategori-branda | 8,8 sn | 5,7 | — | ✅ iyileşme (~%35) |
| matbaa-mersin | 5,8 sn | 7,2 | 5,5 | ≈ değişmedi (gürültü bandında) |
| urun-kaygan | 5,4 sn | 6,0 | 6,2 | ⚠️ **tutarlı hafif kötüleşme** |

**P1 (görsel önceliği) hedefi vurdu:** ilk 4 kart `fetchpriority="high"`, 5+ lazy — canlı
HTML'den doğrulandı; en kötü iki sayfa (kategoriler) belirgin hızlandı.

**⚠️ Geri bildirim — P2 şüphesi:** TBT her sayfada, her iki turda da yükseldi
(580→~740 · 270→428 · 430→~620 · 360→~550 ms). JS 343→313 KB düştüğü halde TBT'nin
artması ve ürün sayfasının (P1 değişikliği ALMAYAN sayfa) tutarlı yavaşlaması,
dinamik bölmenin işi ertelemek yerine parçalayıp hidrasyon maliyeti eklediğini
düşündürüyor. Öneri: `next/dynamic` ile bölünen bileşenlerden görünür-üstü olanlar
bölünmeden geri alınsın; yalnız gerçekten ekran-altı/etkileşim-sonrası olanlar
bölünmeli. Lokal tekrarlı ölçümle doğrulanmalı (tek koşuya güvenme).

**Nihai hakem şunlar olacak:** (1) GA4'e akan gerçek kullanıcı web-vitals verisi
(birkaç gün), (2) Ads kalite puanı "sayfa deneyimi" bileşeni (1-3 hafta). İkisini
SEO oturumu takip ediyor.

## 📌 EK — Ana sayfa ölçümü (2026-08-20, kullanıcı PSI 58 gördü)

Hasan PSI'da ana sayfayı ölçtü: 58/100. Bizim eş zamanlı lokal ölçüm: 52/100.
Ana sayfa şartnamenin ilk kapsamında YOKTU (reklamlar oraya inmiyor) — ama artık
sıradaki iş. Skorun anatomisi:

| Metrik | Değer | Skora etkisi |
|---|---|---|
| LCP | 3,9 sn | orta (eski denetimde 8,85'ti — P1/P2 dolaylı düzeltmiş) |
| **CLS** | **0,292** | **ana katil #1** (eşik 0,1; skor ağırlığı %25) |
| **TBT** | **880 ms** | **ana katil #2** (eşik 200; skor ağırlığı %30) |

**CLS kaynağı ölçümle isimlendi:** kayan öğe `<section class="bg-paper-50 py-12 …">`
— hero'nun hemen altındaki bölüm. Yani hero mobilde geç gelen görseliyle büyüyüp
altındaki her şeyi itiyor = şartnamedeki **P4** teşhisinin ölçüm kanıtı
(`HeroArtDirectedImage` mobil oran ipucu masaüstü boyutlarıyla veriliyor).

**Karar: P4 artık ertelenmiş değil, P2-TBT geri bildirimiyle birlikte sıradaki iş.**

1. **P4 (CLS 0,292):** hero'nun mobil görünümünde doğru en-boy oranını rezerve et
   (CSS `aspect-ratio` media query ya da mobil boyutları props'tan geçir). Hasan'ın
   hazırlayacağı yeni görseller: masaüstü 3840×1344 (oran 2,857), mobil 1440×1706
   (oran 0,844) — rezervasyon bu oranlarla kurulmalı. Kabul: ana sayfa mobil CLS ≤ 0,05.
2. **TBT 880 ms:** doğrulama bölümündeki P2 geri bildirimiyle aynı kök — ana sayfa
   315 KB JS + hidrasyon. Görünür-üstü dynamic bölmeleri geri al; ana sayfada
   ekran-altı raylar (product-rail, trusted-by, process-timeline) ertelenebilir.
   Kabul: ana sayfa mobil TBT ≤ 300 ms.

İkisi bitince beklenen: ana sayfa mobil skor 52 → **80+** (CLS %25 + TBT %30 ağırlık
taşıyor; LCP zaten toparlamış durumda).
