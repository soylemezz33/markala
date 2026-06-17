-- iyzico checkout token (init'te saklanır) — callback kaçarsa reconciliation güvenlik ağı için.
ALTER TABLE "orders" ADD COLUMN "iyzico_checkout_token" TEXT;
