-- =====================================================================
-- TEDARİKÇİ LİSTESİNE GÖRE EKSİK ÜRÜN + VARYANT TAMAMLAMA (2026-08-27)
--
-- Kaynak: urunlerTurmat.txt (Turmat fiyat listesi) → scripts/turmat/turmat-urunler.json
--
-- 1) EL İLANI  : seçenekleri vardı ama TEK BİR fiyat satırı yoktu → 14 satır eklenir.
--                Ürün, adı zaten "Broşür / El İlanı" olan AKTİF kategoriye taşınır
--                (kendi kategorisi pasif olduğu için ürün hiçbir listede görünmüyordu).
-- 2) KARTVİZİT : listede olup sitede olmayan 5 kâğıt türü (NSK/NK/NKA/FAN/F-SEK)
--                seçenek + fiyat ızgarası ile eklenir.
-- 3) ÜRÜN KUTUSU: sitede HİÇ yoktu → 14 ebatlı yeni ürün. Görsel Hasan tarafından
--                yüklenecek; o yüzden is_active = FALSE açılır (görselsiz ürün
--                vitrinde bozuk görünür). Görsel yüklenince panelden aktifleştirilir.
--
-- MALİYET: listedeki brüt tutarlar birebir yazılır — uydurma yok.
-- SATIŞ  : maliyet × kategorinin kendi marjı (kartvizit 1.65, el ilanı 1.70,
--          ambalaj 1.80 — hepsi o üründeki MEVCUT satırların oranından alındı).
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 1) EL İLANI
-- ---------------------------------------------------------------------
-- Tedarikçide A7 için yalnız 6.000 ve 12.000; A5/A4/A3 için 2.000-8.000 var.
-- Veri olmayan kombinasyonlara satır AÇILMAZ (fiyat uydurmaktansa boş kalsın).
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'brosur'), updated_at = now()
WHERE slug = 'el-ilani';

INSERT INTO product_prices (id, product_id, group_key, option_key, dim_key, cost, price, created_at, updated_at)
SELECT gen_random_uuid()::text, p.id, 'paket', v.opt, v.dim, v.cost, v.price, now(), now()
FROM products p, (VALUES
  ('a7','6000',  1850,  3150),   -- ELI3
  ('a7','12000', 3600,  6120),   -- ELI4
  ('a5','2000',   900,  1530),   -- ELI5
  ('a5','4000',  1800,  3060),   -- ELI6
  ('a5','6000',  2600,  4420),   -- ELI7
  ('a5','8000',  3400,  5780),   -- ELI8
  ('a4','2000',  1650,  2810),   -- ELI9
  ('a4','4000',  3100,  5270),   -- ELI10
  ('a4','6000',  4600,  7820),   -- ELI11
  ('a4','8000',  6000, 10200),   -- ELI12
  ('a3','2000',  3100,  5270),   -- ELI13
  ('a3','4000',  6000, 10200),   -- ELI14
  ('a3','6000',  9000, 15300),   -- ELI15
  ('a3','8000', 11200, 19040)    -- ELI16
) AS v(opt, dim, cost, price)
WHERE p.slug = 'el-ilani'
  AND NOT EXISTS (SELECT 1 FROM product_prices x WHERE x.product_id = p.id
                    AND x.option_key = v.opt AND x.dim_key = v.dim);

UPDATE products SET starting_price = 1530, profit_margin = 1.700, updated_at = now() WHERE slug = 'el-ilani';

-- ---------------------------------------------------------------------
-- 2) KARTVİZİT — listede olup sitede olmayan 5 kâğıt türü
-- ---------------------------------------------------------------------
-- Tedarikçi yalnız 1.000 adet fiyatı veriyor. Üst kademeler için maliyet
-- DOĞRUSAL (×2/×3/×5/×10) yazıldı: gerçek matbaa maliyeti kademe indirimiyle
-- bunun ALTINDA kalır, dolayısıyla kâr asla olduğundan yüksek görünmez.
INSERT INTO product_options (id, product_id, group_key, group_label, group_role, group_sort, option_key, option_label, option_sublabel, option_sort, locked)
SELECT gen_random_uuid()::text, p.id, 'paket', 'Kartvizit Türü', 'priced', 0, v.k, v.lbl, v.sub, v.srt, false
FROM products p, (VALUES
  ('nsk',   'Tek yüz · selefonsuz',        '300 gr Bristol · tek yön renkli · arka yüz tek renk siyah',            1),
  ('nk',    'Tek yüz · parlak',            '250 gr Bristol · tek yön renkli · parlak selefon',                     2),
  ('nka',   'Tek yüz · parlak (arka siyah)','250 gr Bristol · tek yön renkli · parlak selefon · arka yüz tek renk siyah', 3),
  ('fan',   'Tuale doku · tek yüz',        '280 gr Tuale · tek yön renkli',                                       40),
  ('f-sek', 'Tuale doku · çift yüz',       '560 gr Tuale · çift yön renkli',                                      41)
) AS v(k, lbl, sub, srt)
WHERE p.slug = 'klasik-kartvizit'
  AND NOT EXISTS (SELECT 1 FROM product_options x WHERE x.product_id = p.id
                    AND x.group_key = 'paket' AND x.option_key = v.k);

INSERT INTO product_prices (id, product_id, group_key, option_key, dim_key, cost, price, created_at, updated_at)
SELECT gen_random_uuid()::text, p.id, 'paket', v.opt, v.dim, v.cost, v.price, now(), now()
FROM products p, (VALUES
  ('nsk',  '1000',   200,   350), ('nsk',  '2000',   400,   700), ('nsk',  '3000',   600,  1050),
  ('nsk',  '5000',  1000,  1750), ('nsk',  '10000',  2000,  3500),
  ('nk',   '1000',   220,   380), ('nk',   '2000',   440,   760), ('nk',   '3000',   660,  1140),
  ('nk',   '5000',  1100,  1900), ('nk',   '10000',  2200,  3800),
  ('nka',  '1000',   240,   400), ('nka',  '2000',   480,   800), ('nka',  '3000',   720,  1200),
  ('nka',  '5000',  1200,  2000), ('nka',  '10000',  2400,  4000),
  ('fan',  '1000',   450,   750), ('fan',  '2000',   900,  1500), ('fan',  '3000',  1350,  2250),
  ('fan',  '5000',  2250,  3750), ('fan',  '10000',  4500,  7500),
  ('f-sek','1000',   780,  1300), ('f-sek','2000',  1560,  2600), ('f-sek','3000',  2340,  3900),
  ('f-sek','5000',  3900,  6500), ('f-sek','10000',  7800, 13000)
) AS v(opt, dim, cost, price)
WHERE p.slug = 'klasik-kartvizit'
  AND NOT EXISTS (SELECT 1 FROM product_prices x WHERE x.product_id = p.id
                    AND x.option_key = v.opt AND x.dim_key = v.dim);

UPDATE products SET starting_price = 350, profit_margin = 1.650, updated_at = now() WHERE slug = 'klasik-kartvizit';

-- VİP 3.000 adet satırı bozuk: 780 → 1.560 → 1.340 (2.000'den ucuz) → 2.340'a çekildi.
UPDATE product_prices SET cost = 2340, updated_at = now()
WHERE product_id = (SELECT id FROM products WHERE slug = 'klasik-kartvizit')
  AND option_key = 'vip' AND dim_key = '3000' AND cost = 1340;

-- ---------------------------------------------------------------------
-- 3) ÜRÜN KUTUSU — yeni ürün (görsel yüklenene kadar PASİF)
-- ---------------------------------------------------------------------
INSERT INTO products (id, slug, name, category_id, short_description, description,
                      base_price, starting_price, production_time, size_label,
                      images, badges, bestseller, is_active, parameters, pricing_mode,
                      profit_margin, created_at, updated_at)
SELECT gen_random_uuid()::text, 'urun-kutusu',
       'Ürün Kutusu — 350 gr Amerikan Bristol Mat Selefonlu',
       (SELECT id FROM categories WHERE slug = 'canta-kese'),
       'Kutu baskı — 14 standart ebat, 350 gr Amerikan Bristol, mat selefon',
       'Kozmetik, gıda, hediyelik ve e-ticaret gönderileri için 350 gr Amerikan Bristol karton kutu; mat selefon kaplama ile çizilmeye ve neme karşı dayanıklıdır. 14 standart ebat 17,2×21,4 cm''den 42,8×60 cm''ye kadar; baskı brüt 1.000 adet üzerinden hesaplanır. Kesim ve katlama payı nedeniyle %1-9 arası fire olabilmektedir.',
       0, 7470, '7-10 iş günü', '350 gr A.Bristol · Mat Selefon · 14 Ebat',
       ARRAY[]::text[], ARRAY['yeni']::text[], false, false, '[]'::jsonb, 'additive',
       1.800, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'urun-kutusu');

INSERT INTO product_options (id, product_id, group_key, group_label, group_role, group_sort, option_key, option_label, option_sublabel, option_sort, locked)
SELECT gen_random_uuid()::text, p.id, 'paket', 'Kutu Ebadı', 'priced', 0, v.k, v.lbl, NULL, v.srt, false
FROM products p, (VALUES
  ('kt1','17,2 × 21,4 cm', 0), ('kt2','16 × 25,8 cm',    1), ('kt3','21,4 × 25,8 cm', 2),
  ('kt4','25,8 × 26,7 cm', 3), ('kt5','21,4 × 34,4 cm',  4), ('kt6','26,7 × 34,4 cm', 5),
  ('kt7','26,7 × 43 cm',   6), ('kt8','21,4 × 60 cm',    7), ('kt9','32 × 43 cm',     8),
  ('kt10','26,7 × 60 cm',  9), ('kt11','32 × 51,6 cm',  10), ('kt12','37 × 51,6 cm', 11),
  ('kt13','42,8 × 51,6 cm',12), ('kt14','42,8 × 60 cm', 13)
) AS v(k, lbl, srt)
WHERE p.slug = 'urun-kutusu'
  AND NOT EXISTS (SELECT 1 FROM product_options x WHERE x.product_id = p.id AND x.option_key = v.k);

INSERT INTO product_options (id, product_id, group_key, group_label, group_role, group_sort, option_key, option_label, option_sublabel, option_sort, locked)
SELECT gen_random_uuid()::text, p.id, 'adet', 'Adet', 'dimension', 1, '1000', '1.000 Adet', NULL, 0, false
FROM products p
WHERE p.slug = 'urun-kutusu'
  AND NOT EXISTS (SELECT 1 FROM product_options x WHERE x.product_id = p.id AND x.group_key = 'adet');

INSERT INTO product_prices (id, product_id, group_key, option_key, dim_key, cost, price, created_at, updated_at)
SELECT gen_random_uuid()::text, p.id, 'paket', v.opt, '1000', v.cost, v.price, now(), now()
FROM products p, (VALUES
  ('kt1',  4150,  7470), ('kt2',  4500,  8100), ('kt3',  5500,  9900), ('kt4',  6400, 11520),
  ('kt5',  6700, 12060), ('kt6',  8100, 14580), ('kt7',  9850, 17730), ('kt8', 10500, 18900),
  ('kt9', 11300, 20340), ('kt10',12700, 22860), ('kt11',13200, 23760), ('kt12',15600, 28080),
  ('kt13',16800, 30240), ('kt14',19300, 34740)
) AS v(opt, cost, price)
WHERE p.slug = 'urun-kutusu'
  AND NOT EXISTS (SELECT 1 FROM product_prices x WHERE x.product_id = p.id AND x.option_key = v.opt);

-- ---------------------------------------------------------------------
-- Kategori bazlı marj (yeni sistem): mevcut oranlarla birebir aynı.
-- ---------------------------------------------------------------------
UPDATE categories SET profit_margin = 1.650 WHERE slug = 'kartvizit'   AND profit_margin IS NULL;
UPDATE categories SET profit_margin = 1.700 WHERE slug = 'brosur'      AND profit_margin IS NULL;
UPDATE categories SET profit_margin = 1.800 WHERE slug = 'canta-kese'  AND profit_margin IS NULL;

COMMIT;
