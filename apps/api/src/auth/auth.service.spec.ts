import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictException, InternalServerErrorException } from "@nestjs/common";
import { AuthService } from "./auth.service";

/**
 * Regresyon: mevcut e-posta ile kayıt ESKİDEN 500 dönüyordu (auth.service.ts:44-49) —
 * kullanıcı "Kayıt başarısız (sunucu hatası)" görüyor ama hesabı zaten vardı.
 * Artık 409 ConflictException + net mesaj dönmeli.
 */

const cfg = { get: (_k: string) => undefined } as any;
const jwt = { sign: () => "signed.jwt.token" } as any;

function makePrisma(over: Partial<Record<string, any>> = {}) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "u1", email: "yeni@markala.test", role: "customer" }),
      update: vi.fn(),
    },
    refreshToken: { create: vi.fn().mockResolvedValue({}) },
    ...over,
  } as any;
}

const input = { email: "var@markala.test", password: "DiagTest123", fullName: "Test Kullanıcı" };
const ctx = { userAgent: "vitest", ipAddress: "1.2.3.4" };

describe("AuthService.register", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("mevcut e-posta → 409 ConflictException (500 DEĞİL)", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ id: "existing", email: input.email });
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.register(input, ctx)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("yarış durumu: create P2002 → 409 ConflictException", async () => {
    const prisma = makePrisma();
    prisma.user.create.mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.register(input, ctx)).rejects.toBeInstanceOf(ConflictException);
  });

  it("gerçek beklenmeyen DB hatası → 500 InternalServerError", async () => {
    const prisma = makePrisma();
    prisma.user.create.mockRejectedValue(new Error("connection lost"));
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.register(input, ctx)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it("yeni e-posta → access + refresh token üretir", async () => {
    const prisma = makePrisma();
    const svc = new AuthService(prisma, jwt, cfg);

    const res = await svc.register({ ...input, email: "yeni@markala.test" }, ctx);
    expect(res.accessToken).toBe("signed.jwt.token");
    expect(res.refreshToken).toBeTruthy();
    expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
  });
});
