# Markala Online Tasarım Aracı (Web-to-Print Editör) — Ar-Ge & Tasarım Dokümanı

> **Durum:** Ar-Ge tamamlandı (5 paralel araştırma ajanı + canlı kod denetimi). Bu doküman "yapalım" kararı verildiğinde **tek eksik kalmayacak** detayda tasarımı içerir. Uygulama planı ayrı: `docs/superpowers/plans/2026-06-29-online-tasarim-araci-faz1-mvp.md`.
>
> **Tarih:** 2026-06-29 · **Hazırlayan:** Claude (otonom Ar-Ge) · **Karar bekleyen:** Hasan (bütçe + pilot ürün + ICC profili + Polotno trial başvurusu)

---

## 0.0 ⚠️ REVİZYON 2026-06-29 (akşam): Polotno → %100 AÇIK KAYNAK (Fabric.js)

> **Hasan kararı:** "Ücretli yazılım (Polotno) istemiyorum; açık kaynak profesyonel bir şey. bidolubaski'den farklı, daha gelişmiş/profesyonel free-form bir hizmet." → **Polotno BUY İPTAL. %100 açık kaynak, free-form editör.**
>
> 9 alt-ajanlık derin araştırma sonucu (bu blok §0-§16'daki Polotno kararını EZER):
>
> - **Hazır bedava profesyonel web-to-print editör YOK** (doğrulandı): layerhub=terk, lidojs=lisanssız, salgum1114/react-design-editor=baskı için değil, tldraw=$6k/yıl, Penpot/Excalidraw=baskı değil+embed-SDK yok, Pixie/Pintura=ücretli. → Editörü **biz Fabric.js üstüne kuracağız.**
> - **Revize %100-OSS yığın:** Editör **Fabric.js v7 (MIT)** — SVG export + inline metin + JSON, web-to-print için Konva'yı eler (Konva SVG export edemez). Renk **lcms2 (MIT)** gerçek ICC motoru. Baskı PDF/X **Scribus (GPL v2+, çıktı yükümlülüksüz, gerçek PDF/X-1a + CMYK + bleed + ICC, headless `-g -py` + xvfb)** veya **Ghostscript (AGPL — bizim değiştirmeden internal CLI shell-out kullanımımız hukuken güvenli/ücretsiz; FSF "mere aggregation" + §13 "if you modify" tetiklenmez; Artifex v. Hancom = dağıtım davası, bizim durum değil)**. Font **OFL/Apache (Noto Sans/Inter, ş/ğ/ı/₺)** — baskıya gömme serbest. ICC **ISO Coated v2 (ECI)** ücretsiz, kullan+çıktıya-göm serbest (dosyayı dağıtma → embed-only temiz yol). **SIFIR ücretli bağımlılık.**
> - **Efor gerçeği:** free-form Fabric.js MVP ~2-3 kişi-ay, olgun (CMYK/bleed/PDF-X/çoklu-sayfa/şablon/undo) ~9-12 kişi-ay. Polotno'nun MVP ~1-1.5 kişi-ay avantajı kayboldu — takas: $0 + tam sahiplik.
> - **Aşağıdaki Polotno-özel kısımlar (B2 @polotno/pdf-export, lisans, Grass Roots, trial) artık geçersiz.** Render pipeline (§6) Ghostscript/Scribus + lcms2 ile aynı mantıkta kalır; B1 (Redis), B3 (headless render RAM — Scribus/Chromium), B4-B6, O1-O7 düzeltmeleri GEÇERLİ kalır. Yeni Prisma modelleri (§5) aynen geçerli (`Design.document` = Fabric.js JSON).
> - **Pilot:** Hasan "free-form, gelişmiş" dedi → şablon-tabanlı pdfme yolu elendi; Fabric.js free-form. Pilot ürün hâlâ kartvizit (en temiz) önerilir.

---

## 0. Tek Cümle Karar

**Polotno SDK'yı (self-host, React-native) satın al; baskıya-hazır CMYK/PDF-X-1a/bleed/crop çıktısını backend'de (`@polotno/pdf-export` + Ghostscript) üret; "Online Tasarla" editörünü mevcut "Hazır Dosya Yükle" akışıyla yan yana, zorunlu önizleme kapısıyla sun; bir üründe (İSG levhası veya kartvizit) 60-günlük ücretsiz denemede pilotla, baskı provası tutarsa ($249/ay Grass Roots) yaygınlaştır.**

---

## 0.5 KRİTİK DÜZELTMELER — Boşluk Denetimi (bu blok aşağıdaki çelişen satırları EZER)

> Adversaryal boşluk-eleştirmeni ajanı bu dokümanı + planı gerçek kod tabanına karşı denetledi. İç kod-entegrasyon iddialarının **tamamı doğrulandı** (admin indirme UI, safeUploadUrl host whitelist, SVG yasağı, Product yapısal-mm-yokluğu, DesignUpload ölü tablo, cart-store, rate-limit, sunucu-fiyat). Ancak **dış (Polotno) + mimari varsayımlarda 6 build-blocker** vardı; aşağıdaki düzeltmeler bağlayıcıdır:

| # | Sorun (aşağıda nerede) | DOĞRU durum / düzeltme |
|---|---|---|
| **B1** | "Redis zaten var" (§1, §4.2, §6.5) | ❌ **Production'da Redis YOK** (`docker-compose.production.yml`'de yok; `health.controller.ts:62` `REDIS_URL` yoksa `not_configured`). BullMQ'dan ÖNCE compose'a `redis:7-alpine` servisi + `REDIS_URL` env eklenmeli. Maliyete ~50-100MB RAM ekle. |
| **B2** | `polotno-node jsonToPDFBase64({dpi,unit,includeBleed,cropMarkSize,pdfx1a})` (§4.1, §6) | ❌ Bu fonksiyon o opsiyonları KABUL ETMEZ ve **raster** PDF üretir (CMYK/PDF-X yok). Vektör + bleed/crop + PDF/X-1a ayrı paket **`@polotno/pdf-export`** ile (veya client `store.saveAsPDF({includeBleed, cropMarkSize})`). Faz 0'da gerçek imzayı doğrula; pipeline'ı bunun üzerine kur, polotno-node'u raster-fallback yap. |
| **B3** | "render Node'da" (§4.2, §13) | ⚠️ `@polotno/pdf-export`/polotno-node **headless Chromium** (puppeteer + @sparticuz/chromium) başlatır — saf Node değil. Worker image'ına Chromium + bağımlılıkları (~300-500MB) + RAM bütçesi (düğüm başı yüzlerce MB) eklenmeli; concurrency=1 + memory-limit; VPS RAM kontrol (kaynak-limitli). Faz 0'da render süresi+peak RAM ölç. |
| **B5** | `DesignAsset.design` relation (§5) | ✅ Düzeltildi: relation `DesignTemplate` → **`Design`** (yoksa `prisma generate` hatası). |
| **O3** | Legal metin (§10) | ❌ KK/KVKK canlıda **`legal_pages` DB tablosundan** serve ediliyor (`legal.service.ts`, admin `yasal/`). Yalnız `mock-data/legal.ts` düzenlemek canlıyı GÜNCELLEMEZ → DB satırını da güncelle (admin editör veya migration). |
| **O4** | Ürün→mm (§8) | ⚠️ İSG levha (827 ürün, değişken ebat) için yapısal mm yok; mockup metnine gömülü. Pilot İSG ise mm'yi ebat option `rules`'a toplu-SQL ile yazmak **ön-koşul**. Kartvizit pilotu daha kolay. |
| **O5** | Editör fiyatı (§3.2, §7.1, §12) | **MVP kararı:** editör fiyatı = mevcut konfigüratör fiyatı; `designId` fiyatı ETKİLEMEZ. Premium-şablon/çift-yüz fiyat farkı → **Faz 2**. |
| **O6** | Editör sayfası SEO | `/tasarim-araci` (+spike) **`robots: noindex`** (ssr:false → boş SSR HTML, thin-content). |

Diğer önemli boşluklar (detay §ilgili bölümler + plan): **O1** misafir→login tasarım bağlama akışı (`POST /api/designs/claim`, sessionId migrate) eklendi; **O2** önizleme iki-aşamalı (editörde `store.toDataURL()` anlık thumbnail sepete; worker yüksek-çöz preview arkada); **B4** `designId` çözümü `orders.service.ts` `recalculatedItems.map` + `OrderItem.create` (~536-549) içinde — `__bundle` bloğu (252-258) DEĞİL; **B6** `Design.document` Json için orders.dto 200-key/derinlik-6 limiti KULLANILMAZ (Polotno JSON aşar) → ayrı gevşek byte-cap; **O7** Faz 0'da Polotno'ya "tek client key + server-render aynı lisansta mı?" sor; **M3** `DESIGN_TOOL_ENABLED` feature-flag (bozulursa CTA gizlenir, upload akışı korunur); **M2** render testleri CI'da Chromium+GS gerektirir → integration/skip; **M4** Polotno Türkçe i18n yolu (`unstable_setTranslations`) Faz 0'da ş/ğ/ı ile doğrula.

---

## 1. Yönetici Özeti

Markala bir matbaa e-ticaretidir; online tasarım aracı **araçtır, ürün değildir** → sıfırdan inşa (8-12 kişi-ay, en zoru CMYK/PDF hattı) stratejik değil. Web2print'in gerçek mühendislik yükü editör değil **sunucu-tarafı baskıya-hazır PDF/CMYK render hattıdır** (~2-3 kişi-ay tek başına); bütün ücretsiz canvas kütüphaneleri (Fabric.js/Konva) tam burada çöker çünkü tarayıcı yalnızca sRGB bilir, CMYK kavramı yoktur.

**Polotno SDK** bu hattı (PDF/X-1a, CMYK, bleed, crop marks, spot/Pantone) hazır verir, React-native Next.js'e iframe'siz oturur, self-host'tur (tasarım datası dışarı çıkmaz), öngörülebilir düz aylık ücretlidir ($249/ay Grass Roots — Türkiye düşük-alım-gücü pazarı + <50 çalışan → başvurulmalı; $899/ay sınırsız), 60 gün tam ücretsiz denemesi vardır.

**MVP efor: ~1-1.5 kişi-ay** (vs sıfırdan 3-5 ay + kalıcı bakım). Markala'nın mevcut altyapısı (Redis→BullMQ, Cloudflare R2, secure-upload deseni, admin sipariş-detay indirme UI'ı, sunucu-tarafı fiyat, `__bundle` referans deseni) entegrasyonu kolaylaştırır — birçok plug-in noktası **zaten hazır**.

---

## 2. Karar: BUILD vs BUY

### 2.1 Karşılaştırma (özet)

| Kriter | BUILD (Fabric/Konva sıfırdan) | BUY — Polotno SDK ⭐ | BUY — PitchPrint (2. alt.) | BUY — Zakeke |
|---|---|---|---|---|
| Baskıya-hazır PDF (CMYK/bleed/crop) | ❌ Kendin yazarsın (~2-3 kişi-ay) | ✅✅ PDF/X-1a, CMYK, bleed, crop, spot | ✅ CMYK+spot (bleed/crop belirsiz) | ✅ ama prepress sığ |
| Next.js/React uyumu | Tam kontrol | ✅ Native React bileşeni | JS SDK (gömülür) | Headless API |
| Self-host / veri sahipliği | ✅ | ✅ (editör + render kendi sunucunda) | ❌ bulut | ❌ bulut |
| İşlem-başı ücret | Yok | **Yok** (düz aylık) | Proje-başı | **%1,5-1,9 işlem** |
| Türkçe UI | Kendin | Çeviri dosyası (sende) | Çevrilebilir | ✅ 80+ dil hazır |
| Maliyet | $0 lisans ama 3-5 kişi-ay + %20-30/yıl bakım | $249-899/ay | $29-199/ay | $68-340/ay + işlem |
| Time-to-market | 3-5 ay | **Haftalar** | Haftalar | Haftalar |
| 60-gün ücretsiz tam deneme | — | ✅ | — | — |

### 2.2 Neden Polotno (Markala bağlamı)

1. **PDF/CMYK kriterini tek başına tam karşılayan açık-kaynak-temelli çözüm.** İSG levhası, branda, broşür gibi kesim-payı kritik ürünler için PDF/X-1a + CMYK + bleed + crop şart.
2. **React-native + self-host.** `apps/web` (Next 14 App Router, React 18) içine `dynamic(..., { ssr: false })` ile gömülür; render `apps/api` (NestJS) içinde `polotno-node` ile — data dışarı çıkmaz.
3. **Öngörülebilir maliyet**, işlem/koltuk başına değil; Grass Roots ile küçük-ekip-dostu.
4. **60 gün ücretsiz deneme** → satın almadan önce gerçek baskı provasıyla doğrula.

### 2.3 Sıfırdan Fabric.js ne zaman mantıklı? 
Editör **çekirdek iş modeli** olsaydı (Markala bir SaaS editör satsaydı) veya SDK'ya sığmayan çok standart-dışı bir akış olsaydı. Markala matbaa e-ticareti → **satın al**.

### 2.4 Çıkış / kilitlenme riski (lock-in)
Tasarım state'i Polotno JSON formatında saklanır. Polotno terk edilirse JSON başka motora migrate gerektirir. Mitigasyon: (a) `Design.document` JSON + `schemaVersion` saklanır, (b) baskı çıktısı PDF olarak da arşivlenir (motordan bağımsız), (c) Polotno JSON Fabric'e yakın → migrasyon yolu var. Risk düşük-orta, kabul edilebilir.

---

## 3. Kapsam (MVP → Faz 2 → Faz 3)

### 3.1 Table-stakes (MVP — olmazsa-olmaz)
- **İki giriş yolu yan yana:** ürün sayfasında **"Online Tasarla"** (birincil) + **"Hazır Dosya Yükle"** (mevcut akış korunur). Editörü olmayan üründe en azından upload + "daha sonra yükle".
- Şablon kütüphanesi (kategorili: kartvizit/sticker/kaşe) + **boş başla**.
- Metin (font/renk/boyut/hizalama), **logo/görsel yükleme** (PNG/JPG/PDF), şekil/clipart ekle.
- **Çift taraf (ön/arka)** — kartvizit için zorunlu.
- **Bleed + güvenli alan + kesim çizgisi kılavuzu** canvas üstünde görünür.
- **Düşük çözünürlük (DPI) canlı uyarısı** (yeşil/sarı/kırmızı indikatör).
- **Renk kayması notu** ("ofset baskıda renkler ~%10 değişebilir").
- 2D canlı önizleme + **sepete eklemeden önce ZORUNLU "ÖNİZLEME / Tasarımı Onaylıyorum" kapısı**.
- Tasarımı hesapta sakla + sonradan düzenle + tekrar sipariş.
- Geri-al/yinele.
- **Baskıya-hazır PDF** (CMYK, bleed, 300dpi, font-gömülü) backend'de üretim + admin sipariş-detayında indirme.

### 3.2 Differentiator (Faz 2 — fark yaratan)
- **QR kod üretici (vCard/URL/SMS)** — kartvizitte güçlü; TR rakiplerinde net değil.
- **3D / gerçekçi mockup önizleme** — TR matbaalarında neredeyse yok (branda/kaşe/sticker/kupa).
- **Mobil-çalışan editör** — TR'de zayıf/doğrulanamadı; fırsat.
- **m² ürünlerde (branda/sticker) canlı fiyat + tasarım** birleşik akış (area modu zaten var).
- Tasarım seçeneklerinin (lak/kuşe/adet) editör içinde canlı fiyatı etkilemesi.

### 3.3 Nice-to-have (Faz 3)
- AI ile başla (metin → taslak layout), gelişmiş metin efektleri (eğri/gölge), stok clipart kütüphanesi genişletme, çok-tasarım tek pakette, marka kit (kayıtlı logo+renk), harita gömme.

### 3.4 Kategori → şablon önceliği (MVP)
| Kategori | MVP şablon | Öncelik |
|---|---|---|
| Kartvizit (çift taraf + QR) | 20-30 | ★★★ en kritik |
| Sticker/Etiket (yuvarlak/kare/oval) | 8-12 | ★★★ |
| Kaşe (yuvarlak/dikdörtgen) | 6-10 | ★★ metin ağırlıklı, basit |
| Broşür / El ilanı | 12-18 | ★★ layout zor |
| Roll-up / Banner | 10-15 | ★★ |
| Menü / Branda / Magnet / Antetli | 6-12 each | ★ Faz 2 |

**MVP gerçekçi başlangıç:** en çok satan 4 kategori × ~15 = **~60 şablon**; kalanı haftalık ekle. Toplam hedef ~90-130.

---

## 4. Mimari

### 4.1 Bileşenler ve veri akışı

```
┌─────────────────────────── apps/web (Next.js 14, React 18) ───────────────────────────┐
│  PDP: "Online Tasarla" CTA (configurator.tsx) ──► /tasarim-araci?urun=<slug>&design=<id?> │
│                                                                                         │
│  Editör (client-only, dynamic ssr:false)  ── Polotno React SDK                          │
│   • canvas mm = ürün ebadı (option rules.widthMm/heightMm) + bleedMm                     │
│   • şablon/asset/font panel · DPI uyarısı · safe/bleed kılavuz · ön/arka                 │
│   • "Onayla" → store.toJSON()  ──POST /api/design/save──►                                │
│                                              │                                           │
│  Sepet (cart-store.ts): configuration.designId + designPreviewUrl  ──► checkout          │
└─────────────────────────────────────────────┼───────────────────────────────────────────┘
                                               ▼
┌─────────────────────────── apps/api (NestJS) ─────────────────────────────────────────┐
│  DesignsController:                                                                     │
│   POST /api/designs            → Design kaydet (JSON state, userId|sessionId)           │
│   POST /api/designs/:id/render → BullMQ 'render' job enqueue → 202 + jobId              │
│   GET  /api/designs/:id        → durum/preview/printFileUrl (poll veya SSE)             │
│   GET  /api/templates/active   → public şablon listesi                                  │
│  TemplatesController (admin): CRUD (JwtAuthGuard + Roles)                               │
│                                               │                                          │
│  Order create (orders.service.ts): configuration.designId çöz (── __bundle deseni gibi) │
│   → OrderItem.designId FK + uploadedFileUrl = printFileUrl                              │
└───────────────────────────────────────────────┼─────────────────────────────────────────┘
                                                 ▼  (Redis / BullMQ)
┌─────────────── markala-render-worker (yeni Docker servisi) ───────────────────────────┐
│  1. Design.document JSON yükle                                                          │
│  2. PREFLIGHT (DPI/bleed/safe/font/TAC/RGB-black) — blok varsa durdur                   │
│  3. polotno-node jsonToPDFBase64({ dpi:300, unit:'mm', includeBleed:true,               │
│        cropMarkSize:3, pdfx1a:true })                                                    │
│  4. Ghostscript: RGB→CMYK + ICC (FOGRA39) + font outline + TrimBox                      │
│  5. Storage'a yükle (R2/secure)  → Design.printFileUrl + previewUrl                      │
│  6. job.complete                                                                         │
│  (Image: ghostscript + ICC profilleri + Türkçe woff2 fontlar kurulu)                    │
└────────────────────────────────────────────────┼──────────────────────────────────────┘
                                                  ▼
┌─────────────── apps/admin ───────────────────────────────────────────────────────────┐
│  Sipariş detay (order-detail-client.tsx): "Tasarım Dosyaları" → baskı-PDF İNDİR (HAZIR) │
│  /sablonlar (Template CRUD) · /tasarimlar (Design listesi)  — mevcut admin kalıbı       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Kararlar
- **Editör iframe DEĞİL**, native React bileşeni (`PolotnoContainer`).
- **Baskı PDF DAİMA backend'de** üretilir (CMYK/PDF-X-1a en zengin çıktı Node'da; lisans key client'ta sızmaz; render güvenli).
- **Render ASENKRON** (BullMQ + ayrı worker process/container) — HTTP request içinde yapma. Redis zaten var.
- Büyük dosyalar (PDF/asset) job payload'una konmaz → storage'a koy, job'da referans tut.

---

## 5. Veri Modeli (Prisma)

Mevcut konvansiyon: `cuid()`, `@map(snake_case)`, `createdAt/updatedAt`, opsiyonel user FK `onDelete:SetNull`, soft-delete `deletedAt?`, JSON `@default`.

```prisma
model Design {
  id            String   @id @default(cuid())
  userId        String?  @map("user_id")         // üye; misafir → null
  sessionId     String?  @map("session_id")       // misafir anonim id (AnalyticsEvent kalıbı)
  productId     String?  @map("product_id")
  templateId    String?  @map("template_id")
  name          String   @default("Tasarım")
  status        String   @default("draft")        // draft | rendering | finalized | ordered | failed
  document      Json                               // Polotno store JSON (tuval state)
  schemaVersion Int      @default(1) @map("schema_version")
  widthMm       Int      @map("width_mm")
  heightMm      Int      @map("height_mm")
  bleedMm       Int      @default(3) @map("bleed_mm")
  previewUrl    String?  @map("preview_url")       // editör PNG önizleme (public)
  printFileUrl  String?  @map("print_file_url")    // baskı-PDF (secure veya public R2)
  printFileKey  String?  @map("print_file_key")
  preflight     Json?                              // son preflight sonucu (uyarı/blok listesi)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  user     User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  product  Product?        @relation(fields: [productId], references: [id], onDelete: SetNull)
  template DesignTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  assets   DesignAsset[]
  orderItems OrderItem[]

  @@index([userId]) @@index([sessionId]) @@index([productId])
  @@map("designs")
}

model DesignAsset {
  id        String   @id @default(cuid())
  designId  String?  @map("design_id")
  userId    String?  @map("user_id")
  kind      String   @default("image")   // image | logo | clipart
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  fileSize  Int      @map("file_size")
  mimeType  String   @map("mime_type")
  createdAt DateTime @default(now()) @map("created_at")
  design Design? @relation(fields: [designId], references: [id], onDelete: Cascade)  // ← Design (DesignTemplate DEĞİL; B5 düzeltmesi)
  @@index([designId]) @@index([userId]) @@map("design_assets")
}

model DesignTemplate {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  categorySlug String?  @map("category_slug")
  productSlug  String?  @map("product_slug")
  document     Json
  schemaVersion Int     @default(1) @map("schema_version")
  widthMm      Int      @map("width_mm")
  heightMm     Int      @map("height_mm")
  bleedMm      Int      @default(3) @map("bleed_mm")
  thumbnailUrl String?  @map("thumbnail_url")
  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  designs Design[]
  @@index([isActive, sortOrder]) @@index([categorySlug, isActive]) @@map("design_templates")
}

model DesignFont {
  id        String  @id @default(cuid())
  family    String
  fileUrl   String  @map("file_url")    // self-host woff2 (R2)
  weight    Int     @default(400)
  isActive  Boolean @default(true) @map("is_active")
  sortOrder Int     @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  @@map("design_fonts")
}
```

**Mevcut modellere ekleme:**
- `OrderItem.designId String? @map("design_id")` + relation (schema.prisma:449-475). Baskı-PDF zaten `uploadedFileUrl`'e yazılır (admin indirme UI'ı hazır).
- `Product`'a `editorWidthMm/editorHeightMm/editorBleedMm Int?` **veya** `editorSpec Json?` — canvas mm kaynağı (§8 eksiği).
- `User`/`Product`'a `designs Design[]` ters ilişki.
- **NOT:** Mevcut `DesignUpload` tablosu (schema.prisma:479) order-create'te yazılmıyor (ölü/yarı-bağlı) → yeni `Design` modeli kullanılır, eskiye bağlanmaya çalışılmaz.

---

## 6. Baskıya-Hazır PDF Pipeline (en kritik kısım)

### 6.1 Baskı geometrisi
- **Bleed (taşma):** 3mm her kenar · **Trim:** bitmiş ölçü · **Safe area:** trim'den 3mm içeri · **Crop marks:** bleed dışında.
- **mm↔px @300dpi formülü:** `px = mm × (300 / 25.4)`.
  - Kartvizit 85×55mm trim = **1004×650px**; +3mm bleed (91×61mm) = **1075×720px**; bleed payı tek kenar ≈ 35.4px.
  - A5 broşür 148×210mm trim = 1748×2480px; +bleed = 1819×2551px.
- PDF box'ları: **MediaBox** (en dış), **BleedBox** (trim+3mm), **TrimBox** (kesim — makine bunu okur), **ArtBox**. Polotno vector export bunları yazar (`includeBleed:true`, `cropMarkSize`).

### 6.2 Renk yönetimi
- RGB (ekran, geniş gamut) → CMYK (mürekkep, dar gamut) **şart**; yapmazsan matbaa RIP'i kontrolsüz çevirir → ekrandan farklı çıktı → iade. Parlak mavi/yeşil/turuncu CMYK'da matlaşır.
- Hedef ICC: **Coated FOGRA39 / ISO Coated v2 (ECI)** (AB kuşe) — **[KARAR BEKLİYOR: Markala'nın matbaa tedarikçisinin tam ICC profilini onaylat]**.
- Node komutu (üretim, ICC'li):
  ```bash
  gs -dPDFX -dBATCH -dNOPAUSE -dPDFXCompatibilityPolicy=1 \
     -sColorConversionStrategy=CMYK -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress \
     -sOutputICCProfile=/icc/CoatedFOGRA39.icc -sOutputFile=out_pdfx1a.pdf in.pdf
  ```
  - **Tuzak:** eski GS'te RGB siyah (0,0,0) 4-renk zengin siyaha kayabilir → güncel GS 10.x + `-dBlackPreservation`/`-dKPreserve`, çıktıyı doğrula.
- **Ink kuralları (matbaa reddi):** Toplam mürekkep (TAC) ≤ 300% (280 güvenli); metin/ince çizgi **K-only (0/0/0/100)**; rich black büyük alanda C60M40Y40K100.

### 6.3 Çözünürlük & font
- Efektif DPI = `görsel_px / (yerleşim_mm / 25.4)`. Eşik: ≥300 ok; 150-299 sarı; <150 kırmızı (büyük format/branda 150 yeterli — ürün tipine göre).
- **Font PDF'e MUTLAKA gömülü/subset.** Standart 14 PDF fontu Türkçe içermez → TTF/woff2 gömme şart, **ş ğ ı İ ç ö ü** glif testi zorunlu (DejaVu/Roboto/Inter/Open Sans içerir). Kullanıcı fontu yüklerse fontkit `getCharacterSet()` ile glif kontrolü; yoksa outline'a çevir.

### 6.4 Preflight kural tablosu (render öncesi worker'da)
| # | Kontrol | Eşik | Seviye | Mesaj |
|---|---|---|---|---|
| 1 | Düşük efektif DPI | <150 küçük / <100 büyük format | 🔴 Blok | "Görsel düşük çözünürlük, bulanık çıkar" |
| 2 | Orta DPI | 150-299 | 🟡 Uyarı | "Baskı yumuşak olabilir" |
| 3 | Bleed eksik | arka plan trim'e değiyor, bleed'e taşmıyor | 🟡 Uyarı | "Kenarda beyaz şerit riski" |
| 4 | Safe-area taşması | metin/logo trim'den <3mm içeride | 🟡 Uyarı | "İçerik kesilebilir" |
| 5 | Bleed dışı kritik öğe | öğe kesim çizgisini geçiyor | 🟡 Uyarı | "Bu öğe kesilecek" |
| 6 | Gömülmeyen font | embed yok | 🔴 Blok | "Yazı tipi gömülemedi" |
| 7 | RGB içerik | RGB renk uzayı | 🟢 Bilgi | "CMYK'ya çevrilecek, renkler hafif değişebilir" |
| 8 | Aşırı mürekkep (TAC) | >300% | 🟡 Uyarı | "Koyu alanlar kuruma sorunu yapabilir" |
| 9 | RGB siyah metin | metin K-only değil | 🟡 Uyarı | "Siyah metin K100'e çevrilecek" |
| 10 | Boyut uyuşmazlığı | ürün ebadı ≠ tasarım ebadı | 🔴 Blok | "Boyut uyuşmuyor" |

### 6.5 Yığın
| Katman | Paket | Neden |
|---|---|---|
| Editör | **Polotno SDK** | bleed/crop/CMYK/PDF-X yerleşik |
| Server render | **polotno-node** / `@polotno/pdf-export` | vektör + PDF/X-1a, Node offline |
| CMYK/PDF-X | **Ghostscript 10.x** | RGB→CMYK + ICC + flatten + TrimBox |
| ICC | **CoatedFOGRA39.icc** (onaylanacak) | AB kuşe standardı |
| Kuyruk | **@nestjs/bullmq** + mevcut Redis | async render, ayrı worker |
| Görsel/DPI | **sharp** | efektif DPI ölçümü |
| Fallback | pdf-lib (+@pdf-lib/fontkit), rsvg-convert | Polotno dışı yol |

### 6.6 "Matbaacının 7 kuralı"
1. TrimBox/BleedBox doğru gömülü. 2. 3mm bleed fiilen dolu. 3. RGB→CMYK'yı SEN (ICC ile) yap. 4. Fontlar gömülü/outline + Türkçe glif test. 5. Efektif DPI ≥300 (büyük ≥150). 6. Metin K-only, TAC ≤300%. 7. Son PDF/X-1a validate + ilk üründe fiziksel prova.

---

## 7. UX Akışları

### 7.1 Ana akış (giriş → sipariş)
1. **PDP — ikili CTA:** "Online Tasarla" (dolu sarı) + "Hazır Dosya Yükle" (ikincil). Editörü olmayan üründe sadece upload.
2. **Başlangıç:** Şablon galerisi (kategorili) **veya** boş tuval. Misafir tasarlayabilir; login sepete-eklemede istenir (friction düşük).
3. **Editör açılır, kılavuzlar görünür:** bleed (kırmızı kesik), safe-area (mavi), trim çizgisi baştan açık.
4. **Düzenleme:** Metin/Logo/Şekil/QR; katman + hizalama. Kartvizitte **Ön/Arka sekmesi**. Logo yüklenince **DPI indikatörü** anında.
5. **Pasif uyarılar:** düşük DPI + "%10 renk sapması" notu + safe-area taşma uyarısı.
6. **ÖNİZLEME (zorunlu kapı):** "Tasarımı Onaylıyorum / baskıya bu haliyle gidecek" işaretlenmeden sepete eklenemez.
7. **Kaydet & Sepete Ekle:** tasarım hesaba kaydedilir (giriş yoksa burada iste); adet/kağıt/lak **canlı fiyatı** günceller; sepete eklenir (`configuration.designId`).
8. **Sipariş sonrası esneklik:** "Daha sonra yükle" + Siparişlerim>Detaylar>Tasarımım (mevcut).
9. **Tekrar sipariş:** kayıtlı tasarımdan tek tıkla.

### 7.2 Kaçınılacak 5 UX hatası
1. Editörü ödeme arkasına saklamak (önizleme+onay sepetten önce olsun). 2. Baskı kılavuzlarını göstermemek. 3. DPI/renk uyarısını atlamak. 4. Aşırı kalabalık/yavaş editör (2-3sn üstü yükleme %80 kayıp; minimal araç, lazy-load şablon). 5. Mobili görmezden gelmek.

### 7.3 TR pazarı notları
- Fontlar **ç/ğ/ı/İ/ö/ş/ü** tam desteklemeli; editör dili "Kendin Tasarla / Online Tasarla / Tasarımını Yükle / Önizleme / Onayla". Fiyat **KDV dahil** ("(%20 dahil)" konvansiyonu). Kartvizit = en yoğun ürün (çift taraf + QR beklentisi). Editörü olmayan üründe "grafiker desteği" düşük-maliyetli upsell.

---

## 8. Ürün ↔ Canvas Eşlemesi (yapısal eksik — kurulacak)

**Sorun:** Ürün gerçek baskı ölçüsü Markala'da **yapısal değil** — `Product.sizeLabel` serbest metin, ölçüler mockup SVG metinlerinde gömülü ("85×55 mm", "47×18 mm kaşe"). Editör canvas'ı mm'yi yapısal almalı.

**Çözüm:** 
- Ebat option'larının `rules` JSON'una (zaten Json, `maxM2`/`forcesOption` ile aynı kalıp) `{ widthMm, heightMm, bleedMm }` ekle; **veya** `Product.editorSpec Json?`.
- Area ürünlerinde (branda/folyo) canvas = kullanıcı girdiği **cm × 10 = mm**; `maxM2` aşımı editörde de bloklanır.
- Kartvizit/broşür/sticker/kaşe için **kanonik mm tablosu** (DB seed veya kod sabiti) — editör projesinin kuracağı tek-doğru-kaynak. Örnek: kartvizit 85×55, A5 broşür 148×210, A6 el ilanı 105×148, yuvarlak kaşe Ø40, sticker değişken.

---

## 9. Şablon / Asset / Font Stratejisi

### 9.1 Şablon
- Format: Polotno JSON, Postgres'te (`DesignTemplate.document`), gömülü görseller R2'de; `schemaVersion` zorunlu.
- Üretim: **iç ekip + AI taslak + insan düzeltme** (en ucuz/hızlı). Hazır şablon paketi **satın alma** (lisans zinciri kirli → kaçın).
- MVP ~60 şablon (4 ana kategori), haftalık ekleme.

### 9.2 Asset (lisans-temiz)
- **İkon/şekil:** yalnız **MIT** — Phosphor (zaten kullanılıyor) + Heroicons + Lucide/Tabler. ✅ redistribüte + son üründe kullanım serbest.
- **İllüstrasyon:** **unDraw** (atıfsız ticari) + **CC0** (Open Doodles/Humaaans). ✅
- **YASAK:** Freepik/Flaticon (editable dosyada redistribution ihlali), SVGRepo "custom license" (ikon-bazında doğrula, sadece CC0/MIT al).
- **Stok fotoğraf:** MVP'de **sunma** — Unsplash/Pexels POD/baskı-satış yasağı var. Sadece **kullanıcı kendi fotoğrafını yükler** (sorumluluk kullanıcıya geçer).

### 9.3 Font (~17, Türkçe-tam, baskı-gömme-açık)
- **Anahtar:** Google Fonts `latin-ext` subset Türkçe glifleri içerir; Markala `layout.tsx` zaten `DM_Sans` ile `["latin","latin-ext"]` kullanıyor (kalıp doğrulanmış).
- **Lisans:** OFL ve Apache-2.0 ikisi de **baskı ürününe gömüp satmaya açık** (OFL tek yasak: fontu tek başına satmak).
- Liste: Inter, Roboto, Open Sans, Montserrat (güncel sürüm), Poppins, Lato, Nunito, Raleway, Work Sans, DM Sans, Rubik, Source Sans 3, PT Sans/Serif, Lora, Playfair Display, Merriweather, EB Garamond, Oswald. (Bebas Neue/Pacifico/el-yazısı → **her birini ş/ğ/ı testinden geçir**.)
- **Self-host woff2** (Google CDN'e bağlanma — KVKK/IP toplama riski); R2'den serve; PDF'e subset+gömme.

---

## 10. Hukuk / IP / KVKK

**Mevcut:** `legal.ts` KK m.3 telif sorumluluğunu genel olarak kullanıcıya yüklüyor, m.5 yasaklı içerik, KVKK m.6 "iptal sonrası 30 gün" saklama var — **tasarım aracına özel ekleme şart**.

**Türkiye notu:** DMCA safe harbor YOK (o ABD). Markala ihlalli içeriği basarsa **fiilen üreten taraf** olarak 6769 SMK kapsamında sorumlu olabilir → sözleşmeyle tazminat + üretim öncesi kontrol + ihbar-kaldır süreci üçü birden. **Hukuk müşaviri onayı şart.**

**KK'ya eklenecek (m.3.A — tam taslak araştırma raporunda):** 3.A.1 Tasarım Öğeleri lisans kapsamı + yalnız son üründe kullanım; 3.A.2 editable dosyayı tek başına çıkarıp dağıtma/satma yasağı; 3.A.3 yüklenen içeriğin telif/marka sorumluluğu **münhasıran kullanıcıda** + tazminat; 3.A.4 Markala üretmeyi reddetme hakkı; 3.A.5 kullanıcı tasarımı yalnız sipariş üretimi için işlenir. **KVKK m.6'ya:** kaydedilen tasarımlar hesap aktifken saklanır, silme talebinde 30 gün; kişisel veri içerebilir, silme hakkı.

---

## 11. Admin Yönetimi
- `apps/admin/src/app/sablonlar/` (Template CRUD) + `apps/admin/src/app/tasarimlar/` (Design listesi) — mevcut `urunler/[slug]/actions.ts` server-action kalıbı.
- `@markala/api-client`'a `templates`/`designs` resource; `apps/api`'de `templates`/`designs` modülü (controller+service, admin için `JwtAuthGuard`+`Roles`).
- Şablon thumbnail/font upload: mevcut admin upload yolu (font için ttf/woff2 MIME eklenir).

---

## 12. Güvenlik
- **SVG yasağı:** `storage.service.ts:38` SVG'yi bilerek yasaklıyor (stored-XSS). Editör SVG asset'i kabul edecekse **ayrı sanitize yolu** (DOMPurify/rasterize) şart.
- **Sunucu-tarafı fiyat:** editör premium-şablon ücreti varsa `orders.service.ts:181-184` sunucuda hesaplanır; client fiyatına güvenilmez.
- **Host whitelist:** `safeUploadUrl` (siparis-kaydet:30-45) — editör çıktı URL'i markala host'unda olmalı. `designId` URL değil, id olarak taşınır.
- **Upload limitleri:** asset için ayrı/küçük limit; baskı-PDF pdf zaten izinli (50MB).
- **Secure storage:** müşteri tasarım kaynak dosyaları `/app/uploads/secure` (owner||admin guard, B2B belge deseni).
- **Lisans key:** Polotno key client'ta (`NEXT_PUBLIC_POLOTNO_KEY`) editör için gerekli ama render key backend'de; client key domain-kilitli olmalı.
- **Rate-limit:** editör yüksek asset trafiği → `/uploads` rate-limit (main.ts:74, 40/saat) ayarı gerekebilir.

---

## 13. Maliyet & Efor

| | MVP | Tam ürün |
|---|---|---|
| **BUY (Polotno)** | **~1-1.5 kişi-ay** + **$249/ay** (Grass Roots; $899 sınırsız) + altyapı ~$20-50/ay | ~3-4 kişi-ay (şablon+akış) + aynı lisans |
| BUILD (referans) | ~3-5 kişi-ay + lisans $0 ama **bakım %20-30/yıl** kalıcı | 9+ ay + 2-3 kişi kalıcı bakım |

Altyapı: render worker (mevcut VPS'e ek 1 worker), R2 (zaten var, marjinal), font hosting (ihmal edilebilir).

**Aksiyon:** Polotno **60-gün ücretsiz deneme** + **Grass Roots indirim başvurusu** (Türkiye <50 çalışan).

---

## 14. Riskler & Mitigasyon

| Risk | Etki | Mitigasyon |
|---|---|---|
| Baskı çıktısı renk/kesim hatalı | Yüksek (iade) | 60-gün denemede **fiziksel prova**; ICC tedarikçiden onayla; preflight + ilk üründe insan kontrolü |
| Türkçe glif eksik (font/PDF) | Orta | latin-ext fontlar + ş/ğ/ı render testi + embed/subset |
| Polotno lisans kapsamı (tek domain) | Orta | markalakontrol gibi ayrı ürün çıkarsa lisans tekrar konuş |
| $249→$899 hacim sıçraması | Düşük | trafik büyüyünce satışla netleşir |
| SVG XSS (asset upload) | Orta | sanitize/rasterize yolu |
| Editör mobilde zayıf | Orta | MVP'de masaüstü öncelik + mobilde "dosya yükle" fallback; Faz 2 mobil editör |
| Lock-in (Polotno JSON) | Düşük-orta | JSON+schemaVersion sakla, PDF arşivle, Fabric'e yakın migrasyon yolu |
| Kullanıcı ihlalli içerik (marka/telif) | Yüksek (hukuki) | KK m.3.A + ihbar-kaldır + üretim öncesi kontrol + hukuk onayı |

---

## 15. Hasan'ın Vereceği Kararlar (go/no-go öncesi)

1. **Bütçe onayı:** $249-899/ay Polotno + ~1-1.5 kişi-ay geliştirme.
2. **Pilot ürün:** İSG levhası mı (tek-yüz, basit) yoksa kartvizit mi (çift-yüz, en yüksek hacim, en iyi vitrin)?
3. **ICC profili:** matbaa tedarikçisinin tam profilini onayla (FOGRA39 varsayımı).
4. **Polotno trial:** 60-gün deneme başvurusu + Grass Roots indirim başvurusu.
5. **Hukuk:** KK m.3.A + KVKK eklemeleri hukuk müşavirine onaylat.
6. **BUILD vs BUY teyidi:** Polotno onayı (alternatif PitchPrint).

---

## 16. Faz Planı (özet — detay ayrı plan dosyasında)

- **Faz 0 — Doğrulama (1 hafta):** Polotno trial key; tek üründe editör + tek baskı-PDF üret; **matbaada fiziksel prova**; ICC onayı. Go/no-go.
- **Faz 1 — MVP (~1-1.5 kişi-ay):** Prisma modelleri + ürün mm eşlemesi; editör sayfası (Polotno, ssr:false); şablon kütüphanesi (~60); save/render endpoint + BullMQ worker + Ghostscript CMYK; preflight; sepet `designId`; order attachment; admin Template CRUD + Design listesi; KK/KVKK madde; kartvizit + İSG pilot canlı.
- **Faz 2 — Differentiator:** QR üretici, 3D mockup, mobil editör, m² area entegrasyonu, editör-içi canlı fiyat, kalan kategoriler.
- **Faz 3 — Nice-to-have:** AI ile başla, marka kit, gelişmiş efektler, çok-tasarım tek paket.

---

## Ek: Kaynak Ajan Raporları
Bu doküman 5 paralel araştırma ajanının (rakip/UX teardown, editör build-vs-buy, baskıya-hazır PDF/CMYK pipeline, markala kod entegrasyon haritası, şablon/asset/font/hukuk/maliyet) bulgularının sentezidir. Tüm dış iddialar kaynaklı; doğrulanamayanlar "[doğrulanmalı]" işaretli. Detaylı kaynak URL'leri ajan raporlarında.
