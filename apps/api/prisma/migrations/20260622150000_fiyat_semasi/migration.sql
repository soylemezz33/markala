-- CreateTable
CREATE TABLE "product_options" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "group_key" TEXT NOT NULL,
    "group_label" TEXT NOT NULL,
    "group_role" TEXT NOT NULL,
    "group_sort" INTEGER NOT NULL DEFAULT 0,
    "option_key" TEXT NOT NULL,
    "option_label" TEXT NOT NULL,
    "option_sublabel" TEXT,
    "option_sort" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "group_key" TEXT,
    "option_key" TEXT,
    "dim_key" TEXT,
    "cost" DECIMAL(10,2),
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);
-- CreateIndex
CREATE INDEX "product_options_product_id_group_sort_option_sort_idx" ON "product_options"("product_id", "group_sort", "option_sort");
CREATE INDEX "product_prices_product_id_idx" ON "product_prices"("product_id");
-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
