# markala.com.tr — E-commerce SEO & Merchant Center Audit

Data source: On-page analysis (static/raw HTML fetch, `render_page.py --mode auto|never`, homepage confirmed server-rendered/non-SPA). DataForSEO Merchant (live) marketplace data was **not fetched** — `dataforseo_costs.py check merchant/products_listings/live` returned `"status": "needs_approval"` (unknown endpoint, est. $0.05). Per cost guardrails this is surfaced to the orchestrator for approval rather than auto-approved; no DataForSEO calls were made in this pass.

**Scope note:** This pass focused on the Merchant Center "Misrepresentation" root-cause investigation (Task 1), which the brief marked as top priority, plus what could be verified about legal/business-identity pages. Tasks 2–5 (10+ product pages, 5+ category pages, per-product schema validation, image resolution sampling) were **not completed** in this pass — no `/urun/` or `/kategori/` pages were actually fetched/rendered. Those items are marked UNKNOWN below with a recommended follow-up scope rather than guessed at.

---

## 1. Google Merchant Center "Misrepresentation" Remediation Checklist (PRIORITY)

Account 5817357737 is suspended; feed shows 59/59 products disapproved, "not showing to customers." Findings below are ordered by how directly they plausibly explain a Misrepresentation flag.

| # | Requirement | Result | Evidence (URL) | Severity |
|---|---|---|---|---|
| 1 | Business identity is **consistent** across schema, footer, and legal contract | **FAIL** | Three-way mismatch, see 1.1 below | **Critical** |
| 2 | Mandatory Turkish e-commerce registry (ETBİS) status disclosed as complete | **FAIL** | `https://markala.com.tr/yasal/kullanim-kosullari` contains a live placeholder | **Critical** |
| 3 | Return & refund policy reachable and specific | **PASS** | `https://markala.com.tr/yasal/iade`, `https://markala.com.tr/yardim/iade`, `https://markala.com.tr/yasal/mesafeli-satis` (Madde 8) | Pass (Medium note: duplication, see 1.3) |
| 4 | Shipping cost shown before checkout | **PASS** (policy copy) / **UNKNOWN** (live cart not verified) | `https://markala.com.tr/yasal/kargo`, `https://markala.com.tr/yardim/kargo` | Pass / Medium (unverified) |
| 5 | Full business identity: legal name, address, phone, tax ID | **PARTIAL** | See 1.1 — tax/MERSİS present but on an orphaned page | High |
| 6 | Terms of sale / distance-selling contract present | **PASS** | `https://markala.com.tr/yasal/mesafeli-satis`, `https://markala.com.tr/yasal/on-bilgilendirme` | Pass |
| 7 | Contact methods (phone, email, form) | **PASS** (with one inconsistency) | `https://markala.com.tr/iletisim`, footer `tel:+903244333351`, homepage JSON-LD `contactPoint` | Pass / Low note, see 1.4 |
| 8 | Secure checkout (HTTPS, 3D Secure PSP) | **PASS** (strong indirect evidence) / **UNKNOWN** (checkout page itself not rendered) | Homepage response headers (HSTS, CSP `frame-src` allows `iyzipay.com`), `/yasal/mesafeli-satis` Madde 4 | Pass / Medium (unverified live, sandbox domain present in CSP — see 1.5) |
| 9 | Price consistency: product page vs. cart/checkout | **UNKNOWN** | Not tested this pass — no product or cart page rendered | Needs follow-up |
| 10 | Legal/policy pages crawlable via sitemap.xml | **FAIL** | See 1.6 | Medium |

### 1.1 Critical — Business identity mismatch (name + address, 3 conflicting versions)

Three different combinations of legal name / address appear on the live site depending on which page or data layer you check:

- **Homepage JSON-LD** (`Organization`/`LocalBusiness` schema, `https://markala.com.tr/`):
  `legalName: "324 Ajans · Markala"`, address `"Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61, Yenişehir, Mersin, 33060"`.
- **Site footer (visible text on every page)** and **`/yasal/mesafeli-satis`** (Madde 1 — Taraflar, the actual distance-sales contract): `"324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Tic. Ltd. Şti."`, address `"Menteş Mah. 100. Yıl Cumhuriyet Cad. No:59/A Yenişehir / Mersin"`.
- **`/yasal/on-bilgilendirme`** (the legally-required Ön Bilgilendirme Formu / seller-info block): same legal name as the footer, but **reverts to the Astoria One address** (matching the JSON-LD, not the footer/contract).

So the address alone appears in two different forms across the homepage structured data, the footer, and the two legal documents that are supposed to be authoritative for exactly this information. Google's Merchant Center policy team cross-checks the business info in the Merchant Center account against what a crawler/reviewer sees on the live site; an internally inconsistent legal name/address is a textbook Misrepresentation trigger. **Fix: pick one legal name and one physical address, and make it identical in (a) homepage JSON-LD `Organization`/`LocalBusiness`, (b) global footer, (c) `/yasal/mesafeli-satis` Madde 1, (d) `/yasal/on-bilgilendirme` §1, and (e) the Merchant Center business info tab itself.**

### 1.2 Critical — Live placeholder text admitting incomplete legal registration

`https://markala.com.tr/yasal/kullanim-kosullari` (Terms of Use), under "ETBİS Kaydı," reads verbatim:

> "ETBİS kayıt numarası: **[BAŞVURU BEKLEMEDE — ETBİS kaydı sonrası eklenecek]**"
> ("ETBİS registration number: [APPLICATION PENDING — will be added after ETBİS registration]")

This is a live, indexable page telling any visitor (and any automated policy reviewer) that the merchant has **not completed** its mandatory Turkish e-commerce registry (ETBİS, required under Law No. 6563) enrollment. This is an unambiguous, self-declared compliance gap and a highly plausible standalone cause of a Misrepresentation suspension — it signals an unverifiable/incomplete business identity in exactly the terms Google's policy is designed to catch. **Fix: complete ETBİS registration and replace the placeholder with the real registration number before appealing; do not appeal while this text is live.**

### 1.3 Medium — Return/refund policy is fragmented across three pages

The same return policy exists in three places with overlapping but not identical wording: `/yasal/iade` (legal/authoritative version, very detailed — production-tolerance %1–5 fire clause, 7-day claim window, who pays return shipping, 10-business-day card refund / 5-business-day IBAN refund), `/yardim/iade` (shorter help-center paraphrase), and `/yasal/mesafeli-satis` Madde 8 (contract clause referencing `/yasal/iade`). Content itself is good — clearly discloses that customized/personalized printed products are excluded from the statutory right of withdrawal (Mesafeli Sözleşmeler Yönetmeliği m.15/1-ç), which is legally correct and disclosed pre-purchase. Recommend consolidating to a single canonical policy URL with the others linking to it, to remove any risk of a reviewer reading a slightly different, seemingly-conflicting version.

### 1.4 Low — WhatsApp number differs from the official contact number

Footer WhatsApp link resolves to `wa.me/905319004102`, while the homepage JSON-LD `contactPoint` and the footer's displayed phone number both use `+90-324-433-3351` / `tel:+903244333351`. Two different phone numbers presented as "contact us" channels is a minor inconsistency worth cleaning up given the identity-consistency theme above.

### 1.5 Medium — iyzico **sandbox** domain present in production CSP

The homepage's `Content-Security-Policy-Report-Only` header whitelists `https://sandbox-api.iyzipay.com` alongside the production `https://api.iyzipay.com` and `https://www.iyzipay.com` in `frame-src`. This is consistent with either (a) leftover dev config with no functional impact (CSP report-only mode, so it wouldn't block anything either way), or (b) a real risk that some checkout path still points at iyzico's test/sandbox environment. Could not verify which from static analysis — **recommend the site owner confirm the live checkout only ever calls the production iyzico endpoint**, since a sandbox/test payment flow reaching production traffic would itself be a legitimate Misrepresentation-adjacent problem (fake/non-functional checkout).

### 1.6 Medium — Legal/help pages are not in the XML sitemap

`https://markala.com.tr/sitemap.xml` (local copy: `C:\Users\Administrator\Desktop\markala\markala.com.tr-audit\sitemap.xml`, `all-urls.txt`) contains **zero** entries for: `/yasal/kullanim-kosullari`, `/yasal/on-bilgilendirme`, `/yasal/cerez`, `/yasal/iade`, `/yasal/kargo`, `/kvkk-basvuru` — all six return HTTP 200 and are linked from the global footer, so they are crawlable, just excluded from the sitemap. This doesn't block crawling but reduces the odds that automated policy/feed review tooling (which often leans on sitemaps) surfaces them quickly. **Fix: add all `/yasal/*` and `/yardim/*` policy pages to sitemap.xml.**

### Remediation checklist for the Merchant Center appeal (priority order)

1. **Critical:** Resolve the legal name/address inconsistency (1.1) — make Organization/LocalBusiness JSON-LD, footer, and both legal contract pages identical, and match whatever is filed in the Merchant Center business info tab.
2. **Critical:** Complete ETBİS registration and remove the `[BAŞVURU BEKLEMEDE]` placeholder from `/yasal/kullanim-kosullari` (1.2) before submitting the appeal.
3. **High:** Surface the full legal identity (unvan, adres, Vergi Dairesi/No, MERSİS) prominently on `/hakkimizda` and/or `/iletisim`, not only buried in `/yasal/on-bilgilendirme`, and add that page to the sitemap.
4. **Medium:** Consolidate the three return-policy pages to one canonical URL (1.3).
5. **Medium:** Confirm production checkout never touches the iyzico sandbox endpoint (1.5).
6. **Medium:** Add all `/yasal/*` and `/yardim/*` pages to sitemap.xml (1.6).
7. **Low:** Unify the WhatsApp contact number with the official phone number (1.4).
8. **Needs verification before appeal:** Confirm price shown on a sampled product/configurator page matches the price shown in cart and at the iyzico checkout step (Task 9 in table above) — not verified in this pass.

---

## 2. Product Page SEO — NOT AUDITED THIS PASS (UNKNOWN)

No `/urun/` pages were fetched or rendered in this session. From the sitemap inventory only (`all-urls.txt`), there are **861 URL matches** containing "urun" (product-related paths). A scan of the slugs themselves surfaces a content-uniqueness concern worth flagging even without opening the pages: many near-duplicate slugs exist for what appear to be the same warning/safety-sign product, e.g. `yerlere-sigara-ve-cop-atmayiniz`, `yerlere-sigara-ve-cop-atmayiniz-2`, `yerlere-sigara-ve-cop-atmayiniz-3`, `yerlere-sigara-ve-cop-atmayin`, alongside `guvenlik-onlemlerini-almadan-ise-baslama-levhasi` / `-levhasi-2`, `once-is-guvenligi-levhasi` / `-levhasi-2`. **Medium severity flag (unverified):** if these are near-identical products with thin/duplicated copy, that is both a content-uniqueness SEO issue (Priority 4 in the standard analysis framework) and a plausible contributor to how a 59-SKU feed reads to Google's product-quality review — recommend a follow-up pass opening 10+ of these `/urun/` pages with `render_page.py --mode always` (the configurator is very likely client-side, see note below) plus `schema_ecommerce_validate.py` against each.

**Recommended follow-up scope:** sample title/meta patterns, breadcrumbs, internal linking, unique-content check on 10+ `/urun/` pages, and specifically verify how the size/quantity configurator exposes price variants to crawlers — confirm whether `Product`/`Offer` JSON-LD is present in `raw_content` (server-rendered) or only appears after JS execution in `content` (client-rendered only), since the latter would mean Google's product feed crawler may not see accurate price/availability without full rendering.

## 3. Category Page SEO — NOT AUDITED THIS PASS (UNKNOWN)

No `/kategori/` pages were fetched. Sitemap inventory shows **38 URL matches** for "kategori", e.g. `/kategori/kartvizit`, `/kategori/rollup`, `/kategori/is-guvenligi-*` (multiple sub-categories under a work-safety-signage vertical), `/kategori/vinil-branda-afis`, `/kategori/yelken-bayrak`. Faceted navigation, pagination (`?page=N`), category intro copy, and indexability were not verified. **Recommended follow-up scope:** sample 5+ category pages, check for `rel=canonical` on paginated/filtered variants, presence of unique intro copy vs. templated boilerplate, and internal links back to relevant products.

## 4. Product Schema Completeness for Shopping Eligibility — NOT AUDITED THIS PASS (UNKNOWN)

Not verified against any actual product page in this pass. What **was** confirmed: the homepage itself is server-rendered (not an SPA — `render_page.py` reported `is_spa: false`, `mode_used: raw`) and carries valid `Organization`, `WebSite`, `LocalBusiness`, and `HowTo` JSON-LD blocks (3/3 valid per `structured_data` output), which is a good sign that this site generally does server-render its structured data rather than injecting it only client-side. That said, **this does not confirm `Product`/`Offer` schema behavior**, which must be checked directly on `/urun/` pages, especially given the configurator (size/quantity → price) noted in the task brief. **Recommended follow-up:** run `schema_ecommerce_validate.py` against 10+ product pages fetched with `--mode always`, and diff `raw_content` vs `content` specifically for the `Product`/`Offer`/`AggregateOffer` block to determine if price/availability requires JS execution.

## 5. Image Quality — NOT AUDITED THIS PASS (UNKNOWN)

No product images were sampled or measured in this pass, so the feed's reported "Low image quality [image_link]" issue (1 product) could not be independently confirmed or characterized. **Recommended follow-up:** pull `image_link` values from 10+ product pages, check natural resolution (Google Shopping generally wants ≥ 800×800px, ideally ≥ 1200px on the long edge for zoom), format (WebP/JPEG), and whether `alt` text is present and descriptive.

---

## Summary of scores

Given the majority of scope items (Tasks 2–5) were not executed this pass, per-category XX/100 scores would be fabricated and are intentionally omitted for Schema/Images/Content/Category. The one score that can be responsibly given:

| Area | Score | Basis |
|---|---|---|
| Merchant Center trust-signal consistency (business identity, policy completeness) | **35/100** | Two Critical findings (address/name mismatch, live ETBİS placeholder) plus several Medium items; underlying policy *content* (return, shipping, distance-selling terms) is actually well-drafted and legally sound — the problem is consistency and one incomplete registration, not missing content. |

Files referenced: `C:\Users\Administrator\Desktop\markala\markala.com.tr-audit\all-urls.txt`, `C:\Users\Administrator\Desktop\markala\markala.com.tr-audit\sitemap.xml`.
