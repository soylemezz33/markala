/** Go-live öncesi SON KONTROL: fiyat matematiği, SEO uzunlukları, görsel kapsaması, sepet tabanları. */
import { readFileSync } from "node:fs";
import { computeConfiguredPrice } from "../src/orders/pricing";
import { gruplaVeEsle, grupToYuk } from "../src/integrations/turkuaz/turkuaz-esleme";
import { kategorileriAyristir, urunleriAyristir } from "../src/integrations/turkuaz/turkuaz-xml";

const [u, k] = process.argv.slice(2);
const skular = urunleriAyristir(readFileSync(u!, "utf8"));
const kategoriler = kategorileriAyristir(readFileSync(k!, "utf8"));
const { gruplar } = gruplaVeEsle(skular, kategoriler);

let titleUzun = 0, descUzun = 0, gorselsiz = 0, kdv10 = 0, kdv10Ornek = "";
const sepetTabanlari: number[] = [];
let motorTum = 0;

for (const g of gruplar) {
  const y = grupToYuk(g, false);
  const seo = (y.content as { seo?: { title: string; description: string } }).seo!;
  if (seo.title.length > 65) titleUzun++;
  if (seo.description.length > 170) descUzun++;
  if (y.gorselKaynaklari.length === 0) gorselsiz++;
  if (g.kdv === 10 && !kdv10Ornek) {
    kdv10++;
    const r = y.prices[0];
    const liste = g.skular.find((s) => s.kod === r.optionKey)!.fiyat;
    kdv10Ornek = `${y.slug}: liste ${liste} → satır ${r.dimKey} adet fiyat ${r.price} (beklenen ${Math.round(liste * 1.1 * Number(r.dimKey) * 100) / 100}), maliyet ${r.cost} (beklenen ${Math.round(liste * 0.6 * Number(r.dimKey) * 100) / 100})`;
  } else if (g.kdv === 10) kdv10++;

  if (y.aktif) {
    const adetler = y.options.filter((o) => o.groupKey === "adet");
    const renk = y.options.find((o) => o.groupKey === "renk")!;
    const enDusuk = y.prices.find((p) => p.optionKey === renk.optionKey && p.dimKey === adetler[0].optionKey);
    if (enDusuk) sepetTabanlari.push(enDusuk.price);
    // motor tam tarama: her aktif ürünün TÜM (ilk renk × tüm kademeler) hücreleri
    for (const a of adetler) {
      const beklenen = y.prices.find((p) => p.optionKey === renk.optionKey && p.dimKey === a.optionKey)?.price;
      const motor = computeConfiguredPrice(
        y.options as never,
        y.prices.map((p, i) => ({ ...p, id: String(i), productId: "x" })) as never,
        { renk: renk.optionKey, adet: a.optionKey },
      );
      if (beklenen !== motor) motorTum++;
    }
  }
}
sepetTabanlari.sort((a, b) => a - b);
const p = (q: number) => sepetTabanlari[Math.floor(sepetTabanlari.length * q)];
console.log("SEO: 65+ karakter title:", titleUzun, "| 170+ desc:", descUzun);
console.log("Görselsiz grup:", gorselsiz);
console.log("KDV %10 grup:", kdv10, "| örnek doğrulama:", kdv10Ornek || "YOK");
console.log("Motor tam tarama farkı (tüm kademeler):", motorTum);
console.log(`En düşük sepet (min adet × birim, KDV dahil): min ${p(0)} ₺ | %10 ${p(0.1)} | medyan ${p(0.5)} | %90 ${p(0.9)} | max ${sepetTabanlari[sepetTabanlari.length - 1]} ₺`);
console.log("500 ₺ altı taban sepetli ürün:", sepetTabanlari.filter((x) => x < 500).length, "/", sepetTabanlari.length);
