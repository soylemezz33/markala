-- CreateIndex
-- Defense-in-depth: aynı iyzico ödemesi (paymentId) iki siparişe kaydedilemez.
-- Postgres unique index NULL'ları distinct sayar → ödenmemiş (iyzico_payment_id IS NULL)
-- siparişler kısıtlanmaz; yalnız non-null değerlerde benzersizlik zorlanır.
CREATE UNIQUE INDEX "orders_iyzico_payment_id_key" ON "orders"("iyzico_payment_id");
