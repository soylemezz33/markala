import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  eksikPaketHatasiMi,
  yenidenYuklenmeliMi,
  eksikPaketiKurtarmayiDene,
  KURTARMA_ANAHTARI,
} from "@markala/ui";

/**
 * 7 Eylül 2026: bir müşteri 4 ayrı cihazda "Beklenmeyen bir hata oluştu" ekranı gördü.
 * nginx kayıtları sebebi verdi — tarayıcısı artık var olmayan paketleri istiyordu:
 *     404 /_next/static/chunks/main-app-1a5767507ab66852.js
 * O gün ~10 deploy yapılmıştı; her yapı yeni dosya adları üretir, eskiler silinir.
 *
 * Bu testlerin koruduğu İKİ şey var ve ikincisi daha kritik:
 *  1) Bu hata türünde sayfa kendini yenilesin (müşteri Ctrl+Shift+R bilmek zorunda kalmasın).
 *  2) ASLA sonsuz yenileme döngüsüne girmesin — yenilemeden sonra hata sürerse (gerçekten
 *     bozuk yapı, ağ filtresi, engelleyici eklenti) site kullanılamaz hâle gelir ve sunucu
 *     boşuna yük alır. Oturum başına EN FAZLA BİR deneme.
 */
describe("eksikPaketHatasiMi", () => {
  it("Next.js ChunkLoadError'unu tanır", () => {
    const e = Object.assign(new Error("Loading chunk 42 failed."), { name: "ChunkLoadError" });
    expect(eksikPaketHatasiMi(e)).toBe(true);
  });

  it("modern tarayıcıların modül yükleme hatalarını tanır", () => {
    for (const m of [
      "Failed to fetch dynamically imported module: https://markala.com.tr/_next/x.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
    ]) {
      expect(eksikPaketHatasiMi(new Error(m)), m).toBe(true);
    }
  });

  it("ALAKASIZ hatalarda tetiklenmez (yoksa her hatada sayfa yenilenirdi)", () => {
    expect(eksikPaketHatasiMi(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(eksikPaketHatasiMi(new TypeError("x is not a function"))).toBe(false);
    expect(eksikPaketHatasiMi(null)).toBe(false);
    expect(eksikPaketHatasiMi(undefined)).toBe(false);
  });
});

describe("yenidenYuklenmeliMi", () => {
  const paketHatasi = Object.assign(new Error("Loading chunk failed"), { name: "ChunkLoadError" });

  it("paket hatası + ilk deneme → YENİLE", () => {
    expect(yenidenYuklenmeliMi({ hata: paketHatasi, dahaOnceDenendi: false })).toBe(true);
  });

  it("DÖNGÜ KORUMASI: bir kez denendiyse bir daha yenilemez", () => {
    expect(yenidenYuklenmeliMi({ hata: paketHatasi, dahaOnceDenendi: true })).toBe(false);
  });

  it("alakasız hatada yenilemez", () => {
    expect(yenidenYuklenmeliMi({ hata: new Error("başka"), dahaOnceDenendi: false })).toBe(false);
  });
});

describe("eksikPaketiKurtarmayiDene (tarayıcı)", () => {
  let reload: ReturnType<typeof vi.fn>;
  let depo: Record<string, string>;

  beforeEach(() => {
    depo = {};
    reload = vi.fn();
    vi.stubGlobal("window", {
      location: { reload },
      sessionStorage: {
        getItem: (k: string) => depo[k] ?? null,
        setItem: (k: string, v: string) => {
          depo[k] = v;
        },
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  const paketHatasi = Object.assign(new Error("Loading chunk failed"), { name: "ChunkLoadError" });

  it("ilk paket hatasında sayfayı yeniler ve işaret bırakır", () => {
    expect(eksikPaketiKurtarmayiDene(paketHatasi)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(depo[KURTARMA_ANAHTARI]).toBe("1");
  });

  it("İKİNCİ kez ASLA yenilemez — sonsuz döngü olmaz", () => {
    eksikPaketiKurtarmayiDene(paketHatasi);
    reload.mockClear();
    expect(eksikPaketiKurtarmayiDene(paketHatasi)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("alakasız hatada sayfaya dokunmaz (hata ekranı görünsün)", () => {
    expect(eksikPaketiKurtarmayiDene(new Error("başka bir hata"))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("sessionStorage kapalıysa çökmez, yalnız kurtarma yapmaz", () => {
    vi.stubGlobal("window", {
      location: { reload },
      sessionStorage: {
        getItem: () => {
          throw new Error("gizli sekmede depolama kapalı");
        },
        setItem: () => undefined,
      },
    });
    expect(() => eksikPaketiKurtarmayiDene(paketHatasi)).not.toThrow();
    expect(reload).not.toHaveBeenCalled();
  });
});
