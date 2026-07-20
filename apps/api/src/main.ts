import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { json, urlencoded, static as serveStatic } from "express";
import type { Request, Response, NextFunction } from "express";
import { join } from "node:path";
import { AppModule } from "./app.module";
import { rateLimit } from "./security/rate-limit";
import { AllExceptionsFilter } from "./common/http-exception.filter";

async function bootstrap() {
  // SECURITY: JWT_SECRET fail-fast — production'da zayıf/eksik secret tokenları taklit edilebilir kılar.
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET env var must be at least 32 characters");
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
  const config = app.get(ConfigService);

  // Trust proxy — Nginx/Cloudflare arkasında gerçek client IP'si req.ip'te görünür.
  app.set("trust proxy", 1);

  // Helmet — güvenlik başlıkları (CSP default ile gönderilir; web origin'i ayrı tutuyoruz).
  app.use(helmet());

  // Body size limit — 100kb. Konfigüratör payload'ları küçük JSON.
  // NOT: multipart upload (/api/uploads) multer ile ayrı parse edilir, bu limit etkilemez.
  app.use(json({ limit: "100kb" }));
  // iyzico Checkout Form callback'i x-www-form-urlencoded gönderir (token alanı) → ayrı parser.
  app.use(urlencoded({ extended: true, limit: "100kb" }));

  // Local depolama sürücüsü görselleri buradan sunar (R2 yokken / dev).
  // CORP cross-origin: helmet varsayılanı same-origin'dir, aksi halde web/admin
  // farklı origin'den <img> yükleyemez. Bunlar public görseller.
  const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");
  // GÜVENLİK: hassas kurumsal belgeler (/uploads/secure altında saklanır) ASLA statik
  // serve EDİLMEZ — yalnızca auth-korumalı GET /api/corporate-applications/:id/document/:field
  // üzerinden owner||admin'e açılır. Bu guard statik mount'tan ÖNCE register edilmeli.
  app.use("/uploads/secure", (_req: Request, res: Response) => {
    res.status(404).end();
  });
  app.use(
    "/uploads",
    (_req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      // Yüklenen dosya MIME-sniffing ile yanlış (örn. HTML/script) yorumlanmasın — XSS/drive-by savunması.
      res.setHeader("X-Content-Type-Options", "nosniff");
      next();
    },
    // Yüklenen görseller slug/UUID-adlı + içerik değişince ?v= ile busted → uzun immutable
    // cache GÜVENLİ. Express varsayılanı max-age=0 idi → Cloudflare hiç cache'leyemiyor, her
    // istek origin'e geliyordu (ana yavaşlık). 1 yıl immutable + zayıf-ETag kapalı (Last-Modified yeter).
    serveStatic(uploadDir, { maxAge: "365d", immutable: true, etag: false, lastModified: true }),
  );

  // Auth endpoint'leri için per-IP fixed-window rate limit — standart 429 + Retry-After.
  // NOT: Türk mobil operatörleri CGNAT ile çok aboneyi tek çıkış IP'sinde topluyor; reklam
  // trafiğinde meşru kayıt/şifre-sıfırlama 429 yememeli. Turnstile zaten asıl bot bariyeri
  // (fail-closed) → bu limitler yalnız kaba flood'a karşı, gevşek tutulur (3→15, 5→12).
  app.use(rateLimit({ windowMs: 60 * 60_000, max: 15, path: "/auth/register", method: "POST" }));
  app.use(rateLimit({ windowMs: 60_000, max: 5, path: "/auth/login", method: "POST" }));
  // "Google ile devam et" — login eşi limit. Tokeninfo (Google) amplification'ı ve
  // otomatik-hesap-oluşturma seli bu sınırla kesilir.
  app.use(rateLimit({ windowMs: 60_000, max: 10, path: "/auth/google", method: "POST" }));
  app.use(
    rateLimit({ windowMs: 60 * 60_000, max: 10, path: "/auth/resend-verification", method: "POST" }),
  );
  // Public doğrulama-maili yeniden gönderme (e-posta ile, girişsiz) — spam/enumeration koruması 5/saat.
  app.use(
    rateLimit({ windowMs: 60 * 60_000, max: 5, path: "/auth/resend-verification-public", method: "POST" }),
  );
  app.use(rateLimit({ windowMs: 60_000, max: 10, path: "/auth/verify-email", method: "POST" }));
  app.use(
    rateLimit({ windowMs: 60 * 60_000, max: 12, path: "/auth/forgot-password", method: "POST" }),
  );
  app.use(rateLimit({ windowMs: 60_000, max: 10, path: "/auth/reset-password", method: "POST" }));
  app.use(rateLimit({ windowMs: 60_000, max: 30, path: "/auth/refresh", method: "POST" }));
  // Ödeme başlatma — nonce zaten zorunlu; bu per-IP limit ek savunma (kötüye kullanım/spam).
  app.use(rateLimit({ windowMs: 60_000, max: 20, path: "/payments/iyzico/init", method: "POST" }));
  // Ziyaretçi analizi olay toplama — public + yüksek-frekanslı; per-IP spam/flood koruması.
  app.use(rateLimit({ windowMs: 60_000, max: 120, path: "/analytics/collect", method: "POST" }));
  // Müşteri tasarım dosyası yükleme — public + büyük dosya; per-IP kötüye kullanım koruması.
  app.use(rateLimit({ windowMs: 60 * 60_000, max: 40, path: "/uploads/design", method: "POST" }));
  // Kurumsal başvuru — public + belge yükleme; per-IP spam/kötüye kullanım koruması (10/saat).
  app.use(
    rateLimit({ windowMs: 60 * 60_000, max: 10, path: "/corporate-applications", method: "POST" }),
  );
  // İletişim formu — public; per-IP spam koruması (10/saat).
  app.use(rateLimit({ windowMs: 60 * 60_000, max: 10, path: "/contact", method: "POST" }));
  // Teklif talebi — public + en yüksek değerli lead formu; per-IP spam koruması (10/saat).
  app.use(rateLimit({ windowMs: 60 * 60_000, max: 10, path: "/quote-requests", method: "POST" }));
  // Public kargo takip — sipariş no+e-posta tahmin/enumerasyon koruması (30/saat).
  app.use(rateLimit({ windowMs: 60 * 60_000, max: 30, path: "/orders/track", method: "POST" }));
  // Bülten aboneliği — public; per-IP spam koruması (15/saat).
  app.use(
    rateLimit({ windowMs: 60 * 60_000, max: 15, path: "/newsletter-subscribers", method: "POST" }),
  );
  // Bülten çıkışı (ETK) — public GET (mail linki); per-IP kaba flood koruması (30/saat).
  app.use(
    rateLimit({ windowMs: 60 * 60_000, max: 30, path: "/newsletter/unsubscribe", method: "GET" }),
  );
  // Müşteri ürün yorumu — giriş yapmış kullanıcı; per-IP spam/flood koruması (10/saat).
  app.use(rateLimit({ windowMs: 60 * 60_000, max: 10, path: "/reviews/public", method: "POST" }));
  // Admin mutation endpoint'leri — JWT+RolesGuard korumalı; per-IP ek savunma (ele geçirilmiş JWT senyaroya karşı).
  // Limitler gerçek admin kullanımına göre GENİŞ — sıkıştırılmış JWT istismarını sınırlar ama
  // meşru yoğun admin kullanımını (örn. ürün-ürün toplu fiyatlama) engellemez.
  // prefix:true → alt-route'ları yakalar (/api/admin/users/:id, /api/prices/bulk-adjust, /api/orders/:id/status).
  app.use(rateLimit({ windowMs: 60_000, max: 120, path: "/admin", method: "PATCH", prefix: true }));
  app.use(rateLimit({ windowMs: 60_000, max: 120, path: "/admin", method: "POST", prefix: true }));
  app.use(rateLimit({ windowMs: 60_000, max: 120, path: "/admin", method: "DELETE", prefix: true }));
  // Sipariş durumu güncelleme (PATCH /orders/:id/status) — admin işlemi.
  app.use(rateLimit({ windowMs: 60_000, max: 60, path: "/orders", method: "PATCH", prefix: true }));
  // Fiyat mutasyonları: PUT /products/:id/prices (ürün-ürün fiyatlama, hızlı oturum) GENİŞ;
  // POST /prices/* (bulk-adjust/category-set, tek çağrı çok ürün) daha düşük yeter.
  app.use(rateLimit({ windowMs: 60_000, max: 200, path: "/prices", method: "PUT", prefix: true }));
  app.use(rateLimit({ windowMs: 60_000, max: 30, path: "/prices", method: "POST", prefix: true }));

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global hata zarfı — tüm yanıtları { statusCode, code, message, path, timestamp }
  // şekline normalize eder; yakalanmamış Prisma hatalarını doğru HTTP status'a mapler.
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: (config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000").split(","),
    credentials: true,
  });

  // Swagger — yalnızca production dışı ortamlarda. Public docs prod'da kapalı.
  if (process.env.NODE_ENV !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Markala API")
      .setDescription("Markala matbaa & reklam ürünleri e-ticaret API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, doc);
  }

  // Graceful shutdown — deploy/recreate sırasında SIGTERM'de temiz kapanış (Prisma bağlantısı
  // kapanır, HTTP listener durur). Bu olmadan container stop'ta takılıp dangling kalıntı bırakıyordu.
  app.enableShutdownHooks();
  const shutdown = async (signal: string) => {
    Logger.log(`${signal} alındı — graceful kapanış başlıyor`, "Bootstrap");
    try {
      await app.close();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  Logger.log(
    `Markala API: http://localhost:${port}/api${process.env.NODE_ENV !== "production" ? " · docs: /api/docs" : ""}`,
    "Bootstrap",
  );
}

bootstrap();
