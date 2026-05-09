-- Markala — Postgres initialization (ilk deploy'da)
-- docker-compose volume'a otomatik mount edilir.

-- Türkçe collation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_collation WHERE collname = 'tr_TR') THEN
        CREATE COLLATION "tr_TR" (LOCALE = 'tr_TR.UTF-8');
    END IF;
EXCEPTION WHEN others THEN
    -- Locale yoksa sessizce geç (Alpine'da olabilir)
    NULL;
END $$;

-- Performans için extension'lar
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Fuzzy search (ürün adı arama)
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- Aksansız arama (Türkçe için)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID üretimi
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- Şifreleme

-- Read-only user (analytics için)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'markala_readonly') THEN
        CREATE ROLE markala_readonly LOGIN PASSWORD 'change-me-in-production';
        GRANT CONNECT ON DATABASE markala TO markala_readonly;
        GRANT USAGE ON SCHEMA public TO markala_readonly;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT SELECT ON TABLES TO markala_readonly;
    END IF;
END $$;
