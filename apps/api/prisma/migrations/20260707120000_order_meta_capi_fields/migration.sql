-- Meta Conversions API (sunucu-taraflı Purchase) için sipariş sinyalleri.
-- Hepsi additive + nullable/default → mevcut siparişlere dokunmaz, veri kaybı yok.
-- KVKK: marketing_consent=false varsayılan → onay yoksa Meta'ya hiçbir şey gönderilmez.
ALTER TABLE "orders" ADD COLUMN "marketing_consent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "fbp" TEXT;
ALTER TABLE "orders" ADD COLUMN "fbc" TEXT;
