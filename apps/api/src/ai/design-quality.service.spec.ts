import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { DesignQualityService } from "./design-quality.service";

/**
 * PoC kontratını kilitler: design-quality stub'ı simüle DPI=300 / bleed=3mm döner,
 * ama eşik mantığı (DPI hatası vs bleed uyarısı, https guard) gerçek dallanma içerir —
 * prod implementasyonu (Sharp/pdf-parse) geçince bu sözleşme korunmalı.
 */
describe("DesignQualityService.check", () => {
  const svc = new DesignQualityService();
  const httpsUrl = "https://cdn.markala.com.tr/uploads/tasarim.pdf";

  it("https olmayan URL → BadRequestException (KVKK: sadece güvenli depolama)", async () => {
    await expect(svc.check({ designUrl: "http://insecure.example/x.pdf" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("varsayılan eşiklerde (300dpi / 3mm) geçer, hata/uyarı yok", async () => {
    const res = await svc.check({ designUrl: httpsUrl });
    expect(res.passed).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
    expect(res.dpi).toBe(300);
    expect(res.bleedMm).toBe(3);
  });

  it("daha yüksek DPI talep edilirse → error + passed:false", async () => {
    const res = await svc.check({ designUrl: httpsUrl, expectedDpi: 600 });
    expect(res.passed).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("daha yüksek bleed talep edilirse → warning (passed'ı bozmaz)", async () => {
    const res = await svc.check({ designUrl: httpsUrl, bleedMm: 5 });
    expect(res.passed).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});
