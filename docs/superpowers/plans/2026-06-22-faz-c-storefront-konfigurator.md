# Faz C — Storefront Konfigüratör + Toplamsal Motor (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ile task-task uygula. Adımlar `- [ ]` checkbox.

**Goal:** Hem storefront (canlı konfigüratör + vitrin fiyatı) hem backend (yetkili sipariş fiyatı) yeni `options`+`prices` modelini **toplamsal motorla** okusun; eski `parameters`-tabanlı fiyatlama bırakılsın; kargo web'de `/settings/shipping`'ten okunsun.

**Architecture:** Toplamsal saf motor `computeConfiguredPrice(options, prices, selections)` — KASITLI DUPLİKE (api `pricing.ts` ↔ web `configurator.ts`), çünkü `@markala/types` API imajına runtime bundle edilemez (mevcut kalıp, pricing.ts:10). Tipler `@markala/types`'ta paylaşılır. Seçim şekli `Record<groupKey, optionKey>` (veride checkbox-group YOK → tek-seçim). Backend fiyatı DAİMA yetkili.

**Tech Stack:** Next.js 14 (web), NestJS (api), TypeScript, vitest. Dizin: `C:/tmp/markala-main`.

## Global Constraints
- Çalışma dizini: `C:/tmp/markala-main` (worktree, branch `fix/kurumsal-indirim-pagination`). baskisitesi STALE.
- **Toplamsal motor SÖZLEŞMESİ (api+web BİREBİR aynı; aynı test vakaları):**
  - Girdi: `options: PricingOption[]`, `prices: PricingPriceRow[]`, `selections: Record<string,string>` (groupKey→optionKey).
  - Grupla (groupKey), `groupSort`/`optionSort` sırala.
  - **Fiyat-boyutu** = ilk `groupRole==="dimension"` grup (groupSort'a göre) `groupKey!=="adet"` olan; yoksa tek dimension grup (örn. matris'te "adet"). `dimSel = selections[fiyatBoyutuKey]`.
  - **Birim** = Σ her `priced` grup: `prices` içinde `groupKey===grup && optionKey===seçili && (dimSel ? dimKey===dimSel : dimKey boş)` satırının `price`'ı (yoksa 0).
  - **Adet çarpanı** = `groupRole==="dimension" && groupKey==="adet" && key!==fiyatBoyutuKey` grubu varsa `Number(selections["adet"])`, yoksa 1.
  - **Grup yoksa (basit ürün):** `groupKey/optionKey` boş tek `price` satırı = birim, çarpan 1.
  - `total = max(0, birim × çarpan)`. Fiyat satırı yoksa 0 → "Teklif Al".
  - Kartvizit (matris): fiyatBoyutu=adet, çarpan yok → total=hücre. İSG: fiyatBoyutu=ebat, çarpan=adet → total=(malzeme[ebat]+baski[ebat])×adet. Basit: tek satır.
- **Vitrin fiyatı (kart/liste)** = API'nin verdiği `product.displayPrice` (= sunucu MIN(price); Faz B B9). Boşsa "Teklif Al". Detay konfigüratör canlı toplamı motordan.
- Kargo varsayılan **79/750** (settings boşsa). Web `/api/settings/shipping`'ten okur (mevcut public uç, Faz B).
- Eski `parameters` alanı/`calculateConfiguredPrice`/`calculatePrice` Faz E'ye kadar SİLİNMEZ ama fiyat KAYNAĞI olmaktan çıkar (orders + storefront yeni motoru kullanır).
- Para: API Decimal-string döndürebilir → motor `num()` ile coerce. KDV dahil (mevcut mantık).
- Her task: ilgili test + `pnpm --filter @markala/api type-check` ve/veya web `pnpm --filter @markala/web type-check` yeşil. ⚠️ tsconfig include'a DOKUNMA.
- Veri gerçeği: `product_prices` BOŞ (Hasan Faz D'de girer) → tüm konfigüratörler şu an "Teklif Al"; bu BEKLENEN (regresyon değil). 5 "dimension" (m²) ürünü A4'te "Özel ebat" tek-seçeneğe indi (m² serbest giriş YOK) — Faz D manuel; Faz C'de Teklif Al.

**Tip tanımları (C1'de @markala/types'a eklenir; tüm fazlar bunları kullanır):**
```ts
export interface PricingOption {
  groupKey: string; groupLabel: string; groupRole: "dimension" | "priced"; groupSort: number;
  optionKey: string; optionLabel: string; optionSublabel?: string | null; optionSort: number;
}
export interface PricingPriceRow {
  groupKey?: string | null; optionKey?: string | null; dimKey?: string | null;
  cost?: number | string | null; price: number | string;
}
export type ConfiguratorSelections = Record<string, string>; // groupKey -> optionKey
```

---

### Task 1: @markala/types — yeni fiyat tipleri + Product alanları

**Files:** Modify: `packages/types/src/index.ts`

**Interfaces — Produces:** `PricingOption`, `PricingPriceRow`, `ConfiguratorSelections` (yukarıdaki blok); `Product`'a `options?: PricingOption[]`, `prices?: PricingPriceRow[]`, `displayPrice?: number | null` eklenir.

- [ ] **Step 1:** `packages/types/src/index.ts`'e yukarıdaki 3 tip tanımını ekle (uygun bölüme, Product yakınına).
- [ ] **Step 2:** `Product` interface'ine ekle: `options?: PricingOption[];`, `prices?: PricingPriceRow[];`, `displayPrice?: number | null;`. `parameters: ProductParameter[]` KALIR (Faz E'de kaldırılır).
- [ ] **Step 3:** Type-check: `pnpm --filter @markala/types type-check` (varsa) veya `pnpm --filter @markala/web type-check` → PASS.
- [ ] **Step 4:** Commit: `git add packages/types/src/index.ts && git commit -m "feat(types): PricingOption/PricingPriceRow/ConfiguratorSelections + Product.options/prices/displayPrice"`

### Task 2: API toplamsal motor — `computeConfiguredPrice` + testler

**Files:** Modify: `apps/api/src/orders/pricing.ts` · Test: `apps/api/src/orders/pricing.spec.ts`

**Interfaces — Produces:** `computeConfiguredPrice(options: PricingOption[], prices: PricingPriceRow[], selections: Record<string,string>): number` (saf, Global Constraints sözleşmesi). Tipler api'de local interface olarak tanımlanır (Prisma'dan bağımsız, @markala/types runtime'da yok).

- [ ] **Step 1: Failing test** — `pricing.spec.ts`'e yeni `describe("computeConfiguredPrice")` ekle (eski `calculateConfiguredPrice` testlerine DOKUNMA, onlar Task 3'te kaldırılacak):
```ts
import { computeConfiguredPrice } from "./pricing";
const opt = (groupKey, groupRole, optionKey, groupSort=0, optionSort=0) =>
  ({ groupKey, groupLabel: groupKey, groupRole, groupSort, optionKey, optionLabel: optionKey, optionSort });
describe("computeConfiguredPrice", () => {
  it("basit ürün: tek null-key satır", () => {
    expect(computeConfiguredPrice([], [{ groupKey:null, optionKey:null, dimKey:null, price:250 }], {})).toBe(250);
  });
  it("matris (kartvizit): paket×adet = hücre", () => {
    const options = [opt("paket","priced","cyp"), opt("adet","dimension","1000")];
    const prices = [{ groupKey:"paket", optionKey:"cyp", dimKey:"1000", price:290 }];
    expect(computeConfiguredPrice(options, prices, { paket:"cyp", adet:"1000" })).toBe(290);
  });
  it("İSG additive: (malzeme[ebat]+baski[ebat]) × adet", () => {
    const options = [opt("ebat","dimension","50x70"), opt("baski","priced","reflektif"), opt("malzeme","priced","dekota"), opt("adet","dimension","2")];
    const prices = [
      { groupKey:"baski", optionKey:"reflektif", dimKey:"50x70", price:110 },
      { groupKey:"malzeme", optionKey:"dekota", dimKey:"50x70", price:70 },
    ];
    expect(computeConfiguredPrice(options, prices, { ebat:"50x70", baski:"reflektif", malzeme:"dekota", adet:"2" })).toBe(360);
  });
  it("malzeme yok (satır yok) = 0 katkı", () => {
    const options = [opt("ebat","dimension","25x35"), opt("baski","priced","reflektif"), opt("malzeme","priced","yok"), opt("adet","dimension","1")];
    const prices = [{ groupKey:"baski", optionKey:"reflektif", dimKey:"25x35", price:110 }];
    expect(computeConfiguredPrice(options, prices, { ebat:"25x35", baski:"reflektif", malzeme:"yok", adet:"1" })).toBe(110);
  });
  it("fiyat satırı yoksa 0 (Teklif Al)", () => {
    const options = [opt("paket","priced","cyp"), opt("adet","dimension","1000")];
    expect(computeConfiguredPrice(options, [], { paket:"cyp", adet:"1000" })).toBe(0);
  });
});
```
- [ ] **Step 2:** Test fail → FAIL (fonksiyon yok).
- [ ] **Step 3:** `pricing.ts`'e ekle (Global Constraints sözleşmesinin BİREBİR uygulaması):
```ts
interface PricingOption { groupKey: string; groupLabel: string; groupRole: "dimension"|"priced"; groupSort: number; optionKey: string; optionLabel: string; optionSublabel?: string|null; optionSort: number; }
interface PricingPriceRow { groupKey?: string|null; optionKey?: string|null; dimKey?: string|null; price: number|string; cost?: number|string|null; }

export function computeConfiguredPrice(options: PricingOption[], prices: PricingPriceRow[], selections: Record<string, string>): number {
  const sels = selections && typeof selections === "object" ? selections : {};
  const opts = Array.isArray(options) ? options : [];
  const rows = Array.isArray(prices) ? prices : [];

  // Grupla + sırala
  const groupMap = new Map<string, { key: string; role: "dimension"|"priced"; sort: number }>();
  for (const o of opts) {
    if (!groupMap.has(o.groupKey)) groupMap.set(o.groupKey, { key: o.groupKey, role: o.groupRole, sort: o.groupSort });
  }
  const groups = [...groupMap.values()].sort((a, b) => a.sort - b.sort);

  if (groups.length === 0) {
    const row = rows.find((p) => p.groupKey == null && p.optionKey == null);
    return row ? Math.max(0, num(row.price)) : 0;
  }

  // Fiyat-boyutu: ilk non-adet dimension; yoksa tek dimension
  const dims = groups.filter((g) => g.role === "dimension");
  const priceDimKey = dims.length ? (dims.find((g) => g.key !== "adet") ?? dims[0]).key : null;
  const dimSel = priceDimKey ? sels[priceDimKey] : undefined;

  // Birim = Σ priced gruplar
  let unit = 0;
  for (const g of groups) {
    if (g.role !== "priced") continue;
    const sel = sels[g.key];
    if (!sel) continue;
    const row = rows.find((p) => p.groupKey === g.key && p.optionKey === sel && (dimSel ? p.dimKey === dimSel : p.dimKey == null));
    if (row) unit += num(row.price);
  }

  // Adet çarpanı: fiyat-boyutu OLMAYAN "adet" dimension
  let qty = 1;
  const adet = groups.find((g) => g.role === "dimension" && g.key === "adet" && g.key !== priceDimKey);
  if (adet) {
    const n = Number(sels[adet.key]);
    if (Number.isFinite(n) && n > 0) qty = n;
  }
  return Math.max(0, unit * qty);
}
```
(`num()` zaten dosyada var.)
- [ ] **Step 4:** Test pass → PASS. `pnpm --filter @markala/api exec vitest run src/orders/pricing.spec.ts`.
- [ ] **Step 5:** Commit: `git add apps/api/src/orders/pricing.ts apps/api/src/orders/pricing.spec.ts && git commit -m "feat(api): computeConfiguredPrice toplamsal motor (options/prices)"`

### Task 3: OrdersService yeni motoru kullanır (yetkili sipariş fiyatı)

**Files:** Modify: `apps/api/src/orders/orders.service.ts` · Modify: `apps/api/src/orders/pricing.ts` (eski calculateConfiguredPrice'ı kaldır) · Test: `apps/api/src/orders/orders.service.spec.ts`, `apps/api/src/orders/pricing.spec.ts`

**Interfaces — Consumes:** `computeConfiguredPrice` (Task 2), `extractSelections` (mevcut — selections artık groupKey→optionKey Record, aynı kod çalışır).

- [ ] **Step 1:** `orders.service.ts` ürün `findMany` (≈satır 224): `include: { options: true, prices: true }` ekle (kampanya paketi dalını bozma).
- [ ] **Step 2:** Fiyat çağrı noktası (≈satır 272-273): `calculateConfiguredPrice(Number(product.basePrice), product.parameters, selections)` → `computeConfiguredPrice(product.options ?? [], (product.prices ?? []).map(r => ({ ...r, price: Number(r.price) })), selections)`. basePrice ARTIK fiyat kaynağı değil (yeni modelde her şey prices'tan; basit üründe null-key satır). `extractSelections(i.configuration)` aynı kalır.
- [ ] **Step 3:** `pricing.ts`: eski `calculateConfiguredPrice` fonksiyonunu + ilgili `DimensionValue`/`isDimensionValue` yardımcılarını KALDIR (artık kullanılmıyor; `extractSelections`/`pickConfigurationSummary`/`num` KALIR). `pricing.spec.ts`'ten eski `calculateConfiguredPrice` describe bloklarını kaldır (computeConfiguredPrice testleri kalır).
- [ ] **Step 4:** `orders.service.spec.ts`: konfigüratör-ürün testini yeni modele uyarla — product mock'una `options`/`prices` ekle, `configuration.selections` yeni şekle ({paket:"cyp",adet:"1000"}) çevir, beklenen unitPrice≈290 (prices satırı 290). Basit-ürün testi: product mock'a `prices:[{groupKey:null,optionKey:null,dimKey:null,price:290}]`, `options:[]` → unitPrice 290. shippingFee/total assertion'ları korunur.
- [ ] **Step 5:** Test: `pnpm --filter @markala/api exec vitest run src/orders/` → tümü PASS. type-check PASS.
- [ ] **Step 6:** Commit: `git add apps/api/src/orders && git commit -m "feat(orders): sipariş fiyatını yeni toplamsal motordan hesapla (parameters bırakıldı)"`

### Task 4: Web toplamsal motor mirror + getDisplayPrice + initConfig/buildSummary

**Files:** Modify: `apps/web/src/lib/configurator.ts` · Test: `apps/web/src/lib/configurator.spec.ts` (yoksa oluştur)

**Interfaces — Produces:**
- `computeConfiguredPrice(options, prices, selections)` — Task 2 ile BİREBİR aynı (mirror; aynı test vakaları).
- `initConfig(product)` — yeni: her grup için ilk option'ı seçili yapar → `Record<groupKey, optionKey>`.
- `getDisplayPrice(product)` — yeni: `product.displayPrice ?? 0` döndürür (artık parameters'tan hesaplamaz).
- `buildSummary(product, selections, needsDesign)` — options'tan insanca özet.
- `calculateTotal(product, selections): number` — `computeConfiguredPrice(product.options ?? [], product.prices ?? [], selections)`.

- [ ] **Step 1: Failing test** — `configurator.spec.ts`: Task 2'deki 5 vakanın AYNISI `computeConfiguredPrice` için + `getDisplayPrice` (product.displayPrice döndürür) + `initConfig` (her grup ilk option) testi.
- [ ] **Step 2:** Test fail → FAIL.
- [ ] **Step 3:** `configurator.ts`'i yeniden yaz:
  - Task 2'deki `computeConfiguredPrice`'ı (PricingOption/PricingPriceRow local veya @markala/types'tan import) ekle.
  - `initConfig(product): ConfiguratorSelections` — `product.options`'ı grupla, her grup için `optionSort` en küçük option'ın `optionKey`'ini seç.
  - `getDisplayPrice(product) = product.displayPrice ?? 0`.
  - `calculateTotal(product, selections) = computeConfiguredPrice(product.options ?? [], product.prices ?? [], selections)`.
  - `buildSummary(product, selections, needsDesign)` — her grup seçili option'ın label'ı `·` ile birleşik (+ "Tasarım desteği isteniyor").
  - Eski `calculatePrice`/`PriceBreakdown`/`ConfigState`(parameters-tabanlı)/`isDimensionValue`/`findParameter` — Task 6 (UI) bunları bırakacak; bu task'ta KALDIRMA (UI henüz onları import ediyor olabilir), SADECE yeni fonksiyonları EKLE + getDisplayPrice'ı değiştir. Eski calculatePrice'ı Task 6 sökünce kaldır.
- [ ] **Step 4:** Test pass + `pnpm --filter @markala/web type-check` PASS.
- [ ] **Step 5:** Commit: `git add apps/web/src/lib/configurator.ts apps/web/src/lib/configurator.spec.ts && git commit -m "feat(web): toplamsal motor mirror + getDisplayPrice=displayPrice + initConfig(options)"`

### Task 5: catalog.ts — options/prices/displayPrice eşle (mapProduct)

**Files:** Modify: `apps/web/src/lib/catalog.ts`

**Interfaces — Consumes:** API `GET /products` + `/products/:slug` yanıtı (`options`/`prices`/`displayPrice` içerir, Faz B B9).

- [ ] **Step 1:** `mapProduct(p, mock)`'a ekle: `options: Array.isArray(p.options) ? p.options : (mock'ta yok → [])`, `prices: Array.isArray(p.prices) ? p.prices : []`, `displayPrice: typeof p.displayPrice === "number" ? p.displayPrice : null`. `parameters` eşlemesi mevcut katı mantıkla KALIR (Faz E'de kaldırılır). Mock fallback YOK (yeni alanlar API'den; yoksa boş/null → Teklif Al).
- [ ] **Step 2:** Type-check: `pnpm --filter @markala/web type-check` → PASS.
- [ ] **Step 3:** Commit: `git add apps/web/src/lib/catalog.ts && git commit -m "feat(web): catalog mapProduct options/prices/displayPrice eşle"`

### Task 6: Konfigüratör UI yeniden yazımı (gruplar → radio kartları + canlı toplam)

**Files:** Modify: `apps/web/src/components/product/configurator.tsx` · Modify/Create: `apps/web/src/components/product/configurator-fields/*` (yeni grup-tabanlı render) · gerekirse `apps/web/src/components/product/configurator-fields/reducer.ts`

**Interfaces — Consumes:** `product.options`/`product.prices`, `initConfig`, `calculateTotal`, `buildSummary` (Task 4); cart `addItem` (Task 7 ile uyumlu config şekli).

**Yeni davranış:**
- State: `selections: ConfiguratorSelections` (groupKey→optionKey) + `quantity` (sepet seti) + `needsDesign`/`uploadedFile*` (mevcut korunur).
- `initState` = `initConfig(product)`.
- Render: `product.options`'ı grupla (groupSort/optionSort sıralı); HER grup için `groupLabel` başlık + option'lar radio-kart (optionLabel + optionSublabel). Seçim → reducer `SET_SELECTION {groupKey, optionKey}`.
- Canlı toplam: `calculateTotal(product, selections)`; 0 ise "Teklif Al" göster, "Sepete Ekle" yerine "Teklif Al / WhatsApp" (mevcut Teklif Al akışı varsa onu kullan).
- "Sepete Ekle": `addItem({ productSlug, productName, productImage, configuration: { selections, summary: buildSummary(...), totalPrice: calculateTotal(...), needsDesign, uploadedFileName, uploadedFileUrl }, quantity })`.
- Eski parameters-tabanlı `ParameterField`/matrix/dimension/quantity/checkbox alanları KALDIRILIR (yeni model hepsini radio-grup olarak gösterir). Dosya başına bağımsız render: tek `<OptionGroup group={...} selected={...} onSelect={...} />` bileşeni yeterli.

- [ ] **Step 1:** `configurator-fields/` mevcut dosyaları oku; grup-tabanlı yeni render için tek `OptionGroup` bileşeni oluştur (radio-kart, optionLabel kalın + optionSublabel açıklama). Erişilebilir (radiogroup/aria).
- [ ] **Step 2:** `reducer.ts`'i yeni state'e uyarla: `selections: Record<string,string>`, action'lar `SET_SELECTION`, `SET_QUANTITY`, `SET_NEEDS_DESIGN`, `SET_FILE`, init `initConfig(product)`.
- [ ] **Step 3:** `configurator.tsx`'i yeniden yaz: gruplar map + OptionGroup, canlı toplam `useMemo(calculateTotal)`, Teklif-Al/Sepete-Ekle dallanması, addItem yeni config şekli.
- [ ] **Step 4:** Eski parameters-tabanlı alan bileşenlerini + `configurator.ts`'teki eski `calculatePrice`/`ConfigState`/`PriceBreakdown`/`isDimensionValue`/`findParameter`'ı kaldır (artık import edilmiyor). `calculatePrice` import eden başka yer var mı kontrol et (grep) — varsa `calculateTotal`/`getDisplayPrice`'a taşı.
- [ ] **Step 5:** `pnpm --filter @markala/web type-check` + `pnpm --filter @markala/web build` (Next derleme) → PASS.
- [ ] **Step 6:** Commit: `git add apps/web/src/components/product apps/web/src/lib/configurator.ts && git commit -m "feat(web): konfigüratör UI grup-tabanlı yeniden yazım (options/prices motoru)"`

### Task 7: Cart config şekli + tüketiciler (selections groupKey→optionKey)

**Files:** Modify: `apps/web/src/lib/cart-store.ts` · `packages/types/src/index.ts` (CartItem.configuration.selections tipi) · sepet/ödeme özeti tüketicileri (`apps/web/src/app/sepet/page.tsx`, `apps/web/src/app/odeme/page.tsx` — summary gösterimi)

**Interfaces — Consumes:** Task 6 addItem config; backend `extractSelections` (groupKey→optionKey okur).

- [ ] **Step 1:** `packages/types` `CartItem.configuration.selections` tipini `Record<string, string>` (ConfiguratorSelections) yap (eski `ConfiguratorSelectionValue` union artık gerekmez; varsa sadeleştir, başka kullanım yoksa kaldır).
- [ ] **Step 2:** `cart-store.ts` `subtotal()` = Σ `item.configuration.totalPrice * item.quantity` — DEĞİŞMEZ (totalPrice yeni motordan geliyor). Tip uyumu kontrol.
- [ ] **Step 3:** sepet/ödeme sayfalarında konfigürasyon ÖZETİ gösterimi `configuration.summary` string'ini kullanır (zaten öyle) — selections'ı doğrudan render eden yer varsa `summary`'e geçir. `configuration.totalPrice` 0 ise satırda "Teklif Al" göster (sipariş edilemez ürün sepete eklenememeli — Task 6 zaten engelliyor).
- [ ] **Step 4:** `pnpm --filter @markala/web type-check` + ilgili sayfalar derlenir → PASS.
- [ ] **Step 5:** Commit: `git add apps/web packages/types && git commit -m "feat(web): cart config selections yeni şekil (groupKey→optionKey)"`

### Task 8: Kargo web'de settings'ten okunur (79/750 hardcode kaldır)

**Files:** Modify: `apps/web/src/app/sepet/page.tsx`, `apps/web/src/app/odeme/page.tsx` · `packages/api-client/src/index.ts` (settings.shipping metodu) · gerekirse bir `apps/web/src/lib/shipping.ts` yardımcı

**Interfaces — Consumes:** Public `GET /api/settings/shipping` → `{ fee: number; freeThreshold: number }` (Faz B).

- [ ] **Step 1:** `packages/api-client`'e `settings = { shipping(): Promise<{fee:number;freeThreshold:number}> }` metodu ekle (GET `/settings/shipping`, auth yok).
- [ ] **Step 2:** `sepet/page.tsx` + `odeme/page.tsx`: hardcoded `SHIPPING_FEE=79`/`FREE_SHIPPING_THRESHOLD=750` yerine değeri client-side fetch'le (`useEffect` + state) VEYA bu sayfalar client component olduğundan `/api/settings/shipping` (web proxy) ya da doğrudan apiClient ile çek; fetch başarısızsa fallback 79/750 (kod sabiti). VAT_RATE değişmez.
- [ ] **Step 3:** Ürün detay trust-badge'deki statik "750₺ üzeri ücretsiz" metnini settings değerinden türet (opsiyonel; mümkün değilse sabit bırak ama yorumla işaretle).
- [ ] **Step 4:** `pnpm --filter @markala/web type-check` + build → PASS.
- [ ] **Step 5:** Commit: `git add apps/web packages/api-client && git commit -m "feat(web): kargo bedelini /settings/shipping'ten oku (hardcode kaldırıldı, fallback 79/750)"`

---

## Self-Review
- **Spec kapsamı (Faz C):** toplamsal motor api+web (C2/C4) ✓; getDisplayPrice=displayPrice (C4) ✓; konfigüratör options/prices render (C6) ✓; kargo settings web (C8) ✓; sipariş yetkili fiyatı yeni motor (C3) ✓; tipler (C1) ✓; catalog eşleme (C5) ✓; cart (C7) ✓.
- **Motor senkronu:** api (C2) + web (C4) AYNI sözleşme + AYNI 5 test vakası → duplikasyon güvenli (mevcut kalıp).
- **"adet" konvansiyonu:** deterministik (ilk non-adet dim = fiyat-boyutu; adet farklıysa çarpan) — matris/İSG/basit hepsi doğru (Global Constraints'te test edildi).
- **Regresyon:** prices boş → motor 0 → "Teklif Al" (mevcut davranış). Sipariş: konfigüratörlü ürün şu an Teklif Al → sipariş edilemez (zaten satış durmuş). basePrice fiyat kaynağı olmaktan çıkar (yeni modelde null-key satır).
- **Risk:** C3 (sipariş fiyatı, ödeme-kritik) — testlerle korunur; C6 (UI rewrite, en büyük) — type-check+build kapısı + Teklif-Al dalı boş-fiyatı güvenli karşılar.
- **Açık (Faz D'ye):** 5 m² ürünü "Özel ebat" placeholder (manuel); admin fiyat girişi olmadan her şey Teklif Al — D bitince Hasan fiyatlar.

## Sonraki planlar (C bitince yazılır)
- Faz D: admin konfigüratör kurucu (options var/yok ekle-çıkar) + fiyat ızgarası (cost+satış, kırım CRUD) + toplu araç (bulk-adjust UI) + kategori-tek-fiyat + kargo ayarları (PATCH /settings).
- Faz E: tam de-mock (catalog/blog/yorum/referans/arama/kategori + parameters/calculatePrice kalıntıları).
