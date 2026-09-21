-- Kapak görselinin alt metni. Görsel aramasında alt metnin başlığı tekrarlaması
-- değer taşımıyor; İSG/dekota yazılarında görselin KENDİSİ tarif edilmeli
-- (ör. "Topraklama işareti sembolü"). Boş bırakılırsa sayfa başlığa düşer.
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "cover_image_alt" TEXT;
