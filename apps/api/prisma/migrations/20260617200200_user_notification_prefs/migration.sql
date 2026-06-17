-- Müşteri duyuru/bildirim tercihleri (granular e-posta/SMS) — { typeId: { email, sms } }.
ALTER TABLE "users" ADD COLUMN "notification_prefs" JSONB;
