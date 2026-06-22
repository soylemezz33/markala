# Faz A — Fiyat Şeması + Migration + Yapı Restore (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development veya executing-plans ile task-task uygula. Adımlar `- [ ]` checkbox.

**Goal:** Yeni fiyat şemasını (`product_options`, `product_prices`, `settings`) kur; eski `parameters` JSON yapısını (matris + İSG radio/quantity grupları) yedekten yeni `product_options`'a taşı (fiyatlar BOŞ); kargo settings tohumla.

**Architecture:** Prisma migration ile 3 yeni tablo. Yedek (`products_fiyat_yedek_20260622_141009.sql`) geçici `products_old` tablosuna yüklenir; bir converter scripti `products_old.parameters` JSON'ını okuyup `product_options` satırları üretir (yalnız YAPI; fiyat yok). `product_prices` boş başlar (admin Faz D'de doldurur; grid option×boyut'tan türetilir).

**Tech Stack:** NestJS, Prisma 5, PostgreSQL, pnpm. Dizin: `C:/tmp/markala-main`.

## Global Constraints
- Çalışma dizini: `C:/tmp/markala-main` (origin/main HEAD; baskisitesi STALE değil).
- Yıkıcı DROP YOK — eski kolonlar (`products.parameters/base_price/starting_price`, `categories.starting_price`) kalır, sadece okunmaz.
- Restore sonrası `product_prices` BOŞ (Hasan fiyatları sonra girer).
- Migration adı snake_case + tarihli; CI type-check + test yeşil olmadan deploy yok.
- Yedek: `/opt/markala/products_fiyat_yedek_20260622_141009.sql` (VPS) — geri dönüş kaynağı.
- ⚠️ EXECUTION ÖN KOŞULU: paralel oturum durmuş olmalı (şema migration çakışır).

---

### Task A1: Prisma şeması — yeni modeller + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (yeni modeller + Product relation)
- Create: `apps/api/prisma/migrations/<ts>_fiyat_semasi/migration.sql` (prisma migrate üretir)

**Interfaces — Produces:**
- `ProductOption { id, productId, groupKey, groupLabel, groupRole('dimension'|'priced'), groupSort, optionKey, optionLabel, optionSublabel?, optionSort }`
- `ProductPrice { id, productId, groupKey?, optionKey?, dimKey?, cost? Decimal, price Decimal, createdAt, updatedAt }`
- `Setting { key (PK), value, updatedAt }`

- [ ] **Step 1:** `schema.prisma`'ya ekle (Product modeline `prices ProductPrice[]` + `options ProductOption[]` relation; aşağıdaki 3 model):
```prisma
model ProductOption {
  id            String  @id @default(cuid())
  productId     String  @map("product_id")
  groupKey      String  @map("group_key")
  groupLabel    String  @map("group_label")
  groupRole     String  @map("group_role") // "dimension" | "priced"
  groupSort     Int     @default(0) @map("group_sort")
  optionKey     String  @map("option_key")
  optionLabel   String  @map("option_label")
  optionSublabel String? @map("option_sublabel") @db.Text
  optionSort    Int     @default(0) @map("option_sort")
  product       Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId, groupSort, optionSort])
  @@map("product_options")
}
model ProductPrice {
  id        String   @id @default(cuid())
  productId String   @map("product_id")
  groupKey  String?  @map("group_key")
  optionKey String?  @map("option_key")
  dimKey    String?  @map("dim_key")
  cost      Decimal? @db.Decimal(10, 2)
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId])
  @@map("product_prices")
}
model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("settings")
}
```
- [ ] **Step 2:** Migration üret: `cd apps/api && pnpm prisma migrate dev --name fiyat_semasi --create-only` → migration.sql incele (3 CREATE TABLE + index + FK). Beklenen: yıkıcı ifade yok.
- [ ] **Step 3:** Type-check: `pnpm --filter @markala/api type-check` → PASS (yeni Prisma tipleri derlenir).
- [ ] **Step 4:** Commit: `git add apps/api/prisma && git commit -m "feat(db): fiyat şeması — product_options/product_prices/settings"`

### Task A2: Settings seed (kargo)

**Files:** Create: `apps/api/prisma/seed-settings.ts` (idempotent) · Test: `apps/api/src/settings/settings.service.spec.ts` (varsa genişlet)

**Interfaces — Consumes:** `Setting` modeli (A1).

- [ ] **Step 1:** `seed-settings.ts` — idempotent upsert:
```ts
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  for (const [key, value] of [["shipping_fee","79"],["free_shipping_threshold","750"]] as const) {
    await p.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
}
main().finally(() => p.$disconnect());
```
- [ ] **Step 2:** Migration uygula + seed çalıştır (DEV DB veya prod-migrate aşamasında): `pnpm prisma migrate deploy && pnpm tsx prisma/seed-settings.ts` → settings'te 2 satır.
- [ ] **Step 3:** Doğrula: `SELECT * FROM settings;` → shipping_fee=79, free_shipping_threshold=750.
- [ ] **Step 4:** Commit: `git add apps/api/prisma/seed-settings.ts && git commit -m "feat(db): kargo settings seed (79/750)"`

### Task A3: Yapı restore converter (parameters → product_options)

**Files:** Create: `apps/api/scripts/restore-options.ts` · Test: `apps/api/scripts/restore-options.spec.ts`

**Interfaces — Produces:** `convertParametersToOptions(params: OldParam[]): OptionRow[]` — eski parameters JSON dizisini `product_options` satırlarına çevirir (fiyat YOK).

**Mapping kuralları (yedekteki gerçek kind'lere göre):**
- `kind:"matrix"` → priced grup `paket` (rows → option; `variantGroup`=row.group "EKO/LAK/VIP" optionKey prefix'i, optionLabel=row.label, optionSublabel=row.sublabel) + dimension grup `adet` (cols → option; optionKey=col.id, optionLabel=col.label).
- `kind:"radio"` → grup; groupLabel `Ebat|Boyut|Adet` içeriyorsa `groupRole="dimension"`, değilse `"priced"`; options → option satırları (optionKey=opt.id, label=opt.label, sublabel=opt.sublabel).
- `kind:"quantity"` → dimension grup `adet`; quantityPresets → option satırları.
- `kind:"dimension"` (5 branda) → dimension grup; min/max sublabel'a yazılır (m² fiyatı Faz D'de manuel — bu 5 ürün işaretlenir/loglanır).

- [ ] **Step 1: Failing test** — `restore-options.spec.ts`:
```ts
import { convertParametersToOptions } from "./restore-options";
test("matris → paket(priced)+adet(dimension)", () => {
  const out = convertParametersToOptions([{ id:"v", kind:"matrix",
    rows:[{id:"nk",group:"EKO",label:"NK",sublabel:"250gr"}],
    cols:[{id:"1000",label:"1.000 Adet"}], cells:[{id:"c",rowId:"nk",colId:"1000",price:50}] }]);
  expect(out.find(o=>o.groupKey==="paket"&&o.groupRole==="priced"&&o.optionKey==="nk")).toBeTruthy();
  expect(out.find(o=>o.groupKey==="adet"&&o.groupRole==="dimension"&&o.optionKey==="1000")).toBeTruthy();
  expect(out.every(o=>!("price" in o))).toBe(true); // FİYAT YOK
});
test("radio Ebat → dimension, Malzeme → priced", () => {
  const out = convertParametersToOptions([
    { id:"ebat", kind:"radio", label:"Ebat", options:[{id:"25x35",label:"25×35 cm"}] },
    { id:"malzeme", kind:"radio", label:"Malzeme / Zemin", options:[{id:"dekota",label:"3mm Dekota"}] },
  ]);
  expect(out.find(o=>o.groupKey==="ebat"&&o.groupRole==="dimension")).toBeTruthy();
  expect(out.find(o=>o.groupKey==="malzeme"&&o.groupRole==="priced")).toBeTruthy();
});
```
- [ ] **Step 2:** Test fail: `pnpm --filter @markala/api exec vitest run scripts/restore-options.spec.ts` → FAIL (fonksiyon yok).
- [ ] **Step 3:** `restore-options.ts` — converter (yukarıdaki kurallar; matrix/radio/quantity/dimension kind'lerini işleyen saf fonksiyon + dimension-heuristik `/(ebat|boyut|adet)/i`). Saf `convertParametersToOptions` + ana fonksiyon: `products_old.parameters` oku → her ürün için convert → `product_options` insert.
- [ ] **Step 4:** Test pass → PASS.
- [ ] **Step 5:** Commit: `git add apps/api/scripts/restore-options* && git commit -m "feat(scripts): parameters→product_options converter (fiyatsız)"`

### Task A4: Restore'u çalıştır + doğrula (geçici products_old tablosu)

**Files:** (script çalıştırma; kod yok)

- [ ] **Step 1:** Yedeği geçici tabloya yükle (VPS): `products` → `products_old` rename-copy YOK; bunun yerine yedek SQL'i ayrı şemaya/tabloya yükle. Pratik: `CREATE TABLE products_old AS SELECT * FROM products WITH NO DATA;` sonra yedekteki INSERT'leri `products_old`'a yönlendir (sed ile `INTO products` → `INTO products_old`) → yükle. Böylece `products_old.parameters` eski yapıyı taşır.
- [ ] **Step 2:** Converter ana fonksiyonu `products_old`'tan okuyacak şekilde çalıştır: `pnpm tsx scripts/restore-options.ts` → `product_options` dolar.
- [ ] **Step 3:** Doğrula:
  - `SELECT count(DISTINCT product_id) FROM product_options;` → matris+radio'lu ürün sayısı (~yüzlerce).
  - klasik-kartvizit: `paket`(priced)+`adet`(dimension) grupları var mı.
  - bir İSG ürünü: `ebat`(dimension)+`malzeme`/`etiket`(priced) var mı.
  - `SELECT count(*) FROM product_prices;` → 0 (fiyat boş).
- [ ] **Step 4:** Geçici tabloyu temizle: `DROP TABLE products_old;`
- [ ] **Step 5:** Commit yok (veri işlemi); sonuç loglanır.

---

## Self-Review
- **Spec kapsamı (Faz A):** 3 tablo (A1) ✓, kargo seed (A2) ✓, yapı restore fiyatsız (A3+A4) ✓, eski alanlar korunur ✓.
- **Placeholder:** converter kuralları kind-bazlı somut; dimension 5-branda manuel işaretlenir (belirsizlik kapatıldı).
- **Tip tutarlılığı:** A1 model alanları (groupKey/optionKey/dimKey/price) A3 converter çıktısı + sonraki fazların (B API, D admin) kullanacağı isimlerle aynı.
- **Açık:** branda `dimension` (m²) fiyatlaması Faz D'de manuel (5 ürün) — kabul.

## Sonraki planlar (A bitince yazılır)
- Faz B: prices API modülü (CRUD/bulk-adjust/category-set/shipping) + public products yanıtı.
- Faz C: storefront toplamsal konfigüratör + getDisplayPrice=MIN + kargo okuma.
- Faz D: admin (konfigüratör kurucu + fiyat ızgarası + toplu düzeltme + kategori-set + kargo).
- Faz E: tam de-mock.
