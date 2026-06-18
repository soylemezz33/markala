import "reflect-metadata";
import { describe, it, expect } from "vitest";
import type { Request } from "express";
import { clientIp } from "./client-ip";

function req(headers: Record<string, unknown>, remoteAddress?: string): Request {
  return { headers, socket: { remoteAddress } } as unknown as Request;
}

describe("clientIp", () => {
  it("x-forwarded-for zincirinden İLK (gerçek client) IP'yi alır", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("x-forwarded-for dizi geldiğinde ilk elemanı alır", () => {
    expect(clientIp(req({ "x-forwarded-for": ["9.9.9.9", "8.8.8.8"] }))).toBe("9.9.9.9");
  });

  it("XFF yoksa socket.remoteAddress'e düşer", () => {
    expect(clientIp(req({}, "10.0.0.5"))).toBe("10.0.0.5");
  });

  it("hiçbir kaynak yoksa undefined döner", () => {
    expect(clientIp(req({}))).toBeUndefined();
  });
});
