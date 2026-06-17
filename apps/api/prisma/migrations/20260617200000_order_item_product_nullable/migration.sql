-- Kampanya paketi (CampaignPackage) kalemleri Product değildir → product_id NULL olabilmeli.
-- Mevcut satırlar etkilenmez (NOT NULL → NULL güvenli genişletme).
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;
