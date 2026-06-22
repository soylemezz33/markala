# Faz F — Konfigüratör UX Paritesi (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Adımlar `- [ ]`.

**Goal:** Ürün detay sayfasını rakip seviyesine getir: seçenek fiyat ipucu, KDV toggle, panelden kilitlenebilir seçenek (🔒), koşullu/bağımlı seçenek, ürün yıldız+yorum (doğrulanmış), güven rozeti, uzun-liste dropdown, masaüstü-sabit + mobil-alt-bar CTA.

**Architecture:** `product_options`'a `locked`(bool)+`rules`(json) eklenir; API serve/accept; admin editör; storefront tüketir. Fiyat ipucu/KDV/dropdown storefront-only. Yorum=mevcut doğrulanmış sistemin gösterimini açmak. Spec: docs/superpowers/specs/2026-06-23-faz-f-konfigurator-ux-paritesi-design.md.

**Tech Stack:** Next.js 14, NestJS, Prisma, TS. Dizin: `C:/tmp/markala-main`.

## Global Constraints
- Çalışma dizini: `C:/tmp/markala-main` (worktree, branch `fix/kurumsal-indirim-pagination`). baskisitesi STALE.
- Auth: admin uçları JwtAuthGuard+RolesGuard; admin mutasyon = Server Action → getAdminApi → Bearer.
- ⚠️ tsconfig include'a DOKUNMA. Deploy öncesi api build→dist/main doğrula.
- DB fiyatları KDV-DAHİL; KDV-hariç gösterim = price/1.20. Para Decimal-string→Number coerce.
- locked = grup-seviye (grubun tüm option satırlarına aynı `locked`). rules = option-seviye `{disablesGroups?:string[], forcesOption?:{groupKey,optionKey}}`.
- setOptions full delete+recreate → yeni alanlar (locked/rules) korunmalı.
- Her task: ilgili type-check (api/web/admin) + (storefront) build "Compiled successfully" (Windows EPERM standalone OK).
- prices BOŞken fiyat-ipucu/KDV görünmez (Hasan fiyatlayınca aktif) — regresyon değil.

**Tipler (F1'de eklenir, tüm tüketiciler kullanır):**
```ts
// @markala/types (PricingOption'a ekle) + api-client (ApiOption/OptionInput'a ekle)
export interface OptionRules { disablesGroups?: string[]; forcesOption?: { groupKey: string; optionKey: string }; }
// PricingOption += locked?: boolean; rules?: OptionRules;
```

---

### Task 1: Şema (locked+rules) + API + tipler

**Files:** `apps/api/prisma/schema.prisma` (+migration `20260623120000_option_locked_rules`), `apps/api/src/prices/prices.dto.ts` (OptionInputDto), `apps/api/src/prices/prices.service.ts` (setOptions spread + getForProduct), `packages/types/src/index.ts`, `packages/api-client/src/index.ts`.

- [ ] **Step 1:** schema.prisma `ProductOption`'a `locked Boolean @default(false)` + `rules Json?` ekle. Migration: `ALTER TABLE "product_options" ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS "rules" JSONB;`
- [ ] **Step 2:** `OptionInputDto`'ya `@IsBoolean() @IsOptional() locked?: boolean` + `@IsOptional() rules?: unknown` ekle. `setOptions` createMany spread'ine `locked: r.locked ?? false`, `...(r.rules != null && { rules: r.rules as Prisma.InputJsonValue })` ekle. `getForProduct` zaten tüm alanları döndürür (findMany).
- [ ] **Step 3:** `@markala/types`: `OptionRules` + `PricingOption.locked?`/`rules?`. `api-client`: `ApiOption`/`OptionInput`'a `locked?`/`rules?` ekle + `OptionRules` export.
- [ ] **Step 4:** prisma generate + type-check (api/web/admin) PASS.
- [ ] **Step 5:** Commit: `feat(db): product_options.locked+rules (kilit+koşullu seçenek) + API/tipler`.

### Task 2: Admin — kilit toggle + kural editörü

**Files:** `apps/admin/src/app/urunler/[slug]/pricing-structure-editor.tsx`.

- [ ] **Step 1:** GroupRow'a `locked: boolean` ekle (init: grubun ilk option'ının locked'ı). UI: her grup başlığına "Kilitle 🔒" toggle. Kaydederken grubun TÜM option satırlarına `locked` yazılır.
- [ ] **Step 2:** OptionRow'a `rules` ekle. UI: her option satırına küçük "Kural" alanı — "Bu seçilince pasifleştir:" çoklu grup seçimi (mevcut groupKey listesinden) + opsiyonel "zorla: grup→option". flattenGroups çıktısına `locked`/`rules` dahil.
- [ ] **Step 3:** `updateProductOptions` (server action) zaten options[] gönderir — locked/rules taşınır (api-client F1'de destekliyor). type-check PASS.
- [ ] **Step 4:** Commit: `feat(admin): konfigüratör kilit toggle + koşullu kural editörü`.

### Task 3: Storefront tipler/catalog + kilitli grup salt-okunur (🔒)

**Files:** `apps/web/src/lib/catalog.ts` (mapProduct options locked/rules taşı — zaten `p.options` as-is alıyor; tip uyumu), `apps/web/src/components/product/configurator.tsx` + `configurator-fields/option-group.tsx`.

- [ ] **Step 1:** catalog mapProduct: `options` zaten API'den as-is geliyor; tipi `PricingOption[]` (locked/rules dahil) olduğundan ek eşleme gerekmez — doğrula.
- [ ] **Step 2:** `configurator.tsx` buildGroups: her gruba `locked` (grubun option'larından) taşı. OptionGroup'a `locked` prop'u: locked grupta tek (seçili/ilk) option salt-okunur + 🔒 ikon, tıklanamaz (radio yerine kilitli rozet). Fiyat hesabı kilitli grubun seçili option'ıyla devam eder (initSelections zaten ilk option'ı seçer).
- [ ] **Step 3:** type-check + build PASS.
- [ ] **Step 4:** Commit: `feat(web): kilitli seçenek grubu salt-okunur + 🔒 gösterim`.

### Task 4: Storefront — koşullu/bağımlı seçenek mantığı

**Files:** `apps/web/src/components/product/configurator.tsx` (+reducer gerekiyorsa), `option-group.tsx` (disabled durumu).

- [ ] **Step 1:** Yardımcı saf fonksiyon `resolveRules(groups, selections): { disabledGroups: Set<string>; forced: Record<string,string> }` — aktif seçimlerin `rules`'larını topla (disablesGroups birleşimi + forcesOption'lar). `configurator.spec.ts`/yeni test ile birim test.
- [ ] **Step 2:** configurator: her render'da resolveRules çağır. Pasif gruplar OptionGroup'a `disabled` prop'uyla grileşir/tıklanamaz (bidolubaski gibi). Zorlanan option'lar selections'a uygulanır (effectiveSelections). Pasif grup `calculateTotal`'a KATILMAZ (effectiveSelections'tan çıkarılır veya zorlanmış değerle). Seçim değişince forced/disabled yeniden hesaplanır.
- [ ] **Step 3:** `calculateTotal(product, effectiveSelections)` ile fiyat efektif seçimden. type-check + build PASS.
- [ ] **Step 4:** Commit: `feat(web): koşullu/bağımlı seçenek (pasifleştir/zorla) mantığı`.

### Task 5: Storefront — seçenek fiyat ipucu (kartta fiyat)

**Files:** `apps/web/src/components/product/configurator.tsx` (buildGroups delta hesabı), `option-group.tsx` (kartta fiyat render).

- [ ] **Step 1:** OptionItem'a `priceHint?: number | null` ekle. configurator buildGroups: `priced` grup option'ları için `product_prices`'tan `{groupKey,optionKey,dimKey=seçili fiyat-boyutu}` price'ı → grup içi en ucuza göre delta (en ucuz null/gizli, diğerleri "+X TL"). `adet` dimension için: o adet seçiliyken `calculateTotal` ile TOPLAM (ladder). Diğer dimension (ebat) için hint yok.
- [ ] **Step 2:** option-group.tsx: kartta `priceHint` varsa sağda `+X TL` / `X TL` göster (radio-card.tsx kalıbı). KDV toggle'a uyum (Task 6 ile entegre — şimdilik KDV-dahil değer; Task 6 toggle'ı bağlar).
- [ ] **Step 3:** type-check + build PASS. (prices boşken hint görünmez.)
- [ ] **Step 4:** Commit: `feat(web): seçenek kartında fiyat ipucu (priced delta + adet toplam)`.

### Task 6: Storefront — KDV dahil/hariç toggle + vat.ts

**Files:** Create `apps/web/src/lib/vat.ts`, `apps/web/src/components/product/configurator.tsx`, `price-card.tsx`, `mobile-cta.tsx`, `option-group.tsx`; (dedup) `sepet/page.tsx`+`odeme/page.tsx`.

- [ ] **Step 1:** `vat.ts`: `export const VAT_RATE = 0.2; export const exVat = (gross:number)=>Math.round((gross/(1+VAT_RATE))*100)/100;`
- [ ] **Step 2:** configurator: `kdvDahil` state (default true) + toggle UI (bidolubaski "KDV Dahil Fiyatlar"). Gösterilen toplam + kart ipuçları + mobil bar: kdvDahil ? değer : exVat(değer). Etiket "KDV dahil"/"KDV hariç". CART'A her zaman KDV-DAHİL (gerçek) fiyat eklenir (sadece gösterim değişir).
- [ ] **Step 3:** sepet/odeme'deki yerel `VAT_RATE` tekrarını `vat.ts`'ten import et (dedup).
- [ ] **Step 4:** type-check + build PASS.
- [ ] **Step 5:** Commit: `feat(web): KDV dahil/hariç toggle + paylaşılan vat.ts`.

### Task 7: Storefront — uzun seçenek listesi dropdown

**Files:** `option-group.tsx`.

- [ ] **Step 1:** OptionGroup: `options.length > 8` ise radio-kart yerine aranabilir açılır liste (styled `<select>` veya custom dropdown) render et — optionLabel + sublabel + priceHint. ≤8 radio kart kalır. Kilitli/disabled durumları korunur.
- [ ] **Step 2:** type-check + build PASS (kartvizit 19 paket dropdown olur).
- [ ] **Step 3:** Commit: `feat(web): çok seçenekli grupta aranabilir dropdown (uzun liste UX)`.

### Task 8: Yorum/yıldız gösterimini aç (doğrulanmış)

**Files:** `apps/web/src/app/urun/[slug]/page.tsx`, `apps/web/src/components/product/configurator.tsx` (rating prop).

- [ ] **Step 1:** page.tsx: `getProductRatingStats(slug)` çek (zaten lib'de var). Configurator'a `rating={stats.count>0 ? {average:stats.average,count:stats.count} : undefined}` geçir. (catalog mapProduct `rating:undefined` kalır — sayfa-seviye gerçek istatistik kullanılır.)
- [ ] **Step 2:** configurator rating bloğu zaten `product.rating` varsa render ediyor → prop'tan gelen rating'i kullan. reviews-section + review-form (doğrulanmış satın alma gating) zaten çalışıyor — doğrula.
- [ ] **Step 3:** type-check + build PASS.
- [ ] **Step 4:** Commit: `feat(web): ürün aggregate yıldız+yorum gösterimini aç (doğrulanmış)`.

### Task 9: Güven rozeti + CTA polisleme

**Files:** `apps/web/src/app/urun/[slug]/page.tsx` veya yeni `components/product/trust-badge.tsx`, `mobile-cta.tsx` doğrula.

- [ ] **Step 1:** "Ücretsiz Hızlı Tasarım Kontrolü" güven rozeti/kartı ekle (statik, ürün sayfası sticky kolonunda veya galeri altında).
- [ ] **Step 2:** Masaüstü sticky (`lg:sticky lg:top-24`) içerik üstüne binmiyor doğrula; mobil `mobile-cta` canlı toplam (KDV toggle'a uyumlu) + Sepete Ekle/Teklif-Al doğru. Gerekirse polisle.
- [ ] **Step 3:** type-check + build PASS.
- [ ] **Step 4:** Commit: `feat(web): hızlı tasarım kontrolü güven rozeti + CTA polisleme`.

### Task 10: Tam doğrulama + final review + deploy

- [ ] **Step 1:** api 239+/web tüm suite + 3 type-check + api build dist/main + web/admin build.
- [ ] **Step 2:** Final whole-branch review (opus).
- [ ] **Step 3:** Push → build → manuel deploy → canlı doğrula (ürün sayfası: kilit/koşullu/fiyat-ipucu/KDV/dropdown/yorum/rozet/mobil-bar; migration uygulandı).
- [ ] **Step 4:** Memory + ledger.

---

## Self-Review
- **Kapsam:** kilit(F1-3) ✓, koşullu(F1,2,4) ✓, fiyat-ipucu(F5) ✓, KDV(F6) ✓, dropdown(F7) ✓, yorum(F8) ✓, rozet+CTA(F9) ✓.
- **Model:** locked grup-seviye, rules option-seviye `{disablesGroups,forcesOption}`. Motor efektif-seçimle (pasif hariç).
- **Risk:** F4 koşullu mantık (pasif grup fiyata sızmamalı — birim test + efektif seçim). F5 adet-ladder hesabı (her adet için calculateTotal). setOptions locked/rules korur.
- **Kapsam dışı:** galeri/mockup, online editör.
