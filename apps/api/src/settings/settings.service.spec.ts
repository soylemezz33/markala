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
