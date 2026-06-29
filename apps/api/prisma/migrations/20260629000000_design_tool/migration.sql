-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "design_id" TEXT;

-- CreateTable
CREATE TABLE "designs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "product_id" TEXT,
    "template_id" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Tasarım',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "document" JSONB NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "width_mm" INTEGER NOT NULL,
    "height_mm" INTEGER NOT NULL,
    "bleed_mm" INTEGER NOT NULL DEFAULT 3,
    "preview_url" TEXT,
    "print_file_url" TEXT,
    "print_file_key" TEXT,
    "preflight" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_assets" (
    "id" TEXT NOT NULL,
    "design_id" TEXT,
    "user_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_slug" TEXT,
    "product_slug" TEXT,
    "document" JSONB NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "width_mm" INTEGER NOT NULL,
    "height_mm" INTEGER NOT NULL,
    "bleed_mm" INTEGER NOT NULL DEFAULT 3,
    "thumbnail_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_fonts" (
    "id" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 400,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_fonts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "designs_user_id_idx" ON "designs"("user_id");

-- CreateIndex
CREATE INDEX "designs_session_id_idx" ON "designs"("session_id");

-- CreateIndex
CREATE INDEX "designs_product_id_idx" ON "designs"("product_id");

-- CreateIndex
CREATE INDEX "designs_deleted_at_idx" ON "designs"("deleted_at");

-- CreateIndex
CREATE INDEX "design_assets_design_id_idx" ON "design_assets"("design_id");

-- CreateIndex
CREATE INDEX "design_assets_user_id_idx" ON "design_assets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "design_templates_slug_key" ON "design_templates"("slug");

-- CreateIndex
CREATE INDEX "design_templates_is_active_sort_order_idx" ON "design_templates"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "design_templates_category_slug_is_active_idx" ON "design_templates"("category_slug", "is_active");

-- CreateIndex
CREATE INDEX "order_items_design_id_idx" ON "order_items"("design_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "design_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_assets" ADD CONSTRAINT "design_assets_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

