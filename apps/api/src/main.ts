import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { json } from "express";
import type { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";

/**
 * Minimal in-memory fixed-window rate limiter (auth endpoint'leri için).
 * Production'da çok-instans senaryoda Redis-backed limiter'a yükseltilmeli;
 * tek-instans VPS için yeterli ve ek dependency gerektirmez.
 */
type Bucket = { count: number; resetAt: number };
function makeRateLimiter(opts: { windowMs: number; max: number; path: string; method?: string }) {
  const store = new Map<string, Bucket>();
  // Stale bucket temizliği — windowMs başına bir kez.
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }, opts.windowMs).unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    if (opts.method && req.method !== opts.method) return next();
    if (!req.path.endsWith(opts.path)) return next();

    const fwd = req.headers["x-forwarded-for"];
    const ip =
      (typeof fwd === "string" ? fwd.split(",")[0]?.trim() : Array.isArray(fwd) ? fwd[0] : undefined) ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";
    const key = `${opts.path}:${ip}`;
    const now = Date.now();
    let bucket = store.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > opts.max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        statusCode: 429,
        message: "Çok fazla deneme. Lütfen bir süre sonra tekrar deneyin.",
      });
      return;
    }
    next();
  };
}

async function bootstrap() {
  // SECURITY: JWT_SECRET fail-fast — production'da zayıf/eksik secret tokenları taklit edilebilir kılar.
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET env var must be at least 32 characters");
  }

  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  // Helmet — güvenlik başlıkları (CSP default ile gönderilir; web origin'i ayrı tutuyoruz).
  app.use(helmet());

  // Body size limit — 100kb. Konfigüratör payload'ları küçük JSON, dosyalar R2'ye direkt yükleniyor.
  app.use(json({ limit: "100kb" }));

  // Auth endpoint'leri için ayrı rate limit — global throttler 60/dk dışında.
  // login: 5/dk · register: 3/saat (brute-force koruması).
  app.use(makeRateLimiter({ windowMs: 60_000, max: 5, path: "/auth/login", method: "POST" }));
  app.use(makeRateLimiter({ windowMs: 60 * 60_000, max: 3, path: "/auth/register", method: "POST" }));

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

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

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  Logger.log(
    `Markala API: http://localhost:${port}/api${process.env.NODE_ENV !== "production" ? " · docs: /api/docs" : ""}`,
    "Bootstrap",
  );
}

bootstrap();
