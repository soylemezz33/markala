# Header Menü Yöneticisi (Faz 1) — Tasarım + Plan

**Tarih:** 2026-06-24 · **Onay:** Hasan ("önerin hangisiyse onu yap")
**Hedef:** Storefront header menüsü (kategori/grup/link/rozet + mega-menü öne çıkan ürünler) admin'den
ekle/çıkar/düzenle yapılabilsin; storefront koddan değil DB'den okusun. Migration YOK.

## Mimari

- **Depolama:** Tek `SiteSetting` kaydı — `key="header_nav"`, `group="header"`, `value=NavCategory[]` (JSON).
  Mevcut `MAIN_NAV` kodda **varsayılan/seed + yedek** olarak kalır → kayıt yok/boş/bozuksa storefront
  eskisi gibi çalışır (sıfır kırılma).
- **Tip (canonical, web+api ortak şekil):**
  ```ts
  type NavFeatured = { slug: string; label: string; theme?: "brand"|"paper"|"ink" };
  type NavItem = { label: string; href: string; badge?: string };
  type NavGroup = { title: string; items: NavItem[] };
  type NavCategory = { label: string; href: string; groups?: NavGroup[]; featured?: NavFeatured[]; highlight?: "fire"|"new" };
  ```
- **Akış:** Admin `/menu` editör → `PATCH /settings {group:"header", values:{header_nav: NavCategory[]}}`
  → storefront `GET /settings/header-nav` (public, ISR 60sn) → mega-menü + mobil çekmece bu veriden render.

## Görevler

### Task 1 — API (public okuma ucu)
- `apps/api/src/settings/settings.service.ts`: `getHeaderNav(): Promise<unknown|null>` — `siteSetting.findUnique({where:{key:"header_nav"}})` → `value ?? null`.
- `apps/api/src/settings/settings.controller.ts`: `@Get("header-nav")` public (guard YOK) → `service.getHeaderNav()`.
- `packages/api-client/src/index.ts`: `settings.headerNav = () => this.request<unknown>("GET","/settings/header-nav")`.
- Admin yazma/okuma: MEVCUT `settings.get("header")` + `settings.upsert("header", {...})` kullanılır (yeni uç yok).
- Doğrula: `pnpm -F @markala/api build` (veya type-check) yeşil.

### Task 2 — Storefront (yedekli tüketim)
- `apps/web/src/components/site-header.tsx`:
  - `MAIN_NAV` → `DEFAULT_NAV` olarak yeniden adlandır + `export type NavCategory` (yukarıdaki şekil).
  - `SiteHeader({ nav }: { nav?: NavCategory[] })` — `const NAV = nav && nav.length ? nav : DEFAULT_NAV;`
    Tüm `MAIN_NAV` kullanımları `NAV`'a çevrilir (masaüstü tab map, MegaPanel items, mobil MobileNavGroup map).
  - `MegaPanel`/`MobileNavGroup` zaten `items`/`nav` prop alıyor; tip `NavCategory` yapılır.
- `apps/web/src/lib/catalog.ts` (veya yeni `nav.ts`): `getHeaderNav(): Promise<NavCategory[]|null>` —
  `fetchJson("/settings/header-nav")`; dizi değilse/null/hata → `null` (yedek devreye girer). `revalidate:60`.
- `apps/web/src/app/layout.tsx`: `const nav = await getHeaderNav();` → `<SiteHeader nav={nav ?? undefined} />`.
- Doğrula: type-check + dev'de menü hâlâ render (kayıt yokken DEFAULT_NAV).

### Task 3 — Admin /menu editörü
- `apps/admin/src/app/menu/page.tsx` (server): `api.settings.get("header")` → `initial["header_nav"]`; boşsa
  storefront DEFAULT_NAV'ın bir kopyasını seed olarak göster (admin paketinde sabit `DEFAULT_NAV` kopyası).
- `apps/admin/src/app/menu/menu-client.tsx` (client): yapılandırılmış editör —
  - Kategori listesi: ekle/sil/yukarı-aşağı sırala; her kategori: label, href, highlight.
  - Grup listesi (kategori içi): ekle/sil; başlık + item'lar (label, href, badge) ekle/sil.
  - Öne çıkanlar: ürün arama (`api.products.adminList({q})` server action ile) → slug+label+theme seç (max 3), sil.
  - "Kaydet" → `saveHeaderNav(navArray)` server action → `settings.upsert("header",{header_nav})` + `revalidatePath`
    + web revalidate (mevcut `revalidate-web.ts` deseni varsa) → storefront tazelenir.
  - "Varsayılana dön" → DEFAULT_NAV kopyasını forma yükler (kaydedene kadar canlıya gitmez).
- `apps/admin/src/app/menu/actions.ts`: `saveHeaderNav`, `searchProducts(q)` server action'ları.
- `apps/admin/src/components/admin-shell.tsx`: "İçerik & Medya" grubuna `{ href:"/menu", label:"Header Menü", icon: ListBullets }`.
- Doğrula: admin type-check + dev'de yükle/düzenle/kaydet; storefront'ta yansımayı gör.

### Task 4 — Deploy + canlı doğrulama
- type-check (api+web+admin) → commit → push main → GH Actions Build&Push → `markala_deploy.ps1` → markala.com.tr + admin.markala.com.tr doğrula.

## Kapsam dışı (YAGNI)
- İlişkisel NavigationItem tablosu (JSON yeterli).
- Çok-dilli menü, menü versiyonlama, sürükle-bırak (ok-tuşu sıralama yeterli).
- Footer menüsü (sadece header).

## Riskler
| Risk | Önlem |
|---|---|
| Bozuk JSON storefront'u kırar | Şekil doğrulama + dizi değilse DEFAULT_NAV yedek |
| Header her sayfada → regresyon | nav opsiyonel prop, default korunur; type-check + dev doğrulama |
| Admin'de yanlış slug | Öne çıkan seçici sadece var olan ürünlerden seçtirir |
