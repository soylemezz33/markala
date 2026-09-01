-- AJA-385 · ProductImage — urun basina coklu gorsel + varyant + responsive.
--
-- IDEMPOTENT: CI "Sema <-> Migration bekcisi" geregi elle yazildi; IF NOT EXISTS ile
-- tekrar calistirilabilir (2026-08-04 P2022 olayindan sonra benimsenen desen).
--
-- Not: `url` FORMAT-AGNOSTIK base key tutar; boyut (160/400/800/1200/2000) ve
-- format (avif/webp) runtime'da turetildigi icin her varyant×boyut satir acmaz.

CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "variant_key" TEXT NOT NULL DEFAULT 'default',
    "width" INTEGER,
    "height" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "blurhash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- FK: urun silinirse gorseller de silinir (Cascade). R2/CDN'deki dosyalar ayri
-- temizlik isidir (immutable cache; orphan blob maliyeti dusuk).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_images_product_id_fkey'
  ) THEN
    ALTER TABLE "product_images"
      ADD CONSTRAINT "product_images_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- (product_id, variant_key, sort) benzersiz — ayni varyantta ayni sirada iki gorsel olmaz.
CREATE UNIQUE INDEX IF NOT EXISTS "product_images_product_id_variant_key_sort_key"
    ON "product_images" ("product_id", "variant_key", "sort");

CREATE INDEX IF NOT EXISTS "product_images_product_id_sort_idx"
    ON "product_images" ("product_id", "sort");

CREATE INDEX IF NOT EXISTS "product_images_product_id_variant_key_idx"
    ON "product_images" ("product_id", "variant_key");

-- PARTIAL UNIQUE INDEX: her urunde EN FAZLA TEK primary gorsel (Prisma @@unique
-- ile ifade edilemez; WHERE kosullu index yalnizca raw SQL ile). Ikinci bir
-- is_primary=true yazilirsa DB seviyesinde reddedilir.
CREATE UNIQUE INDEX IF NOT EXISTS "product_images_one_primary_per_product"
    ON "product_images" ("product_id")
    WHERE "is_primary" = true;

-- ============================================================================
-- ROLLBACK: bu migration'i geri almak icin (elle calistir):
--   DROP INDEX IF EXISTS "product_images_one_primary_per_product";
--   DROP INDEX IF EXISTS "product_images_product_id_variant_key_idx";
--   DROP INDEX IF EXISTS "product_images_product_id_sort_idx";
--   DROP INDEX IF EXISTS "product_images_product_id_variant_key_sort_key";
--   ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "product_images_product_id_fkey";
--   DROP TABLE IF EXISTS "product_images";
-- ============================================================================
