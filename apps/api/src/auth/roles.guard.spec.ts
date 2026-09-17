import { describe, it, expect, afterEach } from "vitest";
import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard, ROLES_KEY } from "./roles.guard";
import { PERM, PERMS_KEY, setOzelRolIzinleri } from "./permissions";

/**
 * ROL GUARD'I — kısıtlanmış admin davranışı (2026-09-17).
 *
 * Panelden admin rolü daraltılabildiği için guard'ın "rol adı eşleşti → geç" kısayolu
 * artık koşullu: rol joker değilse ve uç @Perms taşıyorsa izin aranır. Bu testler, kısıt
 * yokken eski davranışın birebir korunduğunu ve kısıt varken yalnız işaretli uçların
 * kapandığını kilitler.
 */
function baglam(role: string, meta: { roles?: string[]; perms?: string[] }): { ctx: ExecutionContext; reflector: Reflector } {
  const handler = () => undefined;
  const cls = class {};
  const reflector = new Reflector();
  const orijinal = reflector.getAllAndOverride.bind(reflector);
  reflector.getAllAndOverride = ((key: string) => {
    if (key === ROLES_KEY) return meta.roles;
    if (key === PERMS_KEY) return meta.perms;
    return orijinal(key, [handler, cls]);
  }) as Reflector["getAllAndOverride"];
  const ctx = {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({ user: { sub: "u1", role } }) }),
  } as unknown as ExecutionContext;
  return { ctx, reflector };
}

function gecerMi(role: string, meta: { roles?: string[]; perms?: string[] }): boolean {
  const { ctx, reflector } = baglam(role, meta);
  try {
    return new RolesGuard(reflector).canActivate(ctx);
  } catch (e) {
    if (e instanceof ForbiddenException) return false;
    throw e;
  }
}

afterEach(() => setOzelRolIzinleri({}));

describe("RolesGuard — kısıt yokken eski davranış", () => {
  it("admin, yalnız @Roles taşıyan uçtan geçer", () => {
    expect(gecerMi("admin", { roles: ["admin", "super_admin"] })).toBe(true);
  });

  it("admin, @Roles + @Perms uçtan geçer (joker)", () => {
    expect(gecerMi("admin", { roles: ["admin", "super_admin"], perms: [PERM.FINANCE] })).toBe(true);
  });

  it("tasarımcı, izni olan uçtan geçer; olmayandan geçemez", () => {
    expect(gecerMi("tasarimci", { roles: ["admin", "super_admin"], perms: [PERM.CATALOG] })).toBe(true);
    expect(gecerMi("tasarimci", { roles: ["admin", "super_admin"], perms: [PERM.FINANCE] })).toBe(false);
  });

  it("işaretsiz uç yeni gruplara KAPALI (varsayılan kapalı)", () => {
    expect(gecerMi("kargo", { roles: ["admin", "super_admin"] })).toBe(false);
  });
});

describe("RolesGuard — panelden kısıtlanmış admin", () => {
  it("FINANCE alınınca @Perms(FINANCE) uçtan geçemez, @Perms(CATALOG) uçtan geçer", () => {
    setOzelRolIzinleri({ admin: [PERM.CATALOG, PERM.ORDERS_READ] });
    expect(gecerMi("admin", { roles: ["admin", "super_admin"], perms: [PERM.FINANCE] })).toBe(false);
    expect(gecerMi("admin", { roles: ["admin", "super_admin"], perms: [PERM.CATALOG] })).toBe(true);
  });

  it("işaretsiz (@Perms'siz) uç kısıtlı admin'e AÇIK kalır — izin anahtarı yok", () => {
    setOzelRolIzinleri({ admin: [PERM.CATALOG] });
    expect(gecerMi("admin", { roles: ["admin", "super_admin"] })).toBe(true);
  });

  it("super_admin için kayıt yok sayılır — her uçtan geçer", () => {
    setOzelRolIzinleri({ super_admin: [PERM.CATALOG] });
    expect(gecerMi("super_admin", { roles: ["super_admin"], perms: [PERM.FINANCE] })).toBe(true);
  });

  it("yetkili yönetimi (@Roles('super_admin'), @Perms yok) kısıtlı/kısıtsız admin'e her zaman kapalı", () => {
    // AdminUsersController @Perms TAŞIMAZ — bilerek: izin tabanlı açılım (dal 2) her role
    // izinle kapı açar; bu uç yalnız rol adıyla korunur ki admin SETTINGS izniyle bile giremesin.
    expect(gecerMi("admin", { roles: ["super_admin"] })).toBe(false);
    setOzelRolIzinleri({ admin: [PERM.SETTINGS] });
    expect(gecerMi("admin", { roles: ["super_admin"] })).toBe(false);
  });
});

describe("RolesGuard — panelden genişletilmiş dar rol", () => {
  it("kargoya ORDERS_STATUS verilince durum ucu açılır", () => {
    expect(gecerMi("kargo", { roles: ["admin", "super_admin"], perms: [PERM.ORDERS_STATUS] })).toBe(false);
    setOzelRolIzinleri({ kargo: [PERM.ORDERS_READ, PERM.ORDERS_STATUS] });
    expect(gecerMi("kargo", { roles: ["admin", "super_admin"], perms: [PERM.ORDERS_STATUS] })).toBe(true);
  });
});
