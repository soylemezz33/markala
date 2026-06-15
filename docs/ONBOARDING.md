# Geliştirici Onboarding Rehberi

Markala'ya hoş geldin. Bu rehber, yeni bir geliştiricinin **1. gün** ihtiyaç duyduğu her şeyi kapsar.

---

## Ön Koşullar

| Araç | Min Versiyon | Kontrol |
|------|-------------|---------|
| Node.js | 20.x | `node --version` |
| pnpm | 9.x+ | `pnpm --version` |
| Docker | 24.x | `docker --version` |
| Git | herhangi | `git --version` |

---

## 1. Repo'yu Klonla

```bash
git clone https://github.com/soylemezz33/markala.git
cd markala
```

---

## 2. Bağımlılıkları Yükle

```bash
pnpm install
```

> pnpm workspace olduğu için bu komut tüm `apps/` ve `packages/` bağımlılıklarını birden yükler.

---

## 3. Sadece Frontend (FAZ 1-2, mock veri ile)

Veritabanı veya API gerekmez; mock veri (`packages/mock-data`) ile çalışır.

```bash
pnpm dev
# → http://localhost:3000
```

---

## 4. Tam Stack (Backend dahil)

### 4a. Yardımcı servisleri başlat

```bash
docker compose up -d
# PostgreSQL :5432 | Redis :6379 | MailHog :8025 (web UI)
```

### 4b. API'yi ayarla

```bash
cd apps/api
cp .env.example .env          # .env dosyasını oluştur
pnpm prisma:generate          # Prisma client'ı oluştur
pnpm prisma:migrate           # Schema'yı uygula
pnpm prisma:seed              # Test verisi yükle
# admin@markala.com.tr / ChangeMe123!
```

### 4c. Üç servisi ayrı terminallerde başlat

```bash
# Terminal 1 — API
pnpm --filter @markala/api dev        # http://localhost:4000/api/docs

# Terminal 2 — Web Storefront
pnpm --filter @markala/web dev        # http://localhost:3000

# Terminal 3 — Admin Paneli
pnpm --filter @markala/admin dev      # http://localhost:3001
```

---

## 5. Proje Yapısı

```
markala/
├── apps/
│   ├── web/              # Next.js 14 · Müşteri storefront (port 3000)
│   ├── admin/            # Next.js 14 · Yönetim paneli (port 3001)
│   └── api/              # NestJS 10 · REST API (port 4000)
├── packages/
│   ├── ui/               # Paylaşımlı UI bileşenleri (Button, Card, Price…)
│   ├── config/           # Tailwind preset + tsconfig base
│   ├── types/            # Domain tipleri (Product, Order, User…)
│   ├── mock-data/        # FAZ 1-2 mock JSON
│   └── api-client/       # Type-safe REST client
├── docs/                 # Teknik dökümanlar
├── docker-compose.yml    # Yerel geliştirme servisleri
└── pnpm-workspace.yaml
```

---

## 6. Ortam Değişkenleri

Her `apps/*` dizininde bir `.env.example` var. İlk kurulumda kopyala ve doldur:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

Kritik değişkenler (`apps/api/.env`):

| Değişken | Açıklama |
|---------|---------|
| `DATABASE_URL` | PostgreSQL bağlantı string'i |
| `JWT_SECRET` | JWT imzalama anahtarı (min 32 char) |
| `IYZICO_API_KEY` | iyzico API anahtarı (sandbox için) |
| `SENDGRID_API_KEY` | E-posta gönderimi |
| `R2_BUCKET` | Cloudflare R2 depolama |

---

## 7. Sık Kullanılan Komutlar

```bash
# Tüm paketleri build et
pnpm build

# Lint (tüm workspace)
pnpm lint

# Type check (tüm workspace)
pnpm type-check

# Belirli paketi hedefle
pnpm --filter @markala/web dev
pnpm --filter @markala/api test

# Prisma migration oluştur
cd apps/api && pnpm prisma migrate dev --name add_coupon_table

# Prisma Studio (görsel DB yönetim)
cd apps/api && pnpm prisma studio
```

---

## 8. Faz Durumu

| Faz | Kapsam | Durum |
|-----|--------|-------|
| **1** | Tasarım sistemi, anasayfa, kategori/ürün, konfigüratör, 3D hero | ✅ Tamam |
| **2** | Sepet, mock ödeme, mock auth, hesap dashboard | ✅ Tamam |
| **3** | NestJS + Prisma, gerçek auth, admin CRUD, iyzico sandbox | 🟡 Skeleton hazır |
| **4** | 20 ürün konfigürasyonu, kupon, yorumlar, blog, entegrasyonlar | 🟡 Stub hazır |

---

## 9. Önemli Dosyalar

| Dosya | Açıklama |
|-------|---------|
| `apps/web/src/lib/catalog.ts` | Ürün kataloğu (mock → FAZ 3'te API) |
| `apps/web/src/lib/configurator.ts` | Konfigüratör fiyat motoru |
| `apps/web/src/lib/services.ts` | Hizmet sayfaları içeriği |
| `apps/web/src/lib/mockup-svg.ts` | Kategori SVG mockup üretici |
| `packages/api-client/` | `createMarkalaClient()` — type-safe REST wrapper |

---

## 10. Geliştirme Kuralları

- `main` branch'e doğrudan push **yasak** — PR aç, CI geçmeli
- Conventional Commits zorunlu: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- PR < 300 LOC hedef; gerektiğinde birden fazla küçük PR
- Bileşen eklerken `packages/ui/` içine bakarak mevcut bileşeni yeniden kullan
- Mock veriyi (`packages/mock-data`) değiştirirken FAZ 3 geçiş planını göz önünde bulundur

---

## 11. Yardım & İletişim

- **Dökümanlar:** `docs/` klasörü — `DEPLOY.md`, `RUNBOOK.md`, `ARCHITECTURE.md`
- **API Docs:** Yerel ortamda `http://localhost:4000/api/docs` (Swagger UI)
- **Sorunlar:** GitHub Issues → `soylemezz33/markala`
