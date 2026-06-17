-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "path" TEXT,
    "product_slug" TEXT,
    "dwell_ms" INTEGER,
    "value" DECIMAL(12,2),
    "referrer" TEXT,
    "device" TEXT,
    "utm_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_type_created_at_idx" ON "analytics_events"("type", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_product_slug_type_idx" ON "analytics_events"("product_slug", "type");

-- CreateIndex
CREATE INDEX "analytics_events_user_id_idx" ON "analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events"("session_id");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");
