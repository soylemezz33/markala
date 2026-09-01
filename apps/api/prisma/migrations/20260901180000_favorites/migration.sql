-- Favoriler artık HESABA bağlı (2026-09-01, Hasan: "cihazlar arası senkron").
-- Önceden liste yalnız tarayıcı localStorage'ındaydı: telefonda eklenen ürün masaüstünde görünmüyordu.
-- Kullanıcı silinince (KVKK) ve ürün silinince favori kaydı da düşer.

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_product_id_key" ON "favorites"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "favorites_user_id_created_at_idx" ON "favorites"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
