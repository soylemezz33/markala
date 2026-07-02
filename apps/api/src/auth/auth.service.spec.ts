import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictException, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
import { AuthService, createDummyHash } from "./auth.service";

/**
 * Regresyon: mevcut e-posta ile kayıt ESKİDEN 500 dönüyordu (auth.service.ts:44-49) —
 * kullanıcı "Kayıt başarısız (sunucu hatası)" görüyor ama hesabı zaten vardı.
 * Artık 409 ConflictException + net mesaj dönmeli.
 */

const cfg = { get: (_k: string) => undefined } as any;
const jwt = { sign: () => "signed.jwt.token" } as any;
const mail = { sendVerificationEmail: vi.fn(), sendPasswordResetEmail: vi.fn(), sendWelcomeEmail: vi.fn().mockResolvedValue(true) } as any;

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
  beforeEach(() => {
    vi.restoreAllMocks();
    // restoreAllMocks vi.fn() implementasyonunu temizler → sendWelcomeEmail'i yeniden Promise'e bağla
    // (register `void ...sendWelcomeEmail().catch()` çağırıyor; undefined dönerse .catch patlar).
    mail.sendWelcomeEmail.mockResolvedValue(true);
  });

  it("mevcut e-posta → 409 ConflictException (500 DEĞİL)", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ id: "existing", email: input.email });
    const svc = new AuthService(prisma, jwt, cfg, mail);

    await expect(svc.register(input, ctx)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("yarış durumu: create P2002 → 409 ConflictException", async () => {
    const prisma = makePrisma();
    prisma.user.create.mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));
    const svc = new AuthService(prisma, jwt, cfg, mail);

    await expect(svc.register(input, ctx)).rejects.toBeInstanceOf(ConflictException);
  });

  it("gerçek beklenmeyen DB hatası → 500 InternalServerError", async () => {
    const prisma = makePrisma();
    prisma.user.create.mockRejectedValue(new Error("connection lost"));
    const svc = new AuthService(prisma, jwt, cfg, mail);

    await expect(svc.register(input, ctx)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it("yeni e-posta → access + refresh token üretir", async () => {
    const prisma = makePrisma();
    const svc = new AuthService(prisma, jwt, cfg, mail);

    const res = await svc.register({ ...input, email: "yeni@markala.test" }, ctx);
    expect(res.accessToken).toBe("signed.jwt.token");
    expect(res.refreshToken).toBeTruthy();
    expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
  });
});

/**
 * Regresyon: bilinmeyen e-postada timing-attack koruması ESKİDEN elle yazılmış
 * geçersiz bir argon2 sabitine (`$argon2id$...$XXX`) karşı verify çalıştırıyordu.
 * argon2.verify bu hash'i decode edemeyip KDF'yi çalıştırmadan anında reddediyor
 * (~0.2ms) — gerçek verify ~40ms sürdüğü için "kullanıcı var/yok" timing'den okunabiliyordu.
 * Artık geçerli bir hash üretilmeli ve verify, throw etmeden false dönmeli (KDF çalışır).
 */
describe("AuthService.login — timing koruması", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("dummy hash geçerli ve decode edilebilir argon2id çıktısıdır", async () => {
    const h = await createDummyHash();
    expect(h).toMatch(/^\$argon2id\$/);
    // Geçerli hash → verify KDF'yi çalıştırıp false döner. Eski sabit (`$...$XXX`)
    // decode edilemediği için throw ediyordu → timing koruması işlevsizdi.
    await expect(argon2.verify(h, "yanlis")).resolves.toBe(false);
  });

  it("bilinmeyen e-posta → UnauthorizedException (dummy verify path çökmeden çalışır)", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    const svc = new AuthService(prisma, jwt, cfg, mail);

    await expect(svc.login("yok@markala.test", "Sifre123", ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
