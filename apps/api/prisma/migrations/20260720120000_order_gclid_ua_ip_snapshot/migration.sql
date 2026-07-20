-- Ölçümleme denetimi: Google Ads gclid + sipariş anı UA/IP snapshot'ı.
-- Hepsi additive + nullable → mevcut siparişlere dokunmaz, veri kaybı riski sıfır.
-- gclid: Ads offline dönüşüm/atıf eşleşmesi (_gcl_aw çerezinden).
-- client_user_agent / client_ip: Meta CAPI action_source=website için client_user_agent
-- fiilen zorunlu; client_ip_address eşleşme kalitesini artırır.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gclid" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "client_user_agent" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "client_ip" TEXT;
