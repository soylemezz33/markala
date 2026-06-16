# Markala — Yeni Geliştirici Onboarding Rehberi

> Markala projesine ilk gün başlayan biri için A'dan Z'ye rehber.
> **Son güncelleme:** 2026-06-15

---

## 1. Proje Nedir?

**Markala** — `markala.com.tr` — 324 Ajans çatısı altında matbaa ve reklam ürünleri e-ticaret platformu.

```
Monorepo (pnpm + turborepo mimarisi)
├── apps/web        Müşteri storefront — Next.js 14, port 3000
├── apps/admin      Yönetim paneli — Next.js 14, port 3001
├── apps/api        REST API — NestJS + Prisma + PostgreSQL, port 4000
├── packages/ui     Paylaşımlı UI bileşenleri
├── packages/types  Domain tipleri (Product, Order, User…)
├── packages/mock-data  FAZ 1-2 mock JSON — FAZ 3'te API'ye geçer
└── packages/api-client  Type-safe REST wrapper
```

## 2. Gereksinimler

| Araç | Versiyon |
|---|---|
| Node.js | 20 LTS |
| pnpm | 9.x (`npm install -g pnpm@9`) |
| Docker Desktop | Son kararlı |
| Git | 2.40+ |

## 3. İlk Kurulum (10-15 dk)

### 3.1 Repo klonla

```bash
git clone https://github.com/soylemezz33/markala.git
cd markala
pnpm install
```

### 3.2 Mock veri ile sadece frontend (hızlı yol)

```bash
pnpm dev   # web → http://localhost:3000
```

Postgres gerekmez. `packages/mock-data` üzerinden çalışır.

### 3.3 Tam stack (backend dahil)

```bash
# 1. Yardımcı servisleri başlat (Postgres + Redis + MailHog)
docker compose up -d

# 2. API kurulum
cd apps/api
cp .env.example .env        # örnek env'yi kopyala

cd ../..
pnpm --filter @markala/api prisma:generate
pnpm --filter @markala/api prisma:migrate
pnpm --filter @markala/api prisma:seed   # admin@markala.com.tr / ChangeMe123!

# 3. Tüm servisleri paralel çalıştır
pnpm --filter @markala/api dev    # http://localhost:4000/api/docs
pnpm --filter @markala/web dev    # http://localhost:3000
pnpm --filter @markala/admin dev  # http://localhost:3001
```

## 4. Önemli URL'ler (yerel)

| URL | Ne |
|---|---|
| http://localhost:3000 | Storefront |
| http://localhost:3001 | Admin paneli |
| http://localhost:4000/api/docs | NestJS Swagger UI |
| http://localhost:8025 | MailHog (e-posta önizleme) |

Admin giriş (seed sonrası): `admin@markala.com.tr` / `ChangeMe123!`

Storefront mock auth: herhangi e-posta, şifre kontrol edilmiyor.

## 5. Faz Durumu

| Faz | Kapsam | Durum |
|---|---|---|
| 1 | Tasarım sistemi, anasayfa, ürün/kategori, konfigüratör | ✅ Tamam |
| 2 | Sepet (Zustand), çıkış (mock 3D Secure), auth (mock), hesap dashboard | ✅ Tamam |
| 3 | NestJS + Prisma + Postgres bağlantısı, gerçek auth, admin CRUD, iyzico sandbox | 🟡 İskelet hazır |
| 4 | 20 ürün konfigürasyonu, kupon motoru, yorumlar, blog (MDX), tüm entegrasyonlar | 🟡 Stub'lar hazır |

## 6. Mimari Kararlar (Neden?)

### Mock-data paketi

FAZ 1-2'de gerçek veritabanı olmadan storefront'u teslim etmek için. `packages/mock-data/src/products*.ts` dosyaları gerçek ürün katalogunu içeriyor. FAZ 3'te `packages/api-client` üzerinden NestJS API'ye geçilecek; mock-data silinmeyecek, test/dev fallback olarak kalacak.

### API Client paketi

`packages/api-client` hem `apps/web` hem `apps/admin` tarafından import ediliyor. `createMarkalaClient({ baseUrl, getToken })` factory pattern kullanıyor — token yenileme ve type safety burada sağlanıyor.

### Konfigüratör fiyat motoru

`apps/web/src/lib/configurator.ts` — radio modifier (kâğıt tipi) + checkbox modifier (selefon, UV lak) + quantity × unit price. Branda gibi m² ürünleri için `basePrice: 0 + unitPrice` kombinasyonu.

### Mockup SVG endpoint

`apps/web/src/app/api/mockup/route.ts` — ürün görseli yokken kategoriye özel SVG illustrasyon döndürür. Gerçek fotoğraf gelince `prodImg()` helper'ı override edilir.

## 7. Geliştirme Akışı

### Branch kuralı

```
feat/<kısa-açıklama>
fix/<kısa-açıklama>
chore/<kısa-açıklama>
```

### Commit kuralı (Conventional Commits zorunlu)

```
feat(web): kategori sayfasına breadcrumb eklendi
fix(api): sipariş toplamı KDV hesabı düzeltildi
chore(deps): pnpm lock file güncellendi
```

### PR kuralları

- `main` branch'e **doğrudan push yasak** — her değişiklik PR açar
- GitHub Actions CI geçmeli (type-check + build)
- PR açıklarken `docs/` veya `apps/api/src/` değiştirdiysen migration rollback adımı ekle

### Type-check

```bash
pnpm typecheck         # tüm workspace
pnpm --filter @markala/web typecheck
```

### Lint

```bash
pnpm lint
```

## 8. Yasal Sayfalar ve KVKK

`packages/mock-data/src/legal.ts` — 7 yasal sayfa (KVKK, MSS, çerez, gizlilik, kullanım koşulları, ön bilgilendirme, iade). Yayına almadan önce bu dosyadaki `[BAŞVURU BEKLEMEDE...]` placeholder'ları gerçek verilerle doldur.

Detay: `docs/LEGAL_CHECKLIST.md`.

## 9. Env Değişkenleri

`apps/api/.env.example` başlangıç noktası. Production için `docs/DEPLOY.md` bölüm 4'e bak.

Kritik değişkenler:

| Değişken | Ne İçin |
|---|---|
| `DATABASE_URL` | Postgres bağlantı string |
| `JWT_SECRET` | Access token imzalamak için |
| `IYZICO_API_KEY` | Ödeme gateway |
| `SENDGRID_API_KEY` | E-posta |
| `R2_*` | Cloudflare R2 nesne deposu |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics |

## 10. Önemli Dosya Haritası

```
markala/
├── docs/
│   ├── DEPLOY.md              Production deploy A-Z
│   ├── RUNBOOK.md             Operasyon + incident
│   ├── DISASTER_RECOVERY.md   DR + backup drill
│   ├── MONITORING.md          UptimeRobot + Prometheus + Grafana
│   ├── LEGAL_CHECKLIST.md     ETBİS, VERBİS, KEP checklist
│   ├── SEO_STRATEJI.md        12 aylık SEO yol haritası
│   ├── MARKA-TON-REHBERI.md   Yazım ve ton rehberi
│   └── ONBOARDING.md          Bu dosya
│
├── apps/web/src/
│   ├── app/layout.tsx         Root metadata + JSON-LD + provider'lar
│   ├── app/urun/[slug]/       Ürün sayfası (matrix UI + FAQ schema)
│   ├── app/yasal/[slug]/      Yasal sayfalar (legal.ts'den render)
│   └── lib/configurator.ts    Fiyat motoru
│
├── apps/api/src/
│   ├── auth/                  JWT + roles guard
│   ├── products/              CRUD controller + service
│   └── integrations/          iyzico, Paraşüt, SendGrid, NetGSM, DHL, R2
│
└── packages/mock-data/src/
    ├── products*.ts           Ürün katalogu (FAZ 1-2 mock)
    ├── legal.ts               7 yasal sayfa metni
    └── notes.ts               PRODUCTION_TOLERANCE_NOTE sabiti
```

## 11. Yardım

- Runbook (production sorun): `docs/RUNBOOK.md`
- Deploy: `docs/DEPLOY.md`
- Marka tonu sorusu: `docs/MARKA-TON-REHBERI.md`
- Yasal: `docs/LEGAL_CHECKLIST.md`
- Beklenmeyen sorun: issue açıp Hasan Söylemez'i mention'la
