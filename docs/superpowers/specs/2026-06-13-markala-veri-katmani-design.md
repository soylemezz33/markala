# Markala Admin — Veri Katmanı Canlandırma (Faz 1) — Tasarım

> Tarih: 2026-06-13
> Kapsam: Mock-first admin panelini canlı Postgres veri katmanına bağlama; mevcut gerçek sayfaları API üzerinden besleme; admin auth'u API JWT ile birleştirme.
> Hedef olmayan (Faz 2): 7 placeholder sayfanın formları, web sitesinin (apps/web) canlıya alınması.

## 1. Bağlam

Monorepo mimarisi zaten bu geçiş için tasarlanmış:

```
apps/web · apps/admin ──> @markala/api-client ──> apps/api (NestJS /api/*) ──> Prisma ──> Postgres
```

Mevcut durum:

| Katman | Durum |
|---|---|
| Postgres (docker-compose.yml) | Hazır (markala/markala@5432), **hiç migrate edilmemiş** (migrations klasörü yok) |
| NestJS API | Gerçek; modüller: auth, users, categories, products, orders, integrations |
| Prisma şeması | 24 model |
| `@markala/api-client` | Yazılmış (`auth, categories, products, orders, users` metotları), admin'e **bağlanmamış** |
| Admin sayfaları | `@markala/mock-data`'dan besleniyor |
| Admin auth | Bağımsız HMAC env-auth (tek kullanıcı, edge runtime), API JWT'sinden ayrı |
| seed.ts | Minimal: 1 admin, 1 kupon, 3 kategori (ürünleri mock-data'dan basmıyor) |

API auth olgun: `POST /api/auth/login` → `{ accessToken (15dk JWT), user{id,email,role} }` + `mk_refresh` httpOnly cookie (rotation, DB sha256-hash). Write endpoint'leri `JwtAuthGuard + RolesGuard @Roles("admin","super_admin")` ile korumalı. `UserRole` enum: `customer | admin | super_admin`.

## 2. Kararlar (kullanıcı onaylı)

1. **Strateji:** Önce tüm veri katmanı — mevcut gerçek sayfaları topluca canlıya al; placeholder formları Faz 2.
2. **Auth:** JWT'de birleştir — admin login API `/auth/login`'e gider, HMAC kimlik doğrulama kalkar.
3. **Slider + Ayarlar:** Faz 1'e dahil — küçük `HeroSlide` + `SiteSetting` modelleri eklenir.
4. **Web app:** Faz 1 dışında — mock-data'da kalır.

## 3. Faz 1 kapsamı — canlıya geçecek sayfalar

| Sayfa | Model | API modülü | Yapılacak |
|---|---|---|---|
| Ürünler (+ detay, toplu fiyat) | Product | ✓ var | api-client'a bağla |
| Kategoriler | Category | ✓ var | api-client'a bağla |
| Siparişler (+ detay) | Order | ✓ var | api-client'a bağla |
| Müşteriler | User | ✓ var | api-client'a bağla |
| Kurumsal Başvurular | CorporateApplication | ✗ yok | **küçük API modülü ekle** |
| Dashboard | (agregasyon) | ✗ yok | **stats endpoint ekle** |
| Anasayfa Slider | ✗ HeroSlide yok | ✗ yok | **model + migration + modül + form bağla** |
| Ayarlar (genel/seo/api/bildirim) | ✗ SiteSetting yok | ✗ yok | **model + migration + modül + form bağla** |

## 4. Mimari & veri akışı — BFF (server-side proxy)

Tarayıcı JWT taşımaz; admin'in Next.js sunucu tarafı token'ları taşır. XSS yüzeyini küçültür, CORS gerektirmez, edge runtime'ı korur.

```
Tarayıcı ──> Admin (Next RSC / route handler) ──Authorization: Bearer──> NestJS API ──> Prisma ──> Postgres
                     └─ httpOnly cookie: markala_admin_session = sign({ accessToken, refreshToken, user })
```

**Yaklaşım gerekçesi:** Alternatif (tarayıcının API'yi doğrudan çağırması) CORS+credentials konfigürasyonu ve JWT'nin JS'te tutulmasını gerektirir. Server-side proxy mevcut httpOnly cookie + HMAC imzalama altyapısını yeniden kullanır.

## 5. Auth tasarımı (HMAC → JWT)

| Parça | Değişiklik |
|---|---|
| Admin `POST /api/auth/login` route | HMAC `verifyCredentials` yerine: API `/auth/login`'e proxy → cevaptan `accessToken` + `Set-Cookie: mk_refresh` (`response.headers.getSetCookie()`) yakala → `user.role ∈ {admin, super_admin}` değilse 403 → `{ accessToken, refreshToken, user }` payload'ını HMAC ile imzalayıp `markala_admin_session` httpOnly cookie'ye yaz |
| `lib/admin-auth.ts` | `verifyCredentials`, `hashPassword`, `verifyPassword` **kaldırılır**. `signSession`/`verifySession` (HMAC imza) **kalır** ama artık token taşıyan payload'ı imzalar/doğrular |
| `middleware.ts` | Her admin isteğinde: `markala_admin_session` cookie varlığı + HMAC imza doğrula. **accessToken'ın süresi dolmuş/dolmak üzereyse proaktif refresh** (`/auth/refresh` + `mk_refresh`) yapıp yeni cookie'yi `NextResponse` ile yaz. Geçersiz/refresh başarısız → `/giris` |
| `lib/api.ts` (yeni) | Server-side `apiFetch(path, opts)`: cookie'den geçerli `accessToken`'ı oku → `Bearer` ile çağır. RSC render'ında cookie yazılamadığı için refresh **middleware'de** olur; `apiFetch` sadece okur. Mutasyonlar (form gönderimi) **route handler / server action** içinden geçer — orada `401` reaktif retry + cookie yazımı mümkün |
| `POST /api/auth/setup-hash` route | **Silinir** (şifre artık User tablosunda) |
| `apps/admin/.env.example` | `ADMIN_PASSWORD_HASH` kaldırılır; `ADMIN_SESSION_SECRET` (cookie imza) + `API_URL` (server-side) kalır |

**Refresh akışı notu:** `mk_refresh` cookie'si API tarafında `path=/api/auth`. Admin sunucusu bu token'ı server-to-server tutar; refresh'te API'ye ham `Cookie: mk_refresh=<token>` header'ı ile geri gönderir. Tarayıcı bu cookie'yi hiç görmez.

## 6. Prisma şema eklemeleri

```prisma
model HeroSlide {
  id        String   @id @default(cuid())
  title     String
  subtitle  String?
  imageUrl  String   @map("image_url")
  mobileImageUrl String? @map("mobile_image_url")
  ctaLabel  String?  @map("cta_label")
  ctaHref   String?  @map("cta_href")
  sortOrder Int      @default(0) @map("sort_order")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("hero_slides")
}

model SiteSetting {
  key       String   @id            // örn "general.siteName", "seo.defaultTitle"
  value     Json                    // esnek değer (string/number/bool/obj)
  group     String                  // "general" | "seo" | "api" | "notification"
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("site_settings")
}
```

`prisma migrate dev --name init` ilk migration'ı üretir (24 mevcut + 2 yeni model = tek init migration, çünkü DB henüz boş).

## 7. Backend'e eklenecek modüller

- **`CorporateApplicationsModule`** — `GET /api/corporate-applications` (liste, status filtresi), `PATCH /api/corporate-applications/:id` (approve/reject). `@Roles` korumalı.
- **`HeroSlidesModule`** — public `GET /api/hero-slides` (aktif, sıralı) + korumalı CRUD.
- **`SettingsModule`** — `GET /api/settings?group=...`, `PATCH /api/settings` (toplu upsert). Korumalı.
- **Dashboard stats** — `GET /api/admin/stats`: sipariş sayısı/durum dağılımı, ciro, müşteri sayısı, bekleyen kurumsal başvuru. Korumalı.
- **api-client**'a metotlar: `corporateApplications`, `heroSlides`, `settings`, `stats`.

## 8. Veri & seed

`seed.ts` genişletilir:
- `@markala/mock-data`'dan **ürünler + kategoriler** upsert (canlı DB şu anki mock görünümle eşleşsin).
- Birkaç örnek **sipariş + müşteri** (dashboard/listeler dolu görünsün).
- `hero-slides` mock'undan HeroSlide kayıtları; temel SiteSetting değerleri.
- Admin kullanıcı: `hasansylemezz@gmail.com`, role `super_admin`, bilinen dev şifresi (argon2). Mevcut `admin@markala.com.tr` korunur.

## 9. Adım sırası

1. `docker compose up -d postgres redis`; `apps/api/.env` (DATABASE_URL + `.env.example`'daki zorunlu JWT/encryption değişkenleri).
2. Prisma: `HeroSlide` + `SiteSetting` ekle → `prisma migrate dev --name init` → seed'i genişlet → `prisma db seed`.
3. API'yi ayağa kaldır (:4000); `GET /api/products` gerçek seed verisi dönüyor mu doğrula.
4. Yeni backend modülleri: CorporateApplications, HeroSlides, Settings, stats endpoint.
5. api-client'a yeni metotlar.
6. Admin auth: HMAC → JWT proxy (TDD: login proxy + apiFetch refresh-retry).
7. Admin sayfalarında `@markala/mock-data` → `apiFetch`/api-client, sayfa sayfa.
8. Uçtan uca smoke: login → ürün listele/düzenle → sipariş gör → kurumsal başvuru onayla → slider/ayarlar düzenle.

## 10. Test stratejisi

- **TDD:** Admin auth proxy (login → cookie yazımı, rol reddi) ve `apiFetch` refresh-retry mantığı — birim testleri önce.
- **API:** Yeni modüllerin (corporate-applications, hero-slides, settings, stats) endpoint'leri seed verisine karşı doğrulanır.
- **Admin sayfaları:** Manuel smoke (yukarıdaki uçtan uca akış).
- **Regresyon:** `pnpm -r type-check` + `pnpm -r lint` temiz.

## 11. Riskler & açık noktalar

- `apps/api/.env.example`'daki entegrasyon anahtarları (iyzico, paraşüt, DHL, sendgrid, netgsm, r2) dev'de boş/dummy kalabilir; ilgili modüller lazy/opsiyonel olmalı (API boot'u bunlara takılmamalı — doğrulanacak).
- Admin edge runtime: `getSetCookie()` ve Web Crypto imza doğrulaması edge'de çalışmalı (doğrulanacak; gerekirse login route node runtime'a alınır).
- Seed idempotent olmalı (`upsert`), tekrar çalıştırma güvenli.
