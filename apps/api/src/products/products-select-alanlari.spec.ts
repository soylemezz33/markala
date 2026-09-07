import { describe, it, expect, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { ProductsService } from "./products.service";

/**
 * 2026-09-07 REGRESYONU: liste sorgusuna `sku: true` eklendi. `sku` Product modelinde bir
 * SÜTUN DEĞİL (content JSON'unun içinde yaşıyor). Prisma bunu ancak ÇALIŞMA ANINDA
 * reddediyor → PrismaClientValidationError → /products/admin-list her istekte 400 döndü ve
 * panel ürünler sayfası tamamen açılmaz oldu. Canlıda fark edildi.
 *
 * NEDEN TESTLER YAKALAMADI: birim testlerde Prisma taklit ediliyor; sahte istemci hangi
 * alanın istendiğini umursamaz, her şeyi kabul eder. TypeScript de yakalamaz çünkü select
 * nesnesi koşullu yayılımla (spread) kuruluyor ve tipi genişliyor.
 *
 * Bu test gerçek şemayı (Prisma DMMF) kaynak alır: servisin istediği HER alan modelde
 * gerçekten var mı diye bakar. Uydurma alan eklenirse burada kırmızı yanar.
 */
function urunAlanlari(): Set<string> {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === "Product");
  if (!model) throw new Error("Product modeli DMMF'te bulunamadı");
  return new Set(model.fields.map((f) => f.name));
}

/** findAll'ı sahte prisma ile koşturup ürün listesi sorgusunun `select`ini yakalar. */
async function secilenAlanlar(opts: Record<string, unknown>): Promise<string[] | null> {
  const cagrilar: unknown[] = [];
  const prisma = {
    product: {
      findMany: vi.fn((args: unknown) => {
        cagrilar.push(args);
        return Promise.resolve([]);
      }),
    },
    productPrice: { groupBy: vi.fn().mockResolvedValue([]) },
    productOption: { groupBy: vi.fn().mockResolvedValue([]) },
  };
  const settings = { getPricing: vi.fn().mockResolvedValue({}) };
  const svc = new ProductsService(prisma as never, settings as never);
  await svc.findAll(opts as never);
  const ilk = cagrilar[0] as { select?: Record<string, unknown> } | undefined;
  return ilk?.select ? Object.keys(ilk.select) : null;
}

describe("ürün liste sorgusu — select alanları şemada VAR mı", () => {
  it("panel listesi (includeInactive) yalnız GERÇEK Product alanları ister", async () => {
    const alanlar = await secilenAlanlar({ list: true, includeInactive: true, take: 10 });
    expect(alanlar, "liste modunda select bekleniyordu").not.toBeNull();
    const gecerli = urunAlanlari();
    const uydurma = alanlar!.filter((a) => !gecerli.has(a));
    // Boş olmalı. Dolu ise: bu alan modelde yok, Prisma çalışma anında 400 üretir.
    expect(uydurma).toEqual([]);
  });

  it("vitrin listesi de yalnız GERÇEK Product alanları ister", async () => {
    const alanlar = await secilenAlanlar({ list: true, take: 10 });
    const gecerli = urunAlanlari();
    expect(alanlar!.filter((a) => !gecerli.has(a))).toEqual([]);
  });

  it("panel listesi tablonun ihtiyaç duyduğu alanları GERÇEKTEN içerir", async () => {
    const alanlar = await secilenAlanlar({ list: true, includeInactive: true, take: 10 });
    // Bunlar eksikse panel tablosu boş sütun gösterir (sessiz bozulma).
    for (const gerekli of ["id", "name", "slug", "isActive", "categoryId", "productionTime"]) {
      expect(alanlar, `panel tablosu '${gerekli}' alanını kullanıyor`).toContain(gerekli);
    }
  });

  it("vitrin listesi panel-özel alanları TAŞIMAZ (payload şişmesin)", async () => {
    const alanlar = await secilenAlanlar({ list: true, take: 10 });
    expect(alanlar).not.toContain("isActive");
    expect(alanlar).not.toContain("categoryId");
  });
});
