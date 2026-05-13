// Next.js 14 instrumentation hook — runtime'a göre doğru Sentry config'i yükler
// Bu dosyanın aktif olması için next.config.mjs içinde experimental.instrumentationHook
// gerekmez (Next 14.2+ varsayılan).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
