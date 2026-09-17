/** Beslemede baskı bilgisi analizi: hangi ürün baskı dahil, hangisi belirsiz, hangisi baskısız? */
import { readFileSync } from "node:fs";
import { gruplaVeEsle } from "../src/integrations/turkuaz/turkuaz-esleme";
import { kategorileriAyristir, urunleriAyristir } from "../src/integrations/turkuaz/turkuaz-xml";

const [u, k] = process.argv.slice(2);
const skular = urunleriAyristir(readFileSync(u!, "utf8"));
const kategoriler = kategorileriAyristir(readFileSync(k!, "utf8"));
const { gruplar } = gruplaVeEsle(skular, kategoriler);

type Sinif = "dahil" | "teknikVar" | "haric" | "bilgiYok";
const siniflar: Record<Sinif, string[]> = { dahil: [], teknikVar: [], haric: [], bilgiYok: [] };
const teknikSayaci = new Map<string, number>();

for (const g of gruplar) {
  const a = g.aciklama.toLocaleLowerCase("tr");
  let sinif: Sinif;
  if (/bask[ıi]s[ıi]z|bask[ıi] hariç|bask[ıi] dahil değil|bask[ıi] fiyata dahil değil/.test(a)) sinif = "haric";
  else if (/bask[ıi]\s+dahil|dahil.{0,20}bask[ıi]|bask[ıi]l[ıi] fiyat/.test(a)) sinif = "dahil";
  else if (/bask[ıi]\s*:/.test(a)) sinif = "teknikVar";
  else sinif = "bilgiYok";
  siniflar[sinif].push(`${g.kodgrup} ${g.isim} [${g.kategoriSlug.replace("promosyon-", "")}]`);
  const m = g.aciklama.match(/bask[ıi]\s*:\s*([^\r\n*]+)/i);
  if (m) {
    const t = m[1].trim();
    teknikSayaci.set(t, (teknikSayaci.get(t) ?? 0) + 1);
  }
}

console.log("=== SINIFLANDIRMA (507 grup) ===");
console.log("Açıkça 'baskı DAHİL' yazan       :", siniflar.dahil.length);
console.log("Baskı tekniği yazıyor (dahil mi belirsiz):", siniflar.teknikVar.length);
console.log("Açıkça baskısız/hariç            :", siniflar.haric.length);
console.log("Baskı hakkında HİÇ bilgi yok     :", siniflar.bilgiYok.length);
console.log("\n'Baskı DAHİL' örnekleri:", siniflar.dahil.slice(0, 5).join(" | "));
console.log("\n'HARİÇ/baskısız' listesi:");
siniflar.haric.forEach((s) => console.log("  -", s));
console.log("\nBilgi olmayanlar (ilk 15):");
siniflar.bilgiYok.slice(0, 15).forEach((s) => console.log("  -", s));
console.log("\nBilgi olmayanların kategori dağılımı:");
const kd = new Map<string, number>();
for (const s of siniflar.bilgiYok) { const kk = s.match(/\[(.+)\]$/)?.[1] ?? "?"; kd.set(kk, (kd.get(kk) ?? 0) + 1); }
[...kd.entries()].sort((a, b) => b[1] - a[1]).forEach(([kk, n]) => console.log(`  ${kk}: ${n}`));
console.log("\nBaskı teknikleri (ilk 12):");
[...teknikSayaci.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([t, n]) => console.log(`  ${n} × ${t}`));

// Tam listeyi CSV olarak da yaz (Hasan/Gönül incelemesi için).
import { writeFileSync } from "node:fs";
const satirlar = ["sinif;kod;urun;kategori"];
for (const [sinif, liste] of Object.entries(siniflar)) {
  for (const s of liste) {
    const m = s.match(/^(\S+) (.+) \[(.+)\]$/);
    if (m) satirlar.push(`${sinif};${m[1]};${m[2]};${m[3]}`);
  }
}
writeFileSync(process.argv[4] ?? "turkuaz-baski-durumu.csv", "\ufeff" + satirlar.join("\r\n"), "utf8");
console.log("\nCSV yazildi:", process.argv[4]);
