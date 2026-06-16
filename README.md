# Markala

**markala.com.tr** — Matbaa ve reklam ürünleri e-ticaret platformu. 324 Ajans alt markası.

## Yapı (monorepo)

```
markala/
├── apps/
│   ├── web/              Next.js 14 storefront (port 3000)
│   ├── admin/            Yönetim paneli (port 3001)
│   └── api/              NestJS REST API (port 4000)
├── packages/
│   ├── ui/               Paylaşımlı UI bileşenleri (Button, Card, Price...)
│   ├── config/           Tailwind preset + tsconfig base
│   ├── types/            Domain tipleri (Product, Order, User...)
│   ├── mock-data/        FAZ 1-2 mock JSON (FAZ 3'te API'ye geçer)
│   └── api-client/       Type-safe REST client (web ve admin kullanır)
├── docker-compose.yml    Postgres + Redis + MailHog (yerel geliştirme)
└── pnpm-workspace.yaml
```

## Hızlı Başlangıç

### Sadece frontend (FAZ 1-2 mock data ile)

```bash
pnpm install
pnpm dev               # apps/web → http://localhost:3000
```

### Tam stack (backend bağlı)

```bash
# 1. Yardımcı servisleri başlat
docker compose up -d

# 2. API kurulumu
cd apps/api
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed       # admin@markala.com.tr / ChangeMe123!

# 3. Üç servisi paralel çalıştır
pnpm --filter @markala/api dev      # http://localhost:4000/api/docs
pnpm --filter @markala/web dev      # http://localhost:3000
pnpm --filter @markala/admin dev    # http://localhost:3001
```

## Faz Planı

| Faz | Kapsam | Durum |
|---|---|---|
| **1** | Tasarım sistemi · anasayfa · kategori/ürün · konfigüratör · 3D R3F hero | ✅ Tamam |
| **2** | Sepet (Zustand) · Çıkış (mock 3D Secure) · Auth (mock) · Hesap dashboard · Statik sayfalar | ✅ Tamam |
| **3** | NestJS + Prisma + Postgres bağlantısı · Gerçek auth (argon2 + JWT) · Admin CRUD · iyzico sandbox | 🟡 Skeleton hazır — Postgres bağlanınca canlı |
| **4** | Tüm 20 ürün konfigürasyonu · Kupon motoru · Yorumlar · Blog (MDX) · Paraşüt · HepsiJet · NetGSM · SendGrid · R2 · Production deploy | 🟡 Stub'lar hazır — gerçek SDK'lar bekleniyor |

## Marka Kimliği

- **Domain:** markala.com.tr
- **Renk:** Amber sarı `#F5B800` + Cyan neon `#00D9FF` + sıcak charcoal + krem
- **Tipografi:** Fraunces (serif başlık) + Plus Jakarta Sans (gövde)
- **İkon:** Phosphor Icons
- **3D:** React Three Fiber — uçuşan A4 kâğıtları + sarı mürekkep damlası

## Tasarım Yönü

Marketing surface'lar (anasayfa, kategoriler, tasarım desteği, hakkımızda) **dark/cinematic** — 3D hero, glassmorphism, neon vurgu. Transactional surface'lar (ürün detay, sepet, ödeme, hesap) **light/clean** — conversion için.

## Bilinen Mock'lar (FAZ 3-4'te değişecek)

- **Auth:** mock — herhangi e-posta ile giriş, şifre kontrol edilmiyor
- **Ödeme:** iyzico SDK bağlanmadı, mock 3D Secure sonucu döner
- **Mailler:** SendGrid bağlanmadı, console log'a düşer
- **Tasarım yüklemeleri:** R2 bağlanmadı, dosya adı session'da kalır
- **Kupon:** sadece `HOSGELDIN` (%10), kullanım sayacı yok
- **Görseller:** dinamik SVG mockup (`/api/mockup/[category]`) — gerçek atölye fotoğrafları geldikçe değişecek

## Hosting Kararı

Önerilen: **Hetzner CX22 (~€5/ay) + Cloudflare** (DNS + R2). Alternatif: 324 Ajans ESXi sunucusunda yeni VM. Deploy adımları için bkz. [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Deploy

Production deploy hazır — Hetzner VPS + Cloudflare + GitHub Actions stack.

**Detaylı rehberler:**

- 📘 [`docs/DEPLOY.md`](docs/DEPLOY.md) — A'dan Z'ye ilk kurulum
- 🔧 [`docs/RUNBOOK.md`](docs/RUNBOOK.md) — Operasyon ve incident yönetimi

**Hızlı deploy (mevcut VPS'de):**
```bash
ssh markala@<VPS_IP>
cd /opt/markala
./scripts/deploy.sh
```

**CI/CD:** `main` branch'e her push → GitHub Actions otomatik build + deploy.

**Production stack:**

| Bileşen | Versiyon | Port |
| --- | --- | --- |
| Web (Next.js standalone) | 14 | 3000 |
| Admin (Next.js standalone) | 14 | 3001 |
| API (NestJS + Prisma) | 10 | 4000 |
| PostgreSQL | 16 | 5432 (internal) |
| Nginx (reverse proxy + SSL) | 1.27 | 80/443 |

**Önkoşullar:**

- ✅ Hetzner CX22+ VPS (4 vCPU, 8GB RAM, ~€5/ay)
- ✅ Cloudflare hesap (Free plan yeterli)
- ✅ Domain `markala.com.tr` (registered)
- ⚠️ iyzico, Paraşüt, SendGrid, NetGSM, DHL, R2 hesapları (üretim kullanımı için)

## Geliştirici Notları

- **Yeni başlıyorsanız:** [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — kurulum adımları, proje yapısı, sık kullanılan komutlar.
- **Mimari:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — sistem mimarisi, monorepo bağımlılık grafiği, sipariş/auth akışı (Mermaid diyagramlı).
- **Görsel mockup'lar:** `apps/web/src/lib/mockup-svg.ts` — her kategori için SVG generator. Gerçek fotoğraflar geldikçe `mock-data` URL'leri yerel path'lere değiştirilebilir.
- **Konfigüratör fiyat motoru:** `apps/web/src/lib/configurator.ts` — radio modifier + checkbox modifier + quantity × unit price. Branda gibi m² ürünleri için `basePrice: 0` + `unitPrice` kombinasyonu çalışır.
- **API client:** `packages/api-client` — apps/web ve apps/admin arasında type-safe REST wrapper. Kullanım: `createMarkalaClient({ baseUrl, getToken })`.

## Lisans

Özel — 324 Ajans / Markala. Tüm hakları saklıdır.
