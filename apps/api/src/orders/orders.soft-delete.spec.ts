import { describe, it, expect, vi } from "vitest";
import { OrdersService } from "./orders.service";

/**
 * Soft-delete edilen sipariş HİÇBİR listede görünmemeli.
 *
 * 2026-09-03: şema deletedAt'i "KVKK & TTK — mali kayıt 10 yıl saklanır" diye
 * tanımlıyor ve cron'lar/ciro sorguları filtreliyordu, ama panel listesi (listAll)
 * ile müşterinin "Siparişlerim" listesi (listMine) filtrelemiyordu — silinen sipariş
 * ekranda durmaya devam ediyordu.
 */
function makeService() {
  const findMany = vi.fn().mockResolvedValue([]);
  const prisma = { order: { findMany } };
  const svc = new OrdersService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { svc, findMany };
}

describe("Soft-delete edilmiş siparişler listelerde görünmez", () => {
  it("listMine — müşterinin kendi siparişleri", async () => {
    const { svc, findMany } = makeService();
    await svc.listMine("u1");
    expect(findMany.mock.calls[0]![0].where).toEqual({ userId: "u1", deletedAt: null });
  });

  it("listAll — panel listesi, filtresiz", async () => {
    const { svc, findMany } = makeService();
    await svc.listAll({});
    expect(findMany.mock.calls[0]![0].where).toEqual({ deletedAt: null });
  });

  it("listAll — durum filtresi varken de", async () => {
    const { svc, findMany } = makeService();
    await svc.listAll({ status: "uretimde" });
    expect(findMany.mock.calls[0]![0].where).toEqual({ status: "uretimde", deletedAt: null });
  });
});
