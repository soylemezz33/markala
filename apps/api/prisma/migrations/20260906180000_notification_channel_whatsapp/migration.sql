-- Yeni sipariş bildirimi WhatsApp'tan da gidiyor (2026-09-06).
-- Katkısal ve geri alınabilir: yalnız enum'a değer ekler, veri dokunmaz.
-- IF NOT EXISTS: migration daha önce elle uygulanmış ortamda yeniden koşabilsin.
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'whatsapp';
