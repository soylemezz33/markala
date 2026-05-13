// Sentry istemci konfigürasyonu — tarayıcıda yakalanan hatalar
// Bu dosya Next.js tarafından otomatik yüklenir
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",
  // Yalnız %10 transaction trace — düşük maliyet
  tracesSampleRate: 0.1,
  // Normal session replay kapalı — sadece hata oluşunca yakala
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,
  // Geliştirme ortamında Sentry'yi devre dışı bırak — gürültü olmasın
  enabled: process.env.NODE_ENV === "production",
  integrations: [
    // PII riskini azalt: tüm metni maskele, medyayı blokla
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
