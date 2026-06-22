-- Faz A'da yanlışlıkla eklenen redundant settings tablosunu kaldır.
DROP TABLE IF EXISTS "settings";

-- Kargo yapılandırmasını mevcut site_settings sistemine taşı (group="shipping").
-- value JSON (jsonb) — sayı olarak saklanır. ON CONFLICT: var olanı bozma (idempotent).
INSERT INTO "site_settings" ("key", "value", "group", "updated_at") VALUES
  ('shipping.fee', '79'::jsonb, 'shipping', now()),
  ('shipping.freeThreshold', '750'::jsonb, 'shipping', now())
ON CONFLICT ("key") DO NOTHING;
