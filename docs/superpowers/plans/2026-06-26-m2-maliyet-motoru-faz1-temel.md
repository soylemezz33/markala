# m² Maliyet Motoru — Faz 1: Temel (Şema + Area Motoru) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** markala fiyat motoruna `pricingMode="area"` modunu + saf m² hesap fonksiyonunu (maliyet→satış, dolar/TL, etki tipleri, min-1m²) ekle; additive ürünleri bozmadan.

**Architecture:** Mevcut `pricing.ts` (API, yetkili) + `configurator.ts` (web ikiz) motorlarına yeni saf fonksiyon `computeAreaPrice` eklenir. `Product.pricingMode` kolonu hangi motorun çalışacağını belirler. Satış DB'de saklanmaz; `maliyet × marj × kur` ile anlık türetilir. Global ayarlar `SiteSetting` group `"pricing"`.

**Tech Stack:** NestJS + Prisma (Postgres) API, Next.js web, vitest, TypeScript.

## Global Constraints

- Kur/marj/kdv/minM2 değerleri `SiteSetting` group `"pricing"`'ten; default `kur=46, marj=1.5, kdv=0.20, minM2=1`.
- "marj=1.5" net kâr; KDV-dahil efektif çarpan `marj×(1+kdv)=1.8`.
- Area motoru `cost`'u `ProductPrice.cost`'tan (vinilturk $/m² veya TL) okur; `price` alanını area modunda yok sayar.
- Opsiyon etki/birim meta'sı `ProductOption.rules` (Json): `{ effect, birim, maxM2 }`. `effect ∈ {perM2, perM2Add, perPerimeter, conditional, perPiece}`, `birim ∈ {dolar, tl}`.
- `pricing.ts` (API) ve `configurator.ts` (web) area mantığı **birebir aynı** olmalı (parite testi şart).
- Additive ürünler (`pricingMode` default) mevcut `computeConfiguredPrice` yolundan geçer, davranış değişmez.
- TDD: her task önce başarısız test → minimal implementasyon → geçen test → commit.

---

### Task 1: Şema — `Product.pricingMode` kolonu + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (Product modeli, ~satır 335-337 civarı)
- Create: migration (`prisma migrate dev` üretir)

**Interfaces:**
- Produces: `Product.pricingMode: string` (default `"additive"`), DB kolon `pricing_mode`.

- [ ] **Step 1: Şemaya kolon ekle**

`apps/api/prisma/schema.prisma` içinde Product modeline, `isActive` satırının hemen altına ekle:

```prisma
  isActive         Boolean  @default(true) @map("is_active")
  /// Fiyatlama modu: "additive" (hücre-bazlı, mevcut) | "area" (m² bazlı maliyet motoru)
  pricingMode      String   @default("additive") @map("pricing_mode")
```

- [ ] **Step 2: Migration üret**

Run: `cd apps/api && npx prisma migrate dev --name add_product_pricing_mode`
Expected: `migrations/<ts>_add_product_pricing_mode/migration.sql` oluşur, `ALTER TABLE "products" ADD COLUMN "pricing_mode" TEXT NOT NULL DEFAULT 'additive'` içerir.

- [ ] **Step 3: Prisma client üret + doğrula**

Run: `cd apps/api && npx prisma generate && node -e "const {PrismaClient}=require('@prisma/client'); new PrismaClient(); console.log('ok')"`
Expected: `ok` (client `pricingMode` tipini tanır).

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): Product.pricingMode kolonu (additive|area)"
```

---

### Task 2: Ayar okuyucu — `SettingsService.getPricing()`

**Files:**
- Modify: `apps/api/src/settings/settings.service.ts`
- Test: `apps/api/src/settings/settings.service.spec.ts`

**Interfaces:**
- Produces: `getPricing(): Promise<{ kur: number; marj: number; kdv: number; minM2: number }>` — `SiteSetting` group `"pricing"` okur, eksik anahtarlarda default'a düşer.

- [ ] **Step 1: Başarısız test yaz**

`apps/api/src/settings/settings.service.spec.ts` içine ekle (mevcut describe yapısına uygun; PrismaService mock'u dosyada nasılsa öyle kullan):

```ts
describe("getPricing", () => {
  it("eksik anahtarlarda default döner", async () => {
    prisma.siteSetting.findMany.mockResolvedValue([]);
    expect(await service.getPricing()).toEqual({ kur: 46, marj: 1.5, kdv: 0.2, minM2: 1 });
  });
  it("DB değerlerini okur", async () => {
    prisma.siteSetting.findMany.mockResolvedValue([
      { key: "pricing.kur", value: 50, group: "pricing" },
      { key: "pricing.marj", value: 1.6, group: "pricing" },
    ]);
    const p = await service.getPricing();
    expect(p.kur).toBe(50);
    expect(p.marj).toBe(1.6);
    expect(p.kdv).toBe(0.2); // eksik → default
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `cd apps/api && npx vitest run src/settings/settings.service.spec.ts -t getPricing`
Expected: FAIL — `service.getPricing is not a function`.

- [ ] **Step 3: `getPricing` ekle**

`settings.service.ts` içine `getShipping`'in altına:

```ts
  async getPricing(): Promise<{ kur: number; marj: number; kdv: number; minM2: number }> {
    const rows = await this.prisma.siteSetting.findMany({ where: { group: "pricing" } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const num = (v: unknown, d: number) => {
      const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
      return Number.isFinite(n) && n > 0 ? n : d;
    };
    return {
      kur: num(map["pricing.kur"], 46),
      marj: num(map["pricing.marj"], 1.5),
      kdv: num(map["pricing.kdv"], 0.2),
      minM2: num(map["pricing.minM2"], 1),
    };
  }
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `cd apps/api && npx vitest run src/settings/settings.service.spec.ts -t getPricing`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/settings/settings.service.ts apps/api/src/settings/settings.service.spec.ts
git commit -m "feat(api): SettingsService.getPricing (kur/marj/kdv/minM2 + default)"
```

---

### Task 3: Area motoru — `pricing.ts: computeAreaPrice` + testler

**Files:**
- Modify: `apps/api/src/orders/pricing.ts`
- Test: `apps/api/src/orders/pricing.spec.ts`

**Interfaces:**
- Consumes: mevcut `PricingOption`, `PricingPriceRow`, `num()` (pricing.ts içinde).
- Produces:
  - `export interface PricingSettings { kur: number; marj: number; kdv: number; minM2: number }`
  - `export const DEFAULT_PRICING: PricingSettings`
  - `export interface AreaOptionRules { effect?: "perM2"|"perM2Add"|"perPerimeter"|"conditional"|"perPiece"; birim?: "dolar"|"tl"; maxM2?: number }`
  - `export function computeAreaPrice(options, prices, selections, settings?): { haric: number; dahil: number }`

- [ ] **Step 1: Başarısız testler yaz**

`apps/api/src/orders/pricing.spec.ts` sonuna ekle:

```ts
import { computeAreaPrice, DEFAULT_PRICING } from "./pricing";

const aopt = (groupKey: string, role: "dimension"|"priced", optionKey: string, rules?: object) =>
  ({ groupKey, groupLabel: groupKey, groupRole: role, groupSort: 0, optionKey, optionLabel: optionKey, optionSort: 0, rules: rules ?? null });

describe("computeAreaPrice", () => {
  const malzeme = (cost: number, rules: object) => ({ options: [aopt("malzeme","priced","m", rules)], prices: [{ groupKey:"malzeme", optionKey:"m", dimKey:null, price:0, cost }] });

  it("Çin 440 (2.20$/m², dolar) 100x100=1m² → haric 151.80, dahil 182.16", () => {
    const { options, prices } = malzeme(2.20, { effect:"perM2", birim:"dolar" });
    const r = computeAreaPrice(options, prices, { malzeme:"m", en:"100", boy:"100", adet:"1" }, DEFAULT_PRICING);
    expect(r.haric).toBe(151.8);
    expect(r.dahil).toBe(182.16);
  });

  it("min 1 m²: 60x150=0.9m² → 1 m² sayılır (Saten Kırlangıç 3.75$ → dahil 310.50)", () => {
    const { options, prices } = malzeme(3.75, { effect:"perM2", birim:"dolar" });
    const r = computeAreaPrice(options, prices, { malzeme:"m", en:"60", boy:"150", adet:"1" }, DEFAULT_PRICING);
    expect(r.dahil).toBe(310.5);
  });

  it("perPiece TL (Yelken takım 550₺) × adet 2 → dahil 1980", () => {
    const { options, prices } = malzeme(550, { effect:"perPiece", birim:"tl" });
    const r = computeAreaPrice(options, prices, { malzeme:"m", en:"0", boy:"0", adet:"2" }, DEFAULT_PRICING);
    expect(r.dahil).toBe(1980);
  });

  it("perPerimeter (kolon dikiş 0.50$/m) 100x200, çevre 6m → ek = 0.50×46×6 = 138 maliyet", () => {
    const opts = [aopt("kolon","priced","k",{ effect:"perPerimeter", birim:"dolar" })];
    const prices = [{ groupKey:"kolon", optionKey:"k", dimKey:null, price:0, cost:0.5 }];
    const r = computeAreaPrice(opts, prices, { kolon:"k", en:"100", boy:"200", adet:"1" }, DEFAULT_PRICING);
    expect(r.haric).toBe(207); // 138 × 1.5
  });

  it("conditional (<1m² dikiş 0.20$) sadece alan<1'de eklenir", () => {
    const opts = [aopt("dikis","priced","d",{ effect:"conditional", birim:"dolar" })];
    const prices = [{ groupKey:"dikis", optionKey:"d", dimKey:null, price:0, cost:0.2 }];
    const small = computeAreaPrice(opts, prices, { dikis:"d", en:"50", boy:"50", adet:"1" }, DEFAULT_PRICING);
    const big = computeAreaPrice(opts, prices, { dikis:"d", en:"200", boy:"200", adet:"1" }, DEFAULT_PRICING);
    expect(small.haric).toBeGreaterThan(0);
    expect(big.haric).toBe(0); // alan 4m² ≥ 1 → eklenmez
  });
});
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduğunu gör**

Run: `cd apps/api && npx vitest run src/orders/pricing.spec.ts -t computeAreaPrice`
Expected: FAIL — `computeAreaPrice is not exported`.

- [ ] **Step 3: `computeAreaPrice` implementasyonu**

`apps/api/src/orders/pricing.ts` sonuna ekle:

```ts
export interface PricingSettings { kur: number; marj: number; kdv: number; minM2: number }
export const DEFAULT_PRICING: PricingSettings = { kur: 46, marj: 1.5, kdv: 0.2, minM2: 1 };
export interface AreaOptionRules { effect?: "perM2"|"perM2Add"|"perPerimeter"|"conditional"|"perPiece"; birim?: "dolar"|"tl"; maxM2?: number }
type AreaOption = PricingOption & { rules?: AreaOptionRules | null };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeAreaPrice(
  options: AreaOption[],
  prices: PricingPriceRow[],
  selections: Record<string, string>,
  settings: PricingSettings = DEFAULT_PRICING,
): { haric: number; dahil: number } {
  const sels = selections && typeof selections === "object" ? selections : {};
  const opts = Array.isArray(options) ? options : [];
  const rows = Array.isArray(prices) ? prices : [];
  const { kur, marj, kdv, minM2 } = settings;

  const en = num(sels.en);
  const boy = num(sels.boy);
  let adet = Number(sels.adet);
  if (!Number.isFinite(adet) || adet < 1) adet = 1;

  const alan = (en * boy) / 10000;
  const toplamAlan = Math.max(minM2, alan * adet);
  const cevre = ((en + boy) * 2) / 100;

  const role = new Map<string, "dimension"|"priced">();
  for (const o of opts) if (!role.has(o.groupKey)) role.set(o.groupKey, o.groupRole);

  let maliyet = 0;
  for (const [gKey, r] of role) {
    if (r !== "priced") continue;
    const sel = sels[gKey];
    if (!sel) continue;
    const optMeta = opts.find((o) => o.groupKey === gKey && o.optionKey === sel);
    const row = rows.find((p) => p.groupKey === gKey && p.optionKey === sel);
    if (!row) continue;
    const cost = num(row.cost ?? row.price);
    const rules: AreaOptionRules = optMeta?.rules ?? {};
    const tl = rules.birim === "tl" ? cost : cost * kur;
    switch (rules.effect ?? "perM2") {
      case "perM2":
      case "perM2Add": maliyet += tl * toplamAlan; break;
      case "perPerimeter": maliyet += tl * cevre * adet; break;
      case "conditional": if (alan < 1) maliyet += tl * adet; break;
      case "perPiece": maliyet += tl * adet; break;
    }
  }

  const haric = Math.max(0, maliyet * marj);
  const dahil = haric * (1 + kdv);
  return { haric: round2(haric), dahil: round2(dahil) };
}
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini gör**

Run: `cd apps/api && npx vitest run src/orders/pricing.spec.ts -t computeAreaPrice`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/orders/pricing.ts apps/api/src/orders/pricing.spec.ts
git commit -m "feat(api): computeAreaPrice — m² maliyet motoru (etki tipleri, min-1m², dolar/tl)"
```

---

### Task 4: Web ikizi — `configurator.ts: computeAreaPrice` + parite testi

**Files:**
- Modify: `apps/web/src/lib/configurator.ts`
- Test: `apps/web/src/lib/configurator.spec.ts`

**Interfaces:**
- Produces: `configurator.ts`'te API ile **birebir aynı** `computeAreaPrice` + `PricingSettings` + `DEFAULT_PRICING`.

- [ ] **Step 1: Parite testi yaz**

`apps/web/src/lib/configurator.spec.ts` sonuna ekle (aynı vinilturk değerleri — API ile aynı sonuç beklenir):

```ts
import { computeAreaPrice, DEFAULT_PRICING } from "./configurator";

const aopt = (groupKey: string, role: "dimension"|"priced", optionKey: string, rules?: object) =>
  ({ groupKey, groupLabel: groupKey, groupRole: role, groupSort: 0, optionKey, optionLabel: optionKey, optionSort: 0, rules: rules ?? null });

describe("computeAreaPrice (web — API paritesi)", () => {
  it("Çin 440 1m² → dahil 182.16", () => {
    const r = computeAreaPrice(
      [aopt("malzeme","priced","m",{ effect:"perM2", birim:"dolar" })],
      [{ groupKey:"malzeme", optionKey:"m", dimKey:null, price:0, cost:2.20 }],
      { malzeme:"m", en:"100", boy:"100", adet:"1" }, DEFAULT_PRICING,
    );
    expect(r.dahil).toBe(182.16);
  });
  it("min 1 m²: 60x150 Saten Kırlangıç 3.75$ → dahil 310.50", () => {
    const r = computeAreaPrice(
      [aopt("malzeme","priced","m",{ effect:"perM2", birim:"dolar" })],
      [{ groupKey:"malzeme", optionKey:"m", dimKey:null, price:0, cost:3.75 }],
      { malzeme:"m", en:"60", boy:"150", adet:"1" }, DEFAULT_PRICING,
    );
    expect(r.dahil).toBe(310.5);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `cd apps/web && npx vitest run src/lib/configurator.spec.ts -t "API paritesi"`
Expected: FAIL — `computeAreaPrice is not exported`.

- [ ] **Step 3: API'deki implementasyonun aynısını ekle**

`apps/web/src/lib/configurator.ts` sonuna, Task 3 Step 3'teki **birebir aynı** kodu ekle (tek fark: web'in `PricingOption` tipinde `rules` yok → `AreaOption` tipini web'de de tanımla):

```ts
export interface PricingSettings { kur: number; marj: number; kdv: number; minM2: number }
export const DEFAULT_PRICING: PricingSettings = { kur: 46, marj: 1.5, kdv: 0.2, minM2: 1 };
export interface AreaOptionRules { effect?: "perM2"|"perM2Add"|"perPerimeter"|"conditional"|"perPiece"; birim?: "dolar"|"tl"; maxM2?: number }
type AreaOption = PricingOption & { rules?: AreaOptionRules | null };

const _round2 = (n: number) => Math.round(n * 100) / 100;

export function computeAreaPrice(
  options: AreaOption[],
  prices: PricingPriceRow[],
  selections: Record<string, string>,
  settings: PricingSettings = DEFAULT_PRICING,
): { haric: number; dahil: number } {
  const sels = selections && typeof selections === "object" ? selections : {};
  const opts = Array.isArray(options) ? options : [];
  const rows = Array.isArray(prices) ? prices : [];
  const { kur, marj, kdv, minM2 } = settings;
  const en = _num(sels.en);
  const boy = _num(sels.boy);
  let adet = Number(sels.adet);
  if (!Number.isFinite(adet) || adet < 1) adet = 1;
  const alan = (en * boy) / 10000;
  const toplamAlan = Math.max(minM2, alan * adet);
  const cevre = ((en + boy) * 2) / 100;
  const role = new Map<string, "dimension"|"priced">();
  for (const o of opts) if (!role.has(o.groupKey)) role.set(o.groupKey, o.groupRole);
  let maliyet = 0;
  for (const [gKey, r] of role) {
    if (r !== "priced") continue;
    const sel = sels[gKey];
    if (!sel) continue;
    const optMeta = opts.find((o) => o.groupKey === gKey && o.optionKey === sel);
    const row = rows.find((p) => p.groupKey === gKey && p.optionKey === sel);
    if (!row) continue;
    const cost = _num(row.cost ?? row.price);
    const rules: AreaOptionRules = optMeta?.rules ?? {};
    const tl = rules.birim === "tl" ? cost : cost * kur;
    switch (rules.effect ?? "perM2") {
      case "perM2":
      case "perM2Add": maliyet += tl * toplamAlan; break;
      case "perPerimeter": maliyet += tl * cevre * adet; break;
      case "conditional": if (alan < 1) maliyet += tl * adet; break;
      case "perPiece": maliyet += tl * adet; break;
    }
  }
  const haric = Math.max(0, maliyet * marj);
  const dahil = haric * (1 + kdv);
  return { haric: _round2(haric), dahil: _round2(dahil) };
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `cd apps/web && npx vitest run src/lib/configurator.spec.ts -t "API paritesi"`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/configurator.ts apps/web/src/lib/configurator.spec.ts
git commit -m "feat(web): computeAreaPrice — API ile birebir parite"
```

---

### Task 5: Sipariş motorunda `pricingMode` dalı

**Files:**
- Modify: `apps/api/src/orders/orders.service.ts` (~satır 290-310, `computeConfiguredPrice` çağrısı)
- Test: `apps/api/src/orders/orders.service.spec.ts`

**Interfaces:**
- Consumes: `computeAreaPrice`, `SettingsService.getPricing()`, `product.pricingMode`.
- Produces: sipariş kalemi area ürünse `computeAreaPrice(...).dahil`, değilse mevcut `computeConfiguredPrice(...)`.

- [ ] **Step 1: Çağrı bağlamını oku**

Run: `cd /c/tmp/markala-main && sed -n '285,315p' apps/api/src/orders/orders.service.ts`
Expected: `computeConfiguredPrice(product.options, product.prices, selections)` çağrısının tam hali görünür. Burada `product` nesnesinin `pricingMode` ve servisin `settingsService` erişimi olduğunu not et (yoksa Step 3'te enjekte et).

- [ ] **Step 2: Başarısız test yaz**

`orders.service.spec.ts` içine, area ürünlü bir sipariş kaleminin fiyatının `computeAreaPrice` ile hesaplandığını doğrulayan test ekle (mevcut mock kurulum stiline uygun — `product.pricingMode="area"`, options/prices area şemasıyla, `getPricing` DEFAULT_PRICING döndürür). Beklenen: Çin 440 1m² → 182.16.

- [ ] **Step 3: Dalı ekle**

`orders.service.ts:297` civarındaki çağrıyı sarmala:

```ts
const configuredUnit =
  product.pricingMode === "area"
    ? computeAreaPrice(
        product.options as never,
        product.prices as never,
        selections,
        await this.settings.getPricing(),
      ).dahil
    : computeConfiguredPrice(product.options as never, product.prices as never, selections);
```

`import { computeAreaPrice } from "./pricing";` ekle; `SettingsService` constructor'a enjekte değilse ekle (`private settings: SettingsService`), `OrdersModule`'a `SettingsModule` import et.

- [ ] **Step 4: Testleri çalıştır**

Run: `cd apps/api && npx vitest run src/orders/orders.service.spec.ts`
Expected: PASS (yeni + mevcut testler).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/orders
git commit -m "feat(api): orders motoru pricingMode=area dalı (computeAreaPrice)"
```

---

### Task 6: Area ürünleri için `displayPrice`

**Files:**
- Modify: `apps/api/src/products/products.service.ts` (~satır 60-70, `minMap`/`displayPrice`)
- Test: `apps/api/src/products/products.service.spec.ts` (yoksa oluştur)

**Interfaces:**
- Consumes: `computeAreaPrice`, `getPricing()`, `product.pricingMode`.
- Produces: area ürünün `displayPrice` = en ucuz malzeme × 1 m² × marj × kur (KDV dahil) — kart "…'den başlayan" için.

- [ ] **Step 1: Çağrı bağlamını oku**

Run: `cd /c/tmp/markala-main && sed -n '40,70p' apps/api/src/products/products.service.ts`
Expected: `displayPrice`/`minMap` üretiminin tam hali; area dalını nereye ekleyeceğini belirle.

- [ ] **Step 2: Başarısız test yaz**

Area ürün (malzeme cost 2.20$/perM2/dolar) için `displayPrice` ≈ 182.16 bekleyen test ekle (en ucuz malzeme × 1 m²).

- [ ] **Step 3: Area dalı ekle**

`products.service.ts` displayPrice üretiminde: `if (p.pricingMode === "area")` → priced "malzeme" grubunun en ucuz `cost`'unu bul, `computeAreaPrice` ile `en:"100",boy:"100",adet:"1"` ve o tek malzeme seçiliyken `.dahil` hesapla; değilse mevcut `minMap` mantığı.

- [ ] **Step 4: Testleri çalıştır**

Run: `cd apps/api && npx vitest run src/products/products.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Tüm api+web testlerini çalıştır (regresyon)**

Run: `cd apps/api && npx vitest run && cd ../web && npx vitest run`
Expected: tüm testler PASS (additive ürün davranışı değişmedi).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/products
git commit -m "feat(api): area ürünleri için displayPrice (en ucuz malzeme × 1m²)"
```

---

## Sonraki fazlar (ayrı planlar — Faz 1 build+review sonrası yazılır)

- **Faz 2 — Konfigüratör UI:** `area-field.tsx` (özel en×boy + presetler), fiyat kartı (KDV dahil + kırılım + min-1m² rozeti), maxM2 doğrulama, `configurator.tsx` area dalı.
- **Faz 3 — Admin:** `/ayarlar/fiyat` (kur/marj/kdv/minM2), area ürün fiyat editörü (malzeme $/m² + etki + birim + maxM2; satış salt-okunur), maliyet/kâr görünürlüğü, vinilturk JSON import.
- **Faz 4 — Veri & go-live:** vinilturk seed JSON, 7 ana ürün + malzeme konsolidasyonu, eski ürün 301'leri, prod yedek → migration+seed → health (Hasan onayı sonrası).

## Self-Review

- **Spec coverage:** Faz 1, spec Bölüm 1 (şema: Task 1; ayar: Task 2) + Bölüm 2 (motor: Task 3-4-5-6) tamamını karşılar. Bölüm 3-6 sonraki fazlarda (yukarıda outline). ✔
- **Placeholder:** Task 5/6 Step 1 "oku" adımları gerçek `sed` komutu içeriyor (call-site kodu dosyaya bağlı; planlamada okunup uyarlanır — placeholder değil, kasıtlı keşif adımı). Diğer tüm code step'leri tam kod içeriyor. ✔
- **Tip tutarlılığı:** `computeAreaPrice` imzası ve `{haric,dahil}` dönüşü Task 3-4-5-6'da aynı; `PricingSettings`/`AreaOptionRules` aynı tanım. ✔
