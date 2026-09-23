-- Manuel siparişlerde "fatura kesilmesin" bayrağı (2026-09-23). İdempotent.
-- Fatura önden elle kesilmiş siparişte sistem ikinci kez kesmesin diye.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_skip" BOOLEAN NOT NULL DEFAULT false;
