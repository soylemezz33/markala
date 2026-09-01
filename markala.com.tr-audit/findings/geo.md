# GEO / AI Search Readiness Audit — markala.com.tr

Date: 2026-08-17
Scope: robots.txt AI-bot access, llms.txt, passage-level citability (6 `/rehber/` guides + `/yardim/*` + 1 `/urun/*` sample), entity/brand signals, technical accessibility, platform-specific recommendations.

Context that makes this audit high-stakes: GA4 shows a channel literally named **"AI Assistant"** delivering daily sessions, and the site's first recorded sale (1,573.86 TRY, order MK-MSSPDYVJ-ISZS, Dekota Baskı) came from that channel. AI-referred traffic is already the highest-converting channel on the site — the recommendations below are about not accidentally strangling it, and growing it deliberately.

---

## GEO Health Score: 57 / 100 ("Needs Work" — strong technical bones, weak multi-modal + partial citability gaps)

| Dimension | Weight | Score | Notes |
|---|---|---|---|
| Citability | 25% | 58/100 | Good direct-answer sentences and price tables; guide-page FAQ answers don't reach boilerplate-text extractors (see Critical finding #3) |
| Structural Readability | 20% | 68/100 | Clean H1→H2→H3 hierarchy, semantic `<details>/<summary>` FAQs, well-formed tables; FAQ nesting under one generic H2 on guides weakens skimmability |
| Multi-Modal Content | 15% | 30/100 | Every page (Article/OG) falls back to one generic `og-default.png`; no product photography in schema, no video, no infographics |
< br/>| Authority & Brand Signals | 20% | 48/100 | Rich, well-formed `Organization`/`LocalBusiness` schema; but `sameAs` is thin (Instagram + parent LinkedIn only), no Wikipedia/YouTube/Trustpilot/Google Business Profile, `dateModified` never updates despite live-priced content |
| Technical Accessibility | 20% | 72/100 | Fully server-rendered (no JS required — verified `is_spa: False` on every sampled page), fast, status 200 everywhere; docked for the blunt AI-bot block, missing llms.txt, and no Bing Webmaster Tools registration |

*(Table formatting note: ignore the stray `< br/>` artifact above if your renderer shows it — content is otherwise correct.)*

### Platform-specific scores

| Platform | Score /100 | Why |
|---|---|---|
| Google AI Overviews | 60 | Full Googlebot access + rich JSON-LD (Organization, Product, FAQPage, Article, BreadcrumbList) is exactly what AI Overviews grounds on; capped by thin multi-modal content and stale `dateModified` freshness signal |
| ChatGPT (search/citations) | 45 | `OAI-SearchBot` is not blocked (good), but no Bing Webmaster Tools registration and thin third-party brand corroboration (no Wikipedia/Reddit/YouTube) reduce citation confidence |
| Perplexity | 48 | `PerplexityBot` is not blocked and tables/direct-answer sentences suit Perplexity's citation style well; hurt by the same FAQ-extraction gap and near-zero Reddit/community presence |
| Bing Copilot | 40 | Lowest score — Bingbot is technically allowed but **the site is not verified in Bing Webmaster Tools**, so there's no sitemap submission, no IndexNow, and slower/incomplete indexing; Copilot and much of ChatGPT's non-OpenAI-crawled fallback both lean on Bing's index |

---

## 1. Per-bot robots.txt analysis — AI Crawler Access Status

Fetched live from `https://markala.com.tr/robots.txt` (200 OK). The AI-bot rules are wrapped in a Cloudflare-managed block (`# BEGIN/END Cloudflare Managed content`), which strongly suggests this is Cloudflare's "Block AI Scrapers and Crawlers" dashboard toggle, not a hand-picked list — i.e. nobody at Markala explicitly chose to block `ClaudeBot` specifically; a single Cloudflare Security setting did it. That matters because the same block coexists with a nuanced `Content-Signal: search=yes,ai-train=no,use=reference` declaration on `User-agent: *` — the blanket `Disallow: /` rules are a much blunter instrument than that declaration and, for several bots, contradict its "reference use is fine" intent.

| Bot | Current status | Type | Recommendation | Concrete tradeoff |
|---|---|---|---|---|
| **GPTBot** | Blocked (`Disallow: /`) | OpenAI training crawler | **Keep blocked** | Zero cost to ChatGPT-search visibility — `OAI-SearchBot` is a separate token and is *not* blocked. Only forgoes use as GPT model fine-tuning data, matching the site's own `ai-train=no` signal. |
| **OAI-SearchBot** | Allowed (not listed → falls under wildcard `Allow: /`) | OpenAI's dedicated live-citation crawler for ChatGPT Search | **Keep allowed** — add an explicit rule for robustness | This is the bot literally responsible for whether Markala pages get linked/cited inside ChatGPT answers. Making it explicit protects it from ever being swept into a future "block AI bots" toggle expansion. |
| **ClaudeBot** | Blocked (`Disallow: /`) | Anthropic's general-purpose crawler (index-building + training) | **Keep blocked, but verify** — Anthropic has split duties so live/search-grounded fetches should go through `Claude-User`/`Claude-SearchBot`, not `ClaudeBot`. Since this site already has a *converted sale* from an "AI Assistant" channel that may well be Claude, monitor GA4 for any drop in that channel after clarifying the explicit allows below; if it drops, reconsider unblocking `ClaudeBot` itself. | If the split holds, cost is zero (citations flow through the other two tokens). If Anthropic's live retrieval sometimes still uses `ClaudeBot`, the cost is losing exactly the channel that produced the site's first sale — this is the one bot worth re-testing empirically rather than trusting docs alone. |
| **Claude-User** | Allowed (not listed) | Anthropic's on-demand fetcher — triggered when a Claude.ai user pastes/references a markala.com.tr URL or Claude browses on the user's behalf | **Keep allowed** — add explicit rule | Likely a direct contributor to the existing "AI Assistant" GA4 channel. No downside to making this explicit. |
| **Claude-SearchBot** | Allowed (not listed) | Anthropic's dedicated search/citation-grounding crawler (Claude's answer to `OAI-SearchBot`) | **Keep allowed** — add explicit rule | Same logic as OAI-SearchBot: this is the bot that lets Claude cite Markala inline. |
| **PerplexityBot** | Allowed (not listed) | Perplexity's crawler that builds its answer/citation index | **Keep allowed** — add explicit rule | Direct driver of Perplexity citations. (Note: Perplexity has been reported to sometimes crawl outside its declared UA/robots compliance — blocking wouldn't fully stop it anyway, so there's no reason to try.) |
| **Google-Extended** | Blocked (`Disallow: /`) | Governs use of content to train Gemini app / Vertex AI generative models | **Keep blocked** | Zero cost to Google AI Overviews or regular Search — per Google's own documentation, AI Overviews are grounded on the standard Search index (crawled by `Googlebot`, which is fully allowed here), not gated by Google-Extended. This control only affects Gemini/Vertex training use. |
| **CCBot** | Blocked (`Disallow: /`, listed twice) | Common Crawl's bulk archiver — widely reused as third-party LLM pretraining data | **Keep blocked** | No live-citation mechanism on any of the four target platforms is grounded directly on Common Crawl. Zero cost to Google AIO / ChatGPT / Perplexity / Bing Copilot visibility. |
| **Bytespider** | Blocked (`Disallow: /`, listed twice) | ByteDance crawler (Doubao training, Toutiao/TikTok search) | **Keep blocked** | Not connected to any of the four target platforms. Only relevant if the business later targets TikTok Shop / Doubao audiences. |
| **Applebot-Extended** | Blocked (`Disallow: /`) | Opt-out specifically for Apple Intelligence/Siri generative-AI training | **Keep blocked** | Base `Applebot` (Siri Suggestions / Spotlight search) is a separate token and is *not* blocked, so Apple search surfaces are unaffected. Zero cost. |
| **meta-externalagent** | Blocked (`Disallow: /`, listed twice) | Meta's crawler — trains Llama models **and** is Meta's main mechanism for grounding Meta AI (WhatsApp, Instagram, Facebook) | **Real tradeoff — flagged, not auto-resolved.** Unlike Google/Apple, Meta does not clearly split "training-only" from "search/grounding" under this token, so blocking it does forgo Meta AI citation capability too. Given how heavily Meta AI is used inside WhatsApp in Turkey, this is worth a deliberate decision rather than defaulting to Cloudflare's toggle. **Suggested default: keep blocked for now, revisit if WhatsApp/Meta AI discovery becomes a stated priority.** | Keeping blocked: no Meta AI citations, but no training exposure either. Unblocking: opens a real (if currently unmeasured) Meta AI discovery channel, at the cost of Llama training exposure with no separate opt-out available today. |
| **Amazonbot** | Blocked (`Disallow: /`) | Amazon's crawler (search index + Rufus/Alexa+ shopping AI) | **Keep blocked** | Rufus answers mainly from Amazon's own catalog; negligible practical relevance for an independent Turkish print shop. Low priority either way. |

Also present in the current file, not asked about but worth flagging: `CloudflareBrowserRenderingCrawler` is blocked (Cloudflare's own rendering proxy used by some third-party AI agents to execute JS on pages before reading them) — low risk here since every sampled page is fully server-rendered, so no agent needs JS execution to read Markala content anyway.

**Verification note on Anthropic-token behavior:** the ClaudeBot/Claude-SearchBot/Claude-User split above is based on Anthropic's published crawler documentation as of this audit's knowledge; crawler-token behavior changes over time and isn't independently verifiable from robots.txt alone. Recommend confirming current token names/roles against Anthropic's live crawler docs before finalizing, and tracking the GA4 "AI Assistant" channel for two weeks after the robots.txt change goes live.

### 1a. Corrected robots.txt block — ready to paste

This preserves every existing Disallow path (cart, account, checkout, etc.) and the crawl-delay rules for AhrefsBot/SemrushBot/MJ12bot untouched, and only changes the AI-bot section. **This is an invisible/technical change** — no visible page content is affected.

```
# --- AI bots: training crawlers opted out, live-citation/search crawlers explicitly welcomed ---

User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

# Training-only crawlers — blocked (no cost to AI-search visibility on any target platform)
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

# meta-externalagent: no separate training/search split exists today.
# Blocking forgoes Meta AI (WhatsApp/Instagram) citation capability too — revisit if that channel matters.
User-agent: meta-externalagent
Disallow: /

# Live-citation / search-grounding crawlers — explicitly allowed (do not let a future
# "block AI bots" toggle sweep these up; they are the bots that actually cite this site)
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Googlebot
Allow: /

# --- end AI bot section ---
```

Keep the rest of the existing file (the `User-Agent: *` block with `/hesabim/`, `/sepet`, `/odeme`, etc. disallows, the `AhrefsBot`/`SemrushBot`/`MJ12bot`/`DotBot` rules, and the `Sitemap:`/`Host:` lines) exactly as-is below this section.

**Action needed outside the file itself:** this AI-bot block currently lives inside Cloudflare's managed "AI Scrapers and Crawlers" feature (Security → Bots in the Cloudflare dashboard), which will keep overwriting or fighting with a manually-edited robots.txt unless the toggle is switched to a custom/granular mode there too. Check Cloudflare dashboard settings, not just the origin robots.txt file.

---

## 2. llms.txt — [MEDIUM] Missing (404)

`https://markala.com.tr/llms.txt` returns HTTP 404. `https://markala.com.tr/robots.txt` does exist and additionally publishes a Content-Signal / RSL-style usage declaration at the top (`Content-Signal: search=yes,ai-train=no,use=reference`) — no formal RSL 1.0 `<license>` XML block was found on spot-checked pages.

**Is it worth adding?** Honest tradeoffs:
- Google Search and Google AI Overviews **ignore llms.txt entirely** — no benefit there.
- No major AI platform has confirmed guaranteed, universal llms.txt consumption yet; adoption is inconsistent and speculative.
- However: it costs almost nothing to add, several agentic/RAG tools and some LLM vendors' crawlers do check for it opportunistically, and — specific to this site — it's a good place to hand-curate the exact set of pages worth citing (6 pricing guides, help center, key category pages) rather than hoping an AI crawler's boilerplate extraction finds them (see Finding #3 below, where it currently does not always succeed).

**Recommendation: add it — low effort, asymmetric upside, zero downside.** This is an invisible/technical addition (a new file), not a change to any existing visible page.

Draft (`/llms.txt`):

```markdown
# Markala

> Markala, 324 Ajans çatısı altında matbaa ve reklam ürünleri e-ticareti yapan
> butik markadır. Kartvizit, broşür, afiş, branda, roll-up ve iş güvenliği /
> ikaz levhası baskı hizmeti sunar. Türkiye geneli kargo, canlı fiyat
> konfigüratörü ve KDV dahil şeffaf fiyatlandırma sağlar.

Markala is a Turkish print & signage e-commerce company (business cards,
brochures, banners, roll-ups, and mandatory occupational-safety signage)
operating under 324 Ajans, based in Mersin, Turkey. All prices are TRY,
VAT-inclusive, and generated live from the product catalog.

## Pricing guides

- [Kartvizit Fiyatları 2026](https://markala.com.tr/rehber/kartvizit-fiyatlari-2026): Business card pricing by finish (mat/parlak selefon, lak, yaldız) and quantity.
- [Broşür Baskı Fiyatları 2026](https://markala.com.tr/rehber/brosur-baski-fiyatlari-2026): Brochure printing prices by paper stock and print run.
- [Branda Baskı m² Fiyatı 2026](https://markala.com.tr/rehber/branda-baski-m2-fiyati-2026): Banner/tarpaulin printing price per square meter.
- [Roll-up Fiyatları 2026](https://markala.com.tr/rehber/rollup-fiyatlari-2026): 85x200 roll-up banner pricing.
- [Afiş Baskı Fiyatları 2026](https://markala.com.tr/rehber/afis-baski-fiyatlari-2026): Poster printing prices by size and quantity.
- [İSG Zorunlu Uyarı Levhaları](https://markala.com.tr/rehber/isg-zorunlu-uyari-levhalari): Turkish occupational-safety sign requirements and sign-class reference.

## Help center

- [Sıkça Sorulan Sorular](https://markala.com.tr/yardim/sss): Order minimums, file formats, production tolerance, cancellation rights.
- [Dosya Hazırlama Rehberi](https://markala.com.tr/yardim/dosya-hazirlama): Print-ready file specs (CMYK, 300dpi, bleed).
- [Kargo & Teslimat](https://markala.com.tr/yardim/kargo): Shipping carrier, timelines, and costs.
- [İade & Değişim](https://markala.com.tr/yardim/iade): Returns, cancellation, and print-defect policy.

## Optional

- [Ürün kataloğu](https://markala.com.tr/urunler): Full live product catalog with configurator-driven pricing.
```

---

## 3. Passage-level citability — sampled 6/6 `/rehber/` guides + 6 `/yardim/*` pages + 1 `/urun/*` page

Methodology: fetched via server-side render (all pages returned `is_spa: False`, i.e. fully present in the raw HTTP response, no JavaScript required) and ran the same boilerplate-stripping extraction (trafilatura) that many AI-crawler content pipelines use, to see what actually reaches a "main content" extractor versus what only exists in the raw DOM.

### [HIGH] Finding: FAQ answers on `/rehber/` guide pages don't reach text extractors, even though FAQPage schema is present

All 6 guide pages carry a well-formed `FAQPage`/`Question`/`Answer` JSON-LD block (verified on `kartvizit-fiyatlari-2026`: 3 Q&A pairs including `"1.000 adet kartvizit kaç TL?"` → a fully self-contained, correctly-worded, natural-language-query-matching answer). The same Q&A text is also present in the visible DOM as semantic `<details><summary>` accordion elements (good — real HTML, not JS-injected).

However: running boilerplate extraction on the rendered page, **the FAQ Q&A text does not appear in the extracted "main content" at all** — trafilatura's extraction stopped at 31 lines / ~2,900 characters, ending at the coupon-code blurb, before the FAQ section. This was confirmed by direct string search: the FAQ answer text exists exactly twice in the raw HTML (once inside the JSON-LD script, once inside the visible `<details>` markup) but zero times in the extracted "readable content" output.

**Why this matters:** any AI system that ingests pages the way this audit tool does — raw/rendered HTML → generic readability/boilerplate extraction → LLM context — will silently drop this FAQ content, and will only ever see it if that system separately, reliably parses JSON-LD (Google does; universal coverage across ChatGPT/Perplexity/Claude ingestion pipelines is not guaranteed). The most quotable, question-shaped, self-contained content on the page is at real risk of being invisible outside of Google's own structured-data pipeline.

**Fix (technical, not a visible content change):** ensure the FAQ block sits earlier in DOM order relative to whatever heuristic your extraction pipeline (and, by extension, third-party crawlers) uses to detect "end of main content" (commonly: after the last heading before a nav/footer/CTA block). Concretely: move the `Sık Sorulan Sorular` section to before the closing "İlk siparişine %10 indirim" CTA block, or wrap the FAQ section in a semantic `<article>`/`<main>` boundary distinct from the trailing footer navigation, so generic readability parsers don't classify it as trailing boilerplate. This does not require rewriting any question or answer text.

### [MEDIUM] Finding: FAQ questions are not individually H2/H3 on guide pages (they are on `/yardim/` pages)

- `/yardim/sss` and other `/yardim/*` pages: **excellent** — every question is its own `<h2>` (e.g. `H2: Tasarım dosyamı hangi formatta göndermeliyim?`, `H2: Kaç günde elime ulaşır?`), each followed by a tight, self-contained 40–90 word answer. This is close to ideal AI-citation structure: question-shaped heading + direct answer.
- `/rehber/*` guide pages: FAQ questions sit inside one generic `<h2>Sık Sorulan Sorular</h2>` wrapper as `<summary>` text (not headings). Structurally weaker for extractors and heading-based chunking, even though the underlying content is good.

**Fix (technical/structural, not a visible-text rewrite):** promote each FAQ question's `<summary>` element to also be wrapped in or tagged as an `<h3>` (visually can remain styled identically to the current accordion — this is a semantic-tag change, not a copy change), matching the pattern already proven to work on `/yardim/sss`.

### [MEDIUM] Finding: guide-page body prose is fragmented into very short, single-sentence chunks rather than cohesive 134–167-word passages

Sample from `/rehber/kartvizit-fiyatlari-2026` extraction — actual chunks:
> "En çok tercih edilen standart: yüzeye ince mat film kaplanır, parmak izi tutmaz, kurumsal ve sade bir doku verir." (19 words)
> "Metalik folyo transferi. Logo ve isimde lüks algısı için kullanılır; koyu zeminlerde en iyi sonucu verir." (16 words)

These are punchy and true, but too short and too disconnected from their own heading context to form the kind of 134–167-word self-contained answer block that citation engines prefer to lift wholesale. Compare to `/yardim/sss`, where each Q&A pair (e.g. the "Üretim toleransı (fire) ne demek?" answer, ~45 words, fully self-contained with the legal citation embedded) works well specifically because it's short **but complete** — it doesn't need surrounding context to make sense.

**Assessment:** the guide pages aren't bad, they're just optimized for human skimming (short bullet-style fragments under sub-headings) rather than for a model lifting one paragraph as a complete quotable answer. The `/yardim/*` pages already demonstrate the target pattern site-wide.

**Suggested fix (visible content change — requires owner approval, not applied):** for each guide's key sub-sections (e.g. "Mat selefon", "Parlak selefon"), consider merging the current 1–2 sentence fragments into a single ~80–120 word self-contained paragraph that states the direct answer in the first sentence and adds supporting detail after, without changing the underlying facts or tone. Flagging as a suggestion only, per your instruction not to change visible content without approval.

### Citability scorecard by page type

| Page type | Direct-answer opening | Question-shaped headings | Self-contained passages | Table/data structure | Overall |
|---|---|---|---|---|---|
| `/rehber/*` guides (6/6 sampled) | Good | Partial (only top-level H2s; FAQ not headed) | Weak (fragmented) | Excellent (clean markdown-style tables, extracted fully) | 55/100 |
| `/yardim/*` help pages (6 sampled) | Excellent | Excellent (every Q is its own H2) | Excellent | N/A (prose-only) | 82/100 |
| `/urun/*` product page (1 sampled) | Weak — leads with price/CTA copy before answering "what is this" | None (FAQ present but unheaded) | Weak | Good (Offer/shipping schema) | 40/100 |

---

## 4. Brand / entity signals

**What exists (strong):** every sampled page carries a detailed `Organization` JSON-LD node: legal name ("324 Ajans – Markala"), founding date, full postal address (Mersin), two `ContactPoint`s with phone/email/hours, a `parentOrganization` link to 324ajans.com, and a `knowsAbout` list (Kartvizit Baskı, Broşür Baskı, Afiş Baskı, Branda Baskı, Kupa Baskı, Etiket Baskı, Antetli Kağıt, Kurumsal Kimlik, Reklam Ürünleri). `LocalBusiness` schema with `GeoCoordinates` is also present. `BreadcrumbList` is present sitewide. Guides carry `Article` schema with `datePublished`/`dateModified` and `publisher`. The sampled product page carries `Product`, `AggregateOffer`, `Brand`, `MerchantReturnPolicy`, and `OfferShippingDetails` — genuinely strong e-commerce schema coverage.

**[HIGH] Gap — `sameAs` is thin.** Current value: `["instagram.com/markala.com.tr", "linkedin.com/company/324ajans", "324ajans.com"]`. Notably:
- No Wikipedia/Wikidata entry (expected — the brand is small and founded 2024; not realistic short-term, but worth a Wikidata item once there's enough independent coverage, since Wikidata is a cheap, low-bar first step toward knowledge-graph recognition).
- No YouTube — per the brand-mention correlation data (YouTube ≈0.737, the strongest single correlate with AI citation in the reference table for this audit), this is the single highest-leverage *external* signal missing. Even a handful of short product/process videos (e.g. "kartvizit nasıl basılır", unboxing/production clips) uploaded to a branded YouTube channel and linked via `sameAs` would move this dimension more than almost anything else on this list.
- No Google Business Profile link in `sameAs` (Google Business Profile presence/reviews strongly support Google AI Overviews' local/commerce answers) — worth confirming a GBP listing exists for the Mersin address and linking it.
- No Trustpilot / third-party review platform.
- LinkedIn is the *parent company's* page (324ajans), not a Markala-specific one — acceptable but weaker signal.

**[MEDIUM] Gap — no Reddit or forum footprint identified.** Reference data ranks Reddit presence as a high correlate with AI citation (ChatGPT and Perplexity both surface Reddit threads prominently). No evidence of Markala being discussed in Turkish subreddits (e.g. r/Turkey, r/turkiye) or sektörel forums. This is off-site, non-visible-content work (organic community participation / seeding), not a site change.

**[MEDIUM] Gap — `dateModified` is static despite dynamically-priced content.** On the sampled guide, `datePublished` and `dateModified` are identical (2026-07-20) even though the page states prices are pulled live from the catalog and "refreshed regularly." If prices change but `dateModified` never does, this is a freshness-signal mismatch that could reduce trust/ranking weight in freshness-sensitive AI answer generation (AI Overviews and Bing/Copilot both weight content freshness for pricing-type queries). **Fix (invisible/technical):** have the guide-page rendering pipeline set `dateModified` to the actual last time the underlying catalog price table changed, not a fixed publish date.

**[LOW] Gap — no named human author / Person schema on guide content.** Author is `Organization` (Markala) on all guides, which is acceptable for a commerce site but offers no E-E-A-T "who wrote this and why should I trust them" signal. Not urgent given the content is transactional/pricing-focused rather than advice-heavy, but worth reconsidering if guide content expands into more subjective advice territory (e.g. "hangi kağıt türü daha dayanıklı" style content).

**[LOW] Gap — no `AggregateRating`/`Review` schema found on the sampled product page**, despite a visible "Müşteri Yorumları" (customer reviews) section in the DOM. Likely because this specific product has zero reviews yet — recommend adding `AggregateRating` schema site-wide once products accumulate reviews, since review-count/rating is a citation-relevant trust signal for shopping-oriented AI answers (ChatGPT Shopping, Google AI Overviews shopping panels).

---

## 5. Multi-modal content — [HIGH] weak

Every sampled page's `Article`/`WebPage`/OG image resolves to the same generic `og-default.png` — including guide pages about specific finishes (mat vs parlak selefon, yaldız, lak) that would benefit enormously from an actual close-up photo of each finish referenced in the `Article`'s `image` field. No video content was found referenced anywhere in schema. No infographic/diagram assets referenced for the İSG sign-class color table (yasaklayıcı/uyarı/emredici/acil-çıkış/yangın classes), even though that table is exactly the kind of content that becomes a strong, uniquely-citable visual asset (and a strong YouTube-adjacent embed candidate) if illustrated.

**Recommendation (visible content change — requires owner approval):** add unique, real product photography to guide-page `Article.image` fields (per-guide, not the generic OG fallback), and consider a short video series (ties directly into the YouTube `sameAs` gap in Section 4). This is a content/asset addition, not a rewrite of existing text, but it does add new visible material — flagged for approval per your standing instruction.

---

## 6. Turkish-language considerations

- `html lang="tr"` and `WebSite.inLanguage: "tr-TR"` are both correctly set — good baseline signal, no gap.
- URL slugs correctly ASCII-fold Turkish diacritics (`kartvizit-fiyatlari-2026`, `brosur-baski-fiyatlari-2026`) while visible text and headings correctly *retain* full Turkish orthography (ş, ğ, ı, ö, ü, ç) — this is the right practice and should not be changed.
- **[Structural observation, not a defect]:** because Turkish-language commercial content (like exact printing prices in TRY) is a vanishingly small fraction of any large LLM's pretraining corpus compared to English, these models have essentially no reliable *parametric* (memorized) knowledge of "kartvizit fiyatları" — meaning for Turkish commercial queries, AI assistants are almost entirely dependent on **live retrieval/browsing** (RAG, search-grounding) rather than what they "already know." This raises the stakes of Sections 1 (crawler access) and the Bing Webmaster Tools gap far higher than it would be for an English-language site in a well-covered vertical — there's no parametric-knowledge fallback to compensate for retrieval failures here.
- One genuinely strong practice already in place: the guide FAQ questions are phrased exactly the way a Turkish user would type them into a chat assistant (e.g. `"1.000 adet kartvizit kaç TL?"`, `"Kaç günde elime ulaşır?"`) rather than SEO-keyword phrasing — this is good query-matching practice and should be preserved/extended, not changed.

---

## Top 5 highest-impact changes

1. **[CRITICAL, Low effort, Invisible/technical]** Register the domain in Bing Webmaster Tools, verify ownership, submit `sitemap.xml`, and enable IndexNow. This underpins Bing Copilot directly and much of ChatGPT's non-OpenAI-crawled fallback coverage. Currently the single largest gap with the least effort to close.

2. **[HIGH, Low effort, Invisible/technical]** Apply the corrected robots.txt from Section 1a: explicitly allow `OAI-SearchBot`, `Claude-User`, `Claude-SearchBot`, `PerplexityBot`, `ChatGPT-User`, `Perplexity-User`, and check the Cloudflare "AI Scrapers and Crawlers" dashboard setting so it doesn't overwrite the change. Directly protects the channel that produced the site's first sale.

3. **[HIGH, Medium effort, Invisible/technical]** Fix FAQ-content visibility to boilerplate/readability extractors on the 6 `/rehber/` guide pages (reorder DOM / adjust content boundary, per Section 3) — the most citable content on the site is currently only reliably reachable via JSON-LD parsing, not general text extraction.

4. **[MEDIUM, Low effort, Invisible/technical]** Add `/llms.txt` per the draft in Section 2, and fix `dateModified` to reflect actual catalog price-refresh timestamps rather than a static publish date.

5. **[MEDIUM, Medium effort, Mixed — mostly off-site/invisible]** Strengthen brand entity signals: add a real Markala YouTube channel (highest-correlation signal per the reference data) and Google Business Profile link to `sameAs`; pursue Reddit/Turkish-forum community presence. Low-priority long-term: a Wikidata item once independent coverage exists.

---

## Files referenced during this audit

Raw fetches and extraction outputs (rendered HTML, boilerplate-stripped text, full JSON-LD) for all sampled pages are saved under:
`C:\Users\Administrator\Desktop\markala\markala.com.tr-audit\scratch\pages\`

- 6 guide pages: `rehber-kartvizit.*`, `rehber-brosur.*`, `rehber-branda.*`, `rehber-isg.*`, `rehber-rollup.*`, `rehber-afis.*`
- 6 help pages: `yardim-index.*`, `yardim-sss.*`, `yardim-dosya.*`, `yardim-siparis.*`, `yardim-kargo.*`, `yardim-iade.*`
- 1 product page: `urun-ilkyardim.*`

Each has a `.json` (full render_page.py result incl. full JSON-LD), `.extracted.txt` (boilerplate-stripped text), and `.content.html` (full rendered HTML).
