# Görsel Yükleme (Direct Upload) — Tasarım

**Tarih:** 2026-06-14
**Branch:** `worktree-veri-katmani-impl` (Faz 1+2 üstüne ek)
**Durum:** Onaylandı (dev-first, R2 sonra)

## Problem

Admin panelinde görseller "URL yapıştır" yöntemiyle yönetiliyor:

- **Ürün görselleri:** "+ Yeni görsel yükle (R2)" butonu ölü (onClick yok), `images[]` kaydedilmiyor bile.
- **Banner / Slider / Blog:** `Görsel URL *` text input — admin elle bir CDN linki yapıştırmak zorunda.
- **Backend:** `R2Service` sadece `stub.example.com` döndüren iskelet; gerçek upload altyapısı yok, `@aws-sdk` kurulu değil, hiçbir yerde `type="file"` yok.

Matbaa/e-ticaret admin kullanıcısı CDN linki yapıştıramaz. Doğrudan dosya seçip yüklemeli.

## Hedef

Admin her yerde dosyayı **doğrudan seçip/sürükleyip yükleyebilsin**; sistem dosyayı depolayıp public URL'i ilgili kayda yazsın. Aynı bileşen ürün + banner + slider + blog'da kullanılsın.

## Mimari

### 1. Depolama soyutlaması (sürücü deseni)

`StorageService` arkasında iki sürücü; seçim env ile:

| Sürücü | Ne zaman | Davranış | Dönen URL |
|--------|----------|----------|-----------|
| `local` | `R2_*` env yoksa (dev / şu an) | Dosyayı `apps/api/uploads/`'a yazar | `${API_PUBLIC_URL}/uploads/<uuid>.<ext>` (mutlak) |
| `r2` | `R2_ACCESS_KEY_ID` vb. tanımlıysa (prod) | `@aws-sdk/client-s3` ile R2 bucket'a `PutObject` | `${R2_PUBLIC_BASE}/<uuid>.<ext>` |

Endpoint ve sözleşme aynı; sadece sürücü değişir. Local sürücü **mutlak URL** döndürür (admin/web farklı origin'den yükleyeceği için) — mevcut `img.startsWith("http")` render mantığıyla uyumlu.

Local dosyalar API'de `app.use("/uploads", express.static(dir))` ile sunulur (global `api` prefix'i dışında). `apps/api/uploads/` gitignore'a eklenir.

### 2. Upload endpoint (proxy yaklaşımı)

`POST /api/uploads` — `UploadsController`:

- Guard: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles("admin","super_admin")` (mevcut desen).
- `FileInterceptor("file")` (multer, `@nestjs/platform-express` ile gelir).
- Doğrulama: izinli tip `image/jpeg|png|webp`, max **5MB**. İhlal → `400` + Türkçe mesaj.
- `StorageService.put(buffer, mimetype)` → `{ url }` döner.

Presigned (tarayıcı→R2 direkt) yerine **proxy** seçildi: CORS gerektirmez, credential sunucuda kalır, local sürücüyle dev'de bugün çalışır.

### 3. Admin BFF route handler

Admin token httpOnly cookie'de (tarayıcıya kapalı). Bu yüzden tarayıcı NestJS'e direkt gidemez. Mevcut BFF desenine uygun:

`POST /api/uploads` (admin Next.js route handler) → oturum doğrula → multipart'ı NestJS `/api/uploads`'a bearer token ile proxy'le → `{ url }` döndür.

### 4. Tekrar kullanılabilir bileşen

`<ImageUploader>` (admin):
- Dosya seç + sürükle-bırak, önizleme, yükleme ilerlemesi, hata toast'ı.
- Tek görsel modu (banner/slider/blog) ve çoklu görsel modu (ürün: ekle/sil, ilki kapak).
- Yükleme başarısızsa görsel listeye **eklenmez** + kullanıcı bilgilendirilir (sessiz başarısızlık yok).
- POST → admin `/api/uploads` → dönen URL'i `value`'ya yazar.

### 5. Entegrasyon

- **Ürün:** `ProductDetailClient` images state + ekle/sil; `updateProduct` action `images` gönderir. Backend `images[]` DTO+service'te zaten destekli — sadece UI bağlanır.
- **Banner/Slider/Blog:** `Görsel URL` text input → `<ImageUploader>` (URL elle girme kalkar).

## Veri akışı

```
Tarayıcı (ImageUploader, File)
  → POST /api/uploads  (admin Next.js route handler, same-origin)
      → oturum doğrula (cookie)
      → fetch NestJS POST /api/uploads  (Authorization: Bearer <accessToken>, multipart)
          → JwtAuthGuard + RolesGuard
          → FileInterceptor + tip/boyut doğrulama
          → StorageService.put() → local|r2
          → { url }
      ← { url }
  ← { url }   →  ImageUploader value'ya yazar  →  Kaydet'te kayda gider
```

## Hata yönetimi

| Durum | Davranış |
|-------|----------|
| İzinsiz tip / >5MB | NestJS `400` + Türkçe mesaj → admin toast |
| Yetkisiz | `401/403` (guard) |
| Storage yazma hatası | `500` → toast; görsel eklenmez |
| Upload sırasında ağ hatası | toast; önizleme geri alınır |

## Test (TDD)

- `storage.service.spec.ts`: local sürücü buffer'ı yazar + doğru uzantılı mutlak URL döner; izinsiz mimetype reddi; r2 sürücü env varken seçilir (sürücü seçim mantığı).
- Upload doğrulama: tip/boyut reddi (service/controller seviyesi).
- Mevcut API testleri (39) + admin (4) kırılmamalı; workspace type-check temiz.

## Kapsam dışı (YAGNI)

- Görsel kırpma / yeniden boyutlandırma (sharp).
- Sürükleyerek sıralama.
- Çoklu-dosya toplu upload.
- Müşteri tarafı özel-tasarım dosya upload'ı (orders `uploadedFileUrl`) — ayrı iş.
- `R2Service` stub'ının kaldırılması/birleştirilmesi — sonra.

## Prod'a geçiş

R2 bucket + credential'lar hazır olunca env'e eklenir (mevcut `CLOUDFLARE_R2_*` konvansiyonu):
`CLOUDFLARE_R2_ACCOUNT_ID` (endpoint bundan türetilir), `CLOUDFLARE_R2_ACCESS_KEY`,
`CLOUDFLARE_R2_SECRET`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_PUBLIC_BASE`.
`CLOUDFLARE_R2_ACCESS_KEY` tanımlanınca sürücü otomatik `r2`'ye geçer; kod değişmez.
Dev'de local sürücü mutlak URL'i `API_PUBLIC_URL` ?? `http://localhost:<PORT>`'tan üretir.
