-- Misafir/storefront siparişleri için: adres FK'leri opsiyonel + satır-içi adres snapshot'ı.
-- Sorun: storefront checkout'ta misafir kullanıcının kayıtlı Address satırı yok; sipariş
-- yine de DB'ye düşmeli (admin panelde görünmeli). Bu yüzden shipping/billing FK opsiyonel
-- yapılır ve adres JSON snapshot olarak saklanır. Kayıtlı müşteri siparişlerinde FK aynen dolar.

-- DropForeignKey (RESTRICT → opsiyonel relation default'u SET NULL olarak yeniden eklenecek)
ALTER TABLE "orders" DROP CONSTRAINT "orders_shipping_address_id_fkey";
ALTER TABLE "orders" DROP CONSTRAINT "orders_billing_address_id_fkey";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "shipping_address_id" DROP NOT NULL,
ALTER COLUMN "billing_address_id" DROP NOT NULL,
ADD COLUMN     "shipping_address_snapshot" JSONB,
ADD COLUMN     "billing_address_snapshot" JSONB;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ROLLBACK:
-- -- Geri alma sırasında snapshot ile gelmiş (FK'si NULL) misafir siparişleri NOT NULL
-- -- kısıtını ihlal eder. Önce bu satırları temizleyin veya bir placeholder adrese bağlayın:
-- --   DELETE FROM "orders" WHERE "shipping_address_id" IS NULL OR "billing_address_id" IS NULL;
-- ALTER TABLE "orders" DROP CONSTRAINT "orders_shipping_address_id_fkey";
-- ALTER TABLE "orders" DROP CONSTRAINT "orders_billing_address_id_fkey";
-- ALTER TABLE "orders" DROP COLUMN "billing_address_snapshot";
-- ALTER TABLE "orders" DROP COLUMN "shipping_address_snapshot";
-- ALTER TABLE "orders" ALTER COLUMN "billing_address_id" SET NOT NULL;
-- ALTER TABLE "orders" ALTER COLUMN "shipping_address_id" SET NOT NULL;
-- ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
