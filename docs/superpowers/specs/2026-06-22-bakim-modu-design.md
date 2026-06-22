# Bakım Modu (Maintenance Mode) — Tasarım

**Tarih:** 2026-06-22
**Branch:** worktree-bakim-modu (origin/main tabanlı)
**Talep:** Site bakım modunda görünsün; Hasan admin hesabıyla giriş yapınca site (yalnız onun için) aktif olsun. Diğer herkes bakım ekranı görür.

## Karar (Hasan onayı)

- **Bypass yöntemi:** Mağazaya (`markala.com.tr/giris`) admin girişi → admin canlıyı gezer, herkes bakım görür.
- **Bakım ekranı:** Markala wordmark + mesaj + iletişim (WhatsApp/telefon/e-posta), **HTTP 503** (SEO doğru, `Retry-After` başlıklı).
- **Kapsam:** Yalnız `apps/web` (storefront). Admin paneli ve API etkilenmez. Geri sayım/tarih yok, cross-subdomain çerez yok (YAGNI).

## Kritik kısıt

Storefront auth **tamamen client-side**: access token bellekte (Zustand), refresh çerezi (`mk_refresh`) yalnız `api.` alan adında + path `/api/auth`. Yani `markala.com.tr` **sunucu tarafı** gelen kişinin admin olup olmadığını bilmiyor. Bu yüzden admin login'inde storefront, **kendi alan adına imzalı bir bypass çerezi** yazmalı; middleware bunu okuyup bypass eder.

## Mimari

```
[Admin /ayarlar/bakim toggle] --upsert--> SiteSetting(group="maintenance")
                                                  |
                          GET /api/settings/public (public, ~10sn cache)
                                                  |
[apps/web middleware] --fetch flag--> enabled? --evet--> mk_preview çerezi geçerli? 
        |                                                   |hayır            |evet
        |                                              503 bakım HTML       geçiş (next)
   /giris ve /api/* her zaman geçer (login + bypass çerezi yazımı için)

[Admin storefront login] -> auth-store.login() -> POST /api/maintenance/bypass (Bearer)
        -> route handler /auth/me ile rol doğrular -> admin ise imzalı mk_preview yazar
```

## Bileşenler

### API (`apps/api`)
- **`settings.service.ts`** — `getPublicConfig()`: `maintenance` + `general` gruplarını okur, `{ maintenance:{enabled,title,message}, contact:{phone,whatsapp,email} }` döner. ~10sn in-memory cache; `upsertMany` cache'i invalidate eder.
- **`settings.controller.ts`** — `@Get("public")` **guard'sız** public endpoint → `getPublicConfig()`. Mevcut `@Get()` / `@Patch()` admin-only kalır.
- Migration **yok** — `SiteSetting` key-value zaten var; yeni anahtarlar: `maintenance.enabled` (bool), `maintenance.title`, `maintenance.message`.

### Web (`apps/web`)
- **`src/lib/maintenance.ts`** — `mk_preview` çerezi için Web Crypto HMAC imzala/doğrula (`signBypass(expMs)`, `verifyBypass(token)`). Format: `exp.hmacHex`. Edge + Node uyumlu (`crypto.subtle`). Secret: `MAINTENANCE_BYPASS_SECRET` (dev fallback + uyarı).
- **`src/app/api/maintenance/bypass/route.ts`** — route handler:
  - `POST`: Bearer token ile `${API}/auth/me` çağırır; rol admin/super_admin ise imzalı `mk_preview` httpOnly çerezi yazar (7 gün), değilse 403 + çerez temizler.
  - `DELETE`: çerezi siler.
- **`src/middleware.ts`** (yeni) — choke point. Matcher `_next`, statik (dotlu) yolları, `api/`'yi hariç tutar. İçeride `/giris*` her zaman geçer. `getPublicConfig` fetch + kısa TTL; `enabled && geçerli mk_preview yok` → markalı **503 HTML**. Fetch hatası → **fail-open** (siteyi karartma).
- **`src/lib/auth-store.ts`** — `login()` ve `bootstrap()` sonrası rol admin ise `POST /api/maintenance/bypass`; `logout()`'ta `DELETE`. (Same-origin, rol admin değilse no-op.)

### Admin (`apps/admin`)
- **`src/app/ayarlar/bakim/page.tsx`** + **`bakim-client.tsx`** — Aç/Kapat anahtarı + başlık + mesaj; `saveSettings("maintenance", {...}, "/ayarlar/bakim")`. Durum banner'ı + "siteyi görmek için `/giris`'ten admin girişi yap" notu.
- **`src/components/admin-shell.tsx`** — nav'a `{ href: "/ayarlar/bakim", label: "Bakım Modu", icon: Wrench }`.

## Güvenlik / kenar durumlar
- Bypass çerezi **server-side rol doğrulamasıyla** yazılır (kullanıcı sahteleyemez); değer HMAC imzalı + exp'li.
- `/giris` ve `/api/*` bakımda da açık → tavuk-yumurta yok (admin giriş yapıp çerezi alabilir).
- Settings-fetch hatası → fail-open (transient API hatası tüm siteyi karartmasın).
- `MAINTENANCE_BYPASS_SECRET` prod'da ayarlanmalı (deploy notuna eklenecek); ayarlanmazsa dev fallback + console.warn (sahtecilik yalnız "bakımı atla" sağlar, düşük şiddet).

## Doğrulama
- `pnpm typecheck` (api + web + admin) yeşil.
- Mantıksal akış: enabled=false → her şey geçer; enabled=true + çerezsiz → 503; admin login → çerez → geçiş; logout → çerez silinir → 503.
- Gerçek tarayıcı E2E'yi Hasan deploy sonrası yapacak (prod env + gerçek admin hesabı).
