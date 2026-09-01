# Markala.com.tr — Technical SEO Audit

Audit date: 2026-08-17
Method: live HTTP requests (curl), raw HTML source inspection (no JS execution — validates SSR), sitemap.xml download and parsing, robots.txt fetch, JSON-LD extraction. 33 URLs sampled across all page types (all returned HTTP 200). No rendering/CWV lab test (Lighthouse/PSI) was run in this pass — CWV assessment below is source-inspection only, not field/lab data.

---

## 1. Crawlability

### 1.1 robots.txt — Google-Extended / AI crawler blocking (Medium, informational — no fix required, but messaging risk)
Evidence — `https://markala.com.tr/robots.txt`:
```
User-agent: Google-Extended
Disallow: /
User-agent: GPTBot
Disallow: /
User-agent: ClaudeBot
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: meta-externalagent
Disallow: /
...
Content-Signal: search=yes,ai-train=no,use=reference
```
**Assessment:** This blocks AI *training* crawlers only. `Google-Extended` does **not** control Googlebot's standard Search crawling/indexing and does **not** gate inclusion in Google AI Overviews — AI Overviews are grounded in Google's regular Search index (built by Googlebot, which is fully allowed here), not in the Gemini-training corpus that Google-Extended gates. So this configuration does **not** exclude Markala from AI Overviews citations. The risk is narrower: it opts the site out of being used to *train* future Gemini/Vertex models, and — because ChatGPT/Claude/Perplexity-style answer engines increasingly rely on live retrieval rather than training data — blocking `GPTBot`/`ClaudeBot`/`CCBot` outright (full `Disallow: /`, not just training-specific tokens) means the site cannot be cited or retrieved by those assistants at all, even for real-time answer grounding. Given the site is pursuing early organic visibility, this is a strategic choice worth revisiting, not a technical error.
**Recommendation:** No fix needed for the AI Overviews concern (it's a non-issue). If the business wants visibility in ChatGPT Search / Perplexity / Copilot answers (a plausible acquisition channel for a low-authority new site), consider allowing `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot`'s retrieval-only behavior is not separable from ClaudeBot in robots.txt today — track vendor-specific retrieval tokens as they're published and update robots.txt accordingly. Keep `Google-Extended: Disallow` if training-opt-out is intentional; it has no Search-visibility cost.

### 1.2 robots.txt — sitemap declaration validated (Pass)
`sitemap_discovery.py` confirms `Sitemap: https://markala.com.tr/sitemap.xml` in robots.txt resolves to a valid, live `urlset` (HTTP 200, well-formed XML, 953 `<url>` entries). No stale declaration issue.

### 1.3 robots.txt — no accidental blocking of indexable content (Pass)
Disallow rules target only non-indexable/private paths: `/api/`, `/hesabim*`, `/sepet`, `/odeme*`, `/giris`, `/kayit`, `/favorilerim`, `/sifre-sifirla`, `/eposta-dogrula`, `/kvkk-basvuru`, `/widget/`, `/cdn-cgi/`, and tracking/query params (`?utm_*`, `?ref=*`, `?fbclid=*`, `?gclid=*`, `?sort=*`, `?filter=*`). None of the 33 sampled content URLs (products, categories, city pages, guides, blog, static) fall under a Disallow rule. No conflict found between the global rule set and product/category/matbaa paths.

### 1.4 robots.txt — inconsistency: `Allow: /api/mockup` carved out of `Disallow: /api/` (Low)
```
Allow: /
Allow: /api/mockup
Disallow: /api/
```
The more-specific `Allow: /api/mockup` rule wins over `Disallow: /api/` under Google's longest-match precedence, so `/api/mockup` is technically crawlable. An API endpoint being openly crawlable serves no SEO purpose and risks bots hitting a non-HTML/functional endpoint.
**Fix:** Confirm this carve-out is intentional (e.g., for a documented public mockup-generation tool with its own landing page). If it's leftover from testing, remove the `Allow: /api/mockup` line so the endpoint falls back under `Disallow: /api/`.

### 1.5 DotBot fully blocked, but no equivalent for other low-value crawlers (Low, no action needed)
Fine as-is; noted only for completeness — not a finding requiring a fix.

---

## 2. Indexability

### 2.1 Sample results — 33 URLs tested (Pass, with one caveat below)
All 33 sampled URLs across every page type in the sitemap returned **HTTP 200** with **self-referencing `<link rel="canonical">`** and **`<meta name="robots" content="index, follow">`**:

| Type | Sample | Status | Canonical | Robots meta |
|---|---|---|---|---|
| Homepage | `/` | 200 | (not separately checked, no redirect) | — |
| Product | `/urun/klasik-kartvizit` | 200 | self | index, follow |
| Product | `/urun/yuzmek-yasaktir` | 200 | self | index, follow |
| Product | `/urun/afis-105gr` | 200 | self | index, follow |
| Product | `/urun/selefonlu-brosur` | 200 | self | index, follow |
| Product | `/urun/pro-brosur` | 200 | self | index, follow |
| Product | `/urun/brosur` | 200 | self | index, follow |
| Category | `/kategori/kartvizit` | 200 | self | index, follow |
| Category | `/kategori/vinil-branda-afis` | 200 | self | index, follow |
| Category | `/kategori/rollup` | 200 | self | index, follow |
| City (matbaa) | `/matbaa/mersin` | 200 | self | index, follow |
| City (matbaa) | `/matbaa/adana` | 200 | self | index, follow |
| City (matbaa) | `/matbaa/antalya`, `/gaziantep`, `/hatay`, `/osmaniye`, `/sanliurfa` | 200 each | self | index, follow |
| District (matbaa) | `/matbaa/mersin/tarsus` | 200 | self | index, follow |
| District (matbaa) | `/matbaa/mersin/akdeniz` | 200 | self | index, follow |
| District (matbaa) | `/matbaa/mersin/yenisehir` | 200 | self | index, follow |
| Guide | `/rehber/kartvizit-fiyatlari-2026` | 200 | not fetched (body) | — |
| Guide | `/rehber/isg-zorunlu-uyari-levhalari` | 200 | not fetched (body) | — |
| Blog | `/blog/kartvizit-tasariminda-10-altin-kural` | 200 | not fetched (body) | — |
| Blog listing | `/blog/kategori/rehber` | 200 | not fetched (body) | — |
| Help | `/yardim/sss`, `/yardim/iade` | 200 each | not fetched (body) | — |
| Static | `/kurumsal`, `/hakkimizda`, `/iletisim`, `/fiyat-listesi`, `/sozluk`, `/kategoriler`, `/hizmetler/tasarim-destegi` | 200 each | not fetched (body) | — |

**Limitation (explicitly noting incomplete evidence):** For guide/blog/help/static pages, only HTTP status was verified with a lightweight status check (no body download in this pass) — canonical and meta-robots values were **not** individually confirmed on those 13 URLs. Given 100% consistency (self-canonical, index/follow) across all 20 URLs where the body *was* checked (products, categories, city, district), the risk of a stray noindex/canonical problem on the untested set is low, but this should be verified before final sign-off, e.g.: `curl -s https://markala.com.tr/rehber/kartvizit-fiyatlari-2026 | grep -oE '<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>'`.

### 2.2 www / protocol canonicalization (Medium)
- `http://markala.com.tr/` → 301 → `https://markala.com.tr/` (single hop, correct).
- `https://www.markala.com.tr/` → 301 → `https://markala.com.tr/` (single hop, correct).
- `http://www.markala.com.tr/` → **two redirect hops** (`http://www` → `https://www` → `https://markala.com.tr/`) to reach the canonical host, confirmed via `curl -L -w "%{num_redirects}"` = 2.
**Fix:** Add a single Cloudflare/edge rule (or origin rule) that redirects `http://www.*` directly to `https://markala.com.tr/*` in one hop, rather than chaining through the HTTPS-www intermediate. Low traffic impact today, but wasted redirect hops slightly dilute link equity and add latency for any inbound `http://www` links (e.g., older backlinks, business directories).

### 2.3 Trailing-slash normalization (Pass)
`/urunler/` → 308 → `/urunler` (trailing slash stripped consistently). Sitemap URLs all use the no-trailing-slash form. Consistent.

### 2.4 Pagination handling on category listings — unverified, flagged for follow-up (Medium, evidence incomplete)
`/kategori/kartvizit?page=2` and `/kategori/kartvizit?sort=fiyat-artan` both returned **HTTP 200**. `?sort=*` and `?filter=*` are blocked in robots.txt, but **`?page=*` is not blocked**, meaning paginated category pages (page 2, 3…) are crawlable by default.
**Limitation:** I confirmed the 200 status via headers only; I did not capture the response body for `?page=2` to check whether it self-canonicalizes, canonicalizes back to page 1 (which would be wrong if page 2 has unique products), or carries `rel=next/prev`/noindex. This must be verified directly:
```
curl -s "https://markala.com.tr/kategori/kartvizit?page=2" | grep -oE '<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>'
```
**Fix (contingent on the check above):** If `?page=N` canonicalizes to itself with `index,follow`, that's correct and no action needed. If it canonicalizes to `?page=1`/the bare category URL while still serving different products, that would suppress indexing of deeper catalog items — fix by making paginated pages self-canonical, or by disallowing `?page=` only if all products are otherwise reachable via the sitemap (they are — all 860 `/urun/` pages are in the sitemap directly, so category pagination is a discovery aid, not the sole path to indexation, which lowers the severity of this item).

---

## 3. Duplicate / Near-Duplicate Content Risk

### 3.1 City pages (`/matbaa/{city}`) — genuinely differentiated, not mail-merge (Pass, with a caveat on depth — see 3.2)
Compared intro copy, `<title>`, and meta description across `/matbaa/mersin`, `/matbaa/adana`, `/matbaa/gaziantep`, `/matbaa/osmaniye` (raw HTML, tag-stripped):
- Titles carry different delivery-time claims per city: *"Mersin Matbaa & Baskı — 1-2 Gün Teslim"* vs *"Adana Matbaa & Baskı — 1-1 Gün Teslim"* (i.e., "1 gün").
- Meta descriptions reference distinct local landmarks/sectors: Mersin → "Mersin Limanı, Yenişehir ticaret bölgesi, Tarsus OSB, Toroslar sanayi siteleri"; Adana → "Çukurova'nın ticaret ve sanayi merkezi. Tekstil, gıda, otomotiv ve tarım sektörleri"; Gaziantep → "Güneydoğu'nun ticaret ve sanayi başkenti. Tekstil, makine, gıda (baklava, fıstık) ve mobilya sektörleri."
- Each page has a self-referencing canonical and `index,follow` (confirmed, section 2.1).

This is **not** a templated find-and-replace doorway pattern — the differentiating paragraph reflects real local/sector detail. This meaningfully reduces (but does not eliminate) the duplicate-content risk that would otherwise be expected from 16 near-identical geo pages.

### 3.2 City pages — thin content depth, especially districts (Medium-High given low domain authority)
- Total page word count (nav+footer+body, tag-stripped): `/matbaa/mersin` ≈ 942 words; `/matbaa/mersin/tarsus` ≈ 447 words; `/matbaa/mersin/akdeniz` ≈ 440 words.
- Of that, the **unique** local-context copy per district page is only ~1 short paragraph (~40-60 words), e.g. Tarsus: *"Tarsus, Mersin'in en yoğun ticaret hacmine sahip ilçelerinden. Otomotiv yan sanayi, tekstil, gıda işletmeleri için kartvizit-broşür-magnet-antetli kağıt taleplerine..."* — the rest of each district page (product list, CTA block "1 iş günü kargo · Hızlı Üretim · Kalite garantili · Sipariş Ver · WhatsApp 0324 433 33 51", nav, footer) is identical boilerplate shared across all district pages.
- **Structural inconsistency**: only Mersin (the company's home base) has district-level pages (Tarsus, Yenişehir, Akdeniz, Toroslar, Mezitli, Erdemli, Silifke, Anamur = 8 pages); none of the other 6 cities (Adana, Antalya, Gaziantep, Hatay, Osmaniye, Şanlıurfa) have district subpages, despite the template clearly supporting it. This asymmetry (1 city expanded to district level, 6 not) is a signature of programmatic scaling ahead of the content/authority needed to support it — a pattern search engines increasingly scrutinize as a doorway-page risk, particularly relevant here given the site's very low authority (Semrush AS 2, 8 referring domains, ~53 ranking keywords).

**Fix:**
1. For the 8 Mersin district pages: either (a) enrich unique copy meaningfully (real customer references, district-specific case studies/photos, actual delivery-time data by district, not just one paragraph), or (b) consolidate the thinnest of these (e.g., merge low-search-volume districts like Anamur/Silifke back into the parent `/matbaa/mersin` page with an on-page section + internal anchor, keeping only districts with demonstrable local search demand as standalone URLs) and 301 the rest.
2. Do not scale the district pattern to the other 6 cities until Mersin's district pages show independent organic performance (impressions/clicks in GSC) — validate the format works before multiplying URL count on a 2-authority-score site.
3. Add genuinely unique trust signals per city/district page (e.g., a real local courier partner name, an actual delivery-time metric sourced from order data, a short local testimonial) rather than only sector-name substitution, to further reduce duplicate-content classification risk as this pattern scales.

### 3.3 Product pages (860 `/urun/*`) — spot-checked, not systematically diffed (Medium — evidence is partial, explicitly flagged)
Spot-checked 6 product pages (`klasik-kartvizit`, `yuzmek-yasaktir`, `afis-105gr`, `selefonlu-brosur`, `pro-brosur`, `brosur`): each had a unique `<title>`, unique meta description, self-referencing canonical, and a distinct `Product` JSON-LD block (unique `sku`/`mpn`/`name`/`description`/price range) — see section 7. No duplicate-title or duplicate-canonical issue found in this sample.
**Limitation:** 6 of 860 product pages is a ~0.7% sample — not enough to rule out duplicate/near-duplicate content across the full catalog, especially among visually-similar SKUs (e.g., the ISG/warning-sign catalog, which sitemap URLs suggest includes many near-identical safety-sign variants such as `yuksek-yanici-madde-sigara-icilmez-acik-atesle-yaklasma` vs `yuksek-yanici-madde-sigara-icilmez-acik-alev-yasaktir-levhasi` — these two slugs are extremely close in wording and plausibly render near-duplicate pages differing only in sign text/image).
**Fix / follow-up:** Run a full-catalog title + meta-description + first-150-words uniqueness check (e.g., shingling/fingerprint comparison) across all 860 `/urun/` pages, with particular attention to the İSG (iş güvenliği / safety-sign) subcategory, which is the most likely source of near-duplicate product variants (same layout, near-identical short warning text). Where two products differ only by a few words of sign text, consider: (a) keeping both indexable only if each has genuinely differentiated content (use case, applicable regulation reference, image), or (b) consolidating very close variants into a single product page with a variant selector, reducing thin-duplicate count and consolidating link equity.

### 3.4 Pagination duplicate-content risk — see 2.4 (Medium, evidence incomplete, follow-up specified above)

---

## 4. Security Headers

Evidence — `curl -D - https://markala.com.tr/`:
```
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-frame-options: SAMEORIGIN            (duplicated — sent twice)
x-content-type-options: nosniff         (duplicated — sent twice)
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin   (duplicated — sent twice)
permissions-policy: camera=(), microphone=(), geolocation=(self), payment=(self), interest-cohort=()
content-security-policy-report-only: default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; ... report-uri /api/csp-report
```

### 4.1 HSTS — Pass
`max-age=63072000; includeSubDomains; preload` — strong, 2-year max-age, preload-eligible. No action needed (confirm the domain is actually submitted to the HSTS preload list at hstspreload.org if not already).

### 4.2 CSP is report-only, not enforced (High — security hardening, indirect SEO/trust relevance)
`content-security-policy-report-only` is present but there is **no enforcing `Content-Security-Policy` header**. This means the fairly permissive policy (allowing `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, plus a long allowlist of third-party origins for ads/analytics/payment) is not actually blocking anything — it only reports violations to `/api/csp-report`. For a live e-commerce site handling checkout (iyzipay origins are in `frame-src`), running indefinitely in report-only mode leaves it exposed to injected-script/XSS risk that CSP is specifically meant to mitigate, which matters for account/session integrity and, by extension, Google Safe Browsing standing (a flagged/compromised site can be delisted from search results).
**Fix:** Review `/api/csp-report` violation data collected so far, tighten the policy to remove `'unsafe-inline'`/`'unsafe-eval'` from `script-src` where feasible (nonce- or hash-based script-src is the standard fix for Next.js inline scripts), then flip to an enforcing `Content-Security-Policy` header (keep `-Report-Only` running in parallel temporarily on a staging config if you want continued monitoring during rollout).

### 4.3 Duplicate response headers (Low)
`x-frame-options`, `x-content-type-options`, and `referrer-policy` are each sent twice in the same response (visible in raw `curl -D -` output). This indicates the header is being set both at the Next.js/middleware layer and again at the Cloudflare edge (or a duplicate rule in one of the two). Not a functional problem (browsers take the first/most restrictive value) but indicates redundant config that should be cleaned up to avoid future drift (e.g., someone updates one location and not the other, causing inconsistent policy).
**Fix:** Set these headers in exactly one place — either Next.js `headers()` config or Cloudflare Transform Rules, not both — and remove the duplicate.

### 4.4 HTTPS enforcement — Pass
All HTTP variants (bare and www) 301-redirect to HTTPS (see section 2.2). No mixed-content check was run against rendered assets in this pass (source-level `<img>`/`<script>` src inspection showed all `https://api.markala.com.tr` and `https://markala.com.tr` origins — no `http://` hardcoded asset URLs found in sampled pages).

---

## 5. URL Structure & Internal Linking Depth

### 5.1 URL structure — Pass
Clean, descriptive, flat, hyphenated Turkish slugs with no ID parameters: `/urun/klasik-kartvizit`, `/kategori/kartvizit`, `/matbaa/mersin/tarsus`, `/rehber/kartvizit-fiyatlari-2026`. Consistent no-trailing-slash convention enforced via redirect (section 2.3).

### 5.2 Crawl depth — inferred from breadcrumb structured data, not from a full link-graph crawl (evidence partial, stated explicitly)
The `BreadcrumbList` JSON-LD on the sampled product page gives the canonical navigation path: `Anasayfa (Home) → Ürünler → Kartvizit (category) → Klasik Kartvizit (product)` — i.e., **3 clicks from homepage to product** via the stated hierarchy, assuming category pages are linked from `/urunler` and `/urunler` is linked from the homepage nav (not independently verified by crawling homepage nav HTML in this pass).
**Limitation:** This is inferred from one product's breadcrumb data, not a full site crawl of internal links. With 860 product pages under a relatively small set of 33 category pages, average products-per-category (~26) is plausible for a 3-click depth if each category page lists all its products on one view without deep pagination, but this was not verified across all 33 categories. **Recommend running a full internal-link crawl (Screaming Frog or equivalent) to confirm actual click-depth distribution and identify orphan pages** — this is the single most important follow-up for indexation health, given 860 of 953 sitemap URLs (90%) are products that must be discoverable via internal links, not just the sitemap, for optimal crawl efficiency and PageRank flow.

### 5.3 Orphan page risk — not directly testable without a link crawl (flagged, not resolved)
All 953 URLs are present in the sitemap, so nothing is orphaned from *sitemap* discovery. However, sitemap presence does not guarantee internal *link* discovery/PageRank flow — a page can be in the sitemap yet unlinked from any other page on the site ("sitemap-only orphan"), which Google still crawls but weights lower. This requires the internal-link crawl recommended in 5.2 to resolve definitively.

---

## 6. Mobile-Friendliness

### 6.1 Viewport meta tag — Pass
`<meta name="viewport" content="width=device-width, initial-scale=1">` present and correctly configured on every sampled page (products, categories, city pages). No fixed-width viewport, no user-scalable=no lock found.

### 6.2 Responsive CSS classes — Pass (source-inference only)
Tailwind-style responsive utility classes observed throughout sampled HTML (e.g., `text-3xl md:text-5xl lg:text-6xl`, `grid` breakpoint classes), indicating a mobile-first responsive build rather than a fixed desktop layout with a separate mobile stylesheet.

### 6.3 Touch-target sizing / tap-target spacing — not assessed (explicit limitation)
Static HTML/CSS class inspection cannot reliably confirm rendered touch-target sizes (Core Web Vitals/mobile usability tooling requires actual rendering). **Recommend running Google's Mobile-Friendly Test / PageSpeed Insights mobile report** for a definitive check — out of scope for this source-only pass.

---

## 7. Core Web Vitals — Source-Inspection Flags Only (no lab/field test run)

No Lighthouse/PSI/CrUX test was executed in this pass; the following are **risk flags from source inspection only**, not measured LCP/INP/CLS values.

### 7.1 LCP risk — product images served from a separate origin without visible preconnect/priority hint (Medium, unverified)
Product JSON-LD image URLs point to `https://api.markala.com.tr/uploads/products/*.jpg` — a different subdomain from the page origin (`markala.com.tr`). Cross-origin image loading without a `<link rel="preconnect" href="https://api.markala.com.tr">` (not found in the sampled `<head>`) adds DNS+TLS handshake latency before the LCP image (likely the hero product image) can start loading.
**Fix:** Add `<link rel="preconnect" href="https://api.markala.com.tr" crossorigin>` (and consider `dns-prefetch` as a fallback) in the document `<head>`, and ensure the LCP image uses `fetchpriority="high"` and is not lazy-loaded.

### 7.2 CLS risk — cannot confirm image dimension attributes from source alone (Low-Medium, unverified)
Product image URLs use query-string cache-busting (`?v=3`), consistent with a Next.js `<Image>` component, which normally reserves layout space automatically — this is a positive sign, but was not directly confirmed by inspecting rendered `width`/`height`/`aspect-ratio` on the actual `<img>` tags in this pass.
**Fix (verification, not necessarily a real issue):** Confirm all product/category listing images use Next.js `<Image>` (not raw `<img>`) with explicit width/height or `fill` + sized container, particularly on category grid pages where many images load above the fold simultaneously.

### 7.3 INP risk — CSP allows `'unsafe-eval'` and multiple third-party scripts (Low-Medium)
`script-src` in the CSP (report-only) allowlists Google Tag Manager, Google Analytics, Google Ads, Facebook Connect, Cloudflare Insights, and Cloudflare Turnstile challenge scripts, in addition to `'unsafe-inline' 'unsafe-eval'`. A heavy third-party script payload (ads + analytics + Facebook pixel + Turnstile) on every page is a common INP degradation source, especially on mid-range mobile devices, because these scripts compete for the main thread during user interaction.
**Fix:** Load non-critical third-party scripts (Facebook Connect, Google Ads conversion tracking) with `strategy="lazyOnload"`/`afterInteractive` (Next.js `<Script>` component) rather than blocking, and audit via PSI's "Reduce JavaScript execution time" / "Minimize main-thread work" diagnostics once a lab test is run.

**Recommend as immediate follow-up:** run PageSpeed Insights (mobile + desktop) against `/`, one product page, and one category page to get actual LCP/INP/CLS figures — this report only identifies plausible risk factors from source code, not measured values.

---

## 8. Structured Data

### 8.1 Rich, well-formed JSON-LD present across page types (Pass)
Confirmed via raw JSON-LD extraction on `/urun/klasik-kartvizit`:
- **Organization** (`@id: #organization`) with legal name, logo, founding date, parent org (324 Ajans), social profiles, contact points — complete.
- **WebSite** with `SearchAction` (sitelinks searchbox eligible): `urlTemplate: https://markala.com.tr/urunler?q={search_term_string}`.
- **LocalBusiness** with full `PostalAddress`, `GeoCoordinates` (36.812061, 34.641482), `openingHoursSpecification`, `areaServed` (Türkiye, Mersin, Adana, İstanbul, Ankara, İzmir), `paymentAccepted`.
- **Product** with `sku`, `mpn`, `image[]` (5 images), `brand`, `category`, and a full `AggregateOffer` (`lowPrice: 480`, `highPrice: 20000`, `offerCount: 42`, `priceCurrency: TRY`, `validFrom`/`priceValidUntil` dynamically dated, `availability: InStock`, `MerchantReturnPolicy` — 7-day return, free return shipping — and `OfferShippingDetails` with handling/transit time). This is a genuinely thorough Product/Merchant markup implementation, well above what's typical for a new small e-commerce site.
- **FAQPage** with multiple `Question`/`Answer` pairs (real product-specific FAQ content, not filler).
- **BreadcrumbList** matching the visible navigation path.
- Category and city (matbaa) pages additionally carry **CollectionPage**/**ItemList** and **City** entity markup.

No structured-data errors detected in the sampled markup (valid JSON, required Product/Offer fields present). **Recommend running these exact URLs through Google's Rich Results Test to confirm zero warnings** (not done in this pass — parsing was manual/regex-based, not schema-validated against Google's specific eligibility requirements for each rich-result type).

### 8.2 Missing AggregateRating / Review (Low — expected given site age)
No `AggregateRating` or `Review` present in Product schema — appropriate for a brand-new store with no reviews yet. **Fix (future, not now):** once genuine customer reviews exist, add `AggregateRating`/`Review` to Product schema. Do not add placeholder/fake ratings — this risks a manual structured-data spam action.

---

## 9. JavaScript Rendering

### 9.1 Full content present in raw (non-JS-executed) HTML — Pass
All page text extracted in this audit (H1s, intro paragraphs, product descriptions, JSON-LD, breadcrumbs) was pulled via plain `curl` (no headless browser/JS execution). This confirms the site is genuinely server-rendered (SSR/Next.js App Router as stated) rather than a client-side-rendered shell requiring JS execution for content to appear — the highest-value confirmation for crawlability, since it means Googlebot's rendering queue is not a dependency for this content to be indexed. No `is_spa`-style shell pattern observed.

### 9.2 `x-nextjs-cache: STALE` on homepage response (Low, performance note not correctness issue)
Homepage response carried `x-nextjs-cache: STALE` with `Cache-Control: s-maxage=30, stale-while-revalidate`. This is expected ISR (Incremental Static Regeneration) behavior — the response served was a slightly stale cached copy while a fresh one regenerates in the background — not a rendering defect. No action needed unless stale windows are observed to be unexpectedly long in production monitoring.

---

## 10. Sitemap Quality

Evidence — `https://markala.com.tr/sitemap.xml` (953 `<url>` entries, single flat `urlset`, no sitemap index):

### 10.1 `lastmod` missing on 56 of 953 URLs (5.9%) — inconsistently applied to the most important pages (Medium)
`grep`/`awk` count: 897 of 953 `<url>` blocks have `<lastmod>`; **56 do not**. The 56 missing `lastmod` are disproportionately the site's top-level/highest-priority URLs: `/`, `/urunler`, `/kategoriler`, `/kampanyalar`, `/blog`, `/matbaa`, `/hizmetler`, `/sozluk`, `/fiyat-listesi`, all 6 `/rehber/*` guide pages, `/kurumsal`, `/teklif-al`, `/numune-talebi`, `/yardim`, `/referanslar`, `/portfolio`, `/hakkimizda`, `/iletisim`, `/kargo-takip`, and the top-level `/matbaa` and city pages `/matbaa/mersin`, `/matbaa/antalya`, `/matbaa/adana`, `/matbaa/sanliurfa`, `/matbaa/hatay`, `/matbaa/osmaniye` (list continues; 56 total). These are exactly the pages where `lastmod` would be most useful for signaling freshness to crawlers.
**Fix:** Add `<lastmod>` to all sitemap entries, sourced from actual content-modification timestamps (CMS `updatedAt` field), not a build-time constant.

### 10.2 `lastmod` values suggest a non-trustworthy timestamp source on product pages (Medium)
Of the 897 URLs that do have `lastmod`, **826 (92%) share the exact identical timestamp `2026-07-01T02:38:39.905Z`**, down to the millisecond. This is not consistent with 826 independent products having been "last modified" at the literal same instant — it strongly indicates the `lastmod` value is stamped at sitemap-generation/seed time rather than reflecting real per-product content changes. (32 distinct timestamp values total exist across all 897 entries.)
**Why this matters:** Google has stated it will disregard `lastmod` signals it determines to be inaccurate/untrustworthy across a sitemap. If Google concludes this pattern is unreliable, it loses value as a recrawl-priority signal for the entire sitemap, not just the affected URLs.
**Fix:** Generate `lastmod` per-URL from the actual database `updatedAt`/`published_at` field for that specific product/page at sitemap-build time, not from a single batch job timestamp. If all 826 products genuinely haven't changed since a July 1 import, that's fine to reflect literally — but verify this is really per-record data and not a hardcoded/shared build variable before trusting the current output.

### 10.3 No `sitemap index` / single flat file at 953 URLs (Pass, not yet a problem)
953 URLs is well under the 50,000-URL/50MB sitemap protocol limit, so a single flat `sitemap.xml` (not a sitemap index) is appropriate at current scale. **Forward-looking note:** if the product catalog or city/district page expansion (see 3.2) grows significantly, plan to split into a sitemap index (e.g., separate sitemaps for `/urun/`, `/kategori/`, `/matbaa/`) before hitting protocol limits, and to allow per-section monitoring in Google Search Console.

### 10.4 No `?page=`, `?sort=`, `?filter=` parameter URLs in sitemap (Pass)
Confirmed via `grep -c "?"` on the sitemap file: only 0 query-parameter URLs present (the one `?` match found was a false positive from an XML declaration, not a URL). This is correct — parameterized/paginated/sorted views should not be in the sitemap; canonical unparameterized URLs are the only sitemap contents, which is best practice.

### 10.5 hreflang — not applicable (Pass, no action needed)
Site is Turkish-only, single market, single language, single ccTLD-style domain. No hreflang implementation found in sampled `<head>` sections, which is correct for a mono-lingual site — hreflang is unnecessary here and its absence is not a defect. (Per scope, detailed hreflang validation is deferred to the `seo-hreflang` sub-skill if/when the site adds additional language versions.)

---

## Summary Table

| # | Finding | Severity | Status |
|---|---|---|---|
| 1.1 | Google-Extended block does not affect AI Overviews (informational, no fix needed) | Medium | Clarified |
| 1.4 | `Allow: /api/mockup` carve-out — confirm intentional | Low | Open |
| 2.2 | `http://www` requires 2 redirect hops to canonical | Medium | Open |
| 2.4 / 3.4 | `?page=N` pagination canonical/robots not verified | Medium | Evidence incomplete — follow-up query given |
| 3.2 | Mersin district pages thin/asymmetric vs. other cities — doorway-page risk | Medium-High | Open |
| 3.3 | Only 6/860 products spot-checked for duplicate content — İSG catalog highest risk | Medium | Evidence incomplete — follow-up specified |
| 4.2 | CSP is report-only, not enforced | High | Open |
| 4.3 | Duplicate security response headers | Low | Open |
| 5.2 / 5.3 | Crawl depth / orphan pages inferred from 1 breadcrumb, not full link crawl | Medium | Evidence incomplete — recommend Screaming Frog crawl |
| 7.1 | No preconnect to `api.markala.com.tr` image origin — LCP risk | Medium | Open (unverified without lab test) |
| 7.3 | Heavy third-party script allowlist — INP risk | Low-Medium | Open (unverified without lab test) |
| 10.1 | 56 URLs (incl. all top-level pages) missing `lastmod` | Medium | Open |
| 10.2 | 92% of `lastmod` values are an identical batch timestamp, not real per-page dates | Medium | Open |

**Overall assessment:** No critical crawlability or indexability defects found — every sampled URL (33/33) is 200/self-canonical/indexable, HTTPS+HSTS is solid, structured data is unusually thorough for a new site, and the SSR implementation is genuinely crawler-friendly (no JS-dependency risk). The highest-value fixes are: (1) enforce the CSP instead of report-only, (2) fix `lastmod` to reflect real per-page timestamps, (3) resolve or enrich the Mersin-only district-page asymmetry before replicating it to other cities, and (4) complete the two explicitly-flagged verification gaps (pagination canonical behavior, and a full 860-product duplicate-content scan) with the exact commands provided above.
