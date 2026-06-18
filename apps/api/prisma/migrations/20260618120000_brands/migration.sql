-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "website_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brands_is_active_sort_order_idx" ON "brands"("is_active", "sort_order");
