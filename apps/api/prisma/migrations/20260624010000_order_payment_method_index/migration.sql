-- CreateIndex
CREATE INDEX "orders_payment_method_created_at_idx" ON "orders"("payment_method", "created_at");
