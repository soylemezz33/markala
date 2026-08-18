# Markala (markala.com.tr)
> Son güncelleme: 2026-08-18 · TEK KAYNAK: Cursor doğrudan, Claude Code `CLAUDE.md → @AGENTS.md` importuyla okur.

## Ne / Neden
Matbaa ve reklam ürünleri e-ticaret platformu; 324 Ajans alt markası. Başarı ölçütü: organik trafik ("online matbaa" hedefi) + reklam trafiğinden satış dönüşümü. Misafir (guest) checkout kritik satış yoludur — bozan değişiklik yapılmaz.

## Stack ve Yapı (pnpm monorepo)
```
apps/
├── web/      @markala/web    Next.js 14 storefront   (port 3000)
├── admin/    @markala/admin  Yönetim paneli          (port 3001)
└── api/      @markala/api    NestJS REST API         (port 4000, Prisma → PostgreSQL)
packages/
├── ui/           Paylaşımlı UI bileşenleri (Button, Card, Price...)
├── config/       Tailwind preset + tsconfig base
├── types/        Domain tipleri (Product, Order, User...)
├── mock-data/    Eski FAZ 1-2 mock JSON (canlı akışta KULLANILMAZ)
└── api-client/   Type-safe REST client (web ve admin bunun üzerinden konuşur)
```
Altyapı: docker-compose (Postgres + Redis + MailHog yerelde), nginx + Docker prod, GitHub Actions (`ci.yml`, `deploy.yml`, `cert-monitor.yml`).

## Komutlar
```bash
pnpm install
pnpm dev                                   # web (3000)
pnpm --filter @markala/admin dev           # admin (3001)
pnpm --filter @markala/api dev             # api (4000)
pnpm -r build && pnpm -r lint && pnpm -r type-check
pnpm --filter @markala/api prisma:generate | prisma:migrate | prisma:studio | prisma:seed
pnpm --filter @markala/web test:e2e        # e2e; test:visual görsel regresyon
```
Prisma şeması: `apps/api/prisma/schema.prisma` (build/ altındaki kopyaya DOKUNMA — derleme çıktısı).

## Kurallar
- Değişiklikler tip güvenli zincirden geçer: `packages/types` → `api-client` → app. API sözleşmesi değişiyorsa üçü birlikte güncellenir.
- UI bileşeni önce `packages/ui`'da aranır; app içine kopya bileşen yazılmaz.
- `mock-data` paketine yeni bağımlılık eklenmez (kaldırılma aşamasında).
- Migration'lar geri alınabilir olmalı; `prisma migrate reset` önerilmez.
- SEO kritik: sayfa meta/OG etiketleri ve `/rehber/*`, blog rotaları değişirken mevcut URL yapısı korunur.
- Misafir checkout + WhatsApp destek butonu + loyalty puan akışı canlı satış yollarıdır; ilgili dosyalarda değişiklik önce Plan Mode ile planlanır.
- `.env*` dosyalarına dokunulmaz; yeni değişken = `.env.production.example`a ekle + not düş.

## Deploy
- Push → GitHub Actions → kendi sunucuya Docker deploy (`docker-compose.production.yml`). Elle sunucuya dosya atılmaz.
- Push ve deploy her zaman kullanıcı onayıyla.

## Test ve Kabul
- Bitti sayılır: `pnpm -r lint` + `type-check` + ilgili testler yeşil, `/code-review` temiz, checkout akışı elle doğrulandı (misafir + üye).
