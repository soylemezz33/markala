-- Sepet terk hatırlatması: misafir e-posta yakalama (2026-08-24, Hasan talebi).
-- consent=false ise kayıt DB'de kalır ama n8n sorgusu bunları hiç almaz (asla mail gitmez).

CREATE TABLE "cart_leads" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cart_snapshot" JSONB NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cart_leads_email_idx" ON "cart_leads"("email");
CREATE INDEX "cart_leads_consent_created_at_idx" ON "cart_leads"("consent", "created_at");
