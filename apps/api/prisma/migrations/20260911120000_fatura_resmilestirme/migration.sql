-- Paraşüt e-Arşiv / e-Fatura resmileştirme alanları (2026-09-11). İdempotent.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_type" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_pdf_key" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_issued_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_mailed_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_error" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_attempts" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "orders_invoice_pending_idx" ON "orders" ("parasut_invoice_id") WHERE "invoice_number" IS NULL;
