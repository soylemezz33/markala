// Sentry sunucu konfigürasyonu (admin) — Node.js runtime
// NOT: Server-side DSN — public expose gereksiz, NEXT_PUBLIC_* kullanmıyoruz.
// SENTRY_RELEASE CI'da `git rev-parse --short HEAD` ile inject edilir.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    "Network request failed",
  ],
  beforeSend(event) {
    // PII redact
    if (event.user) {
      event.user.email = event.user.email?.replace(/(.{2}).*@(.*)/, "$1***@$2");
      delete event.user.ip_address;
    }
    // Request body'den email/phone/password yıkayın
    if (event.request?.data) {
      const data =
        typeof event.request.data === "string"
          ? event.request.data
          : JSON.stringify(event.request.data);
      event.request.data = data
        .replace(/("email"\s*:\s*")[^"]+/g, "$1[REDACTED]")
        .replace(/("phone"\s*:\s*")[^"]+/g, "$1[REDACTED]")
        .replace(/("password"\s*:\s*")[^"]+/g, "$1[REDACTED]");
    }
    return event;
  },
});
