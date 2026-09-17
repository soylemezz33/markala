/**
 * TAM DENETİM v2 — DB dökümünden (JSONL) kuruş kuruş bağımsız doğrulama. YAZMAZ.
 * Kullanım: pnpm tsx scripts/turkuaz-tam-denetim-db.ts <canli-urunler.jsonl> <canli-hashler.txt>
 */
import { readFileSync } from "node:fs";
import { baskiUcreti } from "../src/integrations/turkuaz/turkuaz-baski-tarifesi";

const [urunDosya, hashDosya] = process.argv.slice(2);

interface Row { k: string; a: string; f: string; m: string | null }
interface Urun {
  slug: string; name: string; aktif: boolean; kat: string; kodgrup: string;
  teknik: string | null; baskiDahil: boolean; seoTitle: string | null; seoDesc: string | null;
  faq: number; feat: number; rows: Row[] | null; opts: Array<{ g: string; k: string }> | null;
}
const urunler: Urun[] = readFileSync(urunDosya!, "utf8")
  .split(/\r?\n/).filter((l) => l.trim().startsWith("{")).map((l) => JSON.parse(l));

const hashSku = new Map<string, Map<string, { stok: number; liste: number }>>();
for (const l of readFileSync(hashDosya!, "utf8").split(/\r?\n/)) {
  const parcalar = l.split("|");
  if (parcalar.length < 3) continue;
  const m = new Map<string, { stok: number; liste: number }>();
  for (const p of [parcalar[2].replace(/^v2:[HD]:/, ""), ...parcalar.slice(3)]) {
    const [kod, stok, liste] = p.split(":");
    if (kod) m.set(kod, { stok: Number(stok), liste: Number(liste) });
  }
  hashSku.set(parcalar[0], m);
}

const y2 = (n: number) => Math.round(n * 100) / 100;
const hatalar: string[] = [];
const uyarilar: string[] = [];
const marjlar: number[] = [];
let satir = 0, hatasizUrun = 0, seoEksik = 0;
const titleMap = new Map<string, string>();
let dupTitle = 0, stokYetersiz = 0;

for (const u of urunler) {
  const skular = hashSku.get(u.kodgrup);
  const isim = u.name.replace(/\s+\S+$/, "");
  const rows = u.rows ?? [];
  const renkler = (u.opts ?? []).filter((o) => o.g === "renk").map((o) => o.k);
  const adetler = (u.opts ?? []).filter((o) => o.g === "adet").map((o) => Number(o.k)).sort((a, b) => a - b);
  let urunHata = 0;

  if (!skular) { hatalar.push(`${u.slug}: hash kaydı yok`); continue; }

  // KDV çarpanı: satırdan çıkar
  let kdvC = 1.2;
  if (rows.length && renkler.length) {
    const r0 = rows.find((r) => r.k === renkler[0]);
    const sku0 = skular.get(renkler[0]);
    if (r0 && sku0) {
      const a0 = Number(r0.a);
      const pay0 = u.baskiDahil ? 0 : baskiUcreti(u.kat, u.teknik ?? undefined, isim, a0)?.toplam ?? 0;
      const oran = Number(r0.f) / (sku0.liste * a0 + pay0);
      kdvC = Math.abs(oran - 1.1) < Math.abs(oran - 1.2) ? 1.1 : 1.2;
    }
  }

  for (const renk of renkler) {
    const sku = skular.get(renk);
    if (!sku) { hatalar.push(`${u.slug}: seçenek ${renk} hash'te yok`); urunHata++; continue; }
    for (const adet of adetler) {
      satir++;
      const r = rows.find((x) => x.k === renk && Number(x.a) === adet);
      if (!r) { hatalar.push(`${u.slug}: EKSİK SATIR ${renk}×${adet}`); urunHata++; continue; }
      const pay = u.baskiDahil ? 0 : baskiUcreti(u.kat, u.teknik ?? undefined, isim, adet)?.toplam ?? 0;
      const bf = y2((sku.liste * adet + pay) * kdvC);
      const bm = y2(sku.liste * 0.6 * adet + pay);
      const f = Number(r.f), m = r.m == null ? null : Number(r.m);
      if (Math.abs(f - bf) > 0.011) { hatalar.push(`${u.slug} ${renk}×${adet}: fiyat ${f} ≠ ${bf} (liste ${sku.liste}, pay ${pay}, kdv ${kdvC})`); urunHata++; }
      if (m == null || Math.abs(m - bm) > 0.011) { hatalar.push(`${u.slug} ${renk}×${adet}: maliyet ${m} ≠ ${bm}`); urunHata++; }
      else { const net = f / kdvC; if (net - m < -0.01) { hatalar.push(`${u.slug} ${renk}×${adet}: ZARAR (net ${y2(net)} < maliyet ${m})`); urunHata++; } else marjlar.push((net - m) / net); }
    }
  }
  // fazla satır (opts'ta olmayan) kontrolü
  for (const r of rows) {
    if (!renkler.includes(r.k) || !adetler.includes(Number(r.a))) { hatalar.push(`${u.slug}: FAZLA satır ${r.k}×${r.a} (seçeneklerde yok)`); urunHata++; }
  }

  const toplamStok = [...skular.values()].reduce((a, s) => a + s.stok, 0);
  if (u.aktif && adetler.length && toplamStok < adetler[0]) { stokYetersiz++; uyarilar.push(`stok<min: ${u.slug} (stok ${toplamStok} < ${adetler[0]})${toplamStok === 0 ? " STOK 0 AMA AKTİF!" : ""}`); }

  if (!u.seoTitle || !u.seoDesc || u.faq < 3 || u.feat < 1) { seoEksik++; uyarilar.push(`seo eksik: ${u.slug} (faq:${u.faq} feat:${u.feat}${u.seoTitle ? "" : " TITLE YOK"})`); }
  if (u.seoTitle) { const o = titleMap.get(u.seoTitle); if (o) { dupTitle++; uyarilar.push(`çift title: ${o} & ${u.slug}`); } else titleMap.set(u.seoTitle, u.slug); }

  if (urunHata === 0) hatasizUrun++;
}

marjlar.sort((a, b) => a - b);
const pct = (q: number) => (marjlar[Math.min(marjlar.length - 1, Math.floor(marjlar.length * q))] * 100).toFixed(1);
console.log(`=== FİYAT DENETİMİ (DB) ===`);
console.log(`ürün: ${urunler.length} | fiyat satırı: ${satir} | hatasız ürün: ${hatasizUrun} | HATA: ${hatalar.length}`);
hatalar.slice(0, 30).forEach((h) => console.log("  ✗", h));
if (marjlar.length) console.log(`\nNet kâr marjı: min %${pct(0)} | %10 %${pct(0.1)} | medyan %${pct(0.5)} | %90 %${pct(0.9)} | max %${pct(0.999)}`);
console.log(`\n=== UYARILAR (${uyarilar.length}) ===`);
console.log(`stok<ilk kademe (aktif): ${stokYetersiz} | SEO eksik: ${seoEksik} | çift title: ${dupTitle}`);
uyarilar.slice(0, 25).forEach((u) => console.log("  ⚠", u));
