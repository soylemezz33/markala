import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { json } from "express";
import { AppModule } from "./app.module";
import { rateLimit } from "./security/rate-limit";

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

  // Body size limit — 100kb. Konfigüratör payload'ları küçük JSON, dosyalar R2'ye direkt yükleniyor.
  app.use(json({ limit: "100kb" }));

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
