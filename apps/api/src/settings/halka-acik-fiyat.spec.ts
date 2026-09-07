import { describe, it, expect } from "vitest";
import { halkaAcikFiyatAyarlari } from "./halka-acik-fiyat";

/**
 * 2026-09-07: 31 Ağustos denetiminde ürün ve kategori bazlı `profitMargin` halka açık
 * yanıtlardan ayıklanmıştı, ama `GET /settings/pricing` içindeki GLOBAL `marj` çarpanı
 * gözden kaçtı. Hem o uçtan hem ürün sayfasının kaynağından okunabiliyordu:
 *     {"kur":49,"marj":1.2,"kdv":0.2,"minM2":1}
 * Fiyatlar zaten herkese açık olduğundan, çarpanı bilen maliyeti geri hesaplayabilir.
 *
 * Bu testler ayıklamanın sessizce geri alınmasını engeller — 31 Ağustos'un
 * ticari-gizlilik.spec.ts nöbetçileriyle aynı amaç.
 */
describe("halkaAcikFiyatAyarlari", () => {
  const tam = { kur: 49, marj: 1.2, kdv: 0.2, minM2: 1 };

  it("marj'ı HER ZAMAN atar", () => {
    expect(halkaAcikFiyatAyarlari(tam)).not.toHaveProperty("marj");
  });

  it("konfigüratörün ihtiyaç duyduğu alanları AYNEN korur", () => {
    // Bunlar düşerse m² fiyatlandırması bozulur — ayıklama fazla agresif olmamalı.
    expect(halkaAcikFiyatAyarlari(tam)).toEqual({ kur: 49, kdv: 0.2, minM2: 1 });
  });

  it("marj 1 (kârsız) olsa bile gizlenir — değere bakılmaz", () => {
    expect(halkaAcikFiyatAyarlari({ ...tam, marj: 1 })).not.toHaveProperty("marj");
  });

  it("yanıtın hiçbir yerinde 'marj' anahtarı kalmaz (JSON düzeyinde)", () => {
    expect(JSON.stringify(halkaAcikFiyatAyarlari(tam))).not.toContain("marj");
  });
});
