import "reflect-metadata";
import { describe, it, expect } from "vitest";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { MAX_PUBLIC_PRODUCT_TAKE, ProductListQueryDto } from "./products.dto";

/** ValidationPipe(transform:true) davranışını taklit eder: @Type ile explicit dönüşüm + doğrulama. */
function check(input: Record<string, unknown>) {
  const dto = plainToInstance(ProductListQueryDto, input);
  const errors = validateSync(dto, { whitelist: true });
  return { dto, errors };
}

describe("ProductListQueryDto", () => {
  it("boş query geçerli (tüm alanlar opsiyonel)", () => {
    const { dto, errors } = check({});
    expect(errors).toHaveLength(0);
    expect(dto.take).toBeUndefined();
    expect(dto.skip).toBeUndefined();
  });

  it("geçerli take/skip string'lerini sayıya çevirir", () => {
    const { dto, errors } = check({ take: "20", skip: "40" });
    expect(errors).toHaveLength(0);
    expect(dto.take).toBe(20);
    expect(dto.skip).toBe(40);
  });

  it("take sayı değilse reddeder (NaN guard — Prisma take:NaN 500'ünü önler)", () => {
    const { errors } = check({ take: "abc" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("storefront 'tümünü getir' take değerini (5000) kabul eder — kategori sayımı bozulmaz", () => {
    const { dto, errors } = check({ take: String(MAX_PUBLIC_PRODUCT_TAKE) });
    expect(errors).toHaveLength(0);
    expect(dto.take).toBe(MAX_PUBLIC_PRODUCT_TAKE);
  });

  it("public tavanı (5000) aşan take reddedilir (sınırsız sorgu koruması)", () => {
    const { errors } = check({ take: String(MAX_PUBLIC_PRODUCT_TAKE + 1) });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("take < 1 reddedilir", () => {
    const { errors } = check({ take: "0" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("ondalık take reddedilir (@IsInt)", () => {
    const { errors } = check({ take: "10.5" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("skip negatifse reddeder", () => {
    const { errors } = check({ skip: "-1" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("bestseller 'true'/'false' → boolean; diğer her şey undefined (eski lenient davranış)", () => {
    expect(check({ bestseller: "true" }).dto.bestseller).toBe(true);
    expect(check({ bestseller: "false" }).dto.bestseller).toBe(false);
    expect(check({ bestseller: "xyz" }).dto.bestseller).toBeUndefined();
    expect(check({}).dto.bestseller).toBeUndefined();
  });

  it("aşırı uzun category reddedilir (@MaxLength)", () => {
    const { errors } = check({ category: "x".repeat(121) });
    expect(errors.length).toBeGreaterThan(0);
  });
});
