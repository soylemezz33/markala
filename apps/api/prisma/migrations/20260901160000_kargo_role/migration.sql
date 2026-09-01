-- Kargo rolü (2026-09-01, Hasan talebi): siparişi paketleyip gönderiyi açan iç personel.
-- Siparişi ve alıcı bilgisini görür, takip no girer; tutar/maliyet/ödeme GÖRMEZ.
-- İzinler kodda ROLE_PERMISSIONS ile tanımlı (ORDERS_READ + ORDERS_TRACKING);
-- burada yalnız enum genişletiliyor.
--
-- IF NOT EXISTS: migration'ın tekrar çalışması (yeniden deploy / baseline) hata vermesin.
-- ALTER TYPE ... ADD VALUE Postgres'te transaction içinde çalışmaz; Prisma her ifadeyi
-- ayrı çalıştırdığı için sorun olmuyor. Yeni değer AYNI migration içinde KULLANILMAMALI.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'kargo';
