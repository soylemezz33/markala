# Performance / Core Web Vitals Audit — markala.com.tr

Date: 2026-08-17
Status: **INCOMPLETE — stopped early by coordinator instruction.** Only 1 of 8 planned Lighthouse lab runs completed, and zero CrUX/PSI field-data calls succeeded. Everything below is labeled as either measured (with source) or "ölçülemedi" (not measured) — no numbers are invented.

## Methodology actually used

- Attempted: `claude-seo run pagespeed_check.py <url> --json` (wraps PageSpeed Insights API + CrUX API) for all 4 URLs. **Failed every time**: `"PSI rate limit exceeded (240 QPM / 25,000 QPD)"`. Root cause: no `GOOGLE_API_KEY` is configured for this project (checked `C:\Users\Administrator\Projects\markala-google\.env` — it only has Merchant/Ads keys, no PSI/CrUX key), so requests fall back to a shared, already-exhausted anonymous quota. **No CrUX field data (75th-percentile real-user data) was obtained for any URL.**
- Fallback: local Lighthouse CLI (v13.4.1, Node v24.13.1) against local Chrome, `--throttling-method=simulate`. Only the **homepage, mobile** run finished before this report was requested. Six further runs (home-desktop; category mobile+desktop; product mobile+desktop; guide mobile+desktop) were queued/scripted but **not executed** — stopped per coordinator instruction.
- `render_page.py` (for LCP element ID, image markup, font tags, third-party script inspection) was **never run** this session.

## Test coverage

| URL | Form factor | Status |
|---|---|---|
| `/` (homepage) | Mobile | **Completed** — Lighthouse lab run |
| `/` (homepage) | Desktop | ölçülemedi |
| `/kategori/vinil-branda-afis` | Mobile | ölçülemedi |
| `/kategori/vinil-branda-afis` | Desktop | ölçülemedi |
| `/urun/yelken-bayrak-damla` | Mobile | ölçülemedi |
| `/urun/yelken-bayrak-damla` | Desktop | ölçülemedi |
| `/rehber/isg-zorunlu-uyari-levhalari` | Mobile | ölçülemedi |
| `/rehber/isg-zorunlu-uyari-levhalari` | Desktop | ölçülemedi |
| CrUX field data (75th percentile, any URL) | — | ölçülemedi (PSI/CrUX API rate-limited, no API key) |

## Measured data — Homepage, Mobile, LAB ONLY (not field data)

Source: Lighthouse 13.4.1, local headless Chrome, simulated mobile throttling, single run (no median-of-N).

| Metric | Value | Threshold status |
|---|---|---|
| Performance score | 51/100 | — |
| LCP | **8.85s** (8847.9ms) | POOR (>4.0s) |
| CLS | **0.292** | POOR (>0.25) |
| FCP | 2.25s | Needs improvement (>1.8s) |
| TBT (lab proxy only — NOT INP) | 316.5ms | Needs improvement |
| TTFB / server-response-time | 160ms | GOOD |
| Speed Index | 2.49s | — |

Important caveats on this data:
- **INP was not measured.** Lighthouse lab runs cannot produce INP (it requires real user interaction/field data). TBT is a rough main-thread-busyness proxy only, not a substitute.
- **LCP element was not identified.** The audit JSON was not re-inspected for the `largest-contentful-paint-element` detail before this report was requested — ölçülemedi. Do not assume it is the hero image without verification.
- This is a **single lab run**, not the 75th-percentile field measurement Google actually uses for ranking/CWV assessment. Lab LCP/CLS can differ meaningfully from field data, especially CLS (lab often under-reports if late-loading dynamic content — ads, price configurator, embeds — doesn't fire during the short lab window).

## Not measured this session (ölçülemedi)

- Desktop metrics for the homepage.
- All metrics (mobile and desktop) for the category, product, and guide pages.
- CrUX/field-data LCP, INP, CLS, FCP, TTFB at 75th percentile for any URL.
- LCP element identification (any page).
- Third-party script (gtag/GA4, Google Ads tag, Meta Pixel, and any conditionally-loaded Clarity/Hotjar/GTM) main-thread blocking time — no trace/network analysis was run. Cannot quantify their INP/TBT contribution.
- Image audit: format (WebP/AVIF vs JPEG/PNG), intrinsic vs. displayed dimensions, lazy-loading attributes, `fetchpriority`/preload on the LCP image — no HTML/render inspection was performed.
- Font loading: preload tags, `font-display` value, number/weight of woff2 files preloaded — no HTML source inspection was performed.
- Next.js specifics: cache-control/ISR headers, JS bundle size, hydration cost, render-blocking resources — not inspected.
- Cloudflare-level config: cache TTLs, compression (brotli), Early Hints — not inspected.

## Findings (only what is actually supported by the one completed run)

1. **[CRITICAL] Homepage LCP (mobile, lab) = 8.85s — over 3x the "poor" threshold (4.0s).** This is a lab number from one run; real-world (field) LCP could be better or worse. Given it is this far past even the "poor" cutoff, it is very unlikely the field 75th percentile passes "good" (≤2.5s). Root cause (which resource/element) is unidentified — needs `render_page.py` + Lighthouse trace before remediation can be targeted.
2. **[CRITICAL] Homepage CLS (mobile, lab) = 0.292 — over the "poor" threshold (0.25).** Cause not isolated this session. Given the product-line context (price configurator, third-party scripts, ads potential), plausible contributors are dynamically injected content or images without reserved dimensions, but this is a hypothesis, not a finding — needs verification.
3. **[INFO] TTFB (mobile, lab) = 160ms — good, not a bottleneck for the homepage document itself.** This suggests server/edge response time is not the primary LCP driver; the delay is more likely in render-blocking resources, image loading, or element render delay — but this is inferred, not confirmed (LCP subparts breakdown was not pulled).
4. **[INFO] TBT (mobile, lab) = 316.5ms — "needs improvement" range.** Cannot be attributed to specific scripts (gtag, Meta Pixel, hydration, or configurator JS) without a trace, which was not run.

## Recommendations

Because only one homepage/mobile lab run completed, most recommendations below are **standard best-practice actions targeted at the two confirmed-failing metrics (LCP, CLS)**, to be validated/re-prioritized once the remaining measurements are taken. Expected-impact estimates are generic industry ranges, not measurements from this site.

1. **[HIGH][Difficulty: Low]** Run `render_page.py --mode auto --json` on the homepage to identify the actual LCP element, then apply `fetchpriority="high"` + `<link rel="preload">` (or `next/image priority`) to it, and confirm it isn't lazy-loaded or behind render-blocking CSS/JS. Expected impact: this is the single highest-leverage next step — LCP fixes typically recover 1-4s when the LCP resource was unoptimized/lazy/late-discovered; cannot be sized further without knowing the element.
2. **[HIGH][Difficulty: Low-Medium]** Once the LCP/CLS causes are identified, audit all above-the-fold images for explicit `width`/`height` (or CSS `aspect-ratio`) and reserve space for any dynamically injected UI (banners, price configurator, cookie/consent UI under Consent Mode v2). Expected impact: directly targets the 0.292 CLS reading; well-executed dimension/reservation fixes commonly bring CLS under 0.1.
3. **[MEDIUM][Difficulty: Low]** Verify gtag (GA4 + Google Ads) and Meta Pixel are both loaded non-blocking (Next.js `Script` with `strategy="afterInteractive"` or `"lazyOnload"`, Meta Pixel already stated as `lazyOnload` in task context — confirm gtag matches). Expected impact: reduces main-thread contention that shows up as TBT/INP risk, particularly relevant to the product page's price configurator; magnitude unknown until a trace is run.
4. **[MEDIUM][Difficulty: Low]** Inspect font `<link rel=preload>` tags and `font-display` CSS value in the rendered HTML (not done this session) — preload only the woff2 weights actually used above the fold, and confirm `font-display: swap` or `optional` to avoid FOIT and font-swap layout shift. Expected impact: can reduce both LCP delay (if font blocks text render) and CLS (if swap causes reflow).
5. **[LOW][Difficulty: Low, requires access]** Obtain or configure a `GOOGLE_API_KEY` for this project (or wait for the shared anonymous PSI quota to reset) and re-run `pagespeed_check.py` for all 4 URLs to get authoritative CrUX field data at the 75th percentile — this is what Google actually uses for the CWV pass/fail assessment; the lab number above is diagnostic only and can vary run-to-run.
6. **[LOW][Difficulty: Low]** Complete the remaining 7 queued Lighthouse lab runs (home-desktop; category, product, guide × mobile/desktop) to get comparable lab baselines across templates, since the price configurator (product page) and dynamic listing (category page) are the most likely INP/CLS risk areas and were not tested at all this session.

## Next steps (to close the measurement gap)

1. Re-run the already-written batch script logic for the 7 outstanding Lighthouse lab runs.
2. Run `render_page.py --mode auto --json` on all 4 URLs to get LCP element, image markup, font tags, and script-loading strategy.
3. Capture a Lighthouse trace (`--save-assets`) specifically on the product page to quantify price-configurator interaction cost and third-party script main-thread time.
4. Configure `GOOGLE_API_KEY` and pull CrUX field data (28-day, 75th percentile) for all 4 URLs — required before making any pass/fail claim against Google's actual CWV thresholds.
