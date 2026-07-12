-- CreateEnum
CREATE TYPE "LoyaltyEntryKind" AS ENUM ('earn', 'spend', 'adjust');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "loyalty_points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "loyalty_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "kind" "LoyaltyEntryKind" NOT NULL,
    "points" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_ledger_order_id_kind_key" ON "loyalty_ledger"("order_id", "kind");

-- CreateIndex
CREATE INDEX "loyalty_ledger_user_id_created_at_idx" ON "loyalty_ledger"("user_id", "created_at");
