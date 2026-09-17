-- Panelden özelleştirilen rol izinleri (2026-09-17). İdempotent.
CREATE TABLE IF NOT EXISTS "panel_role_permissions" (
  "role"       TEXT NOT NULL,
  "perms"      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "updated_by" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "panel_role_permissions_pkey" PRIMARY KEY ("role")
);
