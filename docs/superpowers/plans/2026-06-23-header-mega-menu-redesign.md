# Header & Mega-Menü (Varyant B) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Storefront header'ın 3. katındaki dar sekme-dropdown'larını, tek tam-genişlik **kategori-index rail** mega-menüye (sol kategori listesi + sağ alt-grup sütunları + öne çıkan ürün kartları) dönüştürmek; diğer her şeyi bozmadan.

**Architecture:** Tek dosya (`site-header.tsx`) içinde, mevcut `MAIN_NAV` verisine `featured` eklenir; sekme-başına `NavItem` dropdown'u kaldırılıp tek paylaşılan `MegaPanel` (state: `activeIndex`, `open`) eklenir. Sunum katmanı değişir, iş mantığı/diğer alt-bileşenler (arama, sepet, favori, hesap, mobil çekmece) aynen korunur.

**Tech Stack:** Next.js 14 (App Router, client component), React 18, TypeScript, framer-motion, Tailwind (paper/ink/brand token'ları), Phosphor icons.

## Global Constraints

- Backend / API / Prisma / fiyat mantığı: **DOKUNULMAZ**.
- Tüm mevcut `href`'ler ve slug'lar aynı kalır.
- Korunacaklar: ⌘K/`/` arama modalı + focus-trap + return-focus, mobil accordion çekmece + route-kapanma + scroll-lock, utility bar 80px gizlenme, UserBlock/CartButton/WishlistHeaderButton, skip-to-content, `aria-*`.
- Öne çıkan kartlarda **sabit fiyat YAZILMAZ** (canlıda çoğu "Teklif Al").
- Görsel: `/api/mockup?slug=<slug>&w=320&h=240`.
- Test döngüsü = `pnpm -F @markala/web type-check` + tarayıcı doğrulaması (sunum bileşeni; birim testi yok).
- Git: `git add -A` YOK — sadece ilgili dosyalar eklenir (paralel oturum çakışması riski).
- Commit yalnız Hasan onayıyla; deploy Hasan'ın `pwsh C:\tmp\markala_deploy.ps1` yöntemiyle.

---

### Task 1: Yedek + veri modeli genişletme (`featured`)

**Files:**
- Backup: `apps/web/src/components/site-header.tsx` → `apps/web/src/components/site-header.backup-20260623.tsx.bak`
- Modify: `apps/web/src/components/site-header.tsx` (`MAIN_NAV` tipi + her kategoriye `featured`)

**Interfaces:**
- Produces: `MAIN_NAV` öğelerinde opsiyonel `featured?: FeaturedItem[]`
  ```ts
  type FeaturedItem = { slug: string; label: string; theme?: "brand" | "paper" | "ink" };
  ```

- [ ] **Step 1: Yedek al**

```bash
cp apps/web/src/components/site-header.tsx apps/web/src/components/site-header.backup-20260623.tsx.bak
```

- [ ] **Step 2: `MAIN_NAV` tipine `featured` ekle** (mevcut `Array<{ label; href; groups?; highlight? }>` tipine ekle):

```ts
const MAIN_NAV: Array<{
  label: string;
  href: string;
  groups?: Array<{ title: string; items: Array<{ label: string; href: string; badge?: string }> }>;
  featured?: Array<{ slug: string; label: string; theme?: "brand" | "paper" | "ink" }>;
  highlight?: "fire" | "new";
}> = [ ... ];
```

- [ ] **Step 3: Her kategoriye `featured` (2 ürün) ekle** — doğrulanmış slug'lar:

```ts
// Kartvizit & Kırtasiye
featured: [
  { slug: "klasik-kartvizit", label: "Klasik Kartvizit", theme: "brand" },
  { slug: "antetli-kagit", label: "Antetli Kağıt", theme: "paper" },
],
// Broşür & El İlanı
featured: [
  { slug: "selefonlu-brosur", label: "Selefonlu Broşür", theme: "paper" },
  { slug: "el-ilani", label: "El İlanı 105 gr", theme: "brand" },
],
// Bayrak & Branda
featured: [
  { slug: "yelken-bayrak-damla", label: "Yelken Bayrak", theme: "ink" },
  { slug: "vinil-branda-440gr", label: "Vinil Branda", theme: "brand" },
],
// Promosyon & Hediye
featured: [
  { slug: "klasik-beyaz-kupa", label: "Sublime Kupa", theme: "brand" },
  { slug: "magnet-promosyon", label: "Promosyon Magnet", theme: "paper" },
],
// Reklam Tabela
featured: [
  { slug: "lightbox-led-100cm", label: "Lightbox LED", theme: "ink" },
  { slug: "dekota-baski-5mm", label: "Dekota Baskı", theme: "paper" },
],
// Restoran & Otel
featured: [
  { slug: "amerikan-servis", label: "Amerikan Servis", theme: "paper" },
  { slug: "trodat-printy-4912", label: "Trodat Kaşe", theme: "brand" },
],
```

- [ ] **Step 4: type-check**

Run: `pnpm -F @markala/web type-check`
Expected: PASS (sadece veri eklendi, kullanılması Task 2'de)

---

### Task 2: `FeaturedCard` + `MegaPanel` (rail) bileşenleri

**Files:**
- Modify: `apps/web/src/components/site-header.tsx`

**Interfaces:**
- Consumes: `MAIN_NAV` (Task 1, `featured` dahil)
- Produces:
  - `FeaturedCard({ slug, label, theme }: FeaturedItem)`
  - `MegaPanel({ items, activeIndex, open, onActive, onClose }: { items: typeof MAIN_NAV; activeIndex: number; open: boolean; onActive: (i: number) => void; onClose: () => void })`

- [ ] **Step 1: `FeaturedCard` ekle** (mockup thumbnail + ad + "İncele", FİYAT YOK):

```tsx
function FeaturedCard({ slug, label, theme = "brand" }: { slug: string; label: string; theme?: "brand" | "paper" | "ink" }) {
  return (
    <Link
      href={`/urun/${slug}`}
      className="group block bg-paper-50 border border-paper-200 rounded-xl overflow-hidden transition-all hover:border-ink-300 hover:shadow-sm hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-paper-100 overflow-hidden">
        <span className="absolute top-2 left-2 z-10 text-[9px] font-bold tracking-wide bg-ink-900 text-brand-400 px-1.5 py-0.5 rounded">
          ÖNE ÇIKAN
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/mockup?slug=${slug}&theme=${theme}&w=320&h=240`}
          alt={label}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[13px] font-semibold text-ink-900 leading-tight">{label}</div>
        <div className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700 group-hover:text-brand-900">
          İncele <ArrowRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: `MegaPanel` ekle** (rail + içerik + alt şerit; `.catnav`'a tam genişlik tutturulur):

```tsx
function MegaPanel({
  items, activeIndex, open, onActive, onClose,
}: {
  items: typeof MAIN_NAV; activeIndex: number; open: boolean;
  onActive: (i: number) => void; onClose: () => void;
}) {
  const nav = items[activeIndex];
  return (
    <AnimatePresence>
      {open && nav && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className="absolute left-1/2 -translate-x-1/2 top-full w-full max-w-content px-4 z-50"
          role="region"
          aria-label="Kategori menüsü"
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        >
          <div className="bg-paper-50 border border-paper-200 border-t-[3px] border-t-brand-500 rounded-b-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-[248px_1fr]">
              {/* Rail */}
              <div className="bg-paper-100 border-r border-paper-200 p-3">
                {items.map((it, i) => (
                  <button
                    key={it.label}
                    onMouseEnter={() => onActive(i)}
                    onFocus={() => onActive(i)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                      i === activeIndex ? "bg-paper-50 text-brand-700 shadow-sm" : "text-ink-700 hover:bg-paper-50 hover:text-ink-900",
                    )}
                  >
                    <span>{it.label}</span>
                    <CaretRight size={13} weight="bold" className={i === activeIndex ? "text-brand-600" : "text-ink-300"} />
                  </button>
                ))}
              </div>
              {/* İçerik */}
              <div className="grid grid-cols-[1.55fr_1.15fr] min-h-[280px]">
                <div className="grid grid-cols-2 gap-x-7 gap-y-2 p-7">
                  {nav.groups?.map((g) => (
                    <div key={g.title}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 pb-2.5">{g.title}</div>
                      {g.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center justify-between gap-2 -mx-2.5 px-2.5 py-2 rounded-lg text-[13.5px] text-ink-700 hover:bg-paper-100 hover:text-ink-900 transition-colors"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500 text-ink-900">{item.badge}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
                {nav.featured && nav.featured.length > 0 && (
                  <div className="bg-paper-100 border-l border-paper-200 p-6">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3.5">
                      <Star size={12} weight="fill" className="text-brand-600" /> Öne Çıkanlar
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      {nav.featured.map((f) => <FeaturedCard key={f.slug} {...f} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Alt şerit */}
            <div className="flex items-center justify-between gap-4 px-7 py-3.5 border-t border-paper-200 bg-paper-50">
              <Link href={nav.href} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-700 hover:text-brand-900">
                Tüm {nav.label} ürünlerini gör <ArrowRight size={14} weight="bold" />
              </Link>
              <div className="hidden md:flex items-center gap-4 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5"><Truck size={13} weight="fill" className="text-brand-600" /> 1-2 iş günü üretim</span>
                <span className="inline-flex items-center gap-1.5"><PencilSimple size={13} weight="fill" className="text-brand-600" /> Ücretsiz tasarım desteği</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Gerekli ikon import'larını ekle** (`@phosphor-icons/react` mevcut satıra): `CaretRight`, `Star`, `PencilSimple` (Truck/ArrowRight zaten var). `max-w-content` token preset'te var (1280px).

- [ ] **Step 4: type-check**

Run: `pnpm -F @markala/web type-check`
Expected: PASS

---

### Task 3: 3. katı `MegaPanel`'e bağla + utility bar kurumsal link

**Files:**
- Modify: `apps/web/src/components/site-header.tsx` (`SiteHeader` gövdesi — bottom category nav bloğu + utility bar)

**Interfaces:**
- Consumes: `MegaPanel`, `MAIN_NAV`

- [ ] **Step 1: `SiteHeader` içine mega state ekle**:

```tsx
const [megaOpen, setMegaOpen] = useState(false);
const [megaIndex, setMegaIndex] = useState(0);
const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const openMega = (i: number) => {
  if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
  setMegaIndex(i);
  setMegaOpen(true);
};
const scheduleClose = () => {
  if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
  megaCloseTimer.current = setTimeout(() => setMegaOpen(false), 120);
};
```

- [ ] **Step 2: Route değişince mega kapansın** (mevcut Effect 3'e ekle): `setMegaOpen(false);` `useEffect(... , [pathname])` içine.

- [ ] **Step 3: Bottom category nav bloğunu değiştir** — mevcut `MAIN_NAV.map((nav) => <NavItem .../>)` yapısını sekme + tek `MegaPanel` ile değiştir. `.catnav` kapsayıcısına `relative` ve `onMouseLeave={scheduleClose}`:

```tsx
<div
  className="hidden lg:block border-t border-paper-200 relative"
  onMouseLeave={scheduleClose}
  onMouseEnter={() => { if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current); }}
>
  <Container className="flex items-center gap-1">
    {MAIN_NAV.map((nav, i) => (
      <Link
        key={nav.label}
        href={nav.href}
        onMouseEnter={() => openMega(i)}
        onFocus={() => openMega(i)}
        aria-haspopup="true"
        aria-expanded={megaOpen && megaIndex === i}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors relative",
          megaOpen && megaIndex === i ? "text-ink-900" : "text-ink-700 hover:text-ink-900",
        )}
      >
        {nav.label}
        <CaretDown size={10} weight="bold" className={cn("transition-transform", megaOpen && megaIndex === i && "rotate-180")} />
        {megaOpen && megaIndex === i && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />}
      </Link>
    ))}
    <Link href="/urunler" className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900 px-3 py-2.5">
      Tüm Ürünler <ArrowRight size={14} weight="bold" />
    </Link>
  </Container>

  <MegaPanel
    items={MAIN_NAV}
    activeIndex={megaIndex}
    open={megaOpen}
    onActive={setMegaIndex}
    onClose={() => setMegaOpen(false)}
  />
</div>
```

- [ ] **Step 4: Eski `NavItem` bileşenini sil** (artık kullanılmıyor — ölü kod bırakma).

- [ ] **Step 5: Utility bar'a "Kurumsal / Teklif Al" linki ekle** — `TOP_LINKS` map'inden önce sağ `<nav>`'a:

```tsx
<Link href="/kurumsal" className="bg-brand-500 text-ink-900 font-semibold px-2.5 py-1 rounded-md hover:bg-brand-400 transition-colors">
  Kurumsal / Teklif Al
</Link>
```

- [ ] **Step 6: type-check**

Run: `pnpm -F @markala/web type-check`
Expected: PASS (kullanılmayan import yok — `NavItem` silindiyse onun özel import'ları gözden geçirilir)

---

### Task 4: Doğrulama (tarayıcı) + temizlik

**Files:** —

- [ ] **Step 1: Dev sunucu** — `pnpm -F @markala/web dev` (port logla)
- [ ] **Step 2: Masaüstü doğrulama** — her sekmeye hover → rail swap, öne çıkan kartlar görsel yükler, "Tümünü gör" + alt linkler doğru. Mouse panele inince kapanmıyor; dışına çıkınca ~120ms'de kapanıyor.
- [ ] **Step 3: Klavye/a11y** — Tab ile sekmeler + rail; Escape kapatır; focus görünür.
- [ ] **Step 4: Regresyon** — ⌘K arama, sepet drawer, favori sayacı, giriş/çıkış dropdown, mobil çekmece (lg altı) çalışıyor.
- [ ] **Step 5: Ekran görüntüsü** al (Playwright) ve Hasan'a göster.
- [ ] **Step 6: Onay sonrası** — Hasan onaylarsa: `git add apps/web/src/components/site-header.tsx docs/superpowers/...` + commit; deploy Hasan'da. Yedek `.bak` dosyası commit'e DAHİL EDİLMEZ (gerekirse `.gitignore` veya elle hariç tut).

---

## Self-Review

**Spec coverage:**
- §5.1 veri modeli → Task 1 ✓
- §5.2 masaüstü etkileşim (rail, tek panel, hover swap, kapanma gecikmesi) → Task 2+3 ✓
- §5.3 a11y (aria-haspopup/expanded, Escape, focus) → Task 3 ✓
- §5.4 mobil korunur → değişiklik yok (Task 3 sadece `hidden lg:block` bloğunu değiştirir) ✓
- §5.5 utility bar kurumsal link → Task 3 Step 5 ✓
- §4 yedek → Task 1 Step 1 ✓
- §3 korunan işlevsellik → Task 4 Step 4 regresyon ✓
- Fiyat yok kararı → Task 2 FeaturedCard (fiyat alanı yok) ✓

**Placeholder scan:** Kod blokları gerçek; "TBD" yok. `max-w-content` token doğrulanacak (preset'te `maxWidth.content=1280px` mevcut — Task 2 Step 3 notu).

**Type consistency:** `FeaturedItem` tipi Task 1'de tanımlı, Task 2 `FeaturedCard` aynı alanları (`slug/label/theme`) kullanır. `MegaPanel` props `onActive/onClose/open/activeIndex/items` Task 3'te birebir aynı çağrılır. ✓
