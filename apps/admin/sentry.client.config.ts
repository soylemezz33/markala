// Sentry istemci konfigürasyonu (admin) — sadece error tracking, replay yok
// Admin panelinde session replay PII riski yüksek olduğundan kapalı.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",
  tracesSampleRate: 0.1,
  // Replay tamamen kapalı — admin'de hassas veri var
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
  enabled: process.env.NODE_ENV === "production",
});
