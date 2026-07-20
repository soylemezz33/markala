-- Bekleyen-ödeme kurtarma maili aşaması (LifecycleService saatlik cron).
-- 0 = gönderilmedi, 1 = ilk hatırlatma (2-24 saat), 2 = son hatırlatma (24-72 saat).
-- Additive + default'lu → mevcut siparişlere dokunmaz; eski siparişler zaten 72 saat
-- penceresinin dışında kaldığı için geriye dönük mail tetiklenmez.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "recovery_mail_stage" INTEGER NOT NULL DEFAULT 0;
