/** Baskı payı + kademe eleme kuralı (baskı ≤ ürün bedelinin %60'ı) simülasyonu — YAZMAZ. */
import { readFileSync } from "node:fs";
import { gruplaVeEsle, grupToYuk } from "../src/integrations/turkuaz/turkuaz-esleme";
import { baskiUcreti } from "../src/integrations/turkuaz/turkuaz-baski-tarifesi";
import { kategorileriAyristir, urunleriAyristir } from "../src/integrations/turkuaz/turkuaz-xml";

const [u, k] = process.argv.slice(2);
const { gruplar } = gruplaVeEsle(
  urunleriAyristir(readFileSync(u!, "utf8")),
  kategorileriAyristir(readFileSync(k!, "utf8")),
);

const ORAN_TAVANI = 0.6;
let tamKalan = 0, kademeDusen = 0, tumKademelerDustu = 0;
const ornekler: string[] = [];
const sifirKalanlar: string[] = [];

for (const g of gruplar) {
  const yuk = grupToYuk(g, false);
  if (!yuk.aktif) continue;
  const teknik = (yuk.content as { specifications?: Array<{ label: string; value: string }> })
    .specifications?.find((s) => s.label === "Baskı tekniği")?.value;
  const renk = yuk.options.find((o) => o.groupKey === "renk")!;
  const adetler = yuk.options.filter((o) => o.groupKey === "adet").map((o) => Number(o.optionKey));
  const kdvC = 1 + g.kdv / 100;

  const kalanlar: Array<{ adet: number; eski: number; yeni: number }> = [];
  for (const adet of adetler) {
    const eski = yuk.prices.find((p) => p.optionKey === renk.optionKey && p.dimKey === String(adet))!.price;
    const bs = baskiUcreti(yuk.kategoriSlug, teknik, g.isim, adet);
    if (!bs) continue;
    const urunBedeliHaric = eski / kdvC;
    if (bs.toplam > urunBedeliHaric * ORAN_TAVANI) continue; // kademe elendi
    kalanlar.push({ adet, eski, yeni: Math.round((eski + bs.toplam * kdvC) * 100) / 100 });
  }
  if (kalanlar.length === adetler.length) tamKalan++;
  else if (kalanlar.length >= 2) kademeDusen++;
  else { tumKademelerDustu++; sifirKalanlar.push(`${g.isim} ${g.kodgrup} [${yuk.kategoriSlug.replace("promosyon-","")}] birim ${ (yuk.basePrice).toFixed(0)}₺ kademeler:${adetler.join(",")}`); }

  if (ornekler.length < 10 && kalanlar.length >= 2 && kalanlar.length < adetler.length) {
    ornekler.push(`${g.isim} ${g.kodgrup}: ${adetler.join("/")} → kalan ${kalanlar.map((x) => x.adet).join("/")}; örn ${kalanlar[0].adet} adet ${kalanlar[0].eski.toFixed(0)}→${kalanlar[0].yeni.toFixed(0)} ₺`);
  }
}
console.log(`Tüm kademeleri kalan: ${tamKalan} | bazı kademeleri elenen: ${kademeDusen} | 0-1 kademe kalan (min yükseltilmeli): ${tumKademelerDustu}`);
console.log("\nÖrnek elemeler:");
ornekler.forEach((x) => console.log("  -", x));
console.log("\n0-1 kademe kalanlar (ilk 12):");
sifirKalanlar.slice(0, 12).forEach((x) => console.log("  -", x));
