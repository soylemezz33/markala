-- Sipariş iç notu (panel personeli arası). Order.notes'a DOKUNULMAZ: o kolon müşterinin
-- checkout notunu ve idempotency etiketini taşıyor.
CREATE TABLE "order_notes" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "author_id" TEXT,
    "author_name" TEXT NOT NULL,
    "author_role" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_notes_order_id_created_at_idx" ON "order_notes"("order_id", "created_at");

ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
