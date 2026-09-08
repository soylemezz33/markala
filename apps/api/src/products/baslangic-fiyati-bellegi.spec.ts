import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  onbellekliBaslangicFiyatlari,
  baslangicFiyatBellegiTemizle,
  bellekAnahtari,
  BELLEK_TTL_MS,
} from "./baslangic-fiyati-bellegi";

/**
 * 8 Eylül 2026, 14:32–14:33: TEK bir ziyaretçinin 39 sayfalık gezintisi Prisma bağlantı
 * havuzunu tüketti; 24 istek "connection pool timeout" ile düştü. O dakikalardaki toplam
 * trafik 45 istekti — yani sorun yük değil, her sayfa render'ının ~950 ms'lik başlangıç
 * fiyatı hesabını İKİ KEZ tetiklemesiydi (ürün listesi + kategoriler).
 *
 * Bu testlerin koruduğu şey sırasıyla:
 *  1) Aynı küme için ağır hesabın TEKRARLANMAMASI.
 *  2) Aynı anda gelen isteklerin TEK hesabı paylaşması — havuzu tüketen desen tam buydu;
 *     bu olmadan soğuk başlangıçta yine onlarca paralel ağır sorgu çıkar.
 *  3) Hatanın önbelleğe YAPIŞMAMASI (geçici DB hıçkırığı 60 saniye fiyatsız liste demek olurdu).
 *  4) Farklı ürün kümelerinin birbirinin sonucunu GÖRMEMESİ.
 */
const harita = (v: number) => new Map<string, number | null>([["p1", v]]);

beforeEach(() => baslangicFiyatBellegiTemizle());

describe("başlangıç fiyatı önbelleği", () => {
  it("aynı küme ikinci kez sorulduğunda AĞIR HESAP TEKRARLANMAZ", async () => {
    const hesap = vi.fn(async () => harita(100));
    await onbellekliBaslangicFiyatlari(["p1", "p2"], hesap);
    await onbellekliBaslangicFiyatlari(["p1", "p2"], hesap);
    await onbellekliBaslangicFiyatlari(["p1", "p2"], hesap);
    expect(hesap).toHaveBeenCalledTimes(1);
  });

  it("AYNI ANDA gelen 40 istek tek hesabı paylaşır (havuzu tüketen desen)", async () => {
    let cozumle: (m: Map<string, number | null>) => void = () => undefined;
    const hesap = vi.fn(() => new Promise<Map<string, number | null>>((r) => { cozumle = r; }));
    const hepsi = Promise.all(
      Array.from({ length: 40 }, () => onbellekliBaslangicFiyatlari(["p1"], hesap)),
    );
    cozumle(harita(50));
    const sonuclar = await hepsi;
    expect(hesap).toHaveBeenCalledTimes(1);
    expect(sonuclar.every((s) => s.get("p1") === 50)).toBe(true);
  });

  it("ürün SIRASI farklı olsa da aynı küme sayılır", async () => {
    const hesap = vi.fn(async () => harita(10));
    await onbellekliBaslangicFiyatlari(["a", "b", "c"], hesap);
    await onbellekliBaslangicFiyatlari(["c", "a", "b"], hesap);
    expect(hesap).toHaveBeenCalledTimes(1);
    expect(bellekAnahtari(["a", "b"])).toBe(bellekAnahtari(["b", "a"]));
  });

  it("FARKLI kümeler birbirinin sonucunu görmez", async () => {
    const hesap = vi.fn(async () => harita(1));
    await onbellekliBaslangicFiyatlari(["a"], hesap);
    await onbellekliBaslangicFiyatlari(["a", "b"], hesap);
    expect(hesap).toHaveBeenCalledTimes(2);
  });

  it("TTL dolunca yeniden hesaplanır (fiyat güncellemesi sonsuza kadar bayat kalmasın)", async () => {
    const hesap = vi.fn(async () => harita(7));
    const t0 = 1_000_000;
    await onbellekliBaslangicFiyatlari(["p1"], hesap, t0);
    await onbellekliBaslangicFiyatlari(["p1"], hesap, t0 + BELLEK_TTL_MS - 1);
    expect(hesap).toHaveBeenCalledTimes(1);
    await onbellekliBaslangicFiyatlari(["p1"], hesap, t0 + BELLEK_TTL_MS + 60_000);
    expect(hesap).toHaveBeenCalledTimes(2);
  });

  it("HATA önbelleğe YAPIŞMAZ — sonraki istek yeniden dener", async () => {
    const hesap = vi
      .fn(async (): Promise<Map<string, number | null>> => new Map())
      .mockRejectedValueOnce(new Error("DB hıçkırığı"))
      .mockResolvedValueOnce(harita(99));
    await expect(onbellekliBaslangicFiyatlari(["p1"], hesap)).rejects.toThrow("DB hıçkırığı");
    const ikinci = await onbellekliBaslangicFiyatlari(["p1"], hesap);
    expect(ikinci.get("p1")).toBe(99);
    expect(hesap).toHaveBeenCalledTimes(2);
  });

  it("panelden fiyat değişince temizlenir (bekleme olmadan taze veri)", async () => {
    const hesap = vi.fn(async () => harita(5));
    await onbellekliBaslangicFiyatlari(["p1"], hesap);
    baslangicFiyatBellegiTemizle();
    await onbellekliBaslangicFiyatlari(["p1"], hesap);
    expect(hesap).toHaveBeenCalledTimes(2);
  });

  it("boş listede hiç hesap yapmaz", async () => {
    const hesap = vi.fn(async () => harita(1));
    expect((await onbellekliBaslangicFiyatlari([], hesap)).size).toBe(0);
    expect(hesap).not.toHaveBeenCalled();
  });
});
