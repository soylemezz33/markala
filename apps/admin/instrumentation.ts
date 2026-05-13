// Next.js 14 instrumentation hook (admin) — sadece Node.js runtime
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}
