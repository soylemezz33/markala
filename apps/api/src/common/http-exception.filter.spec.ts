import { describe, it, expect } from "vitest";
import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AllExceptionsFilter } from "./http-exception.filter";

/** Express response + ArgumentsHost taklidi — filtrenin yazdığı status/body'yi yakalar. */
function createHost(method = "GET", url = "/api/test") {
  const captured: { status?: number; body?: any } = {};
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(body: any) {
      captured.body = body;
      return this;
    },
  };
  const req = { method, originalUrl: url, url };
  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  } as unknown as ArgumentsHost;
  return { host, captured };
}

function prismaKnown(code: string) {
  return new Prisma.PrismaClientKnownRequestError("db internal detail", {
    code,
    clientVersion: "5.22.0",
  });
}

describe("AllExceptionsFilter", () => {
  const filter = new AllExceptionsFilter();

  it("HttpException status + mesajını korur ve makine-okur code ekler", () => {
    const { host, captured } = createHost("GET", "/api/orders/x");
    filter.catch(new NotFoundException("Sipariş bulunamadı."), host);

    expect(captured.status).toBe(404);
    expect(captured.body).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Sipariş bulunamadı.",
      path: "/api/orders/x",
    });
    expect(typeof captured.body.timestamp).toBe("string");
  });

  it("ValidationPipe dizi mesajını ve error reason'ını korur", () => {
    const { host, captured } = createHost();
    filter.catch(new BadRequestException(["email geçersiz", "phone gerekli"]), host);

    expect(captured.status).toBe(400);
    expect(captured.body.code).toBe("BAD_REQUEST");
    expect(captured.body.message).toEqual(["email geçersiz", "phone gerekli"]);
    expect(captured.body.error).toBe("Bad Request");
  });

  it("4xx HttpException reason'ı korunur (ConflictException)", () => {
    const { host, captured } = createHost();
    filter.catch(new ConflictException("Bu e-posta zaten kayıtlı."), host);
    expect(captured.status).toBe(409);
    expect(captured.body.code).toBe("CONFLICT");
    expect(captured.body.message).toBe("Bu e-posta zaten kayıtlı.");
  });

  it("Prisma P2002 (unique) → 409 CONFLICT, iç ayrıntı sızdırmaz", () => {
    const { host, captured } = createHost("POST", "/api/categories");
    filter.catch(prismaKnown("P2002"), host);

    expect(captured.status).toBe(409);
    expect(captured.body.code).toBe("CONFLICT");
    expect(JSON.stringify(captured.body)).not.toContain("db internal detail");
    expect(JSON.stringify(captured.body)).not.toContain("P2002");
  });

  it("Prisma P2025 (kayıt yok) → 404 NOT_FOUND", () => {
    const { host, captured } = createHost();
    filter.catch(prismaKnown("P2025"), host);
    expect(captured.status).toBe(404);
    expect(captured.body.code).toBe("NOT_FOUND");
  });

  it("Prisma P2003 (foreign key) → 400 BAD_REQUEST", () => {
    const { host, captured } = createHost();
    filter.catch(prismaKnown("P2003"), host);
    expect(captured.status).toBe(400);
    expect(captured.body.code).toBe("BAD_REQUEST");
  });

  it("bilinmeyen Prisma kodu → 500 INTERNAL, iç ayrıntı sızdırmaz", () => {
    const { host, captured } = createHost();
    filter.catch(prismaKnown("P2014"), host);
    expect(captured.status).toBe(500);
    expect(captured.body.code).toBe("INTERNAL");
    expect(JSON.stringify(captured.body)).not.toContain("db internal detail");
  });

  it("PrismaClientValidationError → 400 BAD_REQUEST", () => {
    const { host, captured } = createHost();
    filter.catch(
      new Prisma.PrismaClientValidationError("invalid where clause", { clientVersion: "5.22.0" }),
      host,
    );
    expect(captured.status).toBe(400);
    expect(captured.body.code).toBe("BAD_REQUEST");
  });

  it("bilinmeyen hata → 500 INTERNAL, orijinal mesajı sızdırmaz", () => {
    const { host, captured } = createHost();
    filter.catch(new Error("postgres://user:secret@db/markala"), host);

    expect(captured.status).toBe(500);
    expect(captured.body.code).toBe("INTERNAL");
    expect(JSON.stringify(captured.body)).not.toContain("secret");
  });
});
