import { describe, it, expect } from "vitest";
import { paketIcerigiAyristir, paketUretimSuresi } from "./paket-icerik";

describe("paketIcerigiAyristir", () => {
  it("adet + ad + slug'ı ayırır", () => {
    const k = paketIcerigiAyristir("1.000 × Kartvizit — çift yön #klasik-kartvizit");
    expect(k).toHaveLength(1);
    expect(k[0]).toEqual({ quantity: 1000, productName: "Kartvizit — çift yön", productSlug: "klasik-kartvizit" });
  });

  it("kalemleri + ile böler", () => {
    const k = paketIcerigiAyristir("1.000 × Kartvizit #klasik-kartvizit + 2.000 × El ilanı A5 #el-ilani");
    expect(k.map((x) => x.quantity)).toEqual([1000, 2000]);
    expect(k.map((x) => x.productSlug)).toEqual(["klasik-kartvizit", "el-ilani"]);
  });

  it("ÖLÇÜDEKİ çarpı işaretini adet sanmaz", () => {
    const k = paketIcerigiAyristir("1 × Vinil branda afiş 200×100 cm #avrupa-vinil-branda");
    expect(k[0]?.quantity).toBe(1);
    expect(k[0]?.productName).toBe("Vinil branda afiş 200×100 cm");
  });

  it("ölçüyle BAŞLAYAN kalemde ebadı adet olarak okumaz çünkü ad kalır", () => {
    // "70×100 cm Dekota pano": 70 adet "100 cm Dekota pano" OLMAMALI diye başa adet yazılır.
    // Bu test mevcut davranışı sabitler: başta sayı+çarpı varsa adet olarak okunur.
    const k = paketIcerigiAyristir("5 × Dekota pano 70×100 cm #dekota-baski-5mm");
    expect(k[0]?.quantity).toBe(5);
    expect(k[0]?.productName).toBe("Dekota pano 70×100 cm");
  });

  it("işaretsiz eski metni tek kalem olarak korur", () => {
    const k = paketIcerigiAyristir("Kartvizit + Broşür + Kaşe");
    expect(k).toEqual([
      { quantity: 1, productName: "Kartvizit" },
      { quantity: 1, productName: "Broşür" },
      { quantity: 1, productName: "Kaşe" },
    ]);
  });

  it("boş metinde çökmez", () => {
    expect(paketIcerigiAyristir("")).toEqual([{ quantity: 1, productName: "" }]);
  });

  it("@uretim belirtecini kalem olarak göstermez", () => {
    const k = paketIcerigiAyristir("1.000 × Kartvizit #klasik-kartvizit + @uretim:6-12 iş günü");
    expect(k).toHaveLength(1);
    expect(k[0]?.productName).toBe("Kartvizit");
  });

  it("slug biçimine uymayan # metnini olduğu gibi bırakır", () => {
    const k = paketIcerigiAyristir("1 × Roll-Up #Gecersiz Slug");
    expect(k[0]?.productSlug).toBeUndefined();
    expect(k[0]?.productName).toBe("Roll-Up #Gecersiz Slug");
  });
});

describe("paketUretimSuresi", () => {
  it("@uretim belirtecini okur", () => {
    expect(paketUretimSuresi("1.000 × Kartvizit #klasik-kartvizit + @uretim:6-12 iş günü")).toBe("6-12 iş günü");
  });

  it("belirteç yoksa undefined döner (varsayılana düşülür)", () => {
    expect(paketUretimSuresi("1.000 × Kartvizit #klasik-kartvizit")).toBeUndefined();
  });

  it("boş metinde çökmez", () => {
    expect(paketUretimSuresi("")).toBeUndefined();
  });
});
