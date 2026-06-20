-- İletişim formu mesajları — SMTP'den bağımsız kalıcı kayıt (mail gitmese bile lead kaybolmaz).
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'iletisim',
    "status" TEXT NOT NULL DEFAULT 'new',
    "mail_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contact_messages_ticket_id_key" ON "contact_messages"("ticket_id");

CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");
