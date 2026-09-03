import { describe, it, expect, vi } from "vitest";
import { MailHealthService, arizaliMi, uyariGerekliMi, ARIZA_PENCERESI_MS, UYARI_ARALIGI_MS } from "./mail-health.service";

/**
 * E-posta arıza uyarısı (2026-09-03). Koruduğu kurallar: 15 dk penceresi + "hatadan sonra
 * başarı = düzeldi"; uyarı 30 dk'da en çok bir kez; düzelince tek "düzeldi" mesajı; uyarı
 * kanalı hata verse bile gönderim akışı fırlatmaz.
 */

const T0 = new Date("2026-09-03T12:00:00Z");
const dk = (n: number) => new Date(T0.getTime() + n * 60_000);

describe("arizaliMi", () => {
  it("hiç hata yoksa sağlıklı", () => expect(arizaliMi({ lastFailureAt: null, lastSentAt: null, now: T0 })).toBe(false));
  it("15 dk içinde hata var, sonrasında başarı yok → arızalı", () =>
    expect(arizaliMi({ lastFailureAt: dk(-5), lastSentAt: dk(-10), now: T0 })).toBe(true));
  it("hatadan SONRA başarılı gönderim → düzeldi", () =>
    expect(arizaliMi({ lastFailureAt: dk(-5), lastSentAt: dk(-2), now: T0 })).toBe(false));
  it("hata 15 dk'dan eski → arıza sayılmaz", () =>
    expect(arizaliMi({ lastFailureAt: new Date(T0.getTime() - ARIZA_PENCERESI_MS - 1), lastSentAt: null, now: T0 })).toBe(false));
});

describe("uyariGerekliMi", () => {
  it("ilk hata → uyar; 30 dk dolmadan tekrar → uyarma; dolunca → uyar", () => {
    expect(uyariGerekliMi({ lastAlertAt: null, now: 1000 })).toBe(true);
    expect(uyariGerekliMi({ lastAlertAt: 1000, now: 1000 + UYARI_ARALIGI_MS - 1 })).toBe(false);
    expect(uyariGerekliMi({ lastAlertAt: 1000, now: 1000 + UYARI_ARALIGI_MS })).toBe(true);
  });
});

function make(env: Record<string, string> = {}) {
  const prisma = {
    notificationLog: {
      findFirst: vi.fn().mockImplementation(({ where }) => Promise.resolve(where.status === "failed" ? { createdAt: new Date(Date.now() - 60_000), metadata: { error: "535 Authentication failed" } } : { createdAt: new Date(Date.now() - 30 * 60_000) })),
      count: vi.fn().mockResolvedValue(3),
    },
  };
  const svc = new MailHealthService({ get: (k: string) => env[k] } as never, prisma as never);
  const uyar = vi.spyOn(svc as unknown as { uyar: (...a: unknown[]) => Promise<void> }, "uyar").mockResolvedValue(undefined);
  return { svc, uyar, prisma };
}

describe("MailHealthService.kaydet", () => {
  it("ilk hatada uyarır, ardışık hatalarda 30 dk susar", async () => {
    const { svc, uyar } = make();
    await svc.kaydet("failed", { recipient: "a@x", subject: "S", error: "535" });
    await svc.kaydet("failed", { recipient: "b@x", subject: "S", error: "535" });
    expect(uyar).toHaveBeenCalledTimes(1);
    expect(String(uyar.mock.calls[0][0])).toContain("ARIZALI");
    expect(uyar.mock.calls[0][2]).toMatchObject({ tur: "mail_arizasi", failedLast15m: 3, lastError: "535 Authentication failed" });
  });
  it("arıza sonrası ilk başarıda tek 'düzeldi' uyarısı; sağlıklıyken başarı sessiz", async () => {
    const { svc, uyar } = make();
    await svc.kaydet("sent", { recipient: "a@x" });
    expect(uyar).not.toHaveBeenCalled();
    await svc.kaydet("failed", { recipient: "a@x", error: "535" });
    await svc.kaydet("sent", { recipient: "a@x", subject: "S" });
    await svc.kaydet("sent", { recipient: "b@x", subject: "S" });
    expect(uyar).toHaveBeenCalledTimes(2);
    expect(String(uyar.mock.calls[1][0])).toContain("DÜZELDİ");
  });
  it("durum(): DB'den okur, gizli veri sızdırmaz (hata metni kırpılır)", async () => {
    const { svc } = make();
    const d = await svc.durum();
    expect(d.ok).toBe(false);
    expect(d.failedLast15m).toBe(3);
    expect(d.lastError).toBe("535 Authentication failed");
  });
  it("uyarı kanalı patlasa bile kaydet fırlatmaz", async () => {
    const { svc, uyar } = make();
    uyar.mockRejectedValueOnce(new Error("webhook down"));
    await expect(svc.kaydet("failed", { recipient: "a@x", error: "535" })).resolves.toBeUndefined();
  });
});
