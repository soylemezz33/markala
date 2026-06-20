-- Cari hesap (B2B açık hesap) AYLIK toplu faturası — Faz 3 otomatik aylık faturalama.
-- (user_id, period) benzersiz → aynı müşteri/ay ikinci kez faturalanmaz (idempotent).
CREATE TABLE "corporate_monthly_invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "order_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "parasut_invoice_id" TEXT,
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "corporate_monthly_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "corporate_monthly_invoices_user_id_period_key" ON "corporate_monthly_invoices"("user_id", "period");

CREATE INDEX "corporate_monthly_invoices_period_idx" ON "corporate_monthly_invoices"("period");

ALTER TABLE "corporate_monthly_invoices"
    ADD CONSTRAINT "corporate_monthly_invoices_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
