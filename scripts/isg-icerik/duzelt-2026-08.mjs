#!/usr/bin/env node
/**
 * İSG ürün veri düzeltmesi — 2026-08-24 feedback testi (B2/B3/B4) için SQL üretir.
 *
 * B2: icerik-toplu.json'daki specifications/features/useCases/faqs 827 üründe DB'ye
 *     hiç uygulanmamıştı (yalnız elle yazılan 10 üründe vardı). content JSONB'sine
 *     MERGE edilir; specifications anahtarı zaten olan ürünlere DOKUNULMAZ.
 * B3: 828 ürünün tamamının product_prices satırları var (additive mod) ama açıklama
 *     hâlâ "TEKLİF USULÜYLE satılır" diyordu. Açıklama content.seo.description'dan
 *     (ürüne özgü metin) yeniden kurulur; short_description'daki "teklif usulü"
 *     ibaresi kaldırılır.
 * B4: Aynı kategori + aynı (normalize) isimli kopyalar tekilleştirilir: sipariş
 *     referansı olan slug korunur, sonra sayısal soneksiz/kısa/eski slug tercih
 *     edilir; kalanlar is_active=false yapılır (SİLİNMEZ — sipariş/istatistik izi).
 *
 * Kullanım: node scripts/isg-icerik/duzelt-2026-08.mjs > /tmp/isg-duzelt.sql
 * Ardından: psql -f (markala-postgres konteynerinde, önce yedek al).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const toplu = JSON.parse(fs.readFileSync(path.join(DIR, "icerik-toplu.json"), "utf8"));

const out = [];
out.push("-- İSG düzeltme 2026-08-24 (üretici: duzelt-2026-08.mjs) — idempotent");
out.push("BEGIN;");

// ── B2: içerik merge ─────────────────────────────────────────────────────────
for (const u of toplu) {
  const patch = JSON.stringify({
    specifications: u.specifications,
    features: u.features,
    useCases: u.useCases,
    faqs: u.faqs,
  });
  if (patch.includes("$json$")) throw new Error(`dollar-quote çakışması: ${u.slug}`);
  out.push(
    `UPDATE products SET content = coalesce(content,'{}'::jsonb) || $json$${patch}$json$::jsonb, updated_at = now() ` +
      `WHERE slug = '${u.slug.replace(/'/g, "''")}' AND NOT (coalesce(content,'{}'::jsonb) ? 'specifications');`,
  );
}

// ── B3: açıklama düzeltmesi (yalnız fiyat satırı OLAN + teklif metinli İSG) ──
out.push(`
UPDATE products p SET
  description = (p.content->'seo'->>'description')
    || ' Ebat, malzeme ve baskı seçeneklerine göre fiyat ürün sayfasında anında hesaplanır; ödemeyi online tamamlayabilirsiniz.',
  short_description = replace(replace(p.short_description,
    'teklif usulü iş güvenliği levhası', 'ISO 7010 uyumlu iş güvenliği levhası — seçime göre anında fiyat'),
    'Teklif usulü', 'Anında fiyatlı'),
  updated_at = now()
WHERE p.category_id IN (SELECT id FROM categories WHERE slug LIKE 'is-guvenligi%')
  AND p.description LIKE '%TEKLİF USULÜ%'
  AND coalesce(p.content->'seo'->>'description','') <> ''
  AND EXISTS (SELECT 1 FROM product_prices pr WHERE pr.product_id = p.id);
`);

// ── B4: tekilleştirme (deaktivasyon; sipariş referanslı slug korunur) ────────
out.push(`
WITH isg AS (
  SELECT p.id, p.slug, p.name, p.category_id, p.created_at
  FROM products p JOIN categories c ON p.category_id = c.id
  WHERE c.slug LIKE 'is-guvenligi%' AND p.is_active
),
siparisli AS (SELECT DISTINCT product_slug FROM order_items),
grp AS (
  SELECT id, slug, row_number() OVER (
    PARTITION BY category_id, lower(regexp_replace(trim(name), '\\s+', ' ', 'g'))
    ORDER BY
      (slug IN (SELECT product_slug FROM siparisli)) DESC,  -- siparişte geçen kopya kalır
      (slug ~ '-[0-9]+$') ASC,                              -- sayısal soneksiz tercih
      length(slug) ASC,
      created_at ASC
  ) AS rn
  FROM isg
)
UPDATE products SET is_active = false, updated_at = now()
WHERE id IN (SELECT id FROM grp WHERE rn > 1);
`);

out.push("COMMIT;");
out.push(`
-- Kontrol çıktısı
WITH isg AS (SELECT p.* FROM products p JOIN categories c ON p.category_id=c.id WHERE c.slug LIKE 'is-guvenligi%')
SELECT
 (SELECT count(*) FROM isg WHERE is_active) AS aktif,
 (SELECT count(*) FROM isg WHERE NOT is_active) AS pasif,
 (SELECT count(*) FROM isg WHERE content ? 'specifications' AND is_active) AS spec_var,
 (SELECT count(*) FROM isg WHERE description LIKE '%TEKLİF USULÜ%' AND is_active) AS teklif_kalan,
 (SELECT count(*) FROM (SELECT 1 FROM isg WHERE is_active GROUP BY category_id, lower(regexp_replace(trim(name),'\\s+',' ','g')) HAVING count(*)>1) d) AS yinelenen_grup;
`);

process.stdout.write(out.join("\n") + "\n");
