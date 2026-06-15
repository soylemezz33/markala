import { describe, it, expect } from "vitest";
import { parsePagination } from "./pagination";

describe("parsePagination", () => {
  it("varsayılanları döner (parametre yok)", () => {
    expect(parsePagination(undefined, undefined)).toEqual({ take: 50, skip: 0 });
  });

  it("geçerli sayıları parse eder", () => {
    expect(parsePagination("20", "40")).toEqual({ take: 20, skip: 40 });
  });

  it("sayı olmayan take/skip değerlerinde çökmez, varsayılana döner", () => {
    // Regresyon: `?take=abc` eskiden Prisma'ya NaN geçirip 500 üretiyordu.
    expect(parsePagination("abc", "xyz")).toEqual({ take: 50, skip: 0 });
  });

  it("boş string güvenli", () => {
    expect(parsePagination("", "")).toEqual({ take: 50, skip: 0 });
  });

  it("negatif take varsayılana döner, negatif skip 0'a sabitlenir", () => {
    expect(parsePagination("-5", "-10")).toEqual({ take: 50, skip: 0 });
  });

  it("take=0 varsayılana döner (en az 1 kayıt)", () => {
    expect(parsePagination("0", "0")).toEqual({ take: 50, skip: 0 });
  });

  it("take üst sınırı aşarsa maxTake'e sabitlenir (DoS koruması)", () => {
    expect(parsePagination("1000000", "0").take).toBe(500);
  });

  it("ondalık string tam sayıya indirgenir", () => {
    expect(parsePagination("10.9", "5.9")).toEqual({ take: 10, skip: 5 });
  });

  it("özelleştirilmiş defaultTake/maxTake uygulanır", () => {
    expect(parsePagination(undefined, undefined, { defaultTake: 10, maxTake: 20 })).toEqual({
      take: 10,
      skip: 0,
    });
    expect(parsePagination("999", "0", { defaultTake: 10, maxTake: 20 }).take).toBe(20);
  });
});
