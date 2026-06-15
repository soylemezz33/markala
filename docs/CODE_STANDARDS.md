# Markala Kod Standartları

> Bu doküman mevcut repo gerçeğini kodlar — yeni kural icat etmez, **örtük olanı
> açık ve uygulanabilir** hale getirir. Code Reviewer her PR'ı buna göre değerlendirir.

## 1. Dil

- **Kod tanımlayıcıları İngilizce** (değişken, fonksiyon, tip, dosya).
- **Yorumlar Türkçe** ve yalnızca **niye**yi açıklar — **ne**, koddan okunur.
- Domain kavramları Türkçe kalabilir (route segmentleri: `siparislerim`,
  `kurumsal`, `kargo-takip` — bunlar URL'dir, çevrilmez).

## 2. TypeScript

`packages/config/tsconfig.base.json` tüm paketlerde `extends` edilir ve
`strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride` açıktır.

- **`any` yasak.** Bilinmeyen veri için `unknown` + daraltma kullan.
  Kaçınılmazsa satır içi gerekçe zorunlu: `// any: <niye>`.
- Harici/parse edilmemiş veri (`res.json()`, `JSON.parse`) `unknown` döner,
  tipe daraltılır.
- Prisma enum alanları için `as any` yerine üretilen enum tipini import et.
- Public fonksiyon/metot dönüş tipleri açık yazılır (inference'a güvenme).

## 3. İsimlendirme ve Dosya Düzeni

Her katmanın **kendi içinde tutarlı** olan konvansiyonu vardır — bunları koru:

| Katman | Konvansiyon | Örnek |
|---|---|---|
| `packages/ui` bileşen | PascalCase, dosya = bileşen | `Button.tsx`, `Price.tsx` |
| `apps/*` route bileşeni | kebab-case | `hero-carousel.tsx`, `orders-client.tsx` |
| `apps/api` (NestJS) | `<ad>.<rol>.ts` | `auth.service.ts`, `orders.controller.ts` |
| Yardımcı/util | kebab-case | `lib/format.ts` |
| Tip dosyaları | `@markala/types` altında | — |

- Paylaşılan domain tipi → `@markala/types`. Endpoint'e özel DTO →
  `@markala/api-client`. Aynı kavramı iki yerde tanımlama (bkz. §6 tech-debt).

## 4. Import Düzeni

Tek tutarlı sıra (üstten alta), gruplar arası boş satır:

1. Node/harici paketler (`react`, `next`, `@nestjs/*`)
2. Workspace paketleri (`@markala/ui`, `@markala/types`, `@markala/api-client`)
3. Yerel modüller (`./`, `../`)
4. Type-only import'lar `import type { … }` ile ayrılır

Derin göreli zincir (`../../../`) yerine paket export'u veya alias tercih et.

## 5. Paylaşılan Mantık — Tekrar Etme

- **Para formatı:** Tek kaynak. UI'da `<Price>` bileşeni; metin gereken yerde
  paylaşılan `formatTRY` yardımcısı kullanılır. `Number(x).toLocaleString(
  "tr-TR", …)` satır içi tekrarı **yasak** (admin'de ondalık davranışı tutarsız
  hale geldi — bkz. §6).
- **Tarih formatı:** `lib/format.ts` → `formatDate` / `formatDateShort`.
- `cn()` yalnızca `@markala/ui`'den import edilir, yeniden tanımlanmaz.

## 6. Açık Tech-Debt (öncelik sırası)

Code Reviewer denetiminde (2026-06-16) tespit edilen, kapatılması gereken
kalemler. Detay ve gerekçe ilgili issue yorumundadır (AJA-199).

| # | Kalem | Şiddet | Sahip |
|---|---|---|---|
| 1 | ESLint/Prettier baseline yok — `next lint` script'i çalışmaz, CI "Lint" adımı yok, `eslint-disable` yorumları boşa | BLOCKER | Tooling/Backend |
| 2 | `api-client`'ta çift tip+metot: `AdminStats`/`AdminStatsDto`, iki `/admin/stats` çağrısı; `CorporateApplication`/`…Dto` | MAJOR | Backend |
| 3 | Para formatı 3 ayrı `Intl.NumberFormat` + admin'de ~8 satır içi `toLocaleString` (ondalık tutarsız) | MAJOR | Frontend |
| 4 | `orders.create/createGuest(data: any)` ve `admin/page.tsx` `recentOrders as any[]` | MAJOR | Backend/Frontend |
| 5 | CI'da `api` type-check `continue-on-error` (tam strict değil); admin/api unit testleri CI'da koşmuyor | MINOR | Backend |
| 6 | Commit hook yok (husky/lint-staged/commitlint) — Conventional Commits elle denetleniyor | MINOR | Tooling |

## 7. Önerilen ESLint / Prettier Baseline

Tooling PR'ı için referans. Kuralın hedefi: var olan `eslint-disable`
yorumlarını gerçek bir denetleyiciye bağlamak.

```jsonc
// .eslintrc.json (kök) — veya flat config eşdeğeri
{
  "root": true,
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

```jsonc
// .prettierrc — repo zaten 2-space, çift tırnak, noktalı virgül kullanıyor
{ "semi": true, "singleQuote": false, "tabWidth": 2, "trailingComma": "all", "printWidth": 100 }
```

Bağlandığında: `package.json` script'lerine `lint` / `format:check`, CI'a `Lint`
adımı eklenir; `next.config.mjs`'teki `eslint.ignoreDuringBuilds` gözden geçirilir.

## 8. İstisnalar

- **Hot-fix (production aşağıda):** tam inceleme atlanır, smoke test geçer,
  merge sonrası detaylı review yapılır.
- **Hasan'ın doğrudan onayladığı PR:** merge engellenmez; yorum gelecek için ders bırakılır.
- Memory/CLAUDE.md kural ihlali **her zaman BLOCKER**.
