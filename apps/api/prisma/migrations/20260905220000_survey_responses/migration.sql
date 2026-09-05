-- 2026-09-05: Formbricks teslimat sonrası anket yanıtları (Hasan / ops stack kurulumu).
-- Review tablosuna dokunulmadı: Review ürün yorumu (tek puan + zorunlu product_id),
-- bu tablo sipariş bazlı anket (ürün + kargo puanı ayrı). İkisi farklı şeyler.
-- İdempotent: IF NOT EXISTS, tekrar koşarsa hata vermez.

CREATE TABLE IF NOT EXISTS "survey_responses" (
  "id"          TEXT NOT NULL,
  "survey_id"   TEXT NOT NULL,
  "response_id" TEXT NOT NULL,
  "order_id"    TEXT,
  "customer_id" TEXT,
  "urun_puan"   INTEGER,
  "kargo_puan"  INTEGER,
  "yorum"       TEXT,
  "raw"         JSONB,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- Aynı yanıt iki kez gelirse (Formbricks retry) ikinci kayıt oluşmasın.
CREATE UNIQUE INDEX IF NOT EXISTS "survey_responses_response_id_key"
  ON "survey_responses"("response_id");

CREATE INDEX IF NOT EXISTS "survey_responses_order_id_idx"
  ON "survey_responses"("order_id");

CREATE INDEX IF NOT EXISTS "survey_responses_created_at_idx"
  ON "survey_responses"("created_at");
