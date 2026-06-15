import { describe, it, expect, vi } from "vitest";
import type { ArgumentsHost } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaExceptionFilter, mapPrismaError } from "./prisma-exception.filter";

/**
 * Regresyon: servisler `update`/`delete({ where: { id } })`'i mevcudiyet kontrolü
 * yapmadan çağırıyor. Olmayan id ESKİDEN P2025 → 500 dönüyordu. Artık 404 olmalı;
 * yakalanmamış P2002 → 409, P2003 → 409, P2000 → 400 olmalı.
 */

/** Gerçek Prisma hatası gibi davranan minimal sahte — yalnızca `code`/`message` gerekiyor. */
function prismaError(code: string, message = "db error"): Prisma.PrismaClientKnownRequestError {
  return { code, message } as Prisma.PrismaClientKnownRequestError;
}

function mockHost(method = "PATCH", url = "/api/faqs/missing") {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method, url, originalUrl: url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe("mapPrismaError", () => {
  it("P2025 (kayıt yok) → 404", () => {
    expect(mapPrismaError(prismaError("P2025")).status).toBe(404);
  });

  it("P2002 (unique) → 409 ve alan adını sızdırmaz", () => {
    const m = mapPrismaError(prismaError("P2002", "Unique constraint failed on the fields: (`email`)"));
    expect(m.status).toBe(409);
    expect(m.message).not.toContain("email");
  });

  it("P2003 (foreign key) → 409", () => {
    expect(mapPrismaError(prismaError("P2003")).status).toBe(409);
  });

  it("P2000 (değer çok uzun) → 400", () => {
    expect(mapPrismaError(prismaError("P2000")).status).toBe(400);
  });

  it("P2011/P2012 (zorunlu alan eksik) → 400", () => {
    expect(mapPrismaError(prismaError("P2011")).status).toBe(400);
    expect(mapPrismaError(prismaError("P2012")).status).toBe(400);
  });

  it("bilinmeyen kod → 500 (alarm anlamlı kalsın)", () => {
    expect(mapPrismaError(prismaError("P2099")).status).toBe(500);
  });
});

describe("PrismaExceptionFilter.catch", () => {
  it("P2025'i 404 + tutarlı gövde ({ statusCode, message, error }) ile yazar", () => {
    const filter = new PrismaExceptionFilter();
    const { host, status, json } = mockHost();

    filter.catch(prismaError("P2025"), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: "Kayıt bulunamadı.",
      error: "Not Found",
    });
  });

  it("P2002'yi 409 ile yazar", () => {
    const filter = new PrismaExceptionFilter();
    const { host, status } = mockHost("POST", "/api/categories");

    filter.catch(prismaError("P2002"), host);

    expect(status).toHaveBeenCalledWith(409);
  });
});
