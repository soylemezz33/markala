-- Refresh token cihaz ailesi (2026-09-17): replay tespiti hesap geneli yerine aile bazlı iptal eder. İdempotent.
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "family_id" TEXT;
CREATE INDEX IF NOT EXISTS "refresh_tokens_family_id_idx" ON "refresh_tokens" ("family_id");
