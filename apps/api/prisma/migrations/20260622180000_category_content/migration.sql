-- Kategori SEO içeriği (seoIntro/features/faqs/seo) için JSON kolon — mock'tan DB'ye taşınır.
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "content" JSONB;
