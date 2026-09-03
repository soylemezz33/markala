import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

/**
 * Refresh token rotasyonunda EŞZAMANLILIK PAYI (2026-09-03).
 *
 * Sorun: admin paneli Next middleware'i her istekte çalışıyor; access token'ın son
 * 60 saniyesinde aynı anda uçan istekler AYNI refresh token'la /auth/refresh'e gidiyor.
 * İlki rotasyonu yapıyor, kalanlar revoke edilmiş token sunuyor. Eski davranış bunu
 * replay sayıp kullanıcının TÜM oturumlarını iptal ediyordu → panelden anında düşme
 * (üretim logunda 72 saatte 5 kez, biri aynı saniyede iki kez).
 *
 * Bu testler İKİSİNİ AYIRT ETTİĞİNİ çakıyor: yarış tolere edilir, gerçek replay
 * hâlâ tüm oturumları düşürür.
 */
const KULLANICI = { id: "u1", email: "a@b.c", role: "admin" };

function makeService(stored: { revokedAt: Date | null; expiresAt: Date } | null) {
  const updateMany = vi.fn().mockResolvedValue({ count: 2 });
  const prisma = {
    refreshToken: {
      findUnique: vi.fn().mockResolvedValue(stored ? { id: "rt1", userId: "u1", user: KULLANICI, ...stored } : null),
      update: vi.fn().mockResolvedValue({}),
      updateMany,
      create: vi.fn().mockResolvedValue({}),
    },
  };
  const jwt = { sign: vi.fn().mockReturnValue("yeni.access.token") };
  const config = { get: vi.fn().mockReturnValue(undefined) };
  const svc = new AuthService(prisma as never, jwt as never, config as never, {} as never);
  return { svc, prisma, updateMany };
}

const ILERIDE = new Date(Date.now() + 86_400_000);

describe("refresh — eşzamanlılık payı", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geçerli token normal rotasyona girer", async () => {
    const { svc, prisma } = makeService({ revokedAt: null, expiresAt: ILERIDE });
    const r = await svc.refresh("ham-token", {});
    expect(r.accessToken).toBe("yeni.access.token");
    expect(prisma.refreshToken.update).toHaveBeenCalled(); // eski revoke edildi
  });

  it("AZ ÖNCE rotasyona girmiş token (yarış) → yeni çift verilir, oturumlar DÜŞMEZ", async () => {
    const { svc, updateMany } = makeService({ revokedAt: new Date(Date.now() - 800), expiresAt: ILERIDE });
    const r = await svc.refresh("ham-token", {});
    expect(r.accessToken).toBe("yeni.access.token");
    expect(updateMany).not.toHaveBeenCalled(); // aile İPTAL EDİLMEDİ
  });

  it("pencere sınırının hemen içi tolere edilir", async () => {
    const { svc, updateMany } = makeService({ revokedAt: new Date(Date.now() - 19_000), expiresAt: ILERIDE });
    await expect(svc.refresh("ham-token", {})).resolves.toBeTruthy();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("ESKİ revoke edilmiş token (gerçek replay) → tüm oturumlar iptal + 401", async () => {
    const { svc, updateMany } = makeService({ revokedAt: new Date(Date.now() - 600_000), expiresAt: ILERIDE });
    await expect(svc.refresh("ham-token", {})).rejects.toThrow(UnauthorizedException);
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("süresi geçmiş token → 401, ama aileyi iptal ETMEZ (replay değil, sadece eski)", async () => {
    const { svc, updateMany } = makeService({ revokedAt: null, expiresAt: new Date(Date.now() - 1000) });
    await expect(svc.refresh("ham-token", {})).rejects.toThrow(UnauthorizedException);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("hiç bilinmeyen token → 401", async () => {
    const { svc, updateMany } = makeService(null);
    await expect(svc.refresh("yok", {})).rejects.toThrow(UnauthorizedException);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("boş token → 401", async () => {
    const { svc } = makeService(null);
    await expect(svc.refresh("", {})).rejects.toThrow(UnauthorizedException);
  });
});
