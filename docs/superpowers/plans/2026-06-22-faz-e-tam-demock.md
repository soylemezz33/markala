# Faz E — Tam De-Mock + Eski Fiyat Kalıntıları Temizliği (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ile task-task uygula. Adımlar `- [ ]` checkbox.

**Goal:** Storefront'ta HİÇBİR mock/sahte veri kalmasın — ürün/kategori/hero/blog/referans/arama tek kaynak API/DB. Veri yoksa zarif boş/uygun durum (asla sahte). Kategori SEO içeriği DB'ye taşınır (kaybolmaz). Eski `parameters`-tabanlı fiyat kalıntıları kaldırılır.

**Architecture:** apps/web mock fallback'leri kaldırılır → API hatası/boşluğunda graceful empty. Kategori rich SEO alanları için `categories.content` JSON kolonu eklenir (products.content kalıbı), mevcut mock içerik bir kez DB'ye seed edilir, mapCategory DB'den okur. Eski fiyat sistemi (`parameters`/`ProductParameter`/`products.bulkPrice`/matrix-builder/admin inline matris) silinir.

**Tech Stack:** Next.js (web), NestJS+Prisma (api), TypeScript. Dizin: `C:/tmp/markala-main`.

## Global Constraints
- Çalışma dizini: `C:/tmp/markala-main` (worktree). baskisitesi STALE.
- **DE-MOCK İLKESİ:** API/DB tek kaynak. Hata/boşluk → graceful boş durum (mevcut "henüz yok"/gizle kalıpları), ASLA mock veri. Storefront `@markala/mock-data` import ETMEYECEK (sona kalan importerlar kaldırılır).
- **Canlı veri gerçeği (de-mock sonrası ne görünür):** ürünler 870 (dolu), kategoriler 44 (taban alanlar dolu; rich SEO E2'de DB'ye taşınır), hero 8 (dolu), blog 1 yazı (mock 4'tü → 1'e düşer; Hasan admin'den ekleyecek), brands 0 (zaten boş "Yakında"), reviews 3 (zaten temiz/mock'suz). Fiyatlar BOŞ → "Teklif Al" (Hasan Faz D admin'den girer).
- **Yıkıcı silme dikkatli:** `parameters` kolonu DROP edilmez (veri kalsın, sadece okunmaz/tip kaldırılır) — ESKİ alan koruma ilkesi. `ProductParameter` TİPİ + storefront/admin KULLANIMI kaldırılır.
- Her task: ilgili type-check yeşil (`@markala/web`/`@markala/api`/`@markala/admin`). ⚠️ tsconfig include'a DOKUNMA. Deploy öncesi api build→dist/main doğrula (incident 30ae8ac).
- Risk: de-mock graceful state'ler bozulmamalı (sayfa 500 vermemeli) — her web task'ı `pnpm --filter @markala/web build` ile doğrulanır (Windows EPERM standalone artefaktı kabul; "Compiled successfully" yeterli).

---

### Task 1: Kategori içerik (content JSON) kolonu + API serve

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (Category modeline `content Json?`)
- Create: `apps/api/prisma/migrations/<ts>_category_content/migration.sql` (ALTER TABLE add column)
- Modify: `apps/api/src/categories/categories.service.ts` + dto (content okunur/yazılır)

**Interfaces — Produces:** `Category.content` (Json?) — `{ seoIntro?, features?, faqs?, seo?, productCount? }` admin-yönetilir, public yanıtta döner.

- [ ] **Step 1:** schema.prisma Category modeline `content Json?` ekle. Migration: `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "content" JSONB;` (yıkıcı değil).
- [ ] **Step 2:** `categories.service.ts`: public list/detail yanıtına `content` ekle (zaten select'te değilse). Admin update DTO'ya `content?: unknown` ekle (varsa update path).
- [ ] **Step 3:** type-check + (prisma generate) PASS.
- [ ] **Step 4:** Commit: `feat(db): categories.content JSON kolonu (SEO içerik) + API serve`.

### Task 2: Mevcut kategori SEO içeriğini DB'ye seed et (mock → categories.content)

**Files:** Create: `apps/api/scripts/seed-category-content.ts` (bir kez çalışır; mock-data'dan okur, categories.content'e yazar) — VEYA doğrudan SQL üret + psql ile uygula (scripts/ dist'te yok → tsx/yerel-derleme+container ile, A4 yöntemi).

- [ ] **Step 1:** mock-data `categories` (seoIntro/features/faqs/seo/productCount) → her DB kategorisi (slug eşleşmesi) için `content` JSON üret.
- [ ] **Step 2:** Prod'a uygula (A4 deseni: yerel JSON üret → UPDATE SQL → psql). Doğrula: `SELECT count(*) FROM categories WHERE content IS NOT NULL;` ~44.
- [ ] **Step 3:** Commit yok (veri operasyonu) veya seed script commit'lenir.

### Task 3: catalog.ts kategori de-mock (mapCategory DB content'ten)

**Files:** Modify: `apps/web/src/lib/catalog.ts`

- [ ] **Step 1:** `mapCategory`: rich alanları (seoIntro/features/faqs/seo/productCount) `c.content?.* ?? <boş/varsayılan>` ile API'den oku (mock KALDIR). Taban alanlar (name/shortDescription/longDescription/imageUrl/...) zaten API'den — mock fallback'lerini kaldır (yoksa boş string/varsayılan).
- [ ] **Step 2:** `getCategories`/`getCategoryBySlug`: mockCategories fallback'lerini KALDIR (hata/boş → `[]`/`undefined`, graceful). `import { categories as mockCategories }` kaldır.
- [ ] **Step 3:** `pnpm --filter @markala/web type-check` + build → PASS.
- [ ] **Step 4:** Commit: `feat(web): kategori de-mock (content DB'den, mock fallback kaldırıldı)`.

### Task 4: catalog.ts ürün + hero de-mock

**Files:** Modify: `apps/web/src/lib/catalog.ts`

- [ ] **Step 1:** `getProducts`: hata/boş → `[]` (mockProducts KALDIR). `getProductBySlug`: 5xx/network → `undefined` (mock find KALDIR; 404 zaten undefined). `getProductsByCategory`: hata → `[]` (mock filter KALDIR). `getHeroSlides`: hata/boş → `[]` (mockHeroSlides KALDIR).
- [ ] **Step 2:** `mapProduct`: rich alan mock fallback'lerini (features/useCases/specifications/faqs/relatedSlugs/seo/brand/sku/images/parameters) KALDIR → `content.*` API'den, yoksa `undefined`/`[]`. `parameters` artık kullanılmıyor (Faz C motoru options/prices) → mapProduct'tan çıkar.
- [ ] **Step 3:** `@markala/mock-data` import'larını (mockProducts/mockHeroSlides/mockCategories) catalog.ts'ten KALDIR.
- [ ] **Step 4:** type-check + build PASS. (Graceful: ürün listesi API hatası → boş katalog, 500 değil.)
- [ ] **Step 5:** Commit: `feat(web): ürün+hero de-mock (catalog mock fallback tamamen kaldırıldı)`.

### Task 5: blog + brands + arama + sitemap de-mock

**Files:** Modify: `apps/web/src/lib/blog.ts`, `apps/web/src/lib/brands.ts`, `apps/web/src/components/site-header.tsx`, `apps/web/src/app/sitemap.ts`

- [ ] **Step 1:** `blog.ts`: `MOCK_POSTS`/`MOCK_CATEGORIES` ve per-field mock fallback'leri KALDIR. getBlogPosts/getBlogPostBySlug/getBlogCategories hata/boş → `[]`/`undefined`. (Canlı: 1 DB yazısı görünür.) `blogCoverSrc` /api/mockup üretimi: gerçek görsel yoksa nötr placeholder (mockup kalabilir — bu SVG üretici, sahte VERİ değil; ya da kategori/tema bazlı statik). KARAR: blogCoverSrc'i koru (görsel üretici, veri mock'u değil).
- [ ] **Step 2:** `brands.ts`: `mockBrands` import + fallback KALDIR → hata/boş `[]`. (trusted-by/referanslar zaten boşta gizler.)
- [ ] **Step 3:** `site-header.tsx`: `useLiveCategories` init state `mockCategories` → `[]` (modal açılınca API yükler). `import { categories as mockCategories }` KALDIR.
- [ ] **Step 4:** `sitemap.ts`: `import { categories } from "@markala/mock-data"` → `getCategories()` (API) kullan (async sitemap). Ürünler için de `getProducts()` API.
- [ ] **Step 5:** type-check + build PASS.
- [ ] **Step 6:** Commit: `feat(web): blog/brands/arama/sitemap de-mock`.

### Task 6: Eski fiyat kalıntıları — API + admin temizliği

**Files:** Modify: `apps/api/src/products/products.controller.ts` (bulk-price route sil), `products.service.ts` (bulkPrice sil), `products.dto.ts` (BulkPriceDto sil), `packages/api-client/src/index.ts` (products.bulkPrice sil), admin `urunler/[slug]/product-detail-client.tsx` (inline parameters matris editörü sil), Delete: `apps/admin/src/components/matrix-builder.tsx`, admin `urunler/yeni/new-product-client.tsx` (MatrixBuilder kullanımı sil), `apps/admin/src/app/urunler/fiyat-toplu/...` (eski bulkPrice ile ilgili kalıntı yok — D4'te zaten yeni).

- [ ] **Step 1:** API: `@Post("bulk-price")` route + `bulkPrice` service metodu + `BulkPriceDto` sil. (Yeni `prices.bulkAdjust` zaten var.) `bulkPrice` testi varsa kaldır.
- [ ] **Step 2:** api-client: `products.bulkPrice` metodu sil. Kullanan kalmadığını grep'le doğrula.
- [ ] **Step 3:** admin: `product-detail-client.tsx` inline `product.parameters` matris editörünü + `new-product-client.tsx` MatrixBuilder kullanımını kaldır (yeni Fiyat Yönetimi editörü D2/D3 zaten var). `matrix-builder.tsx` dosyasını sil.
- [ ] **Step 4:** type-check (api+admin) + api build dist/main PASS.
- [ ] **Step 5:** Commit: `chore: eski parameters-tabanlı fiyat (bulkPrice/matrix-builder/inline matris) kaldır`.

### Task 7: ProductParameter tipi + Product.parameters kaldır (+ mock-data ürünleri)

**Files:** Modify: `packages/types/src/index.ts` (`ProductParameter` + `Product.parameters` kaldır), `apps/web/src/lib/catalog.ts` (parameters referansı kalmadı — doğrula), mock-data ürün dosyaları.

- [ ] **Step 1:** `packages/types`: `ProductParameter` interface + `Product.parameters` alanını kaldır. Tüm repoda `parameters`/`ProductParameter` kullanımını grep'le; kalan storefront/admin/api referanslarını temizle (api `products.service`/`orders` artık options/prices; create/update DTO `parameters` alanı — KORU veya kaldır: ürün create hâlâ parameters yazıyorsa kaldır, yoksa bırak).
- [ ] **Step 2:** mock-data: storefront artık import etmiyor (Task 3/4 sonrası). `@markala/mock-data` yalnız api seed + /api/mockup + (kaldıysa) gen-content'te kalır — bunlar dev araçları, VERİ amaçlı storefront kullanımı yok → kabul. Mock ürün dosyalarındaki `ProductParameter` tipini local'e indir veya `unknown[]` yap (tip kaldırıldığı için).
- [ ] **Step 3:** type-check (types/web/admin/api) PASS + build'ler PASS.
- [ ] **Step 4:** Commit: `chore(types): ProductParameter + Product.parameters kaldır (Faz C sonrası ölü)`.

### Task 8: Tam doğrulama + deploy

- [ ] **Step 1:** Tüm suite + type-check (api/web/admin) + api build dist/main + web/admin build "Compiled successfully".
- [ ] **Step 2:** Final whole-branch review (opus).
- [ ] **Step 3:** Push main → build → manuel deploy → canlı doğrula: anasayfa/kategori/ürün/blog/arama 200, mock-suz (graceful), api/health 200.
- [ ] **Step 4:** Memory + ledger güncelle.

---

## Self-Review
- **Spec kapsamı (Faz E):** catalog (E3/E4) ✓; blog (E5) ✓; yorum (zaten temiz) ✓; referans/brands (E5) ✓; arama (E5) ✓; kategori (E1-E3, content DB'ye) ✓; eski parameters/bulkPrice/matrix kaldırma (E6/E7) ✓.
- **Kategori SEO korunur:** E1/E2 content kolonu + seed → de-mock SEO kaybı YOK.
- **Graceful:** her de-mock boş durum gösterir (mevcut "henüz yok"/gizle), build ile 500 olmadığı doğrulanır.
- **Outward-facing:** blog 4→1 yazı (Hasan admin'den ekler); brands zaten boş; kategori içeriği DB'ye taşındı (görünüm korunur). Hasan'a bildirildi.
- **Risk:** E7 (parameters/ProductParameter kaldırma) en geniş cascade → grep ile tüm referanslar temizlenir; create/update DTO parameters dikkatli.
