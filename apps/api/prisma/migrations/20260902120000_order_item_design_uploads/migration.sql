-- Sipariş satırına tasarımcı dosyaları (2026-09-02, üretim ARGE Faz 2).
--
-- design_uploads tablosu init'ten beri vardı ama hiçbir yerde yazılmıyor/okunmuyordu (ölü).
-- Tasarımı Markala'nın yaptığı siparişlerde bitmiş dosya sisteme hiç girmiyor, üretimde
-- "hangi bayrak kimin" karışıklığı bundan çıkıyordu. Tablo şu eklemelerle canlandırılıyor:
--   order_item_id  → hangi sipariş SATIRI (üretim birimi sipariş değil satırdır)
--   kind           → onizleme | calisma | baski (uygulama + CHECK; Prisma enum DEĞİL —
--                    ALTER TYPE ... ADD VALUE transaction içinde çalışmaz, bkz. kargo_role)
--   storage_key    → secure/tasarim altındaki uuid.ext (silme için, URL'den türetmeye güvenme)
--   drive_file_id  → Faz 4 (Drive'a taşıma) için yer; şimdilik hep NULL
-- user_id yeniden anlamlandırıldı (yükleyen personel) — yeni FK gerekmiyor.
--
-- İDEMPOTENT: repoda İKİ init migration var (baseline tuzağı, bkz. staging-db-reset.yml);
-- bu dosya tekrar çalışsa da hata vermesin diye her ifade IF NOT EXISTS / pg_constraint
-- kontrolüyle yazıldı. Prisma her ifadeyi ayrı çalıştırır; DO $$ bloğu tek ifadedir.
-- Geri alma: kod geri alınır, kolonlar nullable/varsayılanlı olduğu için eski kod çalışmaya
-- devam eder. DROP migration YAZMA.

ALTER TABLE "design_uploads" ADD COLUMN IF NOT EXISTS "order_item_id" TEXT;
ALTER TABLE "design_uploads" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'calisma';
ALTER TABLE "design_uploads" ADD COLUMN IF NOT EXISTS "storage_key" TEXT;
ALTER TABLE "design_uploads" ADD COLUMN IF NOT EXISTS "drive_file_id" TEXT;

CREATE INDEX IF NOT EXISTS "design_uploads_order_item_id_idx" ON "design_uploads"("order_item_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_uploads_order_item_id_fkey') THEN
    ALTER TABLE "design_uploads"
      ADD CONSTRAINT "design_uploads_order_item_id_fkey"
      FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_uploads_kind_check') THEN
    ALTER TABLE "design_uploads"
      ADD CONSTRAINT "design_uploads_kind_check"
      CHECK ("kind" IN ('onizleme', 'calisma', 'baski'));
  END IF;
END $$;
