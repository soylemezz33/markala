import { describe, it, expect } from "vitest";
import { extractConfigQuantity } from "./orders.service";

/**
 * Regresyon: `configuration` doğrulanmamış `unknown` olduğundan ondalık bir adet
 * (`{ quantity: 2.5 }`) eskiden effectiveQty olarak OrderItem.quantity (Int) sütununa
 * gidip Prisma create'i 500 ile patlatıyordu. extractConfigQuantity artık daima
 * pozitif tam sayı (ondalık → floor) veya null döner.
 */
describe("extractConfigQuantity", () => {
  it("tam sayı adedi olduğu gibi döner", () => {
    expect(extractConfigQuantity({ quantity: 1000 })).toBe(1000);
  });

  it("ondalık adet aşağı yuvarlanır (Int sütun çökmesini önler)", () => {
    expect(extractConfigQuantity({ quantity: 2.5 })).toBe(2);
  });

  it("string adet parse edilip tam sayıya indirgenir", () => {
    expect(extractConfigQuantity({ adet: "250" })).toBe(250);
    expect(extractConfigQuantity({ count: "12.9" })).toBe(12);
  });

  it("0..1 arası ondalık → null (DTO baseQty'ye düşülür)", () => {
    expect(extractConfigQuantity({ quantity: 0.4 })).toBeNull();
  });

  it("sıfır / negatif / geçersiz → null", () => {
    expect(extractConfigQuantity({ quantity: 0 })).toBeNull();
    expect(extractConfigQuantity({ quantity: -3 })).toBeNull();
    expect(extractConfigQuantity({ adet: "abc" })).toBeNull();
    expect(extractConfigQuantity({ quantity: Infinity })).toBeNull();
  });

  it("adet alanı yok / config nesne değil → null", () => {
    expect(extractConfigQuantity({ renk: "kırmızı" })).toBeNull();
    expect(extractConfigQuantity(null)).toBeNull();
    expect(extractConfigQuantity("string")).toBeNull();
    expect(extractConfigQuantity(undefined)).toBeNull();
  });

  it("öncelik quantity → adet → count sırasındadır", () => {
    expect(extractConfigQuantity({ quantity: 5, adet: 9 })).toBe(5);
    expect(extractConfigQuantity({ adet: 7, count: 3 })).toBe(7);
  });
});
