# Schema.org Audit — markala.com.tr

Date: 2026-08-17
Method: Live fetch of rendered/raw HTML via `render_page.py` (site is Next.js SSR, `is_spa=false` on every sampled URL, so JSON-LD is present in the raw HTML — no client-side-only injection risk detected). JSON-LD extracted and validated structurally (parseable, `@context`, `@type`, required properties). Google Rich Results Test / Schema Markup Validator were **not** run against these URLs in this session — anything not cross-checked there is marked **doğrulanmadı** (unverified).

Sampled URLs (16 pages, all page types covered):
- Products: `/urun/yelken-bayrak-damla`, `/urun/klasik-kartvizit`, `/urun/vinil-branda-440gr`, `/urun/dikkat-kaygan-zemin`, `/urun/dikkat-380v-olum-tehlikesi-levhasi`, `/urun/rollup-standart`, `/urun/brosur`
- Categories: `/kategori/vinil-branda-afis`, `/kategori/is-guvenligi-uyari-ikaz`, `/kategori/brosur`, `/kategori/yelken-bayrak`
- Guides: `/rehber/isg-zorunlu-uyari-levhalari`, `/rehber/brosur-baski-fiyatlari-2026`
- Local: `/matbaa/mersin`, `/matbaa/gaziantep`
- Other: `/sozluk`, `/hakkimizda`, `/iletisim`, `/yardim`, `/fiyat-listesi`, `/` (home), `/blog` (index only)

Not fetched this session (doğrulanmadı): individual `/blog/{slug}` post pages, `/hizmetler/tasarim-destegi`, `/hizmetler/toplu-baski`, `/referanslar`, `/kampanyalar`, `/portfolio`, `/kargo-takip`, `/teklif-al`, `/numune-talebi`.

---

## 1. Schema inventory by page type

Every page carries a **sitewide global block** (injected on all templates):
- Block A — `@graph` with `Organization` (`@id=#organization`) + `WebSite` (`@id=#website`, includes `SearchAction`)
- Block B — `LocalBusiness` (`@id=#localbusiness`)

On top of that:

| Page type | Sample | Extra schema found |
|---|---|---|
| Home `/` | `/` | + **HowTo** (5-step order process) ⚠️ deprecated |
| Product `/urun/{slug}` | 7 sampled | + `Product`/`Offer` or `Product`/`AggregateOffer` (with `hasMerchantReturnPolicy`, `OfferShippingDetails`) + `BreadcrumbList`; **most but not all** also carry `FAQPage` (present on 5/7 sampled, absent on `dikkat-kaygan-zemin`, `dikkat-380v-olum-tehlikesi-levhasi`) |
| Category `/kategori/{slug}` | 4 sampled | + `CollectionPage`/`ItemList` (product listing) + `BreadcrumbList` |
| Guide `/rehber/{slug}` | 2 sampled | + `Article` + `FAQPage` + `BreadcrumbList` |
| Local `/matbaa/{city}` | 2 sampled | + `Service` (references `LocalBusiness` by `@id`, not a duplicated fake branch) + `AggregateOffer` on the Service + `FAQPage` + `BreadcrumbList` |
| `/sozluk` | 1 | + `DefinedTermSet`/`DefinedTerm` (already implemented) + `BreadcrumbList` |
| `/yardim` | 1 | + `FAQPage` only — **no `BreadcrumbList`** |
| `/fiyat-listesi` | 1 | + `ItemList` (8.5KB, full price list) + `BreadcrumbList` |
| `/hakkimizda` | 1 | Global blocks only — **no `AboutPage`, no `BreadcrumbList`** |
| `/iletisim` | 1 | Global blocks only — **no `ContactPage`, no `BreadcrumbList`** |
| `/blog` (index) | 1 | Global blocks only — **no `ItemList`/`Blog` schema for the 9 posts** |
| `/blog/{slug}` (post) | not fetched | doğrulanmadı — recommend verifying `BlogPosting`/`Article` exists on individual posts |

---

## 2. Validation results

### 🔴 Critical

**C1 — Deprecated `HowTo` schema on homepage.**
Google removed HowTo rich results in September 2023. The block is technically valid JSON-LD (parses fine, has `step`/`supply`) but **cannot earn any rich result** and is dead weight. Per current guidance this type should never be used going forward.
Evidence (`/`, block 3, 1197 bytes):
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "@id": "https://markala.com.tr/#howto-production",
  "name": "Markala Matbaa Sipariş Süreci — 5 Adım",
  "step": [ { "@type": "HowToStep", "position": 1, "name": "Sipariş Ver", "...": "..." } ]
}
```
**Fix:** Remove the `HowTo` JSON-LD block entirely. Keep the visible "5 adımda sipariş" content on the page (it's good UX copy), just stop wrapping it in HowTo markup — there is no schema.org replacement needed since it isn't a recipe/craft/repair task with rich-result eligibility.

### 🟠 High

**H1 — Inconsistent/placeholder `sku` and `mpn` on Product pages (Merchant Center relevance).**
Some products have a real-looking manufacturer-style SKU:
```json
// urun/yelken-bayrak-damla
"sku": "MK-YLK-DML-001",
"mpn": "MK-YLK-DML-001"
```
Others reuse the URL slug verbatim as both `sku` and `mpn`:
```json
// urun/dikkat-kaygan-zemin
"sku": "dikkat-kaygan-zemin",
"mpn": "dikkat-kaygan-zemin"
```
`sku` = `mpn` = slug is a placeholder, not a genuine manufacturer part number. Given the Merchant Center account is suspended for **Misrepresentation**, supplying an `mpn` value that is not an actual manufacturer part number is exactly the kind of low-trust identifier data that can compound a misrepresentation review — these are custom-printed goods with no real MPN. **Recommend dropping `mpn` entirely site-wide** (it's optional) rather than auto-filling it with the slug, and standardizing `sku` to the internal product code format already used on some items (`MK-XXX-###`).

**H2 — `/blog` index has no listing schema; individual post schema unverified.**
The blog index page (9 posts) carries only the sitewide Organization/LocalBusiness blocks — no `ItemList` or `Blog` type describing the post collection, unlike category pages which do this correctly. Individual `/blog/{slug}` posts were not fetched this session — **doğrulanmadı** whether `BlogPosting`/`Article` exists there. Recommend verifying and adding `ItemList` to the index (see §5).

### 🟡 Medium

**M1 — `FAQPage` retains zero Google SERP value; keep only if AI/GEO benefit is accepted as unconfirmed.**
FAQPage is present on: most product pages, all matbaa/{city} pages, both guide pages, and `/yardim`. Google retired FAQ rich results for **all** sites, not just gov/health, as of May 7, 2026 — this supersedes the Aug 2023 restriction. These blocks are valid JSON-LD and cause no harm, but they now deliver **no SERP feature**. Any AI Overview/GEO citation benefit is unconfirmed. This is downgraded from what might look like a "keep as-is" win to an **Info-severity cleanup candidate** — no urgency to remove, but do not invest further engineering time adding more FAQPage blocks expecting a rich result.

**M2 — Article `image` is generic and reused, not article-specific.**
Both sampled guides use the same site-wide OG fallback image:
```json
"image": "https://markala.com.tr/og-default.png"
```
Google's Article/BlogPosting rich result guidance wants a genuinely representative image (ideally 1200px+ wide, relevant to the specific article) — a shared placeholder logo image weakens eligibility for Article rich results / Google Discover surfacing. Also note `image` is a bare string rather than an `ImageObject` with `width`/`height` (recommended, not required).

**M3 — `datePublished` == `dateModified` on both sampled guides.**
```json
"datePublished": "2026-07-20",
"dateModified": "2026-07-20"
```
Identical values on every guide suggest `dateModified` is not actually tracked on content edits — it's copy-pasted at publish time. Not a validation failure, but it weakens freshness signals if this pattern holds site-wide. **Doğrulanmadı** whether this is true across all 6 guides/9 blog posts (only 2 guides sampled) — recommend spot-checking the CMS field mapping.

**M4 — `Offer.seller` is a thin stub, not linked to the full Organization record.**
```json
"seller": { "@type": "Organization", "name": "Markala", "url": "https://markala.com.tr" }
```
The same page already has a full `Organization` node with `@id: https://markala.com.tr/#organization` including address, telephone, email, sameAs. The `seller` object duplicates only `name`/`url` instead of referencing `{"@id": "https://markala.com.tr/#organization"}`. Given the Merchant Center suspension is about verifying the real business behind listings, linking (or expanding) `seller` to the fully-identified Organization node is worth doing — it costs nothing and strengthens the association between product offers and a verifiable, complete business entity.

**M5 — No `BreadcrumbList` on `/hakkimizda`, `/iletisim`, `/yardim`.**
These three pages carry only the two global blocks — confirmed by block_count of 2 (hakkimizda, iletisim) and 3 with no BreadcrumbList type present (yardim, whose only extra block is FAQPage). Every other sampled page type (product, category, guide, matbaa, sozluk, fiyat-listesi) has BreadcrumbList. This is a straightforward, low-risk gap to close (see §6 snippets).

**M6 — `LocalBusiness.priceRange` uses currency-symbol shorthand (`"₺₺"`).**
```json
"priceRange": "₺₺"
```
Google's documented examples use `$`, `$$`, `$$$` style symbols; whether the Lira sign renders/validates identically across Google's parsers is **doğrulanmadı**. Low risk, but consider testing in Rich Results Test or switching to a numeric range (e.g., `"₺89 - ₺8500"`) which is unambiguous.

**M7 — `LocalBusiness` has no `hasMap` and uses a generic OG image, not a real storefront/office photo.**
```json
"image": "https://markala.com.tr/og-default.png"
```
Google's local business guidance recommends a real photo of the location. A Google Maps `hasMap` URL is also a recommended (not required) property that's currently absent. Both are easy additions once verified.

### 🟢 Low / Info

**I1 — FAQPage severity downgrade note** (see M1) — flagged Info per current Google policy: no SERP benefit for existing or new FAQPage; do not add more expecting rich results.
**I2 — Product `offers` mixes `AggregateOffer` (multi-variant items) and plain `Offer` (single-variant, e.g. `vinil-branda-440gr`) correctly depending on `offerCount`** — this is actually correct usage, noted for completeness, not an error.
**I3 — No fabricated `aggregateRating`/`Review` anywhere on Product or LocalBusiness** — this is good practice (avoids the classic "fake stars" misrepresentation red flag) and should be preserved; only add real ratings if/when genuine review data exists (unverified whether `/referanslar` has real testimonials that could source an honest `AggregateRating` — not fetched this session).
**I4 — `sameAs` on Organization/LocalBusiness lists only Instagram, LinkedIn, and the parent company URL** — no Facebook, X/Twitter, or Google Business Profile URL. Doğrulanmadı whether those profiles exist; if they do, add them.

---

## 3. Product schema — Merchant Center completeness assessment

This is the most important section given the Merchant Center suspension. Checked against every sampled `/urun/{slug}` page (7 samples, consistent pattern):

| Property | Present? | Detail |
|---|---|---|
| `@type: Product` | ✅ | Consistent |
| `name`, `description` | ✅ | Populated, non-placeholder |
| `sku` | ✅ (quality issue) | See H1 — inconsistent, sometimes = slug |
| `mpn` | ⚠️ | See H1 — recommend removing, duplicates sku |
| `brand` | ✅ | `{"@type":"Brand","name":"Markala"}` on every sample |
| `image` | ✅ | Real product photo URL from `api.markala.com.tr/uploads/products/...`, array format |
| `category` | ✅ | Present |
| `offers` (Offer/AggregateOffer) | ✅ | Correctly typed by variant count |
| `priceCurrency` | ✅ | `"TRY"` consistently |
| `price` / `lowPrice`+`highPrice` | ✅ | Numeric, no currency symbols embedded (correct format) |
| `availability` | ✅ | `https://schema.org/InStock` (full URL form, correct) |
| `itemCondition` | ✅ | `https://schema.org/NewCondition` |
| `validFrom` / `priceValidUntil` | ✅ | ~30-day rolling validity window, ISO 8601 dates |
| `seller` | ⚠️ | Present but thin stub, see M4 |
| `hasMerchantReturnPolicy` | ✅ | **Present on every sample** — `applicableCountry: TR`, `returnPolicyCategory: MerchantReturnFiniteReturnWindow`, `merchantReturnDays: 7`, `returnMethod: ReturnByMail`, `returnFees: FreeReturn` |
| `shippingDetails` (`OfferShippingDetails`) | ✅ | **Present on every sample** — `shippingRate` (79 TRY), `shippingDestination` (country TR), `deliveryTime.handlingTime` (1-5 days), `deliveryTime.transitTime` (1-3 days) |
| `aggregateRating`/`review` | ✅ absent (intentional, good) | No fake ratings — correct |
| `gtin`/`gtin13`/`gtin8` | Not present | Not applicable — these are custom-printed goods without retail barcodes; not a gap |

**Bottom line for the appeal:** the task brief specifically flagged "missing merchant return policy and shipping details" as common Merchant Center rejection contributors — **both are present and well-formed on every product sampled.** Structured data completeness does not appear to be a contributing cause of the Misrepresentation suspension. The two real quality issues worth fixing before/during an appeal are:
1. **H1** — stop reusing the slug as a fake `mpn`/`sku` (a real identifier fabrication risk, however minor, is not worth the exposure while a misrepresentation review is active).
2. **M4** — link `seller` to the fully-detailed Organization record so the business identity behind every offer is unambiguous and complete.

Everything else in the product Offer graph (price, currency, availability, condition, shipping, returns) is Merchant-Center-grade.

---

## 4. Organization / LocalBusiness — NAP completeness

**Organization** (`@id: https://markala.com.tr/#organization`, sitewide):
- ✅ `name`, `legalName` ("324 Ajans · Markala"), `alternateName` (2 variants), `url`, `logo`, `description`, `foundingDate`
- ✅ `parentOrganization` → 324 Ajans (correctly modeled as a sub-brand, which matches the real corporate structure — good, since misrepresenting the corporate relationship would itself be a risk)
- ✅ `address` (full PostalAddress: street, locality, region, postal code, country)
- ✅ `contactPoint` × 2 (customer service + sales), each with `telephone`, `email`, `areaServed`, `availableLanguage`; customer service also has `hoursAvailable`
- ✅ `sameAs`: Instagram, LinkedIn, parent site (see I4 — could be more complete)
- ✅ `knowsAbout` (10 service/product terms) — nice-to-have topical signal

**LocalBusiness** (`@id: https://markala.com.tr/#localbusiness`, sitewide):
- ✅ Full NAP: `name`, `telephone` (+90-324-433-3351 — matches brief), `email`, `address` (same as Organization), `geo` (lat/long populated, plausible Mersin/Yenişehir coordinates)
- ✅ `openingHoursSpecification`: Mon-Fri 09:00-18:00, Sat 09:00-17:00 (Sunday implicitly closed — fine)
- ✅ `areaServed`: Country (Türkiye) + 5 named cities
- ✅ `paymentAccepted`, `currenciesAccepted`
- ✅ `sameAs` (same 3 links as Organization)
- ⚠️ `priceRange` uses `"₺₺"` symbol shorthand — see M6
- ⚠️ `image` is the generic OG fallback, not a real location photo — see M7
- ❌ No `hasMap` property — see M7
- **City service pages** (`/matbaa/{city}`) correctly avoid creating fake duplicate `LocalBusiness` entities per city — they use a `Service` node that references the single real `LocalBusiness` via `@id` and scopes `areaServed`/`geoRadius` instead. This is the right pattern and actively **reduces** misrepresentation risk (no fake branch addresses). Worth highlighting positively given the current Merchant Center context — do not change this pattern.

This block is strong. The two gaps (`hasMap`, real photo) are easy, low-risk additions that support Local Pack / Google Business Profile alignment.

---

## 5. Missing opportunities summary

| Opportunity | Status | Priority |
|---|---|---|
| FAQPage on `/yardim`, guides, product, local pages | Already implemented | Info-only — no more SERP value to chase (see M1) |
| BreadcrumbList on product/category/guide/matbaa/sozluk/fiyat-listesi | Already implemented | — |
| BreadcrumbList on `/hakkimizda`, `/iletisim`, `/yardim` | **Missing** | Medium (M5) |
| ItemList on category pages | Already implemented (CollectionPage + ItemList) | — |
| ItemList on `/fiyat-listesi` | Already implemented | — |
| ItemList/Blog schema on `/blog` index | **Missing** | High (H2) |
| WebSite + SearchAction | Already implemented sitewide | — |
| DefinedTerm/DefinedTermSet on `/sozluk` | Already implemented | — |
| Article on guides | Already implemented (image quality issue, M2/M3) | — |
| BlogPosting/Article on individual `/blog/{slug}` posts | Doğrulanmadı — not fetched | Verify next session |
| Service schema on `/hizmetler/*` pages | Doğrulanmadı — not fetched | Verify next session |
| AggregateRating from real testimonials on `/referanslar` | Doğrulanmadı — not fetched, only add if genuine data exists | Low, verify first |

---

## 6. Ready-to-paste JSON-LD for the highest-value gaps

### 6.1 BreadcrumbList for `/hakkimizda`
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://markala.com.tr/" },
    { "@type": "ListItem", "position": 2, "name": "Hakkımızda", "item": "https://markala.com.tr/hakkimizda" }
  ]
}
```

### 6.2 BreadcrumbList for `/iletisim`
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://markala.com.tr/" },
    { "@type": "ListItem", "position": 2, "name": "İletişim", "item": "https://markala.com.tr/iletisim" }
  ]
}
```

### 6.3 BreadcrumbList for `/yardim`
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://markala.com.tr/" },
    { "@type": "ListItem", "position": 2, "name": "Yardım", "item": "https://markala.com.tr/yardim" }
  ]
}
```

### 6.4 ItemList for `/blog` index (adjust `url`/`name`/`position` to the real 9 posts)
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://markala.com.tr/blog#collection",
  "url": "https://markala.com.tr/blog",
  "name": "Markala Blog",
  "isPartOf": { "@id": "https://markala.com.tr/#website" },
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 9,
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "url": "https://markala.com.tr/blog/ORNEK-YAZI-SLUG", "name": "Örnek Yazı Başlığı" }
    ]
  }
}
```

### 6.5 `seller` fix — link to the full Organization node instead of a thin duplicate (apply inside every Product `offers` block)
```json
"seller": { "@id": "https://markala.com.tr/#organization" }
```

### 6.6 `hasMap` + real photo addition to LocalBusiness (merge into the existing sitewide LocalBusiness block)
```json
"hasMap": "https://www.google.com/maps/place/?q=place_id:REPLACE_WITH_REAL_PLACE_ID",
"image": "https://markala.com.tr/OGERCEK-ATOLYE-FOTO.jpg"
```

### 6.7 Homepage — remove the `HowTo` block
No replacement schema needed. Delete the `<script type="application/ld+json">` block whose `@type` is `HowTo` (`@id: https://markala.com.tr/#howto-production`) from the homepage template; keep the visible "5 Adımda Sipariş" section as plain HTML.

---

## Summary of severities
- 🔴 Critical: 1 (deprecated HowTo on homepage)
- 🟠 High: 2 (fake mpn/sku pattern on some products; missing blog index/post-level listing schema — partially unverified)
- 🟡 Medium: 7 (FAQPage no-longer-useful, generic Article image, static dateModified, thin seller stub, missing breadcrumbs on 3 pages, priceRange symbol, missing hasMap/real photo)
- 🟢 Info/Low: 4 (documented for completeness, no action required or verification pending)

**For the Merchant Center appeal specifically:** Product-level structured data (offers, price, currency, availability, `hasMerchantReturnPolicy`, `shippingDetails`) is comprehensive and correctly formatted across every sampled product — this is not a likely contributing factor to the Misrepresentation suspension. The one item worth fixing proactively is the placeholder `mpn`/`sku` duplication (H1), since fabricated-looking identifiers are exactly the class of signal a misrepresentation reviewer could flag, however minor.
