/**
 * KATALOG GÖRSELLERİNİ WEBP'E ÇEVİRİR (2026-08-27, Hasan talebi).
 *
 * NEDEN: /uploads/products altındaki 903 görsel toplu yükleme scriptiyle (ham .jpg)
 * konmuş, panelin sharp hattından HİÇ geçmemişti. Panel yüklemesi ne yapıyorsa
 * (apps/api/src/storage/storage.service.ts) burada aynısı uygulanır: WebP q82.
 *
 * FARK: burada ek olarak UZUN KENAR SINIRI var. Panel hattında resize yok; 4000 px
 * bir fotoğraf 4000 px kalıyor ve /_next/image her yeni kırılımda o devi çözmek
 * zorunda kalıyor. Vitrinde hiçbir görsel MAX_EDGE'den büyük gösterilmiyor.
 *
 * GÜVENLİK KURALLARI:
 *  - WebP orijinalden BÜYÜK çıkarsa dosyaya dokunulmaz (storage.service.ts ile aynı mantık).
 *  - Orijinal dosya silinmez; --sil verilmedikçe yanında durur.
 *  - --uygula verilmedikçe HİÇBİR ŞEY yazılmaz (varsayılan kuru çalışma).
 *  - Büyükten küçüğe işler; --limit ile parça parça ilerlenebilir.
 *
 * KULLANIM (api container içinde):
 *   node gorsel-webp-donustur.mjs                 → kuru analiz
 *   node gorsel-webp-donustur.mjs --uygula --limit 20
 *   node gorsel-webp-donustur.mjs --uygula        → hepsi
 */
import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const DIR = process.env.PRODUCTS_DIR ?? "/app/uploads/products";
const MAX_EDGE = Number(process.env.MAX_EDGE ?? 1600);
const QUALITY = 82;
const uygula = process.argv.includes("--uygula");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const kb = (n) => (n / 1024).toFixed(0).padStart(5);

const dosyalar = [];
for (const ad of await readdir(DIR)) {
  if (!/\.(jpe?g|png)$/i.test(ad)) continue;
  const yol = join(DIR, ad);
  const st = await stat(yol);
  if (st.isFile()) dosyalar.push({ ad, yol, boyut: st.size });
}
dosyalar.sort((a, b) => b.boyut - a.boyut); // BÜYÜKTEN KÜÇÜĞE

console.log(`${dosyalar.length} dosya · ${(dosyalar.reduce((s, d) => s + d.boyut, 0) / 1048576).toFixed(1)} MB`);
console.log(`Mod: ${uygula ? "UYGULA (yazar)" : "kuru analiz (yazmaz)"} · WebP q${QUALITY} · uzun kenar ≤ ${MAX_EDGE}px\n`);

let girenToplam = 0, cikanToplam = 0, cevrilen = 0, atlanan = 0, hata = 0;
const raporlar = [];

for (const d of dosyalar.slice(0, LIMIT)) {
  try {
    const buf = await readFile(d.yol);
    const m = await sharp(buf).metadata();
    const kucult = Math.max(m.width ?? 0, m.height ?? 0) > MAX_EDGE;
    let p = sharp(buf);
    if (kucult) p = p.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
    const webp = await p.webp({ quality: QUALITY, effort: 4 }).toBuffer();

    if (webp.length >= buf.length) {
      atlanan++;
      raporlar.push(`  ATLA ${kb(d.boyut)} KB → ${kb(webp.length)} KB (büyüdü) ${d.ad}`);
      continue;
    }
    const hedef = d.yol.replace(/\.(jpe?g|png)$/i, ".webp");
    if (uygula) await writeFile(hedef, webp);
    girenToplam += buf.length; cikanToplam += webp.length; cevrilen++;
    raporlar.push(
      `  ${kb(d.boyut)} KB → ${kb(webp.length)} KB  %${String(Math.round((1 - webp.length / buf.length) * 100)).padStart(2)}` +
      `  ${m.width}x${m.height}${kucult ? ` → ≤${MAX_EDGE}` : ""}  ${d.ad}`,
    );
  } catch (e) {
    hata++;
    raporlar.push(`  HATA ${d.ad}: ${e.message}`);
  }
}

console.log(raporlar.slice(0, 40).join("\n"));
if (raporlar.length > 40) console.log(`  … ve ${raporlar.length - 40} dosya daha`);
console.log(
  `\nSONUÇ: ${cevrilen} çevrildi, ${atlanan} atlandı (webp daha büyük), ${hata} hata\n` +
  `  ${(girenToplam / 1048576).toFixed(1)} MB → ${(cikanToplam / 1048576).toFixed(1)} MB ` +
  `(%${Math.round((1 - cikanToplam / (girenToplam || 1)) * 100)} kazanç)`,
);
if (!uygula) console.log("\n(kuru çalışma — hiçbir dosya yazılmadı; --uygula ile çalıştır)");
