-- Panel kullanıcı grupları (2026-08-21, Hasan talebi).
-- Yeni roller: tasarimci (grafik ekibi) ve muhasebe.
-- İzinler kodda ROLE_PERMISSIONS ile tanımlı; burada yalnız enum genişletiliyor.
--
-- IF NOT EXISTS: migration'ın tekrar çalışması (yeniden deploy / baseline) hata vermesin.
-- ALTER TYPE ... ADD VALUE Postgres'te transaction içinde çalışmaz; Prisma her ifadeyi
-- ayrı çalıştırdığı için sorun olmuyor.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'tasarimci';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'muhasebe';
