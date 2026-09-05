import { describe, it, expect } from "vitest";
import { arizaliMi, ARIZA_PENCERESI_MS, SERIT_HATA_PENCERESI_MS } from "./mail-health.service";

/**
 * Panel şeridi penceresi (2026-09-05, Hasan: "her gün hata varmış gibi gözüküyor").
 *
 * Şerit sağlıklı durumda `lastFailureAt`i YAŞINA BAKMADAN basıyordu: aylar önceki tek
 * bir hata her gün "son hata 14:47" olarak duruyordu — üstelik tarihsiz, yani bugünmüş
 * gibi. Arayüz artık son 24 saatteki hata SAYISINI gösteriyor; bu testler iki pencereyi
 * ve arıza kararının değişmediğini çakıyor.
 */
describe("e-posta sağlık pencereleri", () => {
  it("arıza penceresi 15 dk, şerit penceresi 24 saat", () => {
    expect(ARIZA_PENCERESI_MS).toBe(15 * 60 * 1000);
    expect(SERIT_HATA_PENCERESI_MS).toBe(24 * 60 * 60 * 1000);
    // Şerit penceresi arıza penceresinden GENİŞ olmalı: "şu an arızalı" ile
    // "bugün bir sorun oldu mu" farklı sorular.
    expect(SERIT_HATA_PENCERESI_MS).toBeGreaterThan(ARIZA_PENCERESI_MS);
  });

  it("15 dk'dan eski hata ARIZA saymaz (davranış korundu)", () => {
    const now = new Date("2026-09-05T12:00:00Z");
    expect(
      arizaliMi({ lastFailureAt: new Date("2026-09-05T11:40:00Z"), lastSentAt: null, now }),
    ).toBe(false);
  });

  it("15 dk içindeki hata, sonrasında başarı YOKSA arızadır", () => {
    const now = new Date("2026-09-05T12:00:00Z");
    expect(
      arizaliMi({ lastFailureAt: new Date("2026-09-05T11:55:00Z"), lastSentAt: null, now }),
    ).toBe(true);
  });

  it("hatadan SONRA başarılı gönderim varsa arıza geçmiştir", () => {
    const now = new Date("2026-09-05T12:00:00Z");
    expect(
      arizaliMi({
        lastFailureAt: new Date("2026-09-05T11:55:00Z"),
        lastSentAt: new Date("2026-09-05T11:58:00Z"),
        now,
      }),
    ).toBe(false);
  });

  it("hiç hata yoksa arıza yok", () => {
    expect(arizaliMi({ lastFailureAt: null, lastSentAt: new Date() })).toBe(false);
  });
});
