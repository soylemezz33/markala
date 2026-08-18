-- Sipariş kaynağı (atıf) kolonları — 2026-08-18.
--
-- Neden: `gclid` yalnız `_gcl_aw` çerezinden veya referer'dan yakalanıyordu; ikisi de çerez
-- onayı verilmeyen kullanıcıda ÇALIŞMIYOR (çerezi gtag yalnız ad_storage=granted iken yazar,
-- ödeme adımında referer ise site-içi). Sonuç: siparişlerin çoğunda kaynak bilinmiyordu.
-- Artık istemci iniş anında URL'den yakalayıp (localStorage, onaydan bağımsız) siparişle
-- birlikte gönderiyor.
--
--   gbraid/wbraid : iOS/uygulama kampanyalarında gclid YERİNE gelir — ayrı kolon olmazsa
--                   o trafiğin tamamı "kaynak yok" görünür.
--   utm_*         : reklam DIŞI kanalları (e-posta, sosyal, AI asistan) ölçülebilir kılar.
--
-- IF NOT EXISTS: prod'a elle uygulanmış olsa bile no-op kalsın, taze ortamda gerçekten çalışsın
-- (repo deseni; bkz. 20260803120000_order_review_email_fields).
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gbraid" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "wbraid" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_source" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_medium" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_campaign" TEXT;
