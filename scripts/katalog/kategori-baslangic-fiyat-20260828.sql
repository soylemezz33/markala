-- Kategori baslangic fiyatlari canli katalogla eslenir (2026-08-28).
-- categories.starting_price ELLE tutulan bir alan; katalog degisince bayatliyor ve
-- kategori kartinda yanlis '...TL'den baslayan' yaziyordu (masa bayragi 450 yazip
-- gercekte 150'den basliyordu -> musteri kaybi; folyo 199 yazip 219'dan basliyordu).
BEGIN;
UPDATE categories SET starting_price = 352.8, updated_at = now() WHERE slug = 'dekota-baski';  -- 530 -> 353
UPDATE categories SET starting_price = 218.74, updated_at = now() WHERE slug = 'folyo';  -- 199 -> 219
UPDATE categories SET starting_price = 350, updated_at = now() WHERE slug = 'kartvizit';  -- 480 -> 350
UPDATE categories SET starting_price = 158.76, updated_at = now() WHERE slug = 'kirlangic-bayrak';  -- 182 -> 159
UPDATE categories SET starting_price = 105, updated_at = now() WHERE slug = 'makam-bayragi';  -- 100 -> 105
UPDATE categories SET starting_price = 150, updated_at = now() WHERE slug = 'masa-bayragi';  -- 450 -> 150
UPDATE categories SET starting_price = 123.48, updated_at = now() WHERE slug = 'vinil-branda-afis';  -- 116 -> 123
COMMIT;
