import { describe, it, expect } from "vitest";
import { signSession, verifySession, getJwtExp, needsRefresh, type AdminSession } from "./admin-session";

const SECRET = "test-secret-min-32-characters-長0123456789";

// exp = 9999999999 (uzak gelecek) içeren sahte JWT (imza doğrulanmaz, sadece payload okunur)
function fakeJwt(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "1", exp })).toString("base64url");
  return `${header}.${payload}.sig`;
}

const session: AdminSession = {
  accessToken: fakeJwt(9999999999),
  refreshToken: "refresh-abc",
  email: "a@b.c",
  name: "A",
  role: "super_admin",
  iat: 1000,
};

describe("admin-session", () => {
  it("signSession + verifySession round-trip", async () => {
    const token = await signSession(session, SECRET);
    const back = await verifySession(token, SECRET);
    expect(back?.email).toBe("a@b.c");
    expect(back?.accessToken).toBe(session.accessToken);
  });

  it("bozuk imza null döner", async () => {
    const token = await signSession(session, SECRET);
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySession(tampered, SECRET)).toBeNull();
  });

  it("getJwtExp payload'tan exp okur", () => {
    expect(getJwtExp(fakeJwt(1700000000))).toBe(1700000000);
  });

  it("needsRefresh süresi yakın token için true", () => {
    expect(needsRefresh(fakeJwt(0))).toBe(true);
    expect(needsRefresh(fakeJwt(9999999999))).toBe(false);
  });
});
