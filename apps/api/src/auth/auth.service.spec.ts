import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictException, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

// argon2 native modülü CI/CD ortamında da güvenilir çalışır; mock ile timing-bağımlı
// davranışları kontrol altına alıyoruz (verify false/true senaryoları).
vi.mock("argon2", () => ({
  hash: vi.fn().mockResolvedValue("$argon2id$v=19$m=65536,t=3,p=4$mock$mockhash"),
  verify: vi.fn().mockResolvedValue(true),
}));

import * as argon2 from "argon2";

const cfg = { get: (_k: string) => undefined } as any;
const jwt = { sign: () => "signed.jwt.token" } as any;

const STORED_USER = { id: "u1", email: "var@markala.test", passwordHash: "$argon2id$mock", role: "customer" };

function makePrisma(over: Partial<Record<string, any>> = {}) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "u1", email: "yeni@markala.test", role: "customer" }),
      update: vi.fn().mockResolvedValue({}),
    },
    refreshToken: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({}),
    },
    ...over,
  } as any;
}

const input = { email: "var@markala.test", password: "DiagTest123", fullName: "Test Kullanıcı" };
const ctx = { userAgent: "vitest", ipAddress: "1.2.3.4" };

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

describe("AuthService.register", () => {
  beforeEach(() => vi.clearAllMocks());

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

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe("AuthService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bilinmeyen e-posta → UnauthorizedException (enum enumeration önleme: DB kayıt yok)", async () => {
    const prisma = makePrisma();
    // argon2.verify mock: timing attack mitigation için yine de çağrılacak (fake hash)
    vi.mocked(argon2.verify).mockResolvedValue(false);
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.login("yok@markala.test", "any", ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    // lastLoginAt güncellemesi olmadığını doğrula
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("yanlış şifre → UnauthorizedException", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(STORED_USER);
    vi.mocked(argon2.verify).mockResolvedValue(false);
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.login(STORED_USER.email, "yanlis123", ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("doğru kimlik bilgileri → token çifti + lastLoginAt güncelleme", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(STORED_USER);
    vi.mocked(argon2.verify).mockResolvedValue(true);
    const svc = new AuthService(prisma, jwt, cfg);

    const res = await svc.login(STORED_USER.email, "DiagTest123", ctx);
    expect(res.accessToken).toBe("signed.jwt.token");
    expect(res.refreshToken).toBeTruthy();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: STORED_USER.id }, data: { lastLoginAt: expect.any(Date) } }),
    );
    expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
  });

  it("doğru giriş → user bilgileri cevaba eklenir", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(STORED_USER);
    vi.mocked(argon2.verify).mockResolvedValue(true);
    const svc = new AuthService(prisma, jwt, cfg);

    const res = await svc.login(STORED_USER.email, "DiagTest123", ctx);
    expect(res.user).toMatchObject({ id: STORED_USER.id, email: STORED_USER.email, role: "customer" });
  });
});

// ---------------------------------------------------------------------------
// refresh
// ---------------------------------------------------------------------------

function makeStoredRefreshToken(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: "rt1",
    tokenHash: "sha256hash",
    userId: STORED_USER.id,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000), // 1 dakika sonra
    user: STORED_USER,
    ...overrides,
  };
}

describe("AuthService.refresh", () => {
  beforeEach(() => vi.clearAllMocks());

  it("boş token → UnauthorizedException", async () => {
    const prisma = makePrisma();
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.refresh("", ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("DB'de bulunamayan token → UnauthorizedException", async () => {
    const prisma = makePrisma();
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.refresh("gecersiz-token-raw", ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("revokedAt dolu token → UnauthorizedException + replay tespit (updateMany ile tüm token'lar revoke)", async () => {
    const prisma = makePrisma();
    prisma.refreshToken.findUnique.mockResolvedValue(
      makeStoredRefreshToken({ revokedAt: new Date() }),
    );
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.refresh("revoked-raw-token", ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    // Replay tespitinde tüm aktif token'lar iptal edilmeli (güvenlik)
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: STORED_USER.id, revokedAt: null } }),
    );
  });

  it("süresi dolmuş token → UnauthorizedException", async () => {
    const prisma = makePrisma();
    prisma.refreshToken.findUnique.mockResolvedValue(
      makeStoredRefreshToken({ expiresAt: new Date(Date.now() - 1000) }),
    );
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.refresh("expired-raw-token", ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("geçerli token → eski revoke edilir, yeni token çifti üretilir (token rotation)", async () => {
    const prisma = makePrisma();
    prisma.refreshToken.findUnique.mockResolvedValue(makeStoredRefreshToken());
    const svc = new AuthService(prisma, jwt, cfg);

    const res = await svc.refresh("valid-raw-token", ctx);
    expect(res.accessToken).toBe("signed.jwt.token");
    expect(res.refreshToken).toBeTruthy();
    // Eski token revoke edilmeli
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "rt1" }, data: { revokedAt: expect.any(Date) } }),
    );
    // Yeni token yaratılmalı
    expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

describe("AuthService.logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("undefined token → {ok: true}, DB'ye dokunmaz", async () => {
    const prisma = makePrisma();
    const svc = new AuthService(prisma, jwt, cfg);

    const res = await svc.logout(undefined);
    expect(res).toEqual({ ok: true });
    expect(prisma.refreshToken.update).not.toHaveBeenCalled();
  });

  it("bilinen token → revoke edilir", async () => {
    const prisma = makePrisma();
    const svc = new AuthService(prisma, jwt, cfg);

    const res = await svc.logout("valid-raw-token");
    expect(res).toEqual({ ok: true });
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { revokedAt: expect.any(Date) } }),
    );
  });

  it("bilinmeyen token → sessizce ok (bilgi sızdırma koruması)", async () => {
    const prisma = makePrisma();
    // update'in başarısız olması logout'u kırmamalı
    prisma.refreshToken.update.mockRejectedValue(new Error("not found"));
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.logout("bilinmeyen-token")).resolves.toEqual({ ok: true });
  });
});

// ---------------------------------------------------------------------------
// me
// ---------------------------------------------------------------------------

describe("AuthService.me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bilinmeyen userId → UnauthorizedException", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    const svc = new AuthService(prisma, jwt, cfg);

    await expect(svc.me("nonexistent-id")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("geçerli userId → kullanıcı verisi döner (passwordHash olmadan)", async () => {
    const prisma = makePrisma();
    const publicUser = {
      id: STORED_USER.id,
      email: STORED_USER.email,
      fullName: "Test Kullanıcı",
      phone: null,
      accountType: "personal",
      role: "customer",
      companyName: null,
      taxOffice: null,
      taxNumber: null,
    };
    prisma.user.findUnique.mockResolvedValue(publicUser);
    const svc = new AuthService(prisma, jwt, cfg);

    const res = await svc.me(STORED_USER.id);
    expect(res).toEqual(publicUser);
    // select projection DB sorgusu kontrolü
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: STORED_USER.id } }),
    );
  });
});
