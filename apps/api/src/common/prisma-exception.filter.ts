import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

/**
 * Prisma'nın "known request" hatalarını tutarlı HTTP yanıtlarına çevirir.
 *
 * Sorun: servislerin çoğu `update`/`delete({ where: { id } })` çağrısını mevcudiyet
 * kontrolü yapmadan yapıyor. Kayıt yoksa Prisma `P2025` fırlatır ve Nest'in varsayılan
 * filtresi bunu **500** olarak döner — doğru status 404 olmalı. Aynı şekilde yakalanmamış
 * `P2002` (unique) → 500 yerine 409 olmalı.
 *
 * Bu filtre yalnızca `PrismaClientKnownRequestError`'ı yakalar; bilinçli fırlatılan
 * `HttpException`'lar (NotFoundException, ConflictException, ...) Nest'in yerleşik
 * filtresinde kalır — mevcut 404/409/400 davranışı ve yanıt şekli değişmez.
 *
 * Yanıt gövdesi, Nest'in HttpException varsayılanıyla aynı şekildedir
 * (`{ statusCode, message, error }`) — istemci sözleşmesi tutarlı kalır.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, message, error } = mapPrismaError(exception);

    // Beklenmeyen (500'e düşen) kodlar alarm anlamlı kalsın diye error seviyesinde;
    // istemci-kaynaklı 4xx'ler ise warn (gürültü yapmasın ama izlenebilsin).
    const where = `${req.method} ${req.originalUrl ?? req.url}`;
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`prisma.${exception.code} ${where} → ${status}`, exception.message);
    } else {
      this.logger.warn(`prisma.${exception.code} ${where} → ${status}`);
    }

    res.status(status).json({ statusCode: status, message, error });
  }
}

interface MappedError {
  status: number;
  message: string;
  error: string;
}

/**
 * Prisma hata kodunu HTTP status + kullanıcıya gösterilebilir mesaja eşler.
 * Bilinmeyen "known" kodlar bilinçli olarak 500'de bırakılır — gerçekten beklenmeyen
 * veritabanı durumlarının izleme/alarm değeri korunsun.
 *
 * @see https://www.prisma.io/docs/orm/reference/error-reference
 */
export function mapPrismaError(e: Prisma.PrismaClientKnownRequestError): MappedError {
  switch (e.code) {
    // Güncellenecek/silinecek kayıt bulunamadı.
    case "P2025":
      return { status: HttpStatus.NOT_FOUND, message: "Kayıt bulunamadı.", error: "Not Found" };

    // Benzersizlik (unique) ihlali. Alan adını sızdırmamak için mesaj genel tutulur.
    case "P2002":
      return {
        status: HttpStatus.CONFLICT,
        message: "Bu kayıt zaten mevcut (benzersiz alan çakışması).",
        error: "Conflict",
      };

    // Yabancı anahtar ihlali — bağlı kayıt yok ya da silinmeye çalışılan kayıt referanslı.
    case "P2003":
      return {
        status: HttpStatus.CONFLICT,
        message: "İlişkili kayıt nedeniyle işlem tamamlanamadı.",
        error: "Conflict",
      };

    // Sütun için değer çok uzun.
    case "P2000":
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Gönderilen değer izin verilen uzunluğu aşıyor.",
        error: "Bad Request",
      };

    // Zorunlu (null olamaz) alan eksik.
    case "P2011":
    case "P2012":
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Zorunlu bir alan eksik.",
        error: "Bad Request",
      };

    // Diğer tüm "known" kodlar gerçekten beklenmeyen kabul edilir → 500.
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Beklenmeyen bir veritabanı hatası oluştu.",
        error: "Internal Server Error",
      };
  }
}
