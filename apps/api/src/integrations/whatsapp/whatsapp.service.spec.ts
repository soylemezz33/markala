import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WhatsappService, WA_SABLON_KAYDI } from "./whatsapp.service";

/**
 * Bu testlerin koruduğu asıl şey: bildirim ASLA sipariş akışını bozmasın ve aynı sipariş
 * için ikinci kez gitmesin. WhatsApp çağrısı ödeme callback'inin içinden fire-and-forget
 * tetikleniyor — orada fırlayan bir hata müşterinin ödeme dönüşünü etkileyebilir.
 */
function cfg(v: Record<string, string>) {
  return { get: (k: string) => v[k] } as never;
}

const TAM_ENV = {
  WHATSAPP_TOKEN: "tok",
  WHATSAPP_PHONE_NUMBER_ID: "1284746154722193",
  WHATSAPP_ADMIN_TO: "0531 900 41 02",
};

const SIPARIS = {
  orderNumber: "MK-TEST-0001",
  total: 3480,
  paymentStatus: "basarili",
  paymentMethod: "kart",
  email: "m@x.com",
  shippingAddressSnapshot: null,
  user: { fullName: "Ahmet Yılmaz" },
  items: [{ productName: "Klasik Kartvizit", quantity: 1000 }],
};

function prismaMock(opts: { siparis?: unknown; gonderilmis?: number } = {}) {
  return {
    // "siparis" in opts kontrolü şart: `?? SIPARIS` yazılsaydı bilerek verilen null da
    // varsayılana düşerdi ve "sipariş bulunamadı" yolu hiç test edilmemiş olurdu.
    order: {
      findUnique: vi.fn().mockResolvedValue("siparis" in opts ? opts.siparis : SIPARIS),
    },
    notificationLog: {
      count: vi.fn().mockResolvedValue(opts.gonderilmis ?? 0),
      create: vi.fn().mockResolvedValue({}),
    },
  } as never;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ messages: [{ id: "wamid.1" }] }),
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("WhatsappService", () => {
  it("env eksikse HİÇ istek yapmaz (staging/geliştirme gerçek mesaj göndermesin)", async () => {
    const svc = new WhatsappService(cfg({}), prismaMock());
    expect(svc.gonderebilir()).toBe(false);
    expect(await svc.bildirYeniSiparis("o1")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("alıcı numarası geçersizse kapalı sayılır", async () => {
    const svc = new WhatsappService(cfg({ ...TAM_ENV, WHATSAPP_ADMIN_TO: "123" }), prismaMock());
    expect(svc.gonderebilir()).toBe(false);
  });

  it("onaylı şablonu doğru gövdeyle gönderir", async () => {
    const svc = new WhatsappService(cfg(TAM_ENV), prismaMock());
    expect(await svc.bildirYeniSiparis("o1")).toBe(true);

    const [url, istek] = fetchMock.mock.calls[0]!;
    expect(url).toContain("/1284746154722193/messages");
    const govde = JSON.parse((istek as { body: string }).body);
    expect(govde.messaging_product).toBe("whatsapp");
    expect(govde.to).toBe("905319004102"); // yerel biçim ülke koduna çevrildi
    expect(govde.type).toBe("template");
    expect(govde.template.name).toBe("yeni_siparis_bildirimi");
    expect(govde.template.components[0].parameters).toHaveLength(5);
    // Ödeme durumu mesajda AÇIKÇA yer alır (Hasan: "en önemlisi ödeme alındı mı").
    expect(govde.template.components[0].parameters[1].text).toContain("ALINDI");
  });

  it("aynı sipariş için ZATEN bildirilmişse ikinci mesaj gitmez", async () => {
    const prisma = prismaMock({ gonderilmis: 1 });
    const svc = new WhatsappService(cfg(TAM_ENV), prisma);
    expect(await svc.bildirYeniSiparis("o1")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mükerrer kontrolü yalnız BAŞARILI gönderimlere bakar", async () => {
    const prisma = prismaMock();
    const svc = new WhatsappService(cfg(TAM_ENV), prisma);
    await svc.bildirYeniSiparis("o1");
    expect((prisma as never as { notificationLog: { count: ReturnType<typeof vi.fn> } }).notificationLog.count)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "sent", template: WA_SABLON_KAYDI }),
        }),
      );
  });

  it("Meta hata dönerse FIRLATMAZ, failed olarak loglar", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { code: 132001, message: "Template not found" } }),
    });
    const prisma = prismaMock();
    const svc = new WhatsappService(cfg(TAM_ENV), prisma);
    await expect(svc.bildirYeniSiparis("o1")).resolves.toBe(false);
    const create = (prisma as never as { notificationLog: { create: ReturnType<typeof vi.fn> } })
      .notificationLog.create;
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) }),
    );
    // Teşhis için Meta'nın kodu kayda geçer.
    expect(JSON.stringify(create.mock.calls[0]![0])).toContain("132001");
  });

  it("ağ hatası FIRLATMAZ (ödeme akışı bozulmasın)", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    const svc = new WhatsappService(cfg(TAM_ENV), prismaMock());
    await expect(svc.bildirYeniSiparis("o1")).resolves.toBe(false);
  });

  it("veritabanı düşerse bile FIRLATMAZ", async () => {
    const prisma = {
      order: { findUnique: vi.fn().mockRejectedValue(new Error("DB yok")) },
      notificationLog: { count: vi.fn(), create: vi.fn() },
    } as never;
    const svc = new WhatsappService(cfg(TAM_ENV), prisma);
    await expect(svc.bildirYeniSiparis("o1")).resolves.toBe(false);
  });

  it("sipariş bulunamazsa sessizce false döner", async () => {
    const svc = new WhatsappService(cfg(TAM_ENV), prismaMock({ siparis: null }));
    expect(await svc.bildirYeniSiparis("yok")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("birden çok alıcıya gönderir", async () => {
    const svc = new WhatsappService(
      cfg({ ...TAM_ENV, WHATSAPP_ADMIN_TO: "05319004102, 05551112233" }),
      prismaMock(),
    );
    await svc.bildirYeniSiparis("o1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
