-- 2026-09-06: Sadakat programı faz 1 (ortak kararları — karar 1, 2, 5, 6).
-- İdempotent: IF NOT EXISTS; tekrar koşarsa hata vermez.

-- Kişiye özel kupon (ikinci-sipariş teşvik kodu yalnız o e-postaya)
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "assigned_email" TEXT;
CREATE INDEX IF NOT EXISTS "coupons_assigned_email_idx" ON "coupons"("assigned_email");

-- Sipariş: ikinci-sipariş maili aşaması + kod, tekrar-sipariş hatırlatması
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "retention_mail_stage" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "retention_coupon_code" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reorder_mail_sent_at" TIMESTAMP(3);

-- Kullanıcı: puan süresi + hatırlatma aşaması, misafir→üye dönüşüm tarihi
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loyalty_expires_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loyalty_expiry_mail_stage" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "guest_converted_at" TIMESTAMP(3);

-- Defter türü: süre dolumu
ALTER TYPE "LoyaltyEntryKind" ADD VALUE IF NOT EXISTS 'expire';
