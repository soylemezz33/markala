-- 2026-09-03: müşterinin checkout'ta yüklediği dosya, ödeme kesinleşince Drive sipariş klasörüne
-- taşınır (Hasan: "o da gitsin"). Drive dosya kimliği burada tutulur; dolu olması = taşındı
-- (idempotency anahtarı). Geriye dönük: mevcut satırlar NULL kalır, ilk ödeme onayında taşınır.
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "uploaded_file_drive_id" TEXT;
