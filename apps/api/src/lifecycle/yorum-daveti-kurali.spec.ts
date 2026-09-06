import { describe, it, expect } from "vitest";
import { yorumDavetiKararlari, YORUM_SESSIZLIK_GUN } from "./yorum-daveti-kurali";

/**
 * 2026-09-06 olayı: muratalp1212@gmail.com 19 dakika arayla iki sipariş verdi, ikisi de aynı
 * gün teslim edildi ve ertesi sabah 06:00:00'da saniyeler arayla iki yorum daveti aldı.
 * Kayıtlarda mükerrer gönderim YOKTU — iki ayrı sipariş, iki ayrı davet. Alıcı için fark yok.
 * Bu testlerin koruduğu şey: bir müşteriye pencerede yalnız bir yorum daveti çıkması.
 */
const gun = 24 * 60 * 60 * 1000;
const simdi = new Date("2026-09-06T11:00:00Z");

describe("yorumDavetiKararlari", () => {
  it("aynı müşterinin iki siparişinde YALNIZ birine davet gider", () => {
    const k = yorumDavetiKararlari(
      [
        { id: "a", email: "murat@example.com" },
        { id: "b", email: "murat@example.com" },
      ],
      new Map(),
      simdi,
    );
    expect(k.map((x) => x.gonder)).toEqual([true, false]);
  });

  it("davet sıralamadaki İLK (en eski teslimat) siparişe gider", () => {
    const k = yorumDavetiKararlari(
      [
        { id: "eski", email: "murat@example.com" },
        { id: "yeni", email: "murat@example.com" },
      ],
      new Map(),
      simdi,
    );
    expect(k.find((x) => x.gonder)?.id).toBe("eski");
  });

  it("farklı müşteriler birbirini SUSTURMAZ", () => {
    const k = yorumDavetiKararlari(
      [
        { id: "a", email: "ali@example.com" },
        { id: "b", email: "veli@example.com" },
      ],
      new Map(),
      simdi,
    );
    expect(k.every((x) => x.gonder)).toBe(true);
  });

  it("sessizlik penceresi İÇİNDE davet almış müşteriye yeniden gönderilmez", () => {
    const dun = new Date(simdi.getTime() - 1 * gun);
    const k = yorumDavetiKararlari(
      [{ id: "a", email: "murat@example.com" }],
      new Map([["murat@example.com", dun]]),
      simdi,
    );
    expect(k[0]!.gonder).toBe(false);
  });

  it("sessizlik penceresi DOLMUŞSA yeniden davet edilir", () => {
    const cokEski = new Date(simdi.getTime() - (YORUM_SESSIZLIK_GUN + 1) * gun);
    const k = yorumDavetiKararlari(
      [{ id: "a", email: "murat@example.com" }],
      new Map([["murat@example.com", cokEski]]),
      simdi,
    );
    expect(k[0]!.gonder).toBe(true);
  });

  it("e-posta büyük/küçük harf farkı aynı müşteri sayılır", () => {
    const k = yorumDavetiKararlari(
      [
        { id: "a", email: "Murat@Example.com" },
        { id: "b", email: "murat@example.com" },
      ],
      new Map(),
      simdi,
    );
    expect(k.map((x) => x.gonder)).toEqual([true, false]);
  });

  it("e-postası olmayan sipariş listeden düşer (karar üretilmez)", () => {
    const k = yorumDavetiKararlari(
      [
        { id: "a", email: null },
        { id: "b", email: "   " },
        { id: "c", email: "ali@example.com" },
      ],
      new Map(),
      simdi,
    );
    expect(k).toHaveLength(1);
    expect(k[0]!.id).toBe("c");
  });

  it("susturulan sipariş de karar listesinde döner — çağıran onu işaretleyebilsin", () => {
    const k = yorumDavetiKararlari(
      [
        { id: "a", email: "murat@example.com" },
        { id: "b", email: "murat@example.com" },
      ],
      new Map(),
      simdi,
    );
    // İkisi de dönmeli: susturulan sipariş işaretlenmezse her gün yeniden aday olur.
    expect(k.map((x) => x.id)).toEqual(["a", "b"]);
  });
});
