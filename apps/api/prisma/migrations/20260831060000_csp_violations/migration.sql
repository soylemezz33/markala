-- CSP ihlal kayitlari — Report-Only fazindan enforce'a gecis karari icin kalici depo.
-- Raporlar onceden yalniz konteyner loguna yaziliyordu ve her deploy'da siliniyordu.
--
-- IDEMPOTENT: CI kurali geregi elle yazildi; tekrar calistirilirsa patlamaz
-- (2026-08-04 P2022 olayindan sonra benimsenen desen).

CREATE TABLE IF NOT EXISTS "csp_violations" (
    "id" TEXT NOT NULL,
    "directive" TEXT NOT NULL,
    "blocked_uri" TEXT NOT NULL,
    "sample_document_uri" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csp_violations_pkey" PRIMARY KEY ("id")
);

-- (directive, blocked_uri) basina TEK satir; tekrar eden ihlal `count` artirir.
CREATE UNIQUE INDEX IF NOT EXISTS "csp_violations_directive_blocked_uri_key"
    ON "csp_violations" ("directive", "blocked_uri");

CREATE INDEX IF NOT EXISTS "csp_violations_last_seen_at_idx"
    ON "csp_violations" ("last_seen_at");
