-- 2026-09-03 (Hasan): "Tasarım Onayında" ile "Üretimde" arasına yeni adım — "Tasarım Onaylandı".
-- Müşteriye mail YOK; yalnız üretim/kargo ekibine (kargo@) bildirim gider ki işi üretime alsın.
-- PostgreSQL 16: ADD VALUE işlem bloğu içinde çalışır (yeni değer aynı işlemde KULLANILAMAZ;
-- burada kullanılmıyor). IF NOT EXISTS → tekrar koşarsa hata vermez.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'tasarim-onaylandi' AFTER 'tasarim-onayindi';
