# Online Tasarım Aracı — Faz 0 (Doğrulama) + Faz 1 (MVP) Uygulama Planı

> **Agentik geliştiriciler için:** Tasarım dokümanı: `docs/superpowers/specs/2026-06-29-online-tasarim-araci-design.md`. Bu plan görev-görev uygulanır; adımlar checkbox (`- [ ]`).
>
> **Amaç:** Polotno tabanlı, baskıya-hazır CMYK/PDF çıktısı veren online tasarım aracını Markala'ya MVP olarak ekle; kartvizit + İSG levhası ile canlıya çıkar.
>
> **Mimari:** Polotno React SDK (`apps/web`, ssr:false) → tasarım JSON Postgres'te → BullMQ render worker (`polotno-node` + Ghostscript CMYK/FOGRA39) → secure storage → mevcut admin sipariş-detay indirme. Sepet/sipariş `__bundle` referans deseninin tasarım eşdeğeri (`designId`).
>
> **Tech Stack:** Polotno SDK, polotno-node, @nestjs/bullmq (mevcut Redis), Ghostscript 10.x, sharp, pdf-lib(+fontkit fallback), Cloudflare R2, Prisma/Postgres, Next.js 14, NestJS.

> ## ⚠️ REVİZYON 2026-06-29 (akşam): Polotno → %100 AÇIK KAYNAK (Fabric.js) — bu blok yukarıdaki Polotno satırlarını EZER
>
> Hasan ücretli SDK istemiyor; free-form, bidolubaski'den gelişmiş, %100 açık kaynak. **Tech Stack revize:**
> - **Editör:** `fabric` (Fabric.js v7, MIT) — `apps/web`, `dynamic(ssr:false)`, kendi toolbar/panel/katman UI'ımız. (Polotno SDK/polotno-node ÇIKARILDI.)
> - **Baskı PDF/X:** Fabric `toSVG()` → **Ghostscript** (AGPL, internal CLI shell-out — hukuken güvenli) veya **Scribus** (GPL `-g -py`+xvfb, gerçek PDF/X-1a+bleed) + **lcms2** (RGB→CMYK ICC). sharp = preview/DPI.
> - **Font:** OFL/Apache woff2 (Noto Sans/Inter), self-host R2, embed/subset. **ICC:** ISO Coated v2 (ECI) ücretsiz, embed-only.
> - Geri kalan mimari (BullMQ render-worker, Redis EKLE[B1], secure storage, admin indirme, `designId`, yeni Prisma modelleri) AYNEN geçerli. `Design.document` = **Fabric.js JSON** (Polotno JSON değil).
> - **Faz 0** artık "Polotno trial" değil: Fabric.js POC + tek baskı-PDF (Ghostscript/Scribus CMYK) + **matbaada fiziksel prova**. Lisans/trial/Grass Roots görevleri İPTAL.
> - **Efor:** free-form MVP ~2-3 kişi-ay (Polotno'nun 1-1.5 avantajı yok); olgun ~9-12. Takas: $0 + tam sahiplik.

## Global Kısıtlar (her görev için geçerli)
- **Fiyat DAİMA sunucuda** (`orders.service.ts:181-184`); client fiyatına güvenme.
- **Baskı PDF DAİMA backend'de** üretilir; Polotno render key client'a sızmaz (`NEXT_PUBLIC_POLOTNO_KEY` sadece editör UI key'i, domain-kilitli).
- **SVG asset yasak** (`storage.service.ts:38` stored-XSS) — sanitize/rasterize yolu olmadan SVG kabul etme.
- **Host whitelist:** editör çıktı URL'i markala host'unda (`safeUploadUrl`); `designId` URL değil id taşınır.
- **Türkçe glif:** tüm fontlar `latin-ext` + PDF'e embed/subset; ş ğ ı İ ç ö ü render testi zorunlu.
- **Misafir-dostu:** `Design.userId` null + `sessionId`; sipariş zaten giriş zorunlu → order'a bağlanır.
- **Build/test yeşil:** her görev sonunda `apps/web` + `apps/api` type-check + ilgili testler geçmeli.
- **Feature-flag (M3):** `DESIGN_TOOL_ENABLED` (env/Settings) — editör bozulursa "Online Tasarla" CTA gizlenir, "Hazır Dosya Yükle" akışı korunur.
- **Redis (B1):** Production'da Redis YOK; BullMQ'dan önce `docker-compose.production.yml`'e eklenmeli (Task 1.4 Adım 0).
- **Deploy:** `pwsh C:\tmp\markala_deploy.ps1` (push → GH Actions image build → script pull+recreate). Yeni `redis` + `render-worker` servisleri compose'a eklenecek.

---

## FAZ 0 — Doğrulama (go/no-go, ~1 hafta, kod minimum)

**Amaç:** Para/efor harcamadan önce Polotno'nun baskı çıktısının matbaada GERÇEKTEN düzgün bastığını kanıtla.

### Task 0.1: Polotno trial + Grass Roots başvurusu
- [ ] polotno.com/sdk → 60-gün ücretsiz trial key al; Grass Roots indirim formu (Türkiye <50 çalışan).
- [ ] **O7:** Polotno'ya sor — "tek client key (storefront) + sunucu-render aynı lisansa dahil mi, ayrı render fee var mı?" + tek-domain kapsam (`markala.com.tr`) onayı.
- [ ] `NEXT_PUBLIC_POLOTNO_KEY` env (web), render key (api) `.env.production` + GitHub secrets.
- [ ] **Çıktı:** çalışan trial key + lisans kapsamı netliği.

### Task 0.2: Tek-sayfa editör spike (throwaway)
- [ ] `apps/web/src/app/tasarim-spike/page.tsx` — `dynamic(() => import('...editor'), { ssr:false })`, tek Polotno store, kartvizit 85×55mm + 3mm bleed.
- [ ] Editörde metin + bir görsel ekle, `store.toJSON()` konsola yaz.
- [ ] **Çıktı:** tarayıcıda çalışan editör.

### Task 0.3: Baskı-PDF spike (backend, manuel)
- [ ] **B2 — GERÇEK API'yi doğrula:** `@polotno/pdf-export` (PDF/X-1a + vektör + bleed/cropMark) imzasını + opsiyonlarını npm/docs'tan teyit et (client `store.saveAsPDF({includeBleed, cropMarkSize})` alternatifi). `polotno-node jsonToPDFBase64` **raster**'dır, bleed/crop/PDF-X opsiyonları YOK — buna dayanma.
- [ ] Geçici script: spike JSON → `@polotno/pdf-export` ile PDF üret → Ghostscript CMYK + FOGRA39 ICC (komut spec §6.2).
- [ ] **B3:** Spike'ı çalıştırırken render'ın headless Chromium başlattığını doğrula; **peak RAM + süre ölç** (worker boyutlandırması için).
- [ ] PDF'i aç: TrimBox/BleedBox var mı, font gömülü mü (Türkçe glif ş/ğ/ı), CMYK mi → doğrula.
- [ ] **Çıktı:** baskıya-hazır örnek PDF.

### Task 0.4: FİZİKSEL PROVA (en kritik)
- [ ] Task 0.3 PDF'ini matbaa tedarikçisine gönder; **fiziksel baskı al**.
- [ ] Renk (CMYK kayması), kesim (bleed/trim), Türkçe karakter, çözünürlük kontrol.
- [ ] Tedarikçinin tam ICC profilini öğren/onayla.
- [ ] **Go/No-go kararı:** prova tatminkârsa Faz 1; değilse PitchPrint denemesi veya BUILD revizyonu.

---

## FAZ 1 — MVP

### Task 1.1: Prisma modelleri + migration
**Files:** Modify `apps/api/prisma/schema.prisma`; Create migration.
**Interfaces (sonraki tasklar buna dayanır):** `Design`, `DesignAsset`, `DesignTemplate`, `DesignFont` modelleri (spec §5); `OrderItem.designId String?`; `Product.editorWidthMm/editorHeightMm/editorBleedMm Int?` (veya `editorSpec Json?`).

- [ ] **Adım 1:** schema.prisma'ya spec §5'teki 4 modeli + `OrderItem.designId` + relation + `Product` editor alanları + `User.designs`/`Product.designs` ters ilişki ekle.
- [ ] **Adım 2:** `npx prisma migrate dev --name design_tool` (dev DB).
- [ ] **Adım 3:** `npx prisma generate`; type-check `apps/api`.
- [ ] **Adım 4:** Commit `feat(api): tasarım aracı veri modeli (Design/Template/Asset/Font)`.

### Task 1.2: Ürün → canvas mm eşlemesi (yapısal eksik)
**Files:** Modify `apps/api/prisma/seed.ts` veya yeni `apps/api/src/designs/canvas-spec.ts` (kanonik mm tablosu); Modify ebat option `rules` veya `Product.editorSpec`.
**Interfaces:** `getCanvasSpec(productSlug|category): { widthMm, heightMm, bleedMm, doubleSided }`.

- [ ] **Adım 1:** Kanonik ölçü tablosu: kartvizit 85×55 (çift yön), A5 broşür 148×210, A6 el ilanı 105×148, yuvarlak kaşe Ø40, sticker değişken, İSG levha (ürün ebadından). Test: `getCanvasSpec('standart-kartvizit')` → `{85,55,3,true}`.
- [ ] **Adım 2:** Area ürünleri: `computeAreaPrice` en/boy (cm) × 10 = mm; `maxM2` aşımı editörde blok (`area-field.tsx:38` kalıbı).
- [ ] **Adım 3:** Test + commit.

### Task 1.3: Backend designs modülü (CRUD + render enqueue)
**Files:** Create `apps/api/src/designs/{designs.module,designs.controller,designs.service,designs.dto}.ts`.
**Interfaces:** `POST /api/designs` (kaydet, body: productSlug, document, name; userId|sessionId), `GET /api/designs/:id`, `POST /api/designs/:id/render` (BullMQ enqueue → 202 + jobId), `GET /api/templates/active`.

- [ ] **Adım 1 (test-first):** `designs.service.spec.ts` — create design (misafir sessionId), get by id, render enqueue çağrısı job ekler.
- [ ] **Adım 2:** Servis + controller; misafir-dostu (userId opsiyonel, `sessionId`). **B6:** `Design.document` Json için `orders.dto.ts:48-69` `IsShallowConfig` (derinlik≤6/200-key) kuralını **KULLANMA** — Polotno JSON aşar; ayrı gevşek limit (byte-cap ~1-5MB + derinlik ~20 + eleman tavanı).
- [ ] **Adım 3 (B4 — DÜZELTİLDİ):** `designId` çözümü `orders.service.ts` **`recalculatedItems.map`** içinde (her item `configuration.designId` okunur) + **`items.create.map` (~satır 536-549)** objesine `designId` + `uploadedFileUrl = design.printFileUrl` yaz. `Design.status` `finalized` değilse reddet/uyar. NOT: `__bundle` bloğu (252-258) `campaignPackage.findMany`'dir, designId orada DEĞİL.
- [ ] **Adım 4:** Misafir→login bağlama (O1): `POST /api/designs/claim` (sessionId→userId migrate); sessionId üretimi cookie/localStorage (AnalyticsEvent ile aynı kaynak).
- [ ] **Adım 5:** Test geç + commit.

### Task 1.4: Redis + BullMQ render worker + Ghostscript pipeline
**Files:** Modify `docker-compose.production.yml` (**B1: yeni `redis` servisi** + `markala-render-worker` servisi); Create worker Dockerfile (**B3: Chromium + ghostscript + ICC + woff2 fontlar**); Create `apps/api/src/designs/render.processor.ts`, `preflight.ts`, `pdf.service.ts`.
**Interfaces:** `RenderProcessor.process(job)`: Design.document → preflight → **`@polotno/pdf-export`** PDF/X-1a → Ghostscript CMYK → storage → Design.printFileUrl/previewUrl/status.

- [ ] **Adım 0 (B1 — ÖN KOŞUL):** `docker-compose.production.yml`'e `redis:7-alpine` (volume + healthcheck) ekle; `api` + `render-worker`'a `REDIS_URL` env + GitHub secret. **Production'da Redis YOK** (`health.controller.ts:62` doğrula). Bu olmadan BullMQ çalışmaz.
- [ ] **Adım 1 (test-first):** `preflight.spec.ts` — efektif DPI (`px/(mm/25.4)`), eşik kuralları (spec §6.4), blok vs uyarı.
- [ ] **Adım 2:** `preflight.ts` — 10 kural (DPI/bleed/safe/font/TAC/RGB-black/boyut). Blok → render durur, `Design.status='failed'` + `preflight` JSON.
- [ ] **Adım 3 (B2 — DÜZELTİLDİ):** `pdf.service.ts` — **`@polotno/pdf-export`** (PDF/X-1a + vektör + bleed/cropMark; `polotno-node jsonToPDFBase64` DEĞİL — o raster + opsiyonları yok) → Ghostscript spawn (CMYK+FOGRA39, `-dBlackPreservation`) → `sharp` preview PNG. **Faz 0'da gerçek `@polotno/pdf-export` imzasını doğrula.**
- [ ] **Adım 4:** `render.processor.ts` — @nestjs/bullmq processor; **concurrency=1 + memory-limit** (B3 Chromium RAM); storage `putSecure` kalıbı; `Design` güncelle.
- [ ] **Adım 5 (B3):** Worker Dockerfile: **Chromium + bağımlılıkları (@sparticuz/chromium veya apt chromium + libnss/fontconfig)** + ghostscript + `/icc/CoatedFOGRA39.icc` + Türkçe woff2 fontlar. Image ~+300-500MB; VPS RAM kontrol (kaynak-limitli → gerekirse swap/upgrade).
- [ ] **Adım 6:** Test geç; lokalde render → PDF (TrimBox/CMYK/font) doğrula; **peak RAM + süre ölç**; commit.

### Task 1.5: Editör bileşeni (web, Polotno)
**Files:** Create `apps/web/src/app/tasarim-araci/page.tsx`, `apps/web/src/components/design/editor.tsx`, `apps/web/src/components/design/preview-gate.tsx`.
**Interfaces:** `/tasarim-araci?urun=<slug>&design=<id?>` → editör; "Onayla" → save+render → designId döner.

- [ ] **Adım 1:** `page.tsx` — `dynamic(editor, { ssr:false })`; `searchParams` ürün slug → `getCanvasSpec` (mm/bleed/doubleSided). **O6:** `export const metadata = { robots: { index:false, follow:false } }` (ssr:false → boş SSR HTML).
- [ ] **Adım 2:** `editor.tsx` — Polotno `PolotnoContainer/SidePanel/Toolbar/Workspace`; canvas mm set, bleed kılavuz, ön/arka sayfa (çift yön); Türkçe UI çevirisi; self-host font listesi (`DesignFont`).
- [ ] **Adım 3:** DPI uyarısı (yüklenen görsel efektif DPI < eşik → editör içi rozet); "%10 renk sapması" notu.
- [ ] **Adım 4:** `preview-gate.tsx` — zorunlu "Tasarımı Onaylıyorum" modal; onaysız sepete-ekle kapalı.
- [ ] **Adım 5 (O2 — iki-aşamalı önizleme):** Sepete eklerken editörde **`store.toDataURL()` anlık client thumbnail** üret → `configuration.designPreviewUrl` (render'ı bekleme). Save: `store.toJSON()` → `POST /api/designs` → `/api/designs/:id/render` (arkada yüksek-çöz preview + baskı-PDF) → poll `GET /api/designs/:id`. Type-check + commit.

### Task 1.6: PDP entegrasyonu (ikili CTA)
**Files:** Modify `apps/web/src/components/product/configurator.tsx` (DesignUpload yanına "Online Tasarla" CTA); Modify `packages/types/src/index.ts` (`CartItemConfiguration` + `designId?`/`designPreviewUrl?`); Modify `apps/web/src/lib/cart-store.ts` (geçiş).
**Interfaces:** "Online Tasarla" → editör (ürün slug ile) → dönen designId → `addItem` config'e.

- [ ] **Adım 1:** `CartItemConfiguration`'a `designId?`/`designPreviewUrl?` (opsiyonel, geriye uyumlu).
- [ ] **Adım 2:** `configurator.tsx` — "Online Tasarla" CTA (editörü olan kategoride göster); editörden dönüşte `configuration.designId` + önizleme sepet görseli.
- [ ] **Adım 3:** "Hazır Dosya Yükle" mevcut akış korunur (yan yana).
- [ ] **Adım 4:** Test (`configurator` mevcut testleri yeşil) + commit.

### Task 1.7: Şablon kütüphanesi (~60, MVP)
**Files:** Create `apps/api/prisma/seed-templates.ts` (veya admin'den gir); şablon JSON'ları.
- [ ] **Adım 1:** 4 kategori (kartvizit 20-30, sticker 8-12, kaşe 6-10, broşür 12-18) için Polotno JSON şablonları (iç ekip/AI taslak + insan); `DesignTemplate` kayıtları (mm/bleed/thumbnail/categorySlug).
- [ ] **Adım 2:** Editörde "Şablondan başla" galeri → `GET /api/templates/active?category=`.
- [ ] **Adım 3:** Türkçe glif testi (her şablon fontu). Commit.

### Task 1.8: Admin yönetimi
**Files:** Create `apps/admin/src/app/sablonlar/{page,packages-client,actions}.tsx`, `apps/admin/src/app/tasarimlar/page.tsx`; Modify `packages/api-client/src` (`templates`/`designs` resource); Modify `apps/api` designs/templates controller (admin guard).
- [ ] **Adım 1:** `@markala/api-client`'a `templates.list/create/update/remove` + `designs.list`.
- [ ] **Adım 2:** Admin Template CRUD (`urunler/[slug]/actions.ts` server-action kalıbı + `revalidate`).
- [ ] **Adım 3:** Admin Design listesi (sipariş-bağlı tasarımları gör). Sipariş-detayda baskı-PDF indirme **zaten hazır** (`order-detail-client.tsx:306-353`) — `uploadedFileUrl=printFileUrl` ile çalışır, değişiklik yok.
- [ ] **Adım 4:** Test + commit.

### Task 1.9: Güvenlik sertleştirme
**Files:** Modify `apps/api/src/storage/storage.service.ts` (asset whitelist + SVG sanitize yolu OR rasterize); Modify `apps/api/src/main.ts` (rate-limit ayarı gerekirse).
- [ ] **Adım 1:** DesignAsset upload: png/jpg/woff2 whitelist; SVG kabul edilecekse DOMPurify/rasterize, aksi halde reddet.
- [ ] **Adım 2:** Polotno client key domain-kilitli; render key sadece backend env.
- [ ] **Adım 3:** Test (kötü-amaçlı SVG reddi) + commit.

### Task 1.10: Hukuk/KVKK metinleri
**Files:** Modify `packages/mock-data/src/legal.ts` + **`legal_pages` DB satırı** (O3: canlı `legal.service.ts`'ten serve ediliyor; mock tek başına canlıyı GÜNCELLEMEZ).
- [ ] **Adım 1:** KK'ya m.3.A (5 alt madde), KVKK saklama satırı ekle (mock + seed).
- [ ] **Adım 2 (O3):** Canlı `legal_pages` DB satırını da güncelle — admin `yasal/` editöründen veya migration/script ile. mock-data değişikliği canlı metni değiştirmez.
- [ ] **Adım 3:** `seed.ts` legal stub çakışma kontrolü (komple_denetim legal DB-stub riski). **Hukuk müşaviri onayına işaretle.** Commit.

### Task 1.11: Pilot canlı + uçtan uca doğrulama
- [ ] **Adım 1:** Kartvizit + İSG levha ürünlerinde "Online Tasarla" aktif.
- [ ] **Adım 2:** E2E: tasarla → önizleme kapısı → sepet → sipariş → admin baskı-PDF indir → **matbaada bas**.
- [ ] **Adım 3:** Mobil: editör masaüstü öncelik; mobilde "dosya yükle" fallback çalışıyor.
- [ ] **Adım 4:** Deploy (`render-worker` compose'da); canlı doğrula; memory + denetim raporu güncelle.

---

## Faz 2 / Faz 3 (ayrı planlar — sonra)
- **Faz 2:** QR üretici, 3D mockup, mobil editör, m² area entegrasyonu, editör-içi canlı fiyat, kalan kategoriler. (Kendi spec+plan'ı.)
- **Faz 3:** AI ile başla, marka kit, gelişmiş efektler, çok-tasarım tek paket.

## Öz-Denetim (plan tamamlandı)
- Spec §1-16 kapsamı bu plana yansıdı mı: editör(1.5/1.6), pipeline(1.4), veri(1.1), mm-eşleme(1.2), şablon(1.7), admin(1.8), güvenlik(1.9), hukuk(1.10), pilot(1.11) ✓
- Placeholder yok: her task dosya + arayüz + test adımı içeriyor ✓
- Tip tutarlılığı: `Design`/`designId`/`getCanvasSpec`/`printFileUrl` plan boyunca tutarlı ✓
- Faz 0 fiziksel prova **go/no-go kapısı** olarak ayrı ✓
