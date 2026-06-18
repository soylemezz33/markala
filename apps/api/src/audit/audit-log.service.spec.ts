import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { Logger } from "@nestjs/common";
import { AuditLogService } from "./audit-log.service";

function makePrisma(auditLogOverrides: Record<string, unknown> = {}) {
  return {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "al1" }),
      ...auditLogOverrides,
    },
  };
}

describe("AuditLogService.record", () => {
  it("denetim kaydını prisma.auditLog.create ile yazar (alanlar doğru maplenir)", async () => {
    const prisma = makePrisma();
    const svc = new AuditLogService(prisma as never);

    await svc.record({
      entityType: "Order",
      entityId: "ord1",
      action: "status_change",
      actorId: "admin1",
      userId: "user1",
      diff: { before: "siparis-alindi", after: "uretimde" },
      ipAddress: "1.2.3.4",
    });

    expect(prisma.auditLog.create).toHaveBeenCalledOnce();
    const data = prisma.auditLog.create.mock.calls[0][0].data;
    expect(data.entityType).toBe("Order");
    expect(data.entityId).toBe("ord1");
    expect(data.action).toBe("status_change");
    expect(data.actorId).toBe("admin1");
    expect(data.userId).toBe("user1");
    expect(data.diff).toEqual({ before: "siparis-alindi", after: "uretimde" });
    expect(data.ipAddress).toBe("1.2.3.4");
  });

  it("opsiyonel alanlar verilmezse create çağrısı yine geçerli (undefined olarak iletilir)", async () => {
    const prisma = makePrisma();
    const svc = new AuditLogService(prisma as never);

    await svc.record({ entityType: "Product", entityId: "p1", action: "delete" });

    const data = prisma.auditLog.create.mock.calls[0][0].data;
    expect(data.actorId).toBeUndefined();
    expect(data.diff).toBeUndefined();
    expect(data.ipAddress).toBeUndefined();
  });

  it("FAIL-SAFE: yazma hatası fırlatmaz (iş akışını bozmaz), sadece loglar", async () => {
    const prisma = makePrisma({ create: vi.fn().mockRejectedValue(new Error("db down")) });
    const errSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const svc = new AuditLogService(prisma as never);

    await expect(
      svc.record({ entityType: "Order", entityId: "ord1", action: "update" }),
    ).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();

    errSpy.mockRestore();
  });
});
