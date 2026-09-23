import { describe, it, expect } from "vitest";
import { cities } from "./cities";
import {
  MATBAA_BASLIK_SINIR,
  MATBAA_ACIKLAMA_SINIR,
  matbaaBaslik,
  matbaaTeslim,
  matbaaIlAciklama,
  matbaaIlceAciklama,
} from "./matbaa-meta";

describe("matbaaBaslik", () => {
  it("sığan başlıkta tam teslim vaadini korur", () => {
    expect(matbaaBaslik("Mersin", "1 Günde Kapında", "1 Gün")).toBe(
      "Mersin Matbaa & Baskı Fiyatları - 1 Günde Kapında",
    );
  });

  it("sınırı aşınca kademeli daralır, sorgu karşılığını korur", () => {
    const t = matbaaBaslik("Afyonkarahisar", "2-4 Günde Kapında", "2-4 Gün");
    expect(t.length).toBeLessThanOrEqual(MATBAA_BASLIK_SINIR);
    expect(t).toContain("Afyonkarahisar");
    expect(t).toContain("Fiyatları");
  });
});

describe("tüm il ve ilçe sayfaları Google sınırının altında", () => {
  it("başlıklar ≤ 55 (layout +10 = 65), açıklamalar ≤ 160", () => {
    const uzunBaslik: string[] = [];
    const uzunAciklama: string[] = [];

    for (const il of cities) {
      const { min, max } = il.deliveryDays;
      const { teslim, teslimKisa, teslimCumle } = matbaaTeslim(min, max, !!il.sameDayCourier);
      const baslik = matbaaBaslik(il.name, teslim, teslimKisa);
      const aciklama = matbaaIlAciklama(il.name, teslimCumle);
      if (baslik.length > MATBAA_BASLIK_SINIR) uzunBaslik.push(`${baslik} (${baslik.length})`);
      if (aciklama.length > MATBAA_ACIKLAMA_SINIR) uzunAciklama.push(`${il.slug} (${aciklama.length})`);

      for (const ilce of il.districts ?? []) {
        const ilceTeslim = ilce.sameDayDelivery ? "Aynı Gün Motor Kurye" : "1 Günde Kapında";
        const ilceKisa = ilce.sameDayDelivery ? "Aynı Gün Kurye" : "1 Gün";
        const b = matbaaBaslik(`${ilce.name} ${il.name}`, ilceTeslim, ilceKisa);
        const a = matbaaIlceAciklama(ilce.name, !!ilce.sameDayDelivery);
        if (b.length > MATBAA_BASLIK_SINIR) uzunBaslik.push(`${b} (${b.length})`);
        if (a.length > MATBAA_ACIKLAMA_SINIR) uzunAciklama.push(`${il.slug}/${ilce.slug} (${a.length})`);
      }
    }

    expect(uzunBaslik, `SERP'te kesilecek başlıklar: ${uzunBaslik.join(" | ")}`).toEqual([]);
    expect(uzunAciklama, `Kesilecek açıklamalar: ${uzunAciklama.join(" | ")}`).toEqual([]);
  });
});
