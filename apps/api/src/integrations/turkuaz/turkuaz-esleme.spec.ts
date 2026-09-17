import { describe, expect, it } from "vitest";
import { computeConfiguredPrice } from "../../orders/pricing";
import {
  adetKademeleri,
  aciklamaTemizle,
  gruplaVeEsle,
  grupToYuk,
  minSiparisAyikla,
  slugla,
  TurkuazGrup,
} from "./turkuaz-esleme";
import { kategorileriAyristir, kokKategori, urunleriAyristir } from "./turkuaz-xml";

const ORNEK_URUN_XML = `<?xml version="1.0" encoding="utf-8"?>
<turkuaz>
  <urunler>
    <uid>5518</uid><kid>27</kid><kategori>Seramik ve Porselen Bardaklar</kategori>
    <isim>Porselen Kupa</isim><baslik>7275SYH Porselen Kupa</baslik>
    <aciklama>*Minimum sipariş 45 adettir.
*Porselen Kupa &amp; Kutu</aciklama>
    <kod>7275SYH</kod><kodgrup>7275</kodgrup><renk>Siyah</renk><ebat>280 ml</ebat>
    <imalat>1</imalat>
    <resim1>https://ornek.tld/img/urunresimleri/7275SYH.jpg</resim1>
    <kodgrupResim>https://ornek.tld/img/kodgrup/7275_V1.jpg</kodgrupResim>
    <stok>500</stok><toplamstok>500</toplamstok><durum>1</durum>
    <fiyat>190.00</fiyat><kdv>20.00</kdv>
  </urunler>
  <urunler>
    <uid>5517</uid><kid>27</kid><kategori>Seramik ve Porselen Bardaklar</kategori>
    <isim>Porselen Kupa</isim><baslik>7275SAR Porselen Kupa</baslik>
    <aciklama>*Minimum sipariş 45 adettir.</aciklama>
    <kod>7275SAR</kod><kodgrup>7275</kodgrup><renk>Sarı</renk><ebat>280 ml</ebat>
    <imalat>1</imalat>
    <resim1>https://ornek.tld/img/urunresimleri/7275SAR.jpg</resim1>
    <stok>0</stok><toplamstok>0</toplamstok><durum>1</durum>
    <fiyat>190.00</fiyat><kdv>20.00</kdv>
  </urunler>
</turkuaz>`;

const ORNEK_KATEGORI_XML = `<?xml version="1.0" encoding="utf-8" ?>
<turkuaz>
  <kategoriler><kid>26</kid><ustkid>0</ustkid><isim>Termos ve Kupa Bardaklar</isim><durum>1</durum></kategoriler>
  <kategoriler><kid>27</kid><ustkid>26</ustkid><isim>Seramik ve Porselen Bardaklar</isim><durum>1</durum></kategoriler>
  <kategoriler><kid>40</kid><ustkid>0</ustkid><isim>Matbaa Ürünleri</isim><durum>1</durum></kategoriler>
  <kategoriler><kid>41</kid><ustkid>40</ustkid><isim>Kağıt Ürünler</isim><durum>1</durum></kategoriler>
</turkuaz>`;

function ornekGrup(): TurkuazGrup {
  const skular = urunleriAyristir(ORNEK_URUN_XML);
  const kategoriler = kategorileriAyristir(ORNEK_KATEGORI_XML);
  return gruplaVeEsle(skular, kategoriler).gruplar[0];
}

describe("turkuaz-xml", () => {
  it("SKU alanlarını ve XML kaçışlarını doğru ayrıştırır", () => {
    const skular = urunleriAyristir(ORNEK_URUN_XML);
    expect(skular).toHaveLength(2);
    expect(skular[0].kod).toBe("7275SYH");
    expect(skular[0].fiyat).toBe(190);
    expect(skular[0].stok).toBe(500);
    expect(skular[0].aciklama).toContain("Kupa & Kutu");
    expect(skular[0].resimler).toContain("https://ornek.tld/img/kodgrup/7275_V1.jpg");
  });

  it("kök kategoriyi ustkid zincirinden bulur", () => {
    const kategoriler = kategorileriAyristir(ORNEK_KATEGORI_XML);
    expect(kokKategori("27", kategoriler)?.isim).toBe("Termos ve Kupa Bardaklar");
    expect(kokKategori("999", kategoriler)).toBeNull();
  });
});

describe("gruplaVeEsle", () => {
  it("kodgrup'a göre gruplar ve kök kategoriye eşler", () => {
    const grup = ornekGrup();
    expect(grup.kodgrup).toBe("7275");
    expect(grup.skular).toHaveLength(2);
    expect(grup.kategoriSlug).toBe("promosyon-bardak-termos");
  });

  it("Matbaa kök kategorisindeki ürünleri dışarıda bırakır", () => {
    const matbaaXml = ORNEK_URUN_XML.replace(/<kid>27<\/kid>/g, "<kid>41</kid>");
    const sonuc = gruplaVeEsle(
      urunleriAyristir(matbaaXml),
      kategorileriAyristir(ORNEK_KATEGORI_XML),
    );
    expect(sonuc.gruplar).toHaveLength(0);
    expect(sonuc.atlanan.matbaa).toBe(2);
  });

  it("fiyatsız SKU'yu satışa sokmaz", () => {
    const fiyatsizXml = ORNEK_URUN_XML.replace(/<fiyat>190\.00<\/fiyat>/g, "<fiyat>0</fiyat>");
    const sonuc = gruplaVeEsle(
      urunleriAyristir(fiyatsizXml),
      kategorileriAyristir(ORNEK_KATEGORI_XML),
    );
    expect(sonuc.gruplar).toHaveLength(0);
    expect(sonuc.atlanan.fiyatsiz).toBe(2);
  });
});

describe("minSiparisAyikla / adetKademeleri", () => {
  it("açıklamadaki minimum sipariş kalıplarını yakalar", () => {
    expect(minSiparisAyikla("*Minimum Sipariş 100 adettir.")).toBe(100);
    expect(minSiparisAyikla("*Minimum sipariş 45 adettir.")).toBe(45);
    expect(minSiparisAyikla("Minimum sipariş: 1.000 adet")).toBe(1000);
    expect(minSiparisAyikla("Kaliteli üründür.")).toBeNull();
  });

  it("merdiven minimumdan başlar, altını hiç sunmaz", () => {
    expect(adetKademeleri(100, 24)).toEqual([100, 250, 500, 1000, 2500]);
    expect(adetKademeleri(45, 228)[0]).toBe(45);
    expect(adetKademeleri(45, 228)).not.toContain(25);
  });

  it("minimum yazmıyorsa fiyata göre makul başlangıç seçer", () => {
    expect(adetKademeleri(null, 5000)[0]).toBe(1); // VIP set: tek adet alınabilir
    expect(adetKademeleri(null, 24)[0]).toBe(25); // ucuz kalem: 25 altı yok
  });
});

describe("slugla / aciklamaTemizle", () => {
  it("Türkçe karakterleri katlar", () => {
    expect(slugla("promosyon Işıklı Küre 5010")).toBe("promosyon-isikli-kure-5010");
  });
  it("yıldızlı satırları maddelere çevirir", () => {
    expect(aciklamaTemizle("*Bir\r\n*İki")).toBe("• Bir\n• İki");
  });
});

describe("grupToYuk — fiyat matrisi", () => {
  it("stoksuz SKU seçenek olarak yazılmaz, ürün yine aktiftir", () => {
    const yuk = grupToYuk(ornekGrup(), false);
    const renkler = yuk.options.filter((o) => o.groupKey === "renk");
    expect(renkler).toHaveLength(1); // Sarı stok=0 → dışarıda
    expect(renkler[0].optionKey).toBe("7275SYH");
    expect(yuk.aktif).toBe(true);
  });

  it("KDV hariç liste → satış = liste × 1,20 × adet; maliyet = liste × 0,60 × adet", () => {
    const yuk = grupToYuk(ornekGrup(), false);
    const satir = yuk.prices.find((p) => p.optionKey === "7275SYH" && p.dimKey === "45");
    expect(satir?.price).toBe(190 * 1.2 * 45); // 10.260
    expect(satir?.cost).toBe(190 * 0.6 * 45); // 5.130
  });

  it("KDV dahil bayrağıyla liste önce arındırılır", () => {
    const yuk = grupToYuk(ornekGrup(), true);
    const satir = yuk.prices.find((p) => p.dimKey === "45");
    expect(satir?.price).toBe(190 * 45); // dahil liste aynen satış olur
    expect(satir?.cost).toBeCloseTo((190 / 1.2) * 0.6 * 45, 2);
  });

  it("GERÇEK fiyat motoru matristen aynı tutarı okur ve hacim indirimi SIZMAZ", () => {
    // emlak-afisi reçetesinin güvencesi: adet tek boyut grubu olduğu için priceDimKey
    // olur, motorun `unit × qty × hacim indirimi` doğrusal yolu hiç çalışmaz.
    const yuk = grupToYuk(ornekGrup(), false);
    const sonuc = computeConfiguredPrice(
      yuk.options.map((o) => ({ ...o, rules: o.rules ?? undefined })) as never,
      yuk.prices.map((p) => ({ ...p, id: p.optionKey + p.dimKey, productId: "x" })) as never,
      { renk: "7275SYH", adet: "45" },
    );
    expect(sonuc).toBe(190 * 1.2 * 45); // indirim uygulansaydı bundan KÜÇÜK olurdu
  });

  it("minimum sipariş ilk kademedir ve 'Minimum sipariş' alt etiketi taşır", () => {
    const yuk = grupToYuk(ornekGrup(), false);
    const adetler = yuk.options.filter((o) => o.groupKey === "adet");
    expect(adetler[0].optionKey).toBe("45");
    expect(adetler[0].optionSublabel).toBe("Minimum sipariş");
  });

  it("tüm SKU'lar stoksuzsa ürün pasife düşer ama yük üretilir", () => {
    const grup = ornekGrup();
    grup.skular.forEach((s) => (s.stok = 0));
    const yuk = grupToYuk(grup, false);
    expect(yuk.aktif).toBe(false);
    expect(yuk.options.length).toBeGreaterThan(0);
  });

  it("slug ve isim kodgrup'u taşır (benzersizlik + müşteri araması)", () => {
    const yuk = grupToYuk(ornekGrup(), false);
    expect(yuk.slug).toBe("promosyon-porselen-kupa-7275");
    expect(yuk.name).toBe("Porselen Kupa 7275");
    expect(yuk.content.sku).toBe("7275");
  });
});
