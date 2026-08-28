BEGIN;
-- Broşürlerde açılış A7'ydi (listede ilk sırada olduğu için); Hasan: en çok tercih
-- edilen A5 - 1000 adet (2026-08-28). Sıralamayı bozmadan işaretle çözülür:
-- görünen sıra A7→A3 kalır, açılış ve "En çok tercih edilen" rozeti A5'e geçer.
UPDATE product_options
SET rules = coalesce(rules, '{}'::jsonb) || '{"varsayilan": true}'::jsonb
WHERE product_id IN (SELECT id FROM products WHERE slug IN ('brosur','pro-brosur','selefonlu-brosur'))
  AND ((group_key = 'paket' AND option_key = 'a5') OR (group_key = 'adet' AND option_key = '1000'));

-- Önceki varsayılan işaretleri (varsa) temizlenir ki tek işaretli kalsın.
UPDATE product_options
SET rules = rules - 'varsayilan'
WHERE product_id IN (SELECT id FROM products WHERE slug IN ('brosur','pro-brosur','selefonlu-brosur'))
  AND rules ? 'varsayilan'
  AND NOT ((group_key = 'paket' AND option_key = 'a5') OR (group_key = 'adet' AND option_key = '1000'));
COMMIT;
SELECT p.slug, o.group_key, o.option_key, o.option_label, coalesce(o.rules->>'varsayilan','') AS varsayilan
FROM products p JOIN product_options o ON o.product_id = p.id
WHERE p.slug IN ('brosur','pro-brosur','selefonlu-brosur') AND o.rules ? 'varsayilan'
ORDER BY p.slug, o.group_key;
