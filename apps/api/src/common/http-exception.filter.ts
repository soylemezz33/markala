import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

/**
 * Tüm API hatalarını TEK bir zarfa normalize eden global filtre.
 *
 * NEDEN:
 *  - Bugün yalnızca rate-limit middleware `{ statusCode, code, message }` döndürüyor;
 *    diğer hatalar NestJS varsayılan şekliyle çıkıyor → tutarsız sözleşme.
 *  - Yakalanmamış Prisma hataları (ör. unique-constraint) ham 500 + DB iç ayrıntısı
 *    sızdırıyor. Burada bilinen kodları doğru HTTP status'a mapliyoruz.
 *
 * SÖZLEŞME (api-client `ApiError` ile uyumlu — `message` + `code` okunur):
 *   { statusCode, code, message, error?, path, timestamp }
 *
 * HttpException'larda davranış EKLEMELİDİR: orijinal status/message/error aynen
 * korunur, sadece makine-okur `code` + `path`/`timestamp` eklenir (kırılma yok).
 */

/**
 * Log güvenliği: URL sorgu parametrelerinde token/secret/password/key gibi hassas
 * değerleri maskeler. Yalnızca log satırında kullanılır; yanıta gönderilmez.
 * Örn. /api/auth/reset?token=abc123 → /api/auth/reset?token=***
 */
function redactSensitivePath(path: string): string {
  return path.replace(
    /([?&](?:token|secret|password|key|apiKey|api_key|access_token|refresh_token)=)[^&]*/gi,
    "$1***",
  );
}
const STATUS_CODE_MAP: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  429: "RATE_LIMITED",
  500: "INTERNAL",
};

function codeForStatus(status: number): string {
  return STATUS_CODE_MAP[status] ?? (status >= 500 ? "INTERNAL" : "ERROR");
}

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string | string[];
  error?: string;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const normalized = this.normalize(exception);
    const rawPath = req?.originalUrl ?? req?.url ?? "";
    const body: ErrorBody = {
      ...normalized,
      path: rawPath,
      timestamp: new Date().toISOString(),
    };

    // 5xx → tam stack logla (observability). 4xx beklenen istemci hatası, gürültü yapma.
    // GÜVENLİK: log satırında URL'den hassas sorgu parametreleri maskelenir (token/secret/key/password).
    if (body.statusCode >= 500) {
      this.logger.error(
        `${req?.method ?? "?"} ${redactSensitivePath(rawPath)} → ${body.statusCode} ${body.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(body.statusCode).json(body);
  }

  private normalize(exception: unknown): Omit<ErrorBody, "path" | "timestamp"> {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaKnown(exception);
    }
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { statusCode: 400, code: "BAD_REQUEST", message: "Geçersiz istek verisi." };
    }
    // Bilinmeyen: iç ayrıntı sızdırma, genel 500.
    return { statusCode: 500, code: "INTERNAL", message: "Beklenmeyen bir hata oluştu." };
  }

  private fromHttpException(exception: HttpException): Omit<ErrorBody, "path" | "timestamp"> {
    const status = exception.getStatus();
    const resp = exception.getResponse();
    let message: string | string[] = exception.message;
    let error: string | undefined;
    if (typeof resp === "string") {
      message = resp;
    } else if (resp && typeof resp === "object") {
      const r = resp as { message?: string | string[]; error?: string };
      if (r.message !== undefined) message = r.message;
      error = r.error;
    }
    return { statusCode: status, code: codeForStatus(status), message, error };
  }

  private fromPrismaKnown(
    exception: Prisma.PrismaClientKnownRequestError,
  ): Omit<ErrorBody, "path" | "timestamp"> {
    switch (exception.code) {
      case "P2002": // unique constraint ihlali
        return { statusCode: 409, code: "CONFLICT", message: "Bu kayıt zaten mevcut." };
      case "P2025": // güncellenecek/silinecek kayıt yok
        return { statusCode: 404, code: "NOT_FOUND", message: "Kayıt bulunamadı." };
      case "P2003": // foreign key ihlali
        return { statusCode: 400, code: "BAD_REQUEST", message: "İlişkili kayıt geçersiz." };
      case "P2000": // değer sütun için çok uzun
        return { statusCode: 400, code: "BAD_REQUEST", message: "Girilen değer çok uzun." };
      default:
        // Bilinmeyen Prisma kodu — beklenmeyen kabul et, iç ayrıntı sızdırma.
        return { statusCode: 500, code: "INTERNAL", message: "Veritabanı hatası." };
    }
  }
}
