-- Müşteri panelinden online (iyzico) cari hesap ödemesi (tahsilat).
-- Başarılı ödemede bir corporate_ledger_entries(credit) kaydı oluşturulup bakiye düşürülür.
CREATE TABLE "corporate_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "iyzico_token" TEXT,
    "iyzico_payment_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    CONSTRAINT "corporate_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "corporate_payments_user_id_status_idx" ON "corporate_payments"("user_id", "status");

ALTER TABLE "corporate_payments"
    ADD CONSTRAINT "corporate_payments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
