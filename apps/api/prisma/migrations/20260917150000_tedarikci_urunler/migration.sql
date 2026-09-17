-- Tedarikçi ürün eşlemesi (Turkuaz Promosyon XML entegrasyonu, 2026-09-17).
-- Gece senkronunun idempotency anahtarı: kodgrup ↔ Product bağı + görsel indirme kaydı.
CREATE TABLE "tedarikci_urunler" (
    "id" TEXT NOT NULL,
    "tedarikci" TEXT NOT NULL,
    "kodgrup" TEXT NOT NULL,
    "product_id" TEXT,
    "ozet" JSONB NOT NULL,
    "gorseller" JSONB NOT NULL DEFAULT '{}',
    "senkron_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tedarikci_urunler_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tedarikci_urunler_product_id_key" ON "tedarikci_urunler"("product_id");

CREATE UNIQUE INDEX "tedarikci_urunler_tedarikci_kodgrup_key" ON "tedarikci_urunler"("tedarikci", "kodgrup");
