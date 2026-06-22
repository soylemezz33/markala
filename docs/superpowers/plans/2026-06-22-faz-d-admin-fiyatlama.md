# Faz D — Admin Fiyatlama UI (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ile task-task uygula. Adımlar `- [ ]` checkbox.

**Goal:** Admin panelinden: ürün konfigüratör yapısını (options var/yok ekle-çıkar) düzenle, fiyat ızgarasını (maliyet+satış, kırım CRUD) doldur, toplu zam/indirim + kategori-tek-fiyat uygula, kargo bedelini yönet — hepsi Faz B'deki HAZIR API uçlarına bağlı.

**Architecture:** apps/admin (Next.js 14 App Router). Auth: httpOnly imzalı `markala_admin_session` cookie → `getAdminApi()` (server-only) → Bearer. TÜM mutasyonlar co-located `actions.ts` Server Action'ları üzerinden (`"use server"` → `getAdminApi()` → typed api-client metodu). Yeni api-client metotları eklenir. UI: inline Tailwind (paper/ink/brand token), `toast` store, `useTransition`.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind, @markala/api-client. Dizin: `C:/tmp/markala-main`.

## Global Constraints
- Çalışma dizini: `C:/tmp/markala-main` (worktree, branch `fix/kurumsal-indirim-pagination`). baskisitesi STALE.
- **Auth kalıbı ZORUNLU:** client component → co-located `actions.ts` Server Action (`"use server"`) → `getAdminApi()` (`apps/admin/src/lib/api.ts`) → api-client metodu (`{ auth: true }`). ASLA client'tan doğrudan API fetch ETME. Mutasyon sonrası `revalidatePath(...)` + gerekiyorsa `revalidateStorefront()`.
- **API uçları (Faz B, HAZIR — yalnız UI bağlanır):** `GET /products/:id/prices` (→{options,prices}), `PUT /products/:id/options` (body `{options: OptionInput[]}`), `PUT /products/:id/prices` (body `{prices: PriceInput[]}`), `POST /prices/bulk-adjust`, `POST /prices/category-set`, `GET /settings?group=shipping` + `PATCH /settings` (body `{group,values}`).
- **Veri şekilleri (Faz A/B/C ile birebir):**
  - OptionInput: `{groupKey, groupLabel, groupRole:"dimension"|"priced", groupSort, optionKey, optionLabel, optionSublabel?, optionSort}`
  - PriceInput: `{groupKey?, optionKey?, dimKey?, cost?, price}` (price≥0; basit üründe groupKey/optionKey/dimKey boş tek satır)
  - Fiyat-boyutu kuralı (motorla AYNI): ilk `groupRole==="dimension"` grup `groupKey!=="adet"` olan; yoksa tek dimension grup. "adet" fiyat-boyutu DEĞİLSE çarpan (ızgarada görünmez).
- **Kargo:** Faz B/C `site_settings` group="shipping", key'ler `shipping.fee`/`shipping.freeThreshold` (getShipping bunları okur). Admin BU key'leri yazmalı (eski `general.*` kargo alanları ölü — D5 düzeltir).
- UI token: input `"w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30"`; kart/section, label, Toggle, `toast.success/error`, `@phosphor-icons/react`, `AdminShell` — mevcut sayfalardan kopyala.
- Her task: `pnpm --filter @markala/admin type-check` yeşil (+ mümkünse build). ⚠️ tsconfig include'a DOKUNMA.
- Para: number (TL). API Decimal-string dönebilir → `Number()` ile coerce.

---

### Task 1: api-client yeni metotlar (prices CRUD + bulk/category)

**Files:** Modify: `packages/api-client/src/index.ts`

**Interfaces — Produces:**
- `products.getPrices(id): Promise<{ options: ApiOption[]; prices: ApiPrice[] }>` → GET `/products/:id/prices`
- `products.setOptions(id, options: OptionInput[]): Promise<{count:number}>` → PUT `/products/:id/options` body `{options}`
- `products.setPrices(id, prices: PriceInput[]): Promise<{count:number}>` → PUT `/products/:id/prices` body `{prices}`
- `prices.bulkAdjust(input): Promise<{updated:number}>` → POST `/prices/bulk-adjust`
- `prices.categorySet(input): Promise<{set:number;skipped:number}>` → POST `/prices/category-set`
- Tipler (api-client içinde export): `ApiOption`/`ApiPrice` (Faz A şema şekli), `OptionInput`, `PriceInput`, `BulkAdjustInput {scope:"all"|"category";categoryId?;op:"percent"|"fixed";direction:"increase"|"decrease";value:number;round?:"none"|"1"|"5"|"10"}`, `CategorySetInput {categoryId:string;price:number}`.

- [ ] **Step 1:** Mevcut `request()` imzasını + `products`/`settings` namespace kalıbını oku (lines ~175-200, ~423-439). Aynı stille:
  - `products` namespace'ine 3 metot ekle (yukarıdaki imzalar, `{ auth: true }`).
  - Yeni top-level `prices = { bulkAdjust, categorySet }` namespace ekle (`{ auth: true }`).
  - Tip tanımlarını ekle (PriceInput/OptionInput şekli Global Constraints'ten birebir).
- [ ] **Step 2:** Type-check: `pnpm --filter @markala/api-client type-check` (varsa) veya `pnpm --filter @markala/admin type-check` → PASS.
- [ ] **Step 3:** Commit: `git add packages/api-client/src/index.ts && git commit -m "feat(api-client): prices CRUD + bulk-adjust/category-set metotları"`

### Task 2: Ürün edit — konfigüratör yapı editörü (options var/yok CRUD)

**Files:**
- Create: `apps/admin/src/app/urunler/[slug]/pricing-structure-editor.tsx` (client component)
- Modify: `apps/admin/src/app/urunler/[slug]/product-detail-client.tsx` (yeni editörü "Fiyat Yönetimi" sekmesi/kartı olarak göm)
- Modify: `apps/admin/src/app/urunler/[slug]/actions.ts` (`updateProductOptions` server action)
- Modify: `apps/admin/src/app/urunler/[slug]/page.tsx` (RSC: GET /products/:id/prices ile options+prices çek, client'a geçir)

**Interfaces — Consumes:** `products.getPrices`, `products.setOptions` (Task 1).

**Davranış:** Admin grupları görür/düzenler: her grup `groupLabel` + `groupRole` (dimension/priced) + sıra; grup içinde option'lar (`optionLabel` + `optionSublabel` + sıra). Ekle/çıkar (var/yok = listede olup-olmaması). `groupKey`/`optionKey` otomatik slug'lanır (label'dan; mevcutsa korunur — fiyat satırları key'e bağlı). Kaydet → `updateProductOptions(productId, options)` → PUT /products/:id/options.

- [ ] **Step 1:** `actions.ts`'e ekle:
```ts
export async function updateProductOptions(productId: string, options: OptionInput[]) {
  "use server";
  const api = await getAdminApi();
  const res = await api.products.setOptions(productId, options);
  revalidatePath(`/urunler`); revalidateStorefront?.();
  return res;
}
```
(`OptionInput` import; mevcut `getAdminApi`/`revalidatePath`/`revalidateStorefront` kalıbını izle.)
- [ ] **Step 2:** `pricing-structure-editor.tsx` — client component: props `{ productId, initialOptions }`. State: grup listesi (her grup: key/label/role/sort + options[]). UI: grup kartları (label input, role select [dimension/priced], yukarı/aşağı sırala, sil), grup içi option satırları (label input, sublabel input, sil), "Grup Ekle"/"Seçenek Ekle" butonları. `groupKey`/`optionKey`: yeni eklenende label→slug (tr karakter sadeleştir, küçük harf, tire); mevcut option'da KORU. Kaydet butonu `useTransition` + `updateProductOptions` + `toast`.
- [ ] **Step 3:** `page.tsx` (RSC): `getAdminApi().products.getPrices(product.id)` ile `{options, prices}` çek, `product-detail-client`'a prop geçir.
- [ ] **Step 4:** `product-detail-client.tsx`: yeni "Fiyat Yönetimi" kartı/sekmesi içinde `<PricingStructureEditor productId={...} initialOptions={...} />` render et. (Eski inline `parameters` matris editörü Faz E'de kaldırılacak — şimdilik DOKUNMA, ayrı kart.)
- [ ] **Step 5:** `pnpm --filter @markala/admin type-check` → PASS.
- [ ] **Step 6:** Commit: `git add apps/admin/src/app/urunler/[slug] && git commit -m "feat(admin): ürün konfigüratör yapı editörü (options var/yok CRUD)"`

### Task 3: Ürün edit — fiyat ızgarası (maliyet+satış, kırım CRUD)

**Files:**
- Create: `apps/admin/src/app/urunler/[slug]/pricing-grid-editor.tsx` (client component)
- Modify: `apps/admin/src/app/urunler/[slug]/product-detail-client.tsx` (ızgarayı "Fiyat Yönetimi" kartına ekle)
- Modify: `apps/admin/src/app/urunler/[slug]/actions.ts` (`updateProductPrices` server action)

**Interfaces — Consumes:** `products.setPrices` (Task 1); options+prices (Task 2 page.tsx prop).

**Izgara türetme (motor kuralıyla AYNI):**
- Grupları al. Fiyat-boyutu = ilk non-adet dimension; yoksa tek dimension; yoksa null.
- **priced gruplar varsa:** HER priced grup için bir tablo: satırlar = o grubun option'ları; sütunlar = fiyat-boyutu option'ları (fiyat-boyutu yoksa tek sütun "Fiyat"). Her hücre: satış fiyatı input (+ opsiyonel maliyet input, küçük). Hücre boş bırakılabilir (o kombinasyon fiyatsız → 0 katkı).
- **priced grup yoksa (basit ürün):** tek satış (+maliyet) input.
- Kaydet → düzleştir: her priced grup × option × fiyat-boyutu-değeri (veya basit: null-key) → `PriceInput[]` → `updateProductPrices(productId, prices)` → PUT /products/:id/prices (REPLACE-ALL; boş hücreler satır üretmez).

- [ ] **Step 1:** `actions.ts`'e `updateProductPrices(productId, prices: PriceInput[])` ekle (Task 2 kalıbı; `api.products.setPrices`).
- [ ] **Step 2:** `pricing-grid-editor.tsx` — props `{ productId, options, initialPrices }`. Yukarıdaki türetme: gruplardan fiyat-boyutunu hesapla, priced grup başına tablo render et (satır=option, sütun=fiyat-boyutu değeri), hücreleri `initialPrices` ile doldur (eşleşme: groupKey+optionKey+dimKey). Satış + maliyet input (number, ≥0). Basit ürün dalı (tek input). Kaydet `useTransition`+`updateProductPrices`+`toast`. Kaydetmeden önce düzleştirme: dolu hücreleri `{groupKey, optionKey, dimKey, cost?, price}` satırlarına çevir (boş satış = atla).
- [ ] **Step 3:** `product-detail-client.tsx`: "Fiyat Yönetimi" kartında yapı editörünün ALTINA `<PricingGridEditor .../>` ekle. Not: yapı değişip kaydedilince ızgara güncel yapıyı yansıtmalı (yapı kaydı sonrası `router.refresh()` veya state senkronu — yapı editörü kaydedince ızgaraya yeni options'ı geçir).
- [ ] **Step 4:** `pnpm --filter @markala/admin type-check` → PASS.
- [ ] **Step 5:** Commit: `git add apps/admin/src/app/urunler/[slug] && git commit -m "feat(admin): ürün fiyat ızgarası (maliyet+satış, kırım CRUD)"`

### Task 4: Toplu fiyat aracı — yeni bulk-adjust + kategori-tek-fiyat

**Files:**
- Modify: `apps/admin/src/app/urunler/fiyat-toplu/bulk-price-client.tsx` (yeni uçlara bağla + kategori-set sekmesi)
- Modify: `apps/admin/src/app/urunler/fiyat-toplu/actions.ts` (`bulkAdjustPrices`, `categorySetPrices`)

**Interfaces — Consumes:** `prices.bulkAdjust`, `prices.categorySet` (Task 1).

**Davranış:** Mevcut toplu-fiyat UI (scope/op/direction/value/round) ARTIK `prices.bulkAdjust`'a gider (eski `products.bulkPrice` yerine — eski uç `parameters`'ı ölçekliyordu, yeni uç `product_prices.price`'ı saklı-fiyat referanslı ölçekler). Ek "Kategoriye Tek Fiyat" sekmesi/kartı: kategori seç + fiyat → `categorySet` (basit ürünlere uygular, matrisli/seçenekli atlar; sonuç `{set, skipped}` toast'ta gösterilir).

- [ ] **Step 1:** `actions.ts`: `bulkAdjustPrices(input: BulkAdjustInput)` → `api.prices.bulkAdjust(input)` + revalidate; `categorySetPrices(input: CategorySetInput)` → `api.prices.categorySet(input)` + revalidate. (Eski `bulkUpdatePrices`/`products.bulkPrice` çağrısını bu dosyada KALDIR/değiştir.)
- [ ] **Step 2:** `bulk-price-client.tsx`: submit'i `bulkAdjustPrices`'a yönlendir (input alanları aynı: scope/categoryId/op/direction/value/round). Sonuç toast: "{updated} fiyat satırı güncellendi". Uyarı metni ekle: "Saklı (mevcut) fiyat referans alınır."
- [ ] **Step 3:** Aynı sayfaya "Kategoriye Tek Fiyat" kartı: kategori seçici + fiyat input + "Uygula" → `categorySetPrices`; sonuç toast "{set} basit ürün fiyatlandı, {skipped} seçenekli ürün atlandı".
- [ ] **Step 4:** `pnpm --filter @markala/admin type-check` → PASS.
- [ ] **Step 5:** Commit: `git add apps/admin/src/app/urunler/fiyat-toplu && git commit -m "feat(admin): toplu araç yeni bulk-adjust + kategori-tek-fiyat uçlarına bağlandı"`

### Task 5: Kargo ayarları — shipping grubu (shipping.fee/shipping.freeThreshold)

**Files:**
- Modify: `apps/admin/src/app/ayarlar/genel/genel-client.tsx` (kargo kartını "shipping" grubuna taşı) VEYA Create `apps/admin/src/app/ayarlar/kargo/` (yeni sayfa) — implementer mevcut yapıya göre seçer; tercih: mevcut kargo kartını shipping grubuna bağla (daha az dağınıklık).
- Modify: `apps/admin/src/app/ayarlar/genel/page.tsx` (RSC: `settings.get("shipping")` de çek)
- Modify: gerekiyorsa `apps/admin/src/app/ayarlar/actions.ts` (generic `saveSettings(group,values,path)` zaten var — `"shipping"` grubuyla çağrılır)

**Interfaces — Consumes:** `settings.get("shipping")`, `settings.upsert("shipping", values)` (mevcut).

**Davranış:** Kargo kartı `shipping.fee` (sabit kargo ₺) + `shipping.freeThreshold` (ücretsiz eşik ₺) alanlarını group="shipping" altında okur/yazar (getShipping'in okuduğu key'ler). Eski `general.freeShippingThreshold/standardShippingFee/expressShippingFee` alanları kaldırılır VEYA bu iki gerçek alana indirgenir (backend yalnız fee+freeThreshold okur). Storefront + orders bu değerleri /settings/shipping üzerinden anında alır.

- [ ] **Step 1:** `page.tsx` RSC: mevcut `settings.get("general")` yanında `settings.get("shipping")` çek, kargo başlangıç değerlerini (shipping.fee/shipping.freeThreshold; yoksa 79/750) client'a geçir.
- [ ] **Step 2:** `genel-client.tsx` kargo kartı: iki input — "Kargo Bedeli (₺)" → `shipping.fee`, "Ücretsiz Kargo Eşiği (₺)" → `shipping.freeThreshold`. Kaydet → `saveSettings("shipping", { "shipping.fee": <n>, "shipping.freeThreshold": <n> }, "/ayarlar/genel")`. Eski general.* kargo alanlarını bu karttan çıkar.
- [ ] **Step 3:** Doğrula akışı: kaydet → `GET /settings/shipping` yeni değeri döndürür (storefront/orders kullanır). type-check PASS.
- [ ] **Step 4:** Commit: `git add apps/admin/src/app/ayarlar && git commit -m "feat(admin): kargo ayarları shipping grubuna bağlandı (shipping.fee/freeThreshold)"`

---

## Self-Review
- **Spec kapsamı (Faz D):** konfigüratör kurucu var/yok (D2) ✓; fiyat ızgarası cost+satış kırım CRUD (D3) ✓; toplu bulk-adjust (D4) ✓; kategori-tek-fiyat (D4) ✓; kargo admin DB (D5) ✓; api-client (D1) ✓.
- **Izgara türetme = motor kuralı:** fiyat-boyutu aynı algoritma (ilk non-adet dim) → admin'in girdiği fiyatlar storefront motoruyla tutarlı okunur.
- **Auth:** tüm mutasyonlar Server Action → getAdminApi → Bearer (client'tan doğrudan API yok). ✓
- **Kargo tutarlılığı:** D5 admin'i Faz B/C'nin okuduğu `shipping.fee`/`shipping.freeThreshold` key'lerine bağlar (eski general.* ölü alan düzeltilir).
- **Regresyon:** eski inline parameters matris editörü + eski products.bulkPrice DOKUNULMADAN durur (Faz E temizler); yeni UI ayrı. Hasan fiyat girince storefront displayPrice + konfigüratör anında dolar (revalidate).
- **Risk:** D2/D3 en büyük UI; key-slug üretimi fiyat satırı eşleşmesini etkiler (mevcut optionKey KORUNMALI) — implementer'a vurgulandı.

## Sonraki plan (D bitince yazılır)
- Faz E: tam de-mock (catalog/blog/yorum/referans/arama/kategori mock fallback + eski parameters/ProductParameter/matrix-builder/eski bulkPrice kalıntıları kaldırma).
