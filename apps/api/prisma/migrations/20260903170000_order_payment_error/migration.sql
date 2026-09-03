-- 2026-09-03: başarısız ödemenin nedenini panelde okunabilir kılmak için (Hasan).
-- İdempotent: ADD COLUMN IF NOT EXISTS, tekrar koşarsa hata vermez.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_error_code" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_error_message" TEXT;
