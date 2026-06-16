import "reflect-metadata";
import { describe, it, expect } from "vitest";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { PaginationQueryDto } from "./pagination.dto";

/** ValidationPipe(transform:true) davranışını taklit eder: @Type ile explicit dönüşüm + doğrulama. */
function check(input: Record<string, unknown>) {
  const dto = plainToInstance(PaginationQueryDto, input);
  const errors = validateSync(dto, { whitelist: true });
  return { dto, errors };
}

describe("PaginationQueryDto", () => {
  it("geçerli take/skip string'lerini sayıya çevirir", () => {
    const { dto, errors } = check({ take: "20", skip: "10" });
    expect(errors).toHaveLength(0);
    expect(dto.take).toBe(20);
    expect(dto.skip).toBe(10);
  });

  it("boş girdi geçerli (take/skip opsiyonel)", () => {
    const { errors } = check({});
    expect(errors).toHaveLength(0);
  });

  it("take sayı değilse reddeder (NaN guard — Prisma take:NaN 500'ünü önler)", () => {
    const { errors } = check({ take: "abc" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("take üst sınırı (200) aşarsa reddeder (sınırsız sorgu DoS koruması)", () => {
    const { errors } = check({ take: "500" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("take < 1 reddedilir", () => {
    const { errors } = check({ take: "0" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("skip negatifse reddeder", () => {
    const { errors } = check({ skip: "-1" });
    expect(errors.length).toBeGreaterThan(0);
  });
});
