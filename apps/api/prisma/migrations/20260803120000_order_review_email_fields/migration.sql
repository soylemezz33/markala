-- cba3bc7 bu kolonları şemaya MIGRATION'SIZ ekledi → prod'da tüm order.findMany() P2022
-- (admin "Veriler yüklenemedi" olayı, 2026-08-04). Kolonlar prod'a aynı gün hotfix
-- workflow'uyla elle uygulandı; bu migration geçmişi tutarlı hale getirir:
-- IF NOT EXISTS sayesinde prod'da no-op olarak kaydedilir, taze ortamda gerçekten çalışır.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "review_token" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "review_email_sent_at" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "orders_review_token_key" ON "orders"("review_token");
