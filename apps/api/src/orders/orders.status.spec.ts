import { describe, it, expect } from "vitest";
import { OrderStatus } from "@prisma/client";
import { slugToOrderStatus } from "./orders.service";

/**
 * Regresyon: şema'da OrderStatus enum değerleri @map ile hyphen'li ("kargoya-verildi") DB
 * değerine maplenmiş, ama Prisma Client API'si underscore üye adı ("kargoya_verildi") bekliyor.
 * Servis eskiden hyphen slug'ı doğrudan `status: ... as any` ile Prisma'ya geçiriyordu →
 * "Expected OrderStatus" validation hatası (500). slugToOrderStatus bu sınırı düzeltir.
 */
describe("slugToOrderStatus", () => {
  it("tüm geçerli slug'lar Prisma'nın kabul ettiği underscore üyeye maplenir", () => {
    const slugs = [
      "siparis-alindi",
      "tasarim-bekleniyor",
      "tasarim-onayindi",
      "uretimde",
      "kargoya-verildi",
      "teslim-edildi",
      "iptal-edildi",
    ];
    const members = Object.values(OrderStatus) as string[];
    for (const slug of slugs) {
      const mapped = slugToOrderStatus(slug);
      expect(mapped).not.toBeNull();
      // Prisma Client yalnızca underscore üye adlarını kabul eder.
      expect(members).toContain(mapped as string);
    }
  });

  it("hyphen → underscore dönüşümü doğru", () => {
    expect(slugToOrderStatus("kargoya-verildi")).toBe("kargoya_verildi");
    expect(slugToOrderStatus("uretimde")).toBe("uretimde");
  });

  it("bilinmeyen / boş / null slug → null (filtre uygulanmaz, 500 yok)", () => {
    expect(slugToOrderStatus("garbage")).toBeNull();
    expect(slugToOrderStatus("kargoya_verildi-x")).toBeNull();
    expect(slugToOrderStatus("")).toBeNull();
    expect(slugToOrderStatus(undefined)).toBeNull();
    expect(slugToOrderStatus(null)).toBeNull();
  });
});
