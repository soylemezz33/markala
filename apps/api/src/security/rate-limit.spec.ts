import { describe, it, expect } from "vitest";
import { FixedWindowCounter } from "./rate-limit";

describe("FixedWindowCounter", () => {
  it("limit aşılınca blocklar ve pencere dolunca sıfırlar", () => {
    let now = 1000;
    const c = new FixedWindowCounter({ windowMs: 100, max: 2 });
    expect(c.hit("ip1", now)).toMatchObject({ allowed: true });
    expect(c.hit("ip1", now)).toMatchObject({ allowed: true });
    expect(c.hit("ip1", now)).toMatchObject({ allowed: false });
    now += 101;
    expect(c.hit("ip1", now)).toMatchObject({ allowed: true });
  });

  it("farklı anahtarlar bağımsız", () => {
    const c = new FixedWindowCounter({ windowMs: 100, max: 1 });
    expect(c.hit("a", 0).allowed).toBe(true);
    expect(c.hit("b", 0).allowed).toBe(true);
    expect(c.hit("a", 0).allowed).toBe(false);
  });
});
