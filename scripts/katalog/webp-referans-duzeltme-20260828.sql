-- WEBP DÖNÜŞÜMÜNÜN KAÇAN REFERANSLARI (2026-08-28).
-- 903 ürün görseli WebP'e çevrilip .jpg/.png dosyalar silinmişti; products.images
-- güncellenmişti ama AYNI dosyalara işaret eden diğer sütunlar atlanmıştı → 404.
-- Kategori kartlarının TAMAMI görselsiz kalmıştı.
BEGIN;
UPDATE categories SET image_url = regexp_replace(image_url, '(/uploads/products/[^?]+)\.(jpg|png)', '\1.webp'), updated_at = now()
  WHERE image_url ~ '/uploads/products/.*\.(jpg|png)';
UPDATE blog_posts SET cover_image = regexp_replace(cover_image, '(/uploads/products/[^?]+)\.(jpg|png)', '\1.webp'), updated_at = now()
  WHERE cover_image ~ '/uploads/products/.*\.(jpg|png)';
UPDATE portfolio_items SET image_url = regexp_replace(image_url, '(/uploads/products/[^?]+)\.(jpg|png)', '\1.webp')
  WHERE image_url ~ '/uploads/products/.*\.(jpg|png)';
-- Sipariş kalemindeki görsel bir ANLIK GÖRÜNTÜdür; ama dosya silindiği için sipariş
-- detayında ve e-postalarda kırık çıkıyor. Aynı görselin WebP hâline çevrilir.
UPDATE order_items SET product_image = regexp_replace(product_image, '(/uploads/products/[^?]+)\.(jpg|png)', '\1.webp')
  WHERE product_image ~ '/uploads/products/.*\.(jpg|png)';
UPDATE products SET images = (
    SELECT array_agg(regexp_replace(img, '(/uploads/products/[^?]+)\.(jpg|png)', '\1.webp') ORDER BY ord)
    FROM unnest(images) WITH ORDINALITY AS t(img, ord))
  WHERE array_to_string(images, ',') ~ '/uploads/products/.*\.(jpg|png)';
COMMIT;
\pset border 0
\pset format unaligned
select 'kalan kirik: ' || (
  (select count(*) from categories where image_url ~ '/uploads/products/.*\.(jpg|png)')
+ (select count(*) from blog_posts where cover_image ~ '/uploads/products/.*\.(jpg|png)')
+ (select count(*) from portfolio_items where image_url ~ '/uploads/products/.*\.(jpg|png)')
+ (select count(*) from order_items where product_image ~ '/uploads/products/.*\.(jpg|png)')
+ (select count(*) from products where array_to_string(images,',') ~ '/uploads/products/.*\.(jpg|png)'));
