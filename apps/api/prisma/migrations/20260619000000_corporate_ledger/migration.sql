-- Cari hesap (B2B açık hesap): müşteri başına vade + borç/ödeme defteri
ALTER TABLE "users" ADD COLUMN "corporate_payment_term_days" INTEGER;

-- Siparişin ödeme yolu (null/"iyzico"/"cari"/"havale")
ALTER TABLE "orders" ADD COLUMN "payment_method" TEXT;

-- Defter hareket tipi
CREATE TYPE "LedgerEntryKind" AS ENUM ('debit', 'credit');

CREATE TABLE "corporate_ledger_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "kind" "LedgerEntryKind" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "corporate_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "corporate_ledger_entries_user_id_created_at_idx" ON "corporate_ledger_entries"("user_id", "created_at");

ALTER TABLE "corporate_ledger_entries"
    ADD CONSTRAINT "corporate_ledger_entries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
