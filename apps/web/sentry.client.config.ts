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
  // NOT: replayIntegration BİLEREK burada DEĞİL — aşağıda tembel yükleniyor.
  integrations: [],
});

/**
 * Session Replay'i KRİTİK YOLDAN ÇIKAR (2026-08-20 hız şartnamesi P2).
 *
 * Ölçüm: Sentry tüm istemci JS'inin %16'sı (158 KB gzip); bunun 62 KB'ı Replay.
 * Replay statik `integrations` dizisinde olduğu için HER sayfa yüklemesinde iniyordu —
 * oysa `replaysSessionSampleRate: 0.0`, yani normal oturumlar hiç kaydedilmiyor; yalnız
 * hata anında (buffer modu) kullanılıyor. Reklam iniş sayfalarında LCP 8,8 sn ve Google
 * kalite puanı "sayfa deneyimi: ortalamanın altında" olduğu için bu ağırlık doğrudan
 * paraya mal oluyordu.
 *
 * Takas (bilinçli): Replay artık sayfa yerleştikten SONRA yükleniyor. İlk birkaç saniyede
 * oluşan bir hatanın videosu olmaz — ama yığın izi (stack trace), breadcrumb ve bağlam
 * Sentry çekirdeğinde ZATEN yakalanıyor, yani hata görünürlüğü kaybolmuyor. Gerçek
 * oturumlar dakikalarca sürdüğü için pratikte replay kapsamı neredeyse aynı kalır.
 */
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  const loadReplay = () => {
    import("@sentry/nextjs")
      .then(({ replayIntegration }) => {
        // Zaten eklenmişse (HMR/çift çağrı) tekrar ekleme.
        if (Sentry.getClient()?.getIntegrationByName?.("Replay")) return;
        Sentry.addIntegration(
          // PII riskini azalt: tüm metni maskele, medyayı blokla (eski davranışla aynı)
          replayIntegration({ maskAllText: true, blockAllMedia: true }),
        );
      })
      .catch(() => {
        // Replay yüklenemezse sessiz geç — hata takibinin çekirdeği çalışmaya devam eder.
      });
  };

  // Tarayıcı boşa çıkınca yükle; requestIdleCallback yoksa kısa gecikmeyle.
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(loadReplay, { timeout: 5000 });
  } else {
    window.setTimeout(loadReplay, 3000);
  }
}
