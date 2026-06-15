# Markala'ya Katkı Rehberi

Bu doküman Markala monorepo'sunda çalışma kurallarını tanımlar. Detaylı kod
standartları için [`docs/CODE_STANDARDS.md`](./docs/CODE_STANDARDS.md)'a bakın.

## Önkoşullar

| Araç | Sürüm | Not |
|---|---|---|
| Node | `20.18.0` (`.nvmrc`) | `nvm use` ile sabitle |
| pnpm | `>=9` (`package.json` → `packageManager: pnpm@10.33.3`) | Corepack: `corepack enable` |

```bash
pnpm install            # tüm workspace bağımlılıkları
pnpm dev                # @markala/web (port 3000)
pnpm --filter @markala/admin dev   # admin (port 3001)
pnpm --filter @markala/api dev     # NestJS API
```

## Monorepo Yapısı

```
apps/
  web/      Next.js 14 — müşteri vitrin (e-ticaret)
  admin/    Next.js 14 — yönetim paneli (noindex)
  api/      NestJS + Prisma + Postgres — backend
packages/
  ui/         paylaşılan React bileşenleri (Button, Price, cn, …)
  types/      paylaşılan domain tipleri
  api-client/ tip güvenli REST wrapper (web + admin tüketir)
  mock-data/  Faz 3 öncesi statik veri
  config/     tsconfig.base.json + tailwind preset
```

**Katman kuralı:** `apps/*` → `packages/*` bağımlılığı tek yönlüdür. Bir paket
asla bir uygulamayı import etmez. Paketler arası: `ui` ve `api-client` →
`types`'a bağlanır, ters yön yoktur.

## Branch ve Commit

- `main`'e **doğrudan push yasak**. Her değişiklik bir PR'dır, CI yeşil olmalı.
- Branch ismi: `<tip>/<alan>-<kısa-açıklama>` — örn `fix/web-cart-coupon`,
  `refactor/api-orders-status-enum`.
- **Conventional Commits zorunlu.** Tipler: `feat`, `fix`, `docs`, `chore`,
  `test`, `refactor`, `ci`, `perf`, `build`.

```
<tip>(<scope>): <60 karakter altı özet>

<gövde: niye, ne, nasıl test edildi>
```

`scope` genelde paket/uygulama adıdır: `web`, `admin`, `api`, `ui`, `api-client`.

## PR Süreci

1. Küçük, odaklı PR aç — hedef **< ~300 LOC**. Büyükse böl.
2. `.github/PULL_REQUEST_TEMPLATE.md` otomatik gelir — tüm bölümleri doldur.
3. Issue'yu bağla: başlıkta/gövdede `AJA-123` (link) veya `Closes AJA-123`
   (merge'de kapatır).
4. CI (type-check + build + web unit test) geçmeden review istenmez.
5. En az bir Code Reviewer onayı gerekir. Hot-fix istisnası için
   `docs/CODE_STANDARDS.md` → "İstisnalar".

## Yerel Doğrulama (push öncesi)

```bash
pnpm type-check                       # tüm workspace tsc --noEmit
pnpm --filter @markala/web test       # web unit (vitest)
pnpm --filter @markala/web build      # prod build sağlaması
```

> ESLint/Prettier baseline'ı henüz repo'ya bağlanmadı (bkz. CODE_STANDARDS →
> "Açık Tech-Debt"). Bağlandığında bu adıma `pnpm lint` ve `pnpm format:check`
> eklenecek; o ana kadar elle stil tutarlılığına dikkat edin.

## Yapma

- `main`'e force push.
- `any` / `@ts-ignore` ekleme (zorunluysa satır içi `// niye` gerekçesiyle).
- Secret / API key / `.env` değeri commit'leme — `.env.production.example`'ı örnek al.
- Tek PR'da hem refactor hem feature karıştırma — ayır.
