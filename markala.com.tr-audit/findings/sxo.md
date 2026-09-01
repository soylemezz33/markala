# SXO Findings — markala.com.tr (SERP-Backwards Intent Analysis)

Date: 2026-08-17
Scope: 6 highest-opportunity keywords (by volume) from the supplied Semrush ranking export, analyzed against the real Google TR organic results, plus 1 supporting keyword ("topraklama sembolü") that surfaces a pattern relevant to Task 2.
Site authority context: Semrush Authority Score 2, 8 referring domains — very low. This caps realistic expectations for any competitive/commercial SERP regardless of on-page fixes; findings below separate "page-type/content fixes" (controllable) from "authority-gated" gaps (not fixable by content alone).

---

## 0. Method & Limitations

- Target pages fetched live via `render_page.py --mode auto` (raw HTML sufficient — site is Next.js SSR, `is_spa: false`) and parsed via `parse_html.py` for title/H1/H2/schema/word count/links.
- SERP data gathered via WebSearch (organic result list + AI-summarized snippet) for each keyword, in Turkish, no geo/device targeting available in the tool.
- **Limitation:** WebSearch does not expose live SERP features (PAA boxes, AI Overview presence, local pack, shopping carousel) directly — feature presence below is *inferred* from query pattern + result composition (marketplace/aggregator presence → shopping intent; city+business-type → near-certain local pack; "nedir/hangi" quiz-site results → PAA/AI Overview likely) and flagged as inferred, not observed. A dedicated SERP-features tool (DataForSEO/SerpAPI) would confirm this with certainty.
- **Limitation:** Search volumes and current positions are taken as given (Semrush export); not independently re-verified in this pass.
- Keyword selection for the "top 6" = the 6 highest search-volume rows in the supplied table (1900 → 390/mo), since all are already weak (pos 30-76) and therefore all represent live opportunity.

---

## 1. Key Finding (lead insight)

The site's page-type strategy is **mostly correct** for pure transactional İSG product queries (kaygan zemin, ölüm tehlikesi, emniyet kemeri all correctly answered by Product pages), and Product schema/AggregateOffer is well-built. The actual ranking blockers split into three distinct root causes that require different fixes:

1. **Content-target mismatch, not page-type mismatch** — the one purely definitional/exam-style keyword in the top 6 ("...hangi renk kullanılır") is answered by a page whose H1/primary entity is a *different, broader* question. The right answer exists (FAQ #2) but isn't what Google matches the page to.
2. **Structural/local mismatch (not fixable by content)** — "gaziantep matbaa" is answered by a Mersin-based service-area page competing against SERP results that are 8/9 local businesses physically headquartered in Gaziantep. No amount of on-page rewriting closes this gap.
3. **Pure authority/competitive gap** — the three aligned product-page queries are losing to Trendyol, Hepsiburada, and Cimri (marketplace giants) and a swarm of same-niche competitors, at Authority Score 2. This is a volume/backlink problem, not a page-type problem.
4. **Supporting pattern (topraklama sembolü, outside top 6 but directly relevant to Task 2):** here the site DOES make the mistake the task hypothesized — a bare Product page answers a query that Google treats as definitional/informational (SERP dominated by "nedir"/explainer content). This confirms the pattern exists in the catalog, just not among the 6 highest-volume rows.

---

## 2. Per-Keyword SERP-Backwards Analysis

### 2.1 "zorunluluk ifade eden güvenlik işaretlerinde hangi renk kullanılır" — 1,900/mo, pos 76
**URL:** `/rehber/isg-zorunlu-uyari-levhalari`

**SERP composition (7 results reviewed):** sorumatik.co (Q&A forum), yenibakishaber.com (news/answer aggregator), **altinmakas.com.tr** (a direct competitor — signage company — ranking with a dedicated guide article), nedir.org (dictionary), isgsorucoz.com (İSG exam question bank), isgasistan.net (İSG exam prep site), neksymm.com (regulation/consultancy summary).
**Dominant type:** Blog Post / definitional Q&A. **Confidence: ~90% (informational).**
**Inferred SERP features:** PAA box and/or AI Overview highly likely (single-fact regulatory question, quiz-site presence is a strong PAA signal); no shopping/ads signal.

**Target page classification:** Hybrid guide (Blog Post + FAQPage schema + heavy commerce cross-links to 10 category cards). Page type family is correct (informational). **H1 is "İşyerinde hangi uyarı levhaları zorunlu?"** — a broader, different question than the searched query. The actual answer ("mavi = zorunlu davranış") is present only as FAQ item #2 of 6, with no dedicated heading or standalone paragraph matching the question's exact phrasing.
**Mismatch severity: MEDIUM-HIGH — content-target mismatch, not a page-type mismatch.** Google is unlikely to select this page as the best answer because its primary entity/H1 doesn't match the query, even though the fact is technically on the page.
**Persona reality check:** the SERP is dominated by exam-prep sites (isgsorucoz.com, isgasistan.net) — a large share of this 1,900/mo volume is **İSG certification exam candidates**, not signage buyers. Even a #1 ranking here would convert poorly; treat as a low-commercial-value/high-visibility keyword, not a revenue keyword.

**Recommendation:** Do not edit the existing rehber page's H1/lead (would change visible content — needs owner approval). Instead, **create a NEW, narrowly-scoped page** — the site already has a "Matbaa Sözlüğü" (glossary) in its footer nav; add an İSG-specific glossary entry there (e.g. `/sozluk/guvenlik-isareti-renkleri`) whose H1 exactly mirrors the question, gives the direct one-paragraph answer first, then links contextually into the existing rehber guide and the relevant category pages. This captures the query without touching the existing guide.

---

### 2.2 "broşür fiyatları" — 1,000/mo, pos 41
**URL:** `/rehber/brosur-baski-fiyatlari-2026`

**SERP composition (9 results):** Armut (marketplace aggregator "fiyatları"), and 8 competing matbaa companies each with a dedicated `/brosur-fiyatlari` or `/brosur` pricing page (bidolubaski, bursaofset, yildizmatbaa, zekicopy, ceptematbaa, bordoofset, istanbulofset).
**Dominant type:** Product/Category pricing page (price table by size × quantity). **Confidence: ~90% (commercial/transactional).**
**Inferred SERP features:** likely Google Ads (print shops commonly bid on this term); no strong PAA signal expected.

**Target page classification: ALIGNED.** Markala's page is already structured almost identically to the winning pattern: H2 "Broşür ... ebat × tiraj fiyat tablosu (Ağustos 2026)", paper/finish options, FAQ, and a direct configurator CTA. **No page-type change needed.**
**Mismatch severity: ALIGNED.** The pos-41 ranking is best explained by Authority Score 2 vs. established competitors with more backlinks, not by page structure.

**Secondary finding — cannibalization risk:** `/kategori/brosur` separately ranks pos 65 for "1000 adet broşür fiyatı." Two markala URLs are targeting overlapping broşür-pricing intent. Recommend clarifying the funnel: rehber page = broad "fiyatları" informational/price-table entry point, category page = browse/buy. **Recommend (internal-linking-only, low-risk, does not alter visible page copy):** add an explicit contextual link from the rehber page's price table down to `/kategori/brosur`, and from the category page up to the rehber guide — flag for owner sign-off since it does touch existing pages, even though it's link-only.

---

### 2.3 "dikkat kaygan zemin" — 880/mo, pos 31
**URL:** `/urun/dikkat-kaygan-zemin`

**SERP composition (10 results):** uysisguvenligi.com.tr (product), Cimri (price-comparison aggregator), **Trendyol** (marketplace), al.com.tr (blog: "Kaygan Zemin Uyarı Levhası Nedir?"), ilgitrafik.com ×2 (product), uyaritabelasi.com (product), trafikgerecleri.com (product), binbirbaski.com (product), hayaltrafik.com (product).
**Dominant type:** Product Page / marketplace listing. **Confidence: ~90% (transactional).**
**Inferred SERP features:** Shopping/product-carousel and image pack plausible given Trendyol + Cimri presence.

**Target page classification: ALIGNED** (Product schema with AggregateOffer, price, breadcrumb — correct type). **Mismatch severity: ALIGNED.**
**Real gaps found on the page itself (not type-related):**
- 396 words — thin vs. a market where even marketplace listings carry Q&A/review volume.
- H2 "Müşteri Yorumları" exists in the DOM, but the Product schema has **no `aggregateRating`/`review` fields** — either there are no real reviews yet, or existing reviews aren't marked up. This is a Trust gap against Trendyol/Cimri, which show review counts directly in the SERP snippet.
- One competitor (al.com.tr) is capturing adjacent "nedir" informational demand with a blog post that this SERP still surfaces — evidence that a definitional companion piece helps even for a mostly-transactional query.

**Recommendation:** Keep the product page as-is (type is correct). **New page suggestion:** a short glossary/rehber entry "Kaygan Zemin Uyarı İşareti Ne Anlama Gelir?" linking into this product — captures the adjacent informational slice without touching the product page. **Flag for owner approval, not urgent:** add real `aggregateRating` schema once genuine reviews exist — do not fabricate.

---

### 2.4 "dikkat ölüm tehlikesi" — 720/mo, pos 30
**URL:** `/urun/dikkat-380v-olum-tehlikesi-levhasi`

**SERP composition (7 results):** Hepsiburada (marketplace), uysisguvenligi.com.tr (product), Cimri (price comparison), buris.com.tr (product), propazar.com (product), ozsahinlerelektrik.com (product), trafikgerecleri.com (product).
**Dominant type:** Product Page / marketplace. **Confidence: ~95% (transactional).**

**Target page classification: ALIGNED**, but note a **query-breadth mismatch**: the tracked keyword is the generic "dikkat ölüm tehlikesi," while markala's ranking URL is the voltage-specific "380V" variant. A searcher wanting a generic danger-of-death sign (e.g., open pit, water well, construction — per SERP snippets mentioning "su kuyuları, dere, kanalizasyon açıklıkları") may not want an electrical-specific sign.
**Mismatch severity: ALIGNED type / MEDIUM long-tail targeting gap.**
**Recommendation (new-page/catalog scope, not a rewrite):** verify whether a generic (non-voltage) "Dikkat Ölüm Tehlikesi" SKU/page exists in the catalog; if not, this is a **new product page** opportunity, separate from the existing 380V variant — do not merge or rewrite the existing page. Otherwise this keyword's ceiling is set by Hepsiburada/Cimri authority, which content changes won't move.

---

### 2.5 "gaziantep matbaa" — 720/mo, pos 34
**URL:** `/matbaa/gaziantep`

**SERP composition (9 results):** bulurum.com (local business directory), **gaziantepmatbaa.com.tr** (exact-match domain, local company homepage), matbaa.gaziantep.edu.tr (university print office), Armut ("En İyi 40 Gaziantep Matbaa Baskı Firması" — directory of local firms), ozcanofset.com.tr, fonmatbaacilik.com (directory), kolumanofset.com, gaziantepmatba.com, aktifmatbaacilik.com — all local Gaziantep company homepages.
**Dominant type:** Local Business homepage / local directory listing. **Confidence: ~90%+ (local intent).**
**Inferred SERP features:** near-certain Google Maps local pack (classic "[city] + [business type]" pattern) — not observable via this tool but this query shape triggers it in virtually all cases.

**Target page classification: Service (area-served) page** — honestly and correctly marked up with `Service` + `areaServed: Gaziantep` schema, `provider` = the real Mersin-based `LocalBusiness`. This is good schema hygiene (no fake local address was invented), but it **cannot win a local-pack-dominated SERP**, and it competes in organic against businesses with genuine local NAP/GBP signals and exact-match domains.
**Mismatch severity: CRITICAL — structural, not content-fixable.** This is the one keyword in the set where page-level SXO work has a low ceiling.
**Recommendation:** Do **not** invest further content effort chasing local-pack visibility here without a real physical presence, partner pickup-point, or local GBP listing strategy in Gaziantep — that is a `/seo local` scope question (GBP/citations), not an SXO content fix. If the business wants to keep competing on this term, the realistic lever is paid local campaigns or a genuine logistics/partner presence, not page restructuring. Recommend flagging this explicitly to the owner as a "keyword to deprioritize for organic" rather than promising a content fix.

---

### 2.6 "emniyet kemerini kullanınız" (kullaniniz) — 390/mo, pos 45
**URL:** `/urun/emniyet-kemerini-kullaniniz`

**SERP composition (9 results):** propazar.com, tabela.com.tr, ilgitrafik.com, uyaritabelasi.com, onlinelevha.com (tag/category page), bboreklam.com, trafikgerecleri.com, gunyoltrafik.com, mignatis.com — all product or product-category pages.
**Dominant type:** Product Page. **Confidence: ~95% (transactional).**

**Target page classification: ALIGNED** (Product schema, correct type). **Mismatch severity: ALIGNED type / phrasing gap.**
**Finding:** 6 of 9 competitor titles use **"takınız"** ("Emniyet Kemerini Takınız") rather than "kullanınız." "Takınız" (fasten/put on) is the more idiomatic Turkish verb for seatbelt signage; "kullanınız" (use) is grammatically valid but less market-standard phrasing. This may be splitting topical/relevance signals from what both users and competitors actually search and title with.
**Recommendation:** Verify with a keyword-volume check whether "emniyet kemerini takınız" carries meaningfully higher demand than "kullanınız." If confirmed, **this requires either a title/H1 change on the existing product page (needs owner approval, since it's a visible content change)** or, if the catalog treats these as genuinely distinct sign variants, a **new product page** for the "takınız" phrasing. Either path should be scoped as a decision for the owner, not applied silently — flagging here per the no-silent-content-change constraint.

---

### 2.7 Supporting example — "topraklama sembolü" (210/mo, pos 71) — outside the top-6 volume cut, included because it demonstrates the exact pattern Task 2 asked to verify

**URL:** `/urun/topraklama-etiketi-...`

**SERP composition (8 results):** pcbasic.com (technical blog explainer), rapidtables.org (reference/schematic-symbols site), elektrikprojecizimi.net (explainer), ilgitrafik.com (product, but titled "...Sembolü... Üretimi" — informational framing baked into a product page), alteksan.com ("Topraklama İşareti Nedir?" — direct definitional article from a competitor), ahmetturanalgin.com (engineering blog), uyaritabelasi.com (product, "sembolü/levhası/etiketi" framing), topraklama.com (glossary/definition image page).
**Dominant type:** Definitional/explainer content (Blog Post/reference). **Confidence: ~65-70% informational**, with 2 of 8 being product pages that still lead with "nedir/sembolü" framing rather than pure SKU/price framing.

**Target page classification: Product Page** (bare SKU, price, configurator — no definitional content). **Mismatch severity: CRITICAL.** This is the pattern Task 2 asked about: a purely definitional/"what does this symbol mean" query is being answered by a page that assumes the visitor already knows what they want to buy.
**Persona reality check:** likely electrical technicians, students, or engineers referencing the symbol — not necessarily signage buyers at the moment of searching.
**Recommendation:** **New page**, not an edit to the existing product page: a short explainer ("Topraklama Sembolü Nedir? Anlamı ve Kullanım Alanları") in the glossary/rehber layer, matching the "nedir" framing competitors use even on their product pages, linking down into the existing `/urun/topraklama-etiketi-...` page for the transactional slice of the audience.

---

## 3. Pattern Analysis (Task 2) — should product pages be supported by informational content?

**Finding: partially confirmed, and the top-6 set actually shows the site getting this mostly right, with two clear exceptions.**

- Purely transactional İSG queries (kaygan zemin, ölüm tehlikesi, emniyet kemeri) → correctly answered by Product pages. Type is not the problem for these three.
- The one purely definitional query in the top 6 ("...hangi renk kullanılır") → correctly routed to an informational rehber page in principle, but the page's primary entity doesn't match the specific question (content-target mismatch, see 2.1).
- The one supporting example outside the top 6 ("topraklama sembolü") → **is** answered by a bare product page against an informational-dominant SERP — this is the literal mismatch pattern the task hypothesized, just not present among the six highest-volume rows.

**Recommendation — build a genuine three-layer topical hub, without rewriting existing pages:**
1. **Glossary/Guide layer (new content):** short "nedir / ne anlama gelir / hangi renk" entries — one per symbol/regulatory fact — answering the exact question in the H1 and first paragraph. Use the existing `/sozluk` (Matbaa Sözlüğü) and `/rehber` sections as the home for these; do not merge them into product pages.
2. **Category layer (existing, mostly fine):** `/kategori/is-guvenligi-*` pages capture "[type] fiyatları/çeşitleri" mid-funnel intent.
3. **Product layer (existing, mostly fine):** individual SKU pages capture branded/specific-name transactional queries.
4. **Internal linking (needs owner sign-off since it touches existing pages, even if link-only):** every new glossary entry should link down contextually into the 2-4 most relevant category/product pages; every product/category FAQ should link up to the matching glossary entry for visitors who arrive wanting context first. Currently, the ISG rehber page's FAQ answers (e.g., "Levha renkleri ne anlama geliyor?") are **plain text with no outbound links** to the specific product examples they reference — a missed contextual-routing opportunity that could be added without changing any visible wording (link insertion only).

---

## 4. Personas & Site-Experience Scoring (Task 3)

Personas derived strictly from the SERP signal clusters observed above (no invented personas).

**Persona A — İSG Sınav Adayı (Certification Exam Candidate).** *Awareness stage.*
Evidence: isgsorucoz.com / isgasistan.net (exam-question banks) ranking for "hangi renk kullanılır."
Goal: find the single correct answer fast, possibly to memorize for a test. Emotional state: task-focused, not shopping. Barrier: information gap (needs the exact fact, fast) + is served commercial CTAs that don't apply to them.

**Persona B — İSG Uzmanı / İşveren (Compliance Buyer).** *Decision stage.*
Evidence: uysisguvenligi.com.tr, propazar.com, trafikgerecleri.com and similar niche competitor product pages dominate 3 of 6 SERPs; ISO 7010 language present in markala's own meta descriptions.
Goal: source the exact compliant sign for a specific hazard, ideally in bulk, with confidence it meets the Yönetmelik. Emotional state: risk-averse (compliance liability). Barrier: trust gap (no visible review counts) + price-comparison fatigue (Cimri/Trendyol offer instant comparison, markala doesn't visibly counter this).

**Persona C — KOBİ Sahibi / Pazarlama Sorumlusu (SMB Marketing Print Buyer).** *Consideration stage.*
Evidence: Armut aggregator + 8 competing dedicated pricing pages for "broşür fiyatları."
Goal: get a fast, comparable per-unit price without calling sales. Emotional state: price-sensitive, comparison-shopping across several matbaa sites in parallel. Barrier: price sensitivity + trust (no visible portfolio/testimonial proof of print quality on the pricing page itself).

**Persona D — Yerel Gaziantep İşletmecisi (Local Business Owner Seeking a Nearby Printer).** *Consideration stage.*
Evidence: 8/9 results for "gaziantep matbaa" are local Gaziantep company homepages or local directories.
Goal: find a printer they can visit, drop files off at, or get same-day service from. Emotional state: prefers local, wants low-friction personal contact. Barrier: local presence gap — markala ships from Mersin and cannot satisfy "local" as a category, only "fast delivery to Gaziantep."

**Persona E — Teknisyen / Mühendislik Öğrencisi (Technical Researcher).** *Awareness stage.*
Evidence: pcbasic.com, rapidtables.org, elektrikprojecizimi.net, ahmetturanalgin.com dominating "topraklama sembolü."
Goal: understand what a symbol means/looks like, not necessarily buy anything today. Barrier: technical confusion / information gap; served a pure SKU page with no explanation.

### Persona Scores

| Persona | Relevant Page(s) | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|---|
| A — İSG Sınav Adayı | `/rehber/isg-zorunlu-uyari-levhalari` | 12/25 | 10/25 | 8/25 | 5/25 | 35/100 | Critical Mismatch |
| B — İSG Uzmanı / İşveren | `/urun/dikkat-kaygan-zemin`, `/urun/dikkat-380v-olum-tehlikesi-levhasi`, `/urun/emniyet-kemerini-kullaniniz` | 22/25 | 18/25 | 12/25 | 20/25 | 72/100 | Good |
| C — KOBİ Sahibi (Broşür) | `/rehber/brosur-baski-fiyatlari-2026` | 22/25 | 19/25 | 12/25 | 20/25 | 73/100 | Good |
| D — Yerel Gaziantep İşletmecisi | `/matbaa/gaziantep` | 10/25 | 15/25 | 14/25 | 18/25 | 57/100 | Needs Work (structural ceiling) |
| E — Teknisyen/Öğrenci | `/urun/topraklama-etiketi-...` | 6/25 | 5/25 | 5/25 | 5/25 | 21/100 | Critical Mismatch |

**Weakest persona: E — Teknisyen/Öğrenci (21/100).**
**Top issue:** page offers zero definitional content for a symbol the searcher doesn't yet recognize; every CTA assumes purchase intent that isn't present yet.
**Recommended fix:** new glossary entry (Section 2.7) — does not touch the existing product page.

**Second weakest: A — İSG Sınav Adayı (35/100)**, but note this persona has structurally low commercial value (exam candidates, not buyers) — recommend fixing for visibility/brand-awareness reasons (Section 2.1's new glossary page), not expecting conversion lift.

**Systemic issue across B, C, D:** Trust dimension is the lowest-scoring dimension even for the "Good" personas (12-14/25 across the board) — no visible review counts/ratings, no embedded portfolio/testimonial proof on the pages that most need it (product and pricing pages). This is a cross-cutting gap independent of any single keyword.

**Priority actions (weakest-first):**
1. New glossary/explainer page for topraklama sembolü (Persona E, Section 2.7).
2. New glossary/explainer page for güvenlik işareti renkleri (Persona A, Section 2.1) — expect visibility, not conversions.
3. Address the systemic Trust gap: add genuine `aggregateRating`/review schema once real reviews exist (Persona B, Section 2.3) — flag to owner, do not fabricate.
4. Local-intent keyword ("gaziantep matbaa") — redirect owner expectations toward `/seo local` / paid channels rather than further content investment (Persona D, Section 2.5).

---

## 5. SERP Features Summary (Task 4) — inferred, not directly observed (see Limitations)

| Keyword | Likely features | Content structure needed to compete |
|---|---|---|
| ...hangi renk kullanılır | PAA / AI Overview (high confidence) | Single direct-answer paragraph matching the exact question, FAQ schema (already have FAQPage — reuse pattern on new page) |
| broşür fiyatları | Google Ads (print-shop bidding is common); no strong snippet signal | Price table above the fold, ebat × tiraj matrix (already present) |
| dikkat kaygan zemin | Shopping/product carousel, image pack plausible (Trendyol/Cimri presence) | Product schema + image + price (already present); reviews to compete with marketplace trust signals |
| dikkat ölüm tehlikesi | Shopping/product carousel (Hepsiburada/Cimri presence) | Same as above; consider generic (non-voltage) SKU |
| gaziantep matbaa | Local Pack (near-certain) | Not achievable via content alone — needs GBP/local presence (`/seo local` scope) |
| emniyet kemerini kullanınız | Shopping/product carousel plausible | Same as kaygan zemin; verify "takınız" phrasing |
| topraklama sembolü (supporting) | PAA / AI Overview plausible (reference-site presence) | Definitional explainer with symbol image + short answer |

---

## 6. Concrete Recommendation Summary (Task 5)

| Keyword | URL | Verdict | Action type |
|---|---|---|---|
| ...hangi renk kullanılır | /rehber/isg-zorunlu-uyari-levhalari | Keep page; content-target mismatch | **New page** (glossary entry) — existing page untouched |
| broşür fiyatları | /rehber/brosur-baski-fiyatlari-2026 | Keep, page-type aligned | No page-type change; optional internal-link addition (needs approval) |
| dikkat kaygan zemin | /urun/dikkat-kaygan-zemin | Keep, page-type aligned | No page-type change; **new** companion glossary entry; trust-schema addition needs approval |
| dikkat ölüm tehlikesi | /urun/dikkat-380v-olum-tehlikesi-levhasi | Keep, page-type aligned | Consider **new** generic (non-voltage) product page |
| gaziantep matbaa | /matbaa/gaziantep | Structural mismatch — deprioritize for organic | No content fix will close this; refer to `/seo local` / paid |
| emniyet kemerini kullanınız | /urun/emniyet-kemerini-kullaniniz | Keep, page-type aligned; phrasing gap | Needs owner decision: **edit existing title/H1** (approval required) or **new variant page** |
| topraklama sembolü (supporting) | /urun/topraklama-etiketi-... | Page-type mismatch — informational query, product page | **New page** (definitional entry) — existing page untouched |

**Nothing above requires silently editing visible copy on an existing page.** The two items that would touch an existing page (broşür internal links, emniyet kemeri title/H1) are explicitly flagged as needing owner approval per the stated constraint.

---

## 7. Cross-Skill Referrals

- E-E-A-T / thin content on product & rehber pages (Persona B/C trust gaps) → `/seo content` for deeper content-quality analysis.
- Missing `aggregateRating`/`review` schema on product pages → `/seo schema` once real review data exists.
- "gaziantep matbaa" local-pack mismatch → `/seo local` for a full GBP/citation feasibility assessment before investing further here.
- Thin word counts across all 6 pages (395-941 words) relative to competitor depth → `/seo page` for a page-level audit of each URL.

---

## 8. Limitations

- SERP features (PAA, AI Overview, local pack, shopping carousel) were **inferred from result composition and query pattern**, not observed via a live SERP-rendering tool — flagged inline wherever used.
- No mobile-vs-desktop SERP differentiation was possible with the available tooling.
- Review/testimonial presence was assessed from Product schema fields only (no `aggregateRating` found); actual on-page review widgets may exist without schema markup — worth a manual visual check.
- Search volumes/positions are taken as given from the supplied Semrush export and not independently re-verified in this pass.
- Keyword-variant volume comparison ("kullanınız" vs. "takınız") was not run — flagged as a follow-up data request, not concluded.
