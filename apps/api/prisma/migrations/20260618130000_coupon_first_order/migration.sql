-- AlterTable: kupon "yalnız ilk sipariş" kuralı
ALTER TABLE "coupons" ADD COLUMN "first_order_only" BOOLEAN NOT NULL DEFAULT false;
