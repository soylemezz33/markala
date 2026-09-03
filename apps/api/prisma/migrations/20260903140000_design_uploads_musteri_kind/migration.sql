-- 2026-09-03 (Hasan, madde 2): müşteri checkout'ta her sepet seti için AYRI tasarım (ve tasarım başına
-- birden çok dosya) yükleyebilir. Dosyalar tasarımcı dosyalarıyla aynı tabloda tutulur:
--   kind = 'musteri', design_index = kaçıncı tasarım (0 tabanlı), user_id = NULL (müşteri).
-- Böylece Drive taşıma, panel listesi ve silme akışı tek yerde kalır. Eski uploaded_file_* alanları
-- geriye dönük uyumluluk için ilk dosyayla doldurulmaya devam eder.
ALTER TABLE "design_uploads" ADD COLUMN IF NOT EXISTS "design_index" INTEGER;

ALTER TABLE "design_uploads" DROP CONSTRAINT IF EXISTS "design_uploads_kind_check";
ALTER TABLE "design_uploads" ADD CONSTRAINT "design_uploads_kind_check"
  CHECK ("kind" IN ('onizleme', 'calisma', 'baski', 'musteri'));
