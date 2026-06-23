-- CreateTable
CREATE TABLE "quote_requests" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company_name" TEXT,
    "sector" TEXT,
    "products" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "budget" TEXT,
    "quantity" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'teklif-al',
    "status" TEXT NOT NULL DEFAULT 'new',
    "mail_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quote_requests_ticket_id_key" ON "quote_requests"("ticket_id");

-- CreateIndex
CREATE INDEX "quote_requests_status_created_at_idx" ON "quote_requests"("status", "created_at");
