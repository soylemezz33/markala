import { describe, it, expect, vi } from "vitest";
import { SettingsService } from "./settings.service";

function mockPrisma() {
  return {
    siteSetting: {
      findMany: vi.fn().mockResolvedValue([
        { key: "general.siteName", value: "Markala", group: "general" },
      ]),
      upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve(create)),
    },
  };
}

describe("SettingsService", () => {
  it("findByGroup group filtresi uygular", async () => {
    const prisma = mockPrisma();
    const svc = new SettingsService(prisma as never);
    const res = await svc.findByGroup("general");
    expect(prisma.siteSetting.findMany).toHaveBeenCalledWith({ where: { group: "general" } });
    expect(res).toEqual({ "general.siteName": "Markala" });
  });

  it("findByGroup group yoksa hepsini döner", async () => {
    const prisma = mockPrisma();
    const svc = new SettingsService(prisma as never);
    await svc.findByGroup();
    expect(prisma.siteSetting.findMany).toHaveBeenCalledWith({});
  });

  it("upsertMany her anahtarı upsert eder", async () => {
    const prisma = mockPrisma();
    const svc = new SettingsService(prisma as never);
    await svc.upsertMany("general", { "general.siteName": "Yeni", "general.siteUrl": "x" });
    expect(prisma.siteSetting.upsert).toHaveBeenCalledTimes(2);
  });
});

describe("getShipping", () => {
  it("site_settings'ten fee+freeThreshold okur", async () => {
    const prisma = mockPrisma();
    prisma.siteSetting.findMany.mockResolvedValue([
      { key: "shipping.fee", value: 99, group: "shipping", updatedAt: new Date() },
      { key: "shipping.freeThreshold", value: 1000, group: "shipping", updatedAt: new Date() },
    ] as any);
    const svc = new SettingsService(prisma as never);
    expect(await svc.getShipping()).toEqual({ fee: 99, freeThreshold: 1000 });
  });

  it("eksikse 79/1500 fallback", async () => {
    const prisma = mockPrisma();
    prisma.siteSetting.findMany.mockResolvedValue([] as any);
    const svc = new SettingsService(prisma as never);
    expect(await svc.getShipping()).toEqual({ fee: 79, freeThreshold: 1500 });
  });

  it("getPricing eksik anahtarlarda default döner", async () => {
    const prisma = mockPrisma();
    prisma.siteSetting.findMany.mockResolvedValue([] as any);
    const svc = new SettingsService(prisma as never);
    expect(await svc.getPricing()).toEqual({ kur: 46, marj: 1.5, kdv: 0.2, minM2: 1 });
  });

  it("getPricing DB değerlerini okur, eksiği default'lar", async () => {
    const prisma = mockPrisma();
    prisma.siteSetting.findMany.mockResolvedValue([
      { key: "pricing.kur", value: 50, group: "pricing" },
      { key: "pricing.marj", value: 1.6, group: "pricing" },
    ] as any);
    const svc = new SettingsService(prisma as never);
    const p = await svc.getPricing();
    expect(p.kur).toBe(50);
    expect(p.marj).toBe(1.6);
    expect(p.kdv).toBe(0.2);
    expect(p.minM2).toBe(1);
  });
});
