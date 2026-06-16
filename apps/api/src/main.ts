import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { json, static as serveStatic } from "express";
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

  // Local depolama sürücüsü görselleri buradan sunar (R2 yokken / dev).
  // CORP cross-origin: helmet varsayılanı same-origin'dir, aksi halde web/admin
  // farklı origin'den <img> yükleyemez. Bunlar public görseller.
  const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");
  app.use(
    "/uploads",
    (_req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    serveStatic(uploadDir),
  );

  // Auth endpoint'leri için per-IP fixed-window rate limit — standart 429 + Retry-After.
  app.use(rateLimit({ windowMs: 60 * 60_000, max: 3, path: "/auth/register", method: "POST" }));
  app.use(rateLimit({ windowMs: 60_000, max: 5, path: "/auth/login", method: "POST" }));
  app.use(rateLimit({ windowMs: 60 * 60_000, max: 3, path: "/auth/resend-verification", method: "POST" }));
  app.use(rateLimit({ windowMs: 60_000, max: 10, path: "/auth/verify-email", method: "POST" }));
  app.use(rateLimit({ windowMs: 60_000, max: 30, path: "/auth/refresh", method: "POST" }));

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

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  Logger.log(
    `Markala API: http://localhost:${port}/api${process.env.NODE_ENV !== "production" ? " · docs: /api/docs" : ""}`,
    "Bootstrap",
  );
}

bootstrap();
