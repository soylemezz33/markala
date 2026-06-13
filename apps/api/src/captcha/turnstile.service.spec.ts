import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TurnstileService } from "./turnstile.service";

function cfg(values: Record<string, string | undefined>) {
  return { get: (k: string) => values[k] } as any;
}

describe("TurnstileService", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prod'da geçerli token + doğru action + whitelist host → true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: "register", hostname: "markala.com.tr" }),
    }));
    const svc = new TurnstileService(cfg({ NODE_ENV: "production", TURNSTILE_SECRET_KEY: "s" }));
    expect(await svc.verify("tok", "register", "1.2.3.4")).toBe(true);
  });

  it("action uyuşmazlığı → false (replay koruması)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: "login", hostname: "markala.com.tr" }),
    }));
    const svc = new TurnstileService(cfg({ NODE_ENV: "production", TURNSTILE_SECRET_KEY: "s" }));
    expect(await svc.verify("tok", "register", "1.2.3.4")).toBe(false);
  });

  it("ağ hatası → false (FAIL-CLOSED)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const svc = new TurnstileService(cfg({ NODE_ENV: "production", TURNSTILE_SECRET_KEY: "s" }));
    expect(await svc.verify("tok", "register")).toBe(false);
  });

  it("dev'de secret yok → true (dev fail-open)", async () => {
    const svc = new TurnstileService(cfg({ NODE_ENV: "development", TURNSTILE_SECRET_KEY: undefined }));
    expect(await svc.verify("anything", "login")).toBe(true);
  });
});
