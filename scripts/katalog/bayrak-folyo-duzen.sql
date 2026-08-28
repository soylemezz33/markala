-- =====================================================================
-- 2026-08-28 · Hasan onaylı dört düzenleme
--   1) Folyo ürününün slug'ı değişir (yönlendirme next.config.mjs'te)
--   2) Kırlangıç Bayrak: Ebat × Kumaş tek matris (Raşel 2,50 $/m² · Saten 3,75 $/m²)
--   3) Masa Bayrağı: Takım grubu (Sadece Bayrak 80₺ · 1'li 200₺ · 2'li 220₺ · 3'lü 240₺)
--   4) Makam Bayrağı: "Bayrak + Direk" GOLD ve KROM olarak ikiye ayrılır
-- =====================================================================
BEGIN;

-- ── 1) Folyo Çeşitleri — slug ────────────────────────────────────────
-- Adres /urun/cam-folyosu-kesimli → /urun/folyo-cesitleri. Eski adres 301 ile
-- yenisine taşınır (next.config.mjs), böylece Google sıralaması korunur.
UPDATE products SET slug = 'folyo-cesitleri', updated_at = now()
WHERE slug = 'cam-folyosu-kesimli';

-- ── 2) Kırlangıç Bayrak — Ebat × Kumaş ───────────────────────────────
-- ÖNCE: yalnız "Kumaş" grubu (Raşel/Saten) vardı, ebat seçilemiyordu.
-- Ebat ile kumaş AYRI gruplar olamaz: Saten farkı ebada göre değişiyor
-- (0,9 m²'de +1,13 $, 1,5 m²'de +1,88 $) — toplamalı motor sabit fark ister.
-- Bu yüzden ikisi TEK grupta çarpım olarak tanımlanır.
--   alan   = en × boy       60×150 = 0,90 m² · 70×150 = 1,05 m² · 75×200 = 1,50 m²
--   maliyet= alan × m² fiyatı   Raşel 2,50 $ · Saten 3,75 $
DELETE FROM product_prices WHERE product_id = (SELECT id FROM products WHERE slug='kirlangic-bayrak-3m');
DELETE FROM product_options WHERE product_id = (SELECT id FROM products WHERE slug='kirlangic-bayrak-3m');

INSERT INTO product_options (id, product_id, group_key, group_label, group_role, group_sort, option_key, option_label, option_sublabel, option_sort, locked, rules)
SELECT gen_random_uuid()::text, p.id, 'paket', 'Ebat × Kumaş', 'priced', 0, v.k, v.lbl, v.sub, v.srt, false,
       '{"effect":"perPiece","birim":"dolar"}'::jsonb
FROM products p, (VALUES
  ('60x150-rasel','60 × 150 cm — Raşel','0,90 m² · ekonomik', 0),
  ('60x150-saten','60 × 150 cm — Saten','0,90 m² · parlak dokulu', 1),
  ('70x150-rasel','70 × 150 cm — Raşel','1,05 m²', 2),
  ('70x150-saten','70 × 150 cm — Saten','1,05 m²', 3),
  ('75x200-rasel','75 × 200 cm — Raşel','1,50 m² · büyük boy', 4),
  ('75x200-saten','75 × 200 cm — Saten','1,50 m² · büyük boy', 5)
) AS v(k, lbl, sub, srt)
WHERE p.slug = 'kirlangic-bayrak-3m';

-- Şekil ücretsiz (Hasan tablosu: Düz / Kırlangıç / Üçgen — hepsi ücretsiz).
-- Fiyat satırı YOK → motor 0 ekler; grup yalnız seçim içindir.
INSERT INTO product_options (id, product_id, group_key, group_label, group_role, group_sort, option_key, option_label, option_sublabel, option_sort, locked)
SELECT gen_random_uuid()::text, p.id, 'sekil', 'Şekil', 'priced', 1, v.k, v.lbl, 'ücretsiz', v.srt, false
FROM products p, (VALUES ('duz','Düz',0), ('kirlangic','Kırlangıç',1), ('ucgen','Üçgen',2)) AS v(k, lbl, srt)
WHERE p.slug = 'kirlangic-bayrak-3m';

INSERT INTO product_prices (id, product_id, group_key, option_key, dim_key, cost, price, created_at, updated_at)
SELECT gen_random_uuid()::text, p.id, 'paket', v.k, NULL, v.cost, 0, now(), now()
FROM products p, (VALUES
  ('60x150-rasel', 2.25), ('60x150-saten', 3.38),
  ('70x150-rasel', 2.63), ('70x150-saten', 3.94),
  ('75x200-rasel', 3.75), ('75x200-saten', 5.63)
) AS v(k, cost)
WHERE p.slug = 'kirlangic-bayrak-3m';

-- ── 3) Masa Bayrağı — Takım ──────────────────────────────────────────
-- Ürünün hiç seçeneği yoktu. Fiyatlar Viniltürk listesiyle birebir (TL).
-- Satış = maliyet × 1,8 (ambalaj/aksesuar marjı), 10₺'ye yuvarlandı.
DELETE FROM product_prices WHERE product_id = (SELECT id FROM products WHERE slug='masa-bayragi-krom');
DELETE FROM product_options WHERE product_id = (SELECT id FROM products WHERE slug='masa-bayragi-krom');

INSERT INTO product_options (id, product_id, group_key, group_label, group_role, group_sort, option_key, option_label, option_sublabel, option_sort, locked)
SELECT gen_random_uuid()::text, p.id, 'takim', 'Takım', 'priced', 0, v.k, v.lbl, v.sub, v.srt, false
FROM products p, (VALUES
  ('sadece-bayrak','Sadece Bayrak','14 × 21 cm · 160 gr saten kumaş', 0),
  ('1li','1''li Takım','bayrak + krom direk + mermer taban', 1),
  ('2li','2''li Takım','iki bayrak + ikili standlı direk', 2),
  ('3lu','3''lü Takım','üç bayrak + üçlü standlı direk', 3)
) AS v(k, lbl, sub, srt)
WHERE p.slug = 'masa-bayragi-krom';

INSERT INTO product_prices (id, product_id, group_key, option_key, dim_key, cost, price, created_at, updated_at)
SELECT gen_random_uuid()::text, p.id, 'takim', v.k, NULL, v.cost, v.price, now(), now()
FROM products p, (VALUES
  ('sadece-bayrak',  80,  150),
  ('1li',           200,  360),
  ('2li',           220,  400),
  ('3lu',           240,  430)
) AS v(k, cost, price)
WHERE p.slug = 'masa-bayragi-krom';

UPDATE products SET starting_price = 150, updated_at = now() WHERE slug = 'masa-bayragi-krom';

-- ── 4) Makam Bayrağı — direk rengi İçindekiler'e taşınır ─────────────
-- ÖNCE: "Bayrak + Direk" tek seçenekti; Hasan'ın tablosunda ayrıca "Çubuk Rengi"
-- (Gold 55 $ / Krom 50 $) diye AYRI bir grup vardı. Motor priced grupları TOPLADIĞI
-- için ikisi birlikte girilirse müşteri direği İKİ KEZ öderdi (55 + 55 = 110 $).
-- Viniltürk de bunu ayrı ürün olarak tutuyor (Gold Takım 55 $ / Krom Takım 50 $),
-- ek seçenek olarak değil. Bu yüzden direk rengi İçindekiler'in İÇİNE alınır.
-- Kur 49 · maliyet = $ × 49 · satış = mevcut satırın kâr oranı korunarak (×1,52).
DELETE FROM product_prices
WHERE product_id = (SELECT id FROM products WHERE slug='makam-bayragi-puskullu')
  AND group_key = 'i-cindekiler';
DELETE FROM product_options
WHERE product_id = (SELECT id FROM products WHERE slug='makam-bayragi-puskullu')
  AND group_key = 'i-cindekiler';

INSERT INTO product_options (id, product_id, group_key, group_label, group_role, group_sort, option_key, option_label, option_sublabel, option_sort, locked)
SELECT gen_random_uuid()::text, p.id, 'i-cindekiler', 'İçindekiler', 'priced', 0, v.k, v.lbl, v.sub, v.srt, false
FROM products p, (VALUES
  ('sadece-bayrak','Sadece Bayrak','100 × 150 cm · 160 gr saten', 0),
  ('bayrak-krom-direk','Bayrak + Krom Direk','krom kaplama demir direk dahil', 1),
  ('bayrak-gold-direk','Bayrak + Gold Direk','gold kaplama demir direk dahil', 2)
) AS v(k, lbl, sub, srt)
WHERE p.slug = 'makam-bayragi-puskullu';

INSERT INTO product_prices (id, product_id, group_key, option_key, dim_key, cost, price, created_at, updated_at)
SELECT gen_random_uuid()::text, p.id, 'i-cindekiler', v.k, NULL, v.cost, v.price, now(), now()
FROM products p, (VALUES
  ('sadece-bayrak',    1470, 2240),   --  30 $ × 49
  ('bayrak-krom-direk',2450, 3730),   --  50 $ × 49
  ('bayrak-gold-direk',2695, 4100)    --  55 $ × 49
) AS v(k, cost, price)
WHERE p.slug = 'makam-bayragi-puskullu';

-- Saçak: Viniltürk 1,70 $ → 83 ₺ maliyet. "Yok" ücretsiz (fiyat satırı yok).
UPDATE product_options SET group_label = 'Saçak', option_label = 'Gold Saçak'
WHERE product_id = (SELECT id FROM products WHERE slug='makam-bayragi-puskullu')
  AND group_key = 'puskul' AND option_key = 'sarmasi';
UPDATE product_options SET group_label = 'Saçak', option_label = 'Gümüş Saçak'
WHERE product_id = (SELECT id FROM products WHERE slug='makam-bayragi-puskullu')
  AND group_key = 'puskul' AND option_key = 'metalik';
UPDATE product_options SET group_label = 'Saçak', option_label = 'Saçaksız'
WHERE product_id = (SELECT id FROM products WHERE slug='makam-bayragi-puskullu')
  AND group_key = 'puskul' AND option_key = 'yok';
UPDATE product_prices SET cost = 83, price = 105, updated_at = now()
WHERE product_id = (SELECT id FROM products WHERE slug='makam-bayragi-puskullu')
  AND group_key = 'puskul';

UPDATE products SET starting_price = 2240, updated_at = now() WHERE slug = 'makam-bayragi-puskullu';

COMMIT;
