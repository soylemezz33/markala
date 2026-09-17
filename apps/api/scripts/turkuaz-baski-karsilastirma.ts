/** Baskı payı eklenirse fiyatlar nasıl değişir? — YAZMAYAN karşılaştırma raporu. */
import { readFileSync } from "node:fs";
import { gruplaVeEsle, grupToYuk } from "../src/integrations/turkuaz/turkuaz-esleme";
import { baskiUcreti } from "../src/integrations/turkuaz/turkuaz-baski-tarifesi";
import { kategorileriAyristir, urunleriAyristir } from "../src/integrations/turkuaz/turkuaz-xml";

const [u, k] = process.argv.slice(2);
const skular = urunleriAyristir(readFileSync(u!, "utf8"));
const kategoriler = kategorileriAyristir(readFileSync(k!, "utf8"));
const { gruplar } = gruplaVeEsle(skular, kategoriler);

let bulunan = 0;
const bulunamayan: string[] = [];
type Satir = { kat: string; n: number; artisMin: number; artisMax: number; artisToplam: number; ornek?: string };
const katOzet = new Map<string, Satir>();

for (const g of gruplar) {
  const yuk = grupToYuk(g, false);
  if (!yuk.aktif) continue;
  const teknik = (yuk.content as { specifications?: Array<{ label: string; value: string }> })
    .specifications?.find((s) => s.label === "Baskı tekniği")?.value;
  const adetler = yuk.options.filter((o) => o.groupKey === "adet").map((o) => Number(o.optionKey));
  const renk = yuk.options.find((o) => o.groupKey === "renk")!;
  const kdvC = 1 + g.kdv / 100;

  const ilkAdet = adetler[0];
  const bs = baskiUcreti(yuk.kategoriSlug, teknik, g.isim, ilkAdet);
  if (!bs) {
    bulunamayan.push(`${g.kodgrup} ${g.isim} [${yuk.kategoriSlug}] teknik:${teknik ?? "-"}`);
    continue;
  }
  bulunan++;
  const eskiSatir = yuk.prices.find((p) => p.optionKey === renk.optionKey && p.dimKey === String(ilkAdet))!;
  const yeniFiyat = Math.round((eskiSatir.price + bs.toplam * kdvC) * 100) / 100;
  const artis = ((yeniFiyat - eskiSatir.price) / eskiSatir.price) * 100;

  const s = katOzet.get(yuk.kategoriSlug) ?? { kat: yuk.kategoriSlug, n: 0, artisMin: 1e9, artisMax: -1, artisToplam: 0 };
  s.n++;
  s.artisToplam += artis;
  if (artis < s.artisMin) { s.artisMin = artis; }
  if (artis > s.artisMax) { s.artisMax = artis; s.ornek = `${g.isim} ${g.kodgrup}: ${ilkAdet} adet ${eskiSatir.price.toFixed(0)}→${yeniFiyat.toFixed(0)} ₺ (${bs.tarife})`; }
  katOzet.set(yuk.kategoriSlug, s);
}

console.log(`Tarife bulunan aktif ürün: ${bulunan} | bulunamayan: ${bulunamayan.length}`);
console.log("\nKategori bazında İLK KADEME fiyat artışı (baskı payı eklenirse):");
console.log("kategori | ürün | ort% | min% | max% | en yüksek artış örneği");
for (const s of [...katOzet.values()].sort((a, b) => b.artisToplam / b.n - a.artisToplam / a.n)) {
  console.log(`${s.kat.replace("promosyon-", "")} | ${s.n} | %${(s.artisToplam / s.n).toFixed(0)} | %${s.artisMin.toFixed(0)} | %${s.artisMax.toFixed(0)} | ${s.ornek}`);
}
console.log("\nTarife bulunamayanlar:");
bulunamayan.slice(0, 20).forEach((x) => console.log("  -", x));
