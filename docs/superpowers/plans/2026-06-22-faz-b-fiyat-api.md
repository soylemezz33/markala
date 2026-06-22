# Faz B — Fiyat API Modülü (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ile task-task uygula. Adımlar `- [ ]` checkbox.

**Goal:** Yeni fiyat sistemine API katmanı: `product_options`/`product_prices` için ürün-bazlı CRUD + toplu zam/indirim (saklı fiyat referanslı) + kategori-tek-fiyat; kargo `site_settings`'e taşınıp admin-yönetilir + public okunur; public ürün yanıtına `options`/`prices` + `displayPrice`(MIN) eklenir.

**Architecture:** Yeni `prices` NestJS modülü (admin-korumalı CRUD + toplu araçlar). Kargo MEVCUT `SiteSetting`/`SettingsModule` sistemiyle yönetilir (group="shipping") — Faz A'da yanlışlıkla eklenen redundant `Setting`/`settings` tablosu kaldırılır. `ProductsService` yanıtı genişletilir. `OrdersService` kargoyu hardcode yerine settings'ten okur.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL, class-validator, vitest. Dizin: `C:/tmp/markala-main`.

## Global Constraints
- Çalışma dizini: `C:/tmp/markala-main` (origin/main HEAD). baskisitesi STALE — orada ÇALIŞMA.
- Auth kalıbı: admin uçları `@UseGuards(JwtAuthGuard, RolesGuard) @Roles("admin","super_admin") @ApiBearerAuth()`. Import yolları: `../auth/jwt.guard`, `../auth/roles.guard`, `../prisma/prisma.service`.
- ⚠️ DUPLICATE ROUTE YASAĞI (incident 2094604833 sınıfı): yeni controller route'ları mevcut `ProductsController` (`GET /products`, `GET /products/:slug`) ile ÇAKIŞMAMALI. `PricesController` `@Controller()` (prefix yok) + her metotta tam yol; segment sayısı farklı (`products/:id/prices` vs `products/:slug`) → çakışma yok.
- Yıkıcı DROP yalnız Faz A'da eklenen redundant `settings` tablosuna izinli (kodda referansı yok — B1'de doğrulanır). Eski alanlar (`products.parameters/base_price/starting_price`) KORUNUR (Faz E'ye kadar okunur).
- `product_prices` BOŞ kalır (Hasan Faz D admin'den girer). Bu yüzden `displayPrice` çoğu üründe null → storefront "Teklif Al" (mevcut davranışla aynı, regresyon yok).
- Kargo varsayılanı **79₺ / 750₺ eşik** — settings yoksa kod fallback bu değerler (mevcut `orders.service.ts` sabitleriyle birebir; testler 79/750 bekliyor).
- Toplu zam/indirim: `price = ROUND(price × katsayı)` — **saklı (mevcut) `product_prices.price` referans alınır**, tek tutarlı işlem (spec gereği; eski çok-alanlı compounding hatası bu modelde yok).
- Her task: ilgili spec testi + `pnpm --filter @markala/api type-check` yeşil. ⚠️ tsconfig include'a DOKUNMA (incident 30ae8ac: scripts/ eklemek build'i dist/src/main'e kaydırdı).
- Para: `Prisma.Decimal`; `product_prices.price` Decimal(10,2), `cost` Decimal(10,2)?.

**Forward dependency (Faz B kapsamı DIŞI):** "adet" çift-anlamı (matris=fiyat-boyutu / quantity=çarpan) fiyat MOTORU konusudur; Faz C konfigüratör planında çözülür. Faz B yalnız satırları DEPOLAR + servis eder + MIN hesaplar → motor semantiğine bağlı değildir.

---

### Task 1: Redundant `Setting` modelini kaldır + kargoyu `site_settings`'e taşı (migration)

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (model `Setting` bloğunu sil — satır ~879-884)
- Create: `apps/api/prisma/migrations/20260622170000_drop_settings_seed_shipping/migration.sql`

**Interfaces — Consumes:** mevcut `SiteSetting { key(PK), value Json, group, updatedAt }` → `site_settings`.

- [ ] **Step 1:** Doğrula `Setting`/`prisma.setting` kodda kullanılmıyor: `grep -rn "prisma\.setting\b" apps/api/src` → 0 sonuç (B1 ön koşulu; varsa BLOCKED bildir).
- [ ] **Step 2:** `schema.prisma`'dan `model Setting { ... @@map("settings") }` bloğunu TAMAMEN sil. (Product modelinde Setting ilişkisi yok — dokunma; `options`/`prices` relation KALIR.)
- [ ] **Step 3:** Migration dosyası oluştur — içerik:
```sql
-- Faz A'da yanlışlıkla eklenen redundant settings tablosunu kaldır.
DROP TABLE IF EXISTS "settings";

-- Kargo yapılandırmasını mevcut site_settings sistemine taşı (group="shipping").
-- value JSON (jsonb) — sayı olarak saklanır. ON CONFLICT: var olanı bozma (idempotent).
INSERT INTO "site_settings" ("key", "value", "group", "updated_at") VALUES
  ('shipping.fee', '79'::jsonb, 'shipping', now()),
  ('shipping.freeThreshold', '750'::jsonb, 'shipping', now())
ON CONFLICT ("key") DO NOTHING;
```
- [ ] **Step 4:** Type-check: `pnpm --filter @markala/api type-check` → PASS (Setting kaldırıldı, kod referansı yok).
- [ ] **Step 5:** Commit: `git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/20260622170000_drop_settings_seed_shipping && git commit -m "refactor(db): redundant settings tablosunu kaldır, kargoyu site_settings'e taşı"`

### Task 2: Kargo settings — service okuma + public uç

**Files:**
- Modify: `apps/api/src/settings/settings.service.ts` (`getShipping()` ekle)
- Modify: `apps/api/src/settings/settings.controller.ts` (public `GET /settings/shipping`)
- Test: `apps/api/src/settings/settings.service.spec.ts` (genişlet)

**Interfaces — Produces:** `SettingsService.getShipping(): Promise<{ fee: number; freeThreshold: number }>` — group="shipping"; eksikse `{ fee:79, freeThreshold:750 }`.

- [ ] **Step 1: Failing test** — `settings.service.spec.ts`'e ekle:
```ts
describe("getShipping", () => {
  it("site_settings'ten fee+freeThreshold okur", async () => {
    prisma.siteSetting.findMany.mockResolvedValue([
      { key: "shipping.fee", value: 99, group: "shipping", updatedAt: new Date() },
      { key: "shipping.freeThreshold", value: 1000, group: "shipping", updatedAt: new Date() },
    ] as any);
    expect(await service.getShipping()).toEqual({ fee: 99, freeThreshold: 1000 });
  });
  it("eksikse 79/750 fallback", async () => {
    prisma.siteSetting.findMany.mockResolvedValue([] as any);
    expect(await service.getShipping()).toEqual({ fee: 79, freeThreshold: 750 });
  });
});
```
(Mevcut spec'in `prisma` mock'unu kullan; `siteSetting.findMany` mock'lanır. Mevcut testte mock yoksa, dosyanın mock kurulum bloğuna `siteSetting: { findMany: vi.fn(), upsert: vi.fn() }` ekle.)
- [ ] **Step 2:** Test fail: `pnpm --filter @markala/api exec vitest run src/settings/settings.service.spec.ts` → FAIL (getShipping yok).
- [ ] **Step 3:** `settings.service.ts`'e ekle:
```ts
async getShipping(): Promise<{ fee: number; freeThreshold: number }> {
  const rows = await this.prisma.siteSetting.findMany({ where: { group: "shipping" } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const num = (v: unknown, d: number) => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) && n >= 0 ? n : d;
  };
  return { fee: num(map["shipping.fee"], 79), freeThreshold: num(map["shipping.freeThreshold"], 750) };
}
```
- [ ] **Step 4:** `settings.controller.ts`'e public uç ekle (GUARD YOK — storefront okur):
```ts
@Get("shipping")
shipping() {
  return this.service.getShipping();
}
```
(Mevcut `@Get()` admin-korumalı kalır; `@Get("shipping")` daha spesifik, çakışmaz.)
- [ ] **Step 5:** Test pass + type-check → PASS.
- [ ] **Step 6:** Commit: `git add apps/api/src/settings && git commit -m "feat(settings): kargo settings okuma + public GET /settings/shipping"`

### Task 3: OrdersService kargoyu settings'ten okur

**Files:**
- Modify: `apps/api/src/orders/orders.service.ts` (sabitler → `SettingsService.getShipping()`)
- Modify: `apps/api/src/orders/orders.module.ts` (SettingsModule import)
- Modify: `apps/api/src/settings/settings.module.ts` (SettingsService export — yoksa)
- Test: `apps/api/src/orders/orders.service.spec.ts` (settings mock ekle)

**Interfaces — Consumes:** `SettingsService.getShipping()` (B2).

- [ ] **Step 1:** `settings.module.ts`'i kontrol et; `exports: [SettingsService]` yoksa ekle.
- [ ] **Step 2:** `orders.module.ts`: `imports: [SettingsModule]` ekle (SettingsModule import et).
- [ ] **Step 3:** `orders.service.ts`: constructor'a `private settings: SettingsService` ekle (import `../settings/settings.service`). `DEFAULT_SHIPPING_FEE`/`FREE_SHIPPING_THRESHOLD` sabit kullanımını, sipariş hesaplama noktasında `const { fee, freeThreshold } = await this.settings.getShipping();` ile değiştir; `freeShipping = appliedCoupon?.type === "free_shipping" || subtotal >= freeThreshold; shippingFee = freeShipping ? 0 : fee;`. Modül-seviye sabitleri fallback olarak `getShipping` zaten kapsıyor — sabitleri SİL veya yalnız geriye-dönük referans için bırakma; `getShipping` tek kaynak.
- [ ] **Step 4: Test güncelle** — `orders.service.spec.ts`'te OrdersService kurulumuna SettingsService mock'u sağla: `getShipping: vi.fn().mockResolvedValue({ fee: 79, freeThreshold: 750 })`. Mevcut 79/750 assertion'ları DEĞİŞMEZ (mock 79/750 döner). free_shipping kupon + 750 eşik testleri geçmeli.
- [ ] **Step 5:** Test + type-check: `pnpm --filter @markala/api exec vitest run src/orders/orders.service.spec.ts` → PASS.
- [ ] **Step 6:** Commit: `git add apps/api/src/orders apps/api/src/settings/settings.module.ts && git commit -m "feat(orders): kargo bedelini settings'ten oku (hardcode kaldırıldı)"`

### Task 4: Prices modülü iskeleti + GET /products/:id/prices

**Files:**
- Create: `apps/api/src/prices/prices.module.ts`, `prices.controller.ts`, `prices.service.ts`, `prices.dto.ts`
- Modify: `apps/api/src/app.module.ts` (PricesModule kaydı)
- Test: `apps/api/src/prices/prices.service.spec.ts`

**Interfaces — Produces:**
- `PricesService.getForProduct(productId: string): Promise<{ options: ProductOption[]; prices: ProductPrice[] }>` — options `groupSort,optionSort` sıralı; ürün yoksa `NotFoundException`.
- Route: `GET /products/:id/prices` (admin-korumalı).

- [ ] **Step 1: Failing test** — `prices.service.spec.ts`:
```ts
import { PricesService } from "./prices.service";
import { NotFoundException } from "@nestjs/common";
const mkPrisma = () => ({
  product: { findUnique: vi.fn() },
  productOption: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn(), createMany: vi.fn() },
  productPrice: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn(), createMany: vi.fn() },
});
it("getForProduct ürün yoksa NotFound", async () => {
  const p = mkPrisma(); p.product.findUnique.mockResolvedValue(null);
  const s = new PricesService(p as any);
  await expect(s.getForProduct("x")).rejects.toBeInstanceOf(NotFoundException);
});
it("getForProduct options+prices döndürür", async () => {
  const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
  p.productOption.findMany.mockResolvedValue([{ id: "o1", groupKey: "paket" }]);
  p.productPrice.findMany.mockResolvedValue([{ id: "pr1", price: "50" }]);
  const s = new PricesService(p as any);
  expect(await s.getForProduct("p1")).toEqual({ options: [{ id: "o1", groupKey: "paket" }], prices: [{ id: "pr1", price: "50" }] });
});
```
- [ ] **Step 2:** Test fail → FAIL (PricesService yok).
- [ ] **Step 3:** `prices.service.ts`:
```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PricesService {
  constructor(private prisma: PrismaService) {}

  private async assertProduct(productId: string) {
    const p = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!p) throw new NotFoundException(`Ürün bulunamadı: ${productId}`);
  }

  async getForProduct(productId: string) {
    await this.assertProduct(productId);
    const [options, prices] = await Promise.all([
      this.prisma.productOption.findMany({
        where: { productId },
        orderBy: [{ groupSort: "asc" }, { optionSort: "asc" }],
      }),
      this.prisma.productPrice.findMany({ where: { productId } }),
    ]);
    return { options, prices };
  }
}
```
- [ ] **Step 4:** `prices.controller.ts`:
```ts
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PricesService } from "./prices.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("prices")
@Controller()
export class PricesController {
  constructor(private service: PricesService) {}

  @Get("products/:id/prices")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  getForProduct(@Param("id") id: string) {
    return this.service.getForProduct(id);
  }
}
```
- [ ] **Step 5:** `prices.module.ts`:
```ts
import { Module } from "@nestjs/common";
import { PricesController } from "./prices.controller";
import { PricesService } from "./prices.service";

@Module({ controllers: [PricesController], providers: [PricesService], exports: [PricesService] })
export class PricesModule {}
```
- [ ] **Step 6:** `app.module.ts`: `import { PricesModule }` + imports dizisine `PricesModule` ekle (ProductsModule yanına).
- [ ] **Step 7:** Test pass + type-check → PASS.
- [ ] **Step 8:** Commit: `git add apps/api/src/prices apps/api/src/app.module.ts && git commit -m "feat(prices): modül iskeleti + GET /products/:id/prices"`

### Task 5: PUT /products/:id/options — konfigüratör yapısı upsert (var/yok, ekle-çıkar)

**Files:**
- Modify: `apps/api/src/prices/prices.service.ts` (`setOptions`)
- Modify: `apps/api/src/prices/prices.controller.ts` (PUT route)
- Modify: `apps/api/src/prices/prices.dto.ts` (SetOptionsDto)
- Test: `apps/api/src/prices/prices.service.spec.ts`

**Interfaces — Produces:** `PricesService.setOptions(productId, rows: OptionInput[]): Promise<{ count: number }>` — REPLACE-ALL (deleteMany + createMany); var/yok = rows içinde olup-olmaması.

- [ ] **Step 1:** `prices.dto.ts` — DTO (class-validator, nested):
```ts
import { IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class OptionInputDto {
  @IsString() @MaxLength(60) groupKey!: string;
  @IsString() @MaxLength(120) groupLabel!: string;
  @IsIn(["dimension", "priced"]) groupRole!: "dimension" | "priced";
  @IsInt() @Min(0) groupSort!: number;
  @IsString() @MaxLength(80) optionKey!: string;
  @IsString() @MaxLength(200) optionLabel!: string;
  @IsString() @IsOptional() @MaxLength(400) optionSublabel?: string;
  @IsInt() @Min(0) optionSort!: number;
}
export class SetOptionsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OptionInputDto)
  options!: OptionInputDto[];
}
```
- [ ] **Step 2: Failing test**:
```ts
it("setOptions replace-all yapar (delete+create)", async () => {
  const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
  p.productOption.createMany.mockResolvedValue({ count: 2 });
  const s = new PricesService(p as any);
  const rows = [
    { groupKey:"paket", groupLabel:"Paket", groupRole:"priced", groupSort:0, optionKey:"nk", optionLabel:"NK", optionSort:0 },
    { groupKey:"adet", groupLabel:"Adet", groupRole:"dimension", groupSort:0, optionKey:"1000", optionLabel:"1.000", optionSort:0 },
  ];
  const r = await s.setOptions("p1", rows as any);
  expect(p.productOption.deleteMany).toHaveBeenCalledWith({ where: { productId: "p1" } });
  expect(p.productOption.createMany).toHaveBeenCalled();
  expect(r).toEqual({ count: 2 });
});
```
- [ ] **Step 3:** Test fail → FAIL.
- [ ] **Step 4:** `prices.service.ts`'e ekle:
```ts
async setOptions(productId: string, rows: import("./prices.dto").OptionInputDto[]) {
  await this.assertProduct(productId);
  await this.prisma.productOption.deleteMany({ where: { productId } });
  if (rows.length === 0) return { count: 0 };
  const { count } = await this.prisma.productOption.createMany({
    data: rows.map((r) => ({
      productId,
      groupKey: r.groupKey, groupLabel: r.groupLabel, groupRole: r.groupRole, groupSort: r.groupSort,
      optionKey: r.optionKey, optionLabel: r.optionLabel,
      ...(r.optionSublabel != null && { optionSublabel: r.optionSublabel }),
      optionSort: r.optionSort,
    })),
  });
  return { count };
}
```
- [ ] **Step 5:** `prices.controller.ts`'e route:
```ts
@Put("products/:id/options")
@UseGuards(JwtAuthGuard, RolesGuard) @Roles("admin","super_admin") @ApiBearerAuth()
setOptions(@Param("id") id: string, @Body() dto: SetOptionsDto) {
  return this.service.setOptions(id, dto.options);
}
```
(`Put`, `Body` import; `SetOptionsDto` import.)
- [ ] **Step 6:** Test pass + type-check → PASS.
- [ ] **Step 7:** Commit: `git add apps/api/src/prices && git commit -m "feat(prices): PUT /products/:id/options — yapı upsert (var/yok)"`

### Task 6: PUT /products/:id/prices — fiyat satırları upsert (kırım ekle-sil-güncelle)

**Files:**
- Modify: `apps/api/src/prices/prices.service.ts` (`setPrices`)
- Modify: `apps/api/src/prices/prices.controller.ts` (PUT route)
- Modify: `apps/api/src/prices/prices.dto.ts` (SetPricesDto)
- Test: `apps/api/src/prices/prices.service.spec.ts`

**Interfaces — Produces:** `PricesService.setPrices(productId, rows: PriceInput[]): Promise<{ count: number }>` — REPLACE-ALL (deleteMany + createMany). Her satır: `groupKey?/optionKey?/dimKey?/cost?/price`. `price` zorunlu ≥0.

- [ ] **Step 1:** `prices.dto.ts`'e ekle:
```ts
import { IsNumber } from "class-validator";
export class PriceInputDto {
  @IsString() @IsOptional() @MaxLength(60) groupKey?: string;
  @IsString() @IsOptional() @MaxLength(80) optionKey?: string;
  @IsString() @IsOptional() @MaxLength(80) dimKey?: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @IsOptional() @Min(0) cost?: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price!: number;
}
export class SetPricesDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PriceInputDto)
  prices!: PriceInputDto[];
}
```
- [ ] **Step 2: Failing test**:
```ts
it("setPrices replace-all + Decimal map", async () => {
  const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
  p.productPrice.createMany.mockResolvedValue({ count: 1 });
  const s = new PricesService(p as any);
  const r = await s.setPrices("p1", [{ groupKey:"paket", optionKey:"nk", dimKey:"1000", price: 50 }] as any);
  expect(p.productPrice.deleteMany).toHaveBeenCalledWith({ where: { productId: "p1" } });
  const arg = p.productPrice.createMany.mock.calls[0][0].data[0];
  expect(arg.productId).toBe("p1"); expect(Number(arg.price)).toBe(50);
  expect(r).toEqual({ count: 1 });
});
```
- [ ] **Step 3:** Test fail → FAIL.
- [ ] **Step 4:** `prices.service.ts`'e ekle (`import { Prisma } from "@prisma/client"`):
```ts
async setPrices(productId: string, rows: import("./prices.dto").PriceInputDto[]) {
  await this.assertProduct(productId);
  await this.prisma.productPrice.deleteMany({ where: { productId } });
  if (rows.length === 0) return { count: 0 };
  const { count } = await this.prisma.productPrice.createMany({
    data: rows.map((r) => ({
      productId,
      ...(r.groupKey != null && { groupKey: r.groupKey }),
      ...(r.optionKey != null && { optionKey: r.optionKey }),
      ...(r.dimKey != null && { dimKey: r.dimKey }),
      ...(r.cost != null && { cost: new Prisma.Decimal(r.cost) }),
      price: new Prisma.Decimal(r.price),
    })),
  });
  return { count };
}
```
- [ ] **Step 5:** Controller route `PUT products/:id/prices` (SetPricesDto). 
- [ ] **Step 6:** Test pass + type-check → PASS.
- [ ] **Step 7:** Commit: `git add apps/api/src/prices && git commit -m "feat(prices): PUT /products/:id/prices — fiyat satırı upsert (kırım CRUD)"`

### Task 7: POST /prices/bulk-adjust — toplu zam/indirim (saklı fiyat referanslı)

**Files:**
- Modify: `apps/api/src/prices/prices.service.ts` (`adjustPrice` saf fonksiyon + `bulkAdjust`)
- Modify: `apps/api/src/prices/prices.controller.ts` (POST route)
- Modify: `apps/api/src/prices/prices.dto.ts` (BulkAdjustDto)
- Test: `apps/api/src/prices/prices.service.spec.ts`

**Interfaces — Produces:**
- `adjustPrice(price: number, op, direction, value, round): number` — saf; `percent`→`price*(1±v/100)`, `fixed`→`price±v`; yuvarlama (none/1/5/10), floor 0.
- `PricesService.bulkAdjust(dto): Promise<{ updated: number }>` — scope all/category; hedef ürünlerin `product_prices.price`'ını saklı değerden ölçekler (tek transaction).

- [ ] **Step 1:** `prices.dto.ts`'e ekle:
```ts
export class BulkAdjustDto {
  @IsIn(["all", "category"]) scope!: "all" | "category";
  @IsString() @IsOptional() categoryId?: string;
  @IsIn(["percent", "fixed"]) op!: "percent" | "fixed";
  @IsIn(["increase", "decrease"]) direction!: "increase" | "decrease";
  @IsNumber() @Min(0) value!: number;
  @IsIn(["none", "1", "5", "10"]) @IsOptional() round?: "none" | "1" | "5" | "10";
}
```
- [ ] **Step 2: Failing test** (saf fonksiyon — referans = verilen mevcut fiyat):
```ts
import { adjustPrice } from "./prices.service";
it("percent increase 10% → 110", () => expect(adjustPrice(100,"percent","increase",10,"none")).toBe(110));
it("percent decrease 20% → 80", () => expect(adjustPrice(100,"percent","decrease",20,"none")).toBe(80));
it("fixed increase 15 → 115", () => expect(adjustPrice(100,"fixed","increase",15,"none")).toBe(115));
it("round 5 → en yakın 5", () => expect(adjustPrice(103,"percent","increase",0,"5")).toBe(105));
it("negatife düşmez", () => expect(adjustPrice(10,"fixed","decrease",999,"none")).toBe(0));
```
- [ ] **Step 3:** Test fail → FAIL.
- [ ] **Step 4:** `prices.service.ts`'e ekle (export saf fonksiyon, dosya başında):
```ts
export function adjustPrice(
  price: number,
  op: "percent" | "fixed",
  direction: "increase" | "decrease",
  value: number,
  round: "none" | "1" | "5" | "10" = "none",
): number {
  const sign = direction === "decrease" ? -1 : 1;
  let v = op === "percent" ? price * (1 + (sign * value) / 100) : price + sign * value;
  v = Math.max(0, v);
  const step = round && round !== "none" ? Number(round) : 0;
  return step > 0 ? Math.round(v / step) * step : Math.round(v * 100) / 100;
}
```
ve metot:
```ts
async bulkAdjust(dto: import("./prices.dto").BulkAdjustDto) {
  const productWhere: import("@prisma/client").Prisma.ProductWhereInput =
    dto.scope === "category" && dto.categoryId ? { categoryId: dto.categoryId } : {};
  const products = await this.prisma.product.findMany({ where: productWhere, select: { id: true } });
  const ids = products.map((p) => p.id);
  if (ids.length === 0) return { updated: 0 };
  const rows = await this.prisma.productPrice.findMany({ where: { productId: { in: ids } } });
  const ops = rows.map((r) =>
    this.prisma.productPrice.update({
      where: { id: r.id },
      data: { price: new Prisma.Decimal(adjustPrice(Number(r.price), dto.op, dto.direction, dto.value, dto.round ?? "none")) },
    }),
  );
  await this.prisma.$transaction(ops);
  return { updated: rows.length };
}
```
- [ ] **Step 5:** Controller `POST prices/bulk-adjust` (BulkAdjustDto, admin guard).
- [ ] **Step 6:** Test pass + type-check → PASS.
- [ ] **Step 7:** Commit: `git add apps/api/src/prices && git commit -m "feat(prices): POST /prices/bulk-adjust — saklı fiyat referanslı toplu zam/indirim"`

### Task 8: POST /prices/category-set — kategoriye tek satış fiyatı (basit ürünler)

**Files:**
- Modify: `apps/api/src/prices/prices.service.ts` (`categorySet`)
- Modify: `apps/api/src/prices/prices.controller.ts` (POST route)
- Modify: `apps/api/src/prices/prices.dto.ts` (CategorySetDto)
- Test: `apps/api/src/prices/prices.service.spec.ts`

**Interfaces — Produces:** `categorySet(categoryId, price): Promise<{ set: number; skipped: number }>` — kategorideki ürünler için: `product_options` satırı OLMAYAN (basit) ürünlere tek `product_prices` satırı (groupKey/optionKey/dimKey null, price) yaz (replace); seçenekli (matris/konfigüratör) ürünler ATLANIR + sayılır.

- [ ] **Step 1:** `prices.dto.ts`'e ekle:
```ts
export class CategorySetDto {
  @IsString() categoryId!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price!: number;
}
```
- [ ] **Step 2: Failing test**:
```ts
it("categorySet basit ürüne yazar, seçenekliyi atlar", async () => {
  const p = mkPrisma();
  p.product.findMany = vi.fn().mockResolvedValue([{ id: "simple" }, { id: "matrix" }]);
  p.productOption.findMany = vi.fn().mockResolvedValue([{ productId: "matrix" }]); // matrix'in option'ı var
  p.productPrice.deleteMany = vi.fn(); p.productPrice.createMany = vi.fn().mockResolvedValue({ count: 1 });
  p.$transaction = vi.fn().mockResolvedValue([]);
  const s = new PricesService(p as any);
  const r = await s.categorySet("cat1", 250);
  expect(r).toEqual({ set: 1, skipped: 1 });
});
```
- [ ] **Step 3:** Test fail → FAIL.
- [ ] **Step 4:** `prices.service.ts`'e ekle:
```ts
async categorySet(categoryId: string, price: number) {
  const products = await this.prisma.product.findMany({ where: { categoryId }, select: { id: true } });
  const ids = products.map((p) => p.id);
  if (ids.length === 0) return { set: 0, skipped: 0 };
  const withOpts = await this.prisma.productOption.findMany({
    where: { productId: { in: ids } }, select: { productId: true }, distinct: ["productId"],
  });
  const hasOpts = new Set(withOpts.map((o) => o.productId));
  const simple = ids.filter((id) => !hasOpts.has(id));
  const ops = simple.flatMap((id) => [
    this.prisma.productPrice.deleteMany({ where: { productId: id } }),
    this.prisma.productPrice.createMany({ data: [{ productId: id, price: new Prisma.Decimal(price) }] }),
  ]);
  if (ops.length) await this.prisma.$transaction(ops);
  return { set: simple.length, skipped: ids.length - simple.length };
}
```
- [ ] **Step 5:** Controller `POST prices/category-set` (CategorySetDto, admin guard).
- [ ] **Step 6:** Test pass + type-check → PASS.
- [ ] **Step 7:** Commit: `git add apps/api/src/prices && git commit -m "feat(prices): POST /prices/category-set — basit ürünlere kategori-tek-fiyat"`

### Task 9: Public ürün yanıtı — options/prices (detay) + displayPrice MIN (liste)

**Files:**
- Modify: `apps/api/src/products/products.service.ts` (`findBySlug` include; `findAll` displayPrice)
- Test: `apps/api/src/products/products.service.spec.ts`

**Interfaces — Produces:** `findBySlug` yanıtına `options` (sıralı) + `prices`; `findAll` her ürüne `displayPrice: number | null` (= `MIN(product_prices.price)`; satır yoksa null → storefront "Teklif Al").

- [ ] **Step 1: Failing test** — `products.service.spec.ts`:
```ts
it("findBySlug options+prices içerir", async () => {
  prisma.product.findUnique.mockResolvedValue({ id: "p1", slug: "x", category: {},
    options: [{ id: "o1" }], prices: [{ id: "pr1", price: "50" }] } as any);
  const r = await service.findBySlug("x");
  expect((r as any).options).toBeDefined();
  expect((r as any).prices).toBeDefined();
});
it("findAll displayPrice = MIN(price), satır yoksa null", async () => {
  prisma.product.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }] as any);
  prisma.productPrice.groupBy = vi.fn().mockResolvedValue([{ productId: "a", _min: { price: "30" } }]);
  const r = await service.findAll({ list: true });
  expect(r.find((x:any)=>x.id==="a").displayPrice).toBe(30);
  expect(r.find((x:any)=>x.id==="b").displayPrice).toBeNull();
});
```
(Mevcut spec mock'una `productPrice: { groupBy: vi.fn() }` ekle.)
- [ ] **Step 2:** Test fail → FAIL.
- [ ] **Step 3:** `findBySlug`: `include`'a ekle:
```ts
include: {
  category: true,
  options: { orderBy: [{ groupSort: "asc" }, { optionSort: "asc" }] },
  prices: true,
},
```
- [ ] **Step 4:** `findAll`: sorgudan sonra displayPrice ekle (hem list hem full modda). `findMany` sonucunu `products` olarak al, ardından:
```ts
const ids = products.map((p) => p.id);
const mins = ids.length
  ? await this.prisma.productPrice.groupBy({ by: ["productId"], where: { productId: { in: ids } }, _min: { price: true } })
  : [];
const minMap = new Map(mins.map((m) => [m.productId, m._min.price == null ? null : Number(m._min.price)]));
return products.map((p) => ({ ...p, displayPrice: minMap.get(p.id) ?? null }));
```
(list ve full dalları aynı son-işleme tabi; `findAll`'ı `async` yap ve her iki `findMany`'i `await` et.)
- [ ] **Step 5:** Test pass + type-check → PASS.
- [ ] **Step 6:** Commit: `git add apps/api/src/products && git commit -m "feat(products): yanıta options/prices + displayPrice (MIN) ekle"`

---

## Self-Review
- **Spec kapsamı (Faz B):** prices modülü CRUD (B4 read, B5 options, B6 prices) ✓; bulk-adjust saklı-referans (B7) ✓; category-set basit ürün (B8) ✓; kargo settings + public (B1-B3) ✓; public yanıt options/prices+MIN (B9) ✓.
- **Duplicate route:** PricesController `@Controller()` + tam yollar; `products/:id/prices` (2 segment+suffix) ≠ `products/:slug`. settings `@Get("shipping")` ≠ `@Get()`. Çakışma yok (incident-admin-stats sınıfı önlendi).
- **Tip tutarlılığı:** DTO alan adları (groupKey/optionKey/dimKey/cost/price/groupRole) Faz A şema @map'leri + A3 converter çıktısı + Faz C/D tüketicileriyle aynı.
- **Regresyon:** prices boş → displayPrice null → "Teklif Al" (mevcut davranış). orders kargo fallback 79/750 = eski sabit. Eski parameters/bulkPrice DOKUNULMADAN kalır (Faz E temizler).
- **Risk:** B3 (orders, ödeme/total hesabı) — testler 79/750 koruyor; SettingsService mock'u şart. B9 `findAll` async'e dönüyor — controller zaten `return service.findAll(...)` (Promise döner, sorun yok).
- **Açık (Faz C'ye taşınır):** "adet" çift-anlam motor konvansiyonu; storefront getDisplayPrice = displayPrice okuması; kargo display web tarafı.

## Sonraki planlar (B bitince yazılır)
- Faz C: storefront toplamsal konfigüratör motoru + getDisplayPrice=displayPrice + kargo settings okuma (web).
- Faz D: admin (konfigüratör kurucu + fiyat ızgarası cost+satış + toplu araç + kategori-set + kargo ayarları).
- Faz E: tam de-mock (catalog/blog/yorum/referans/arama/kategori).
