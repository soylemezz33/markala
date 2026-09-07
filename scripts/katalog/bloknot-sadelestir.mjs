#!/usr/bin/env node
/**
 * Bloknot ürünlerini sadeleştir (2026-09-07, Hasan: "çok karışık duruyor; adet – ölçü – kapak
 * türü seçimi olsa yeterli").
 *
 * ESKİ: tek "Ebat / Kapak × Cilt" grubu, 8-10 birleşik seçenek ("14×20 cm — Mat Selefon Kapak
 * (14×20 cm · CYM)"), her biri için 500/1000 cilt fiyat satırı.
 * YENİ: Adet (500 / 1.000 cilt) → Ölçü (9.4×13.3 / 14×20) → Kapak Türü.
 *
 * Fiyatlar TOPLAMSAL DEĞİL: kapak farkı ebada göre değişiyor (ör. spiralli 1000 cilt: parlak
 * selefon 9 cm +972 ₺, 14 cm +1.944 ₺). Motor (computeConfiguredPrice) gruplar arası bağımlı
 * fiyat bilmez; bu yüzden ebat başına AYRI bir kapak grubu kurulur (kapak9 / kapak14, ikisinin
 * de etiketi "Kapak Türü") ve ebat seçeneğinin kuralı diğer ebadın kapak grubunu devre dışı
 * bırakır (rules.disablesGroups). Devre dışı grup web'de çizilmez ve fiyata girmez. Sonuç:
 * her (ebat, kapak, adet) kombinasyonunun fiyatı ESKİSİYLE BİREBİR aynı (betik doğrular).
 *
 * Kullanım:  node scripts/katalog/bloknot-sadelestir.mjs --dry   |   node scripts/katalog/bloknot-sadelestir.mjs
 * Kimlik: markala-google/.env ADMIN_* (dotenv yok, elle okunur). İdempotent: yeni yapıdaysa dokunmaz.
 */
import { readFileSync } from "node:fs";
const ENV_DOSYA = "C:/Users/Administrator/Projects/markala-google/.env";
try {
  for (const l of readFileSync(ENV_DOSYA, "utf8").split(String.fromCharCode(10))) {
    const m = /^(ADMIN_EMAIL|ADMIN_PASSWORD|API_URL)=(.*)$/.exec(l.replace(String.fromCharCode(13), ""));
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
} catch { /* env dışarıdan verilir */ }

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const SLUGS = ["kapakli-bloknot", "spiralli-bloknot"];
const EBAT = { 9: "9.4×13.3 cm", 14: "14×20 cm" };
const KAPAK = {
  nk: { label: "Standart Kapak", sub: "NK" },
  cyp: { label: "Parlak Selefonlu Kapak", sub: "CYP" },
  cym: { label: "Mat Selefonlu Kapak", sub: "CYM" },
  cyml4: { label: "400 gr Mat Lak Kapak", sub: "CYML4" },
  sek: { label: "Sıvama Kapak", sub: "SEK" },
};
const { computeConfiguredPrice, normalizeSelections } = await import("file:///C:/Users/Administrator/Desktop/markala/apps/api/src/orders/pricing.ts");
const getJson = async (p) => { const r = await fetch(`${API}/api${p}`); return r.ok ? r.json() : null; };
const rowsOf = (p) => p.prices.map((r) => ({ groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey, price: Number(r.price), cost: r.cost == null ? null : Number(r.cost) }));
const optsOf = (p) => p.options.map((o) => ({ groupKey: o.groupKey, groupLabel: o.groupLabel, groupRole: o.groupRole, groupSort: o.groupSort, optionKey: o.optionKey, optionLabel: o.optionLabel, optionSublabel: o.optionSublabel ?? null, optionSort: o.optionSort, locked: !!o.locked, rules: o.rules ?? null }));

let TOKEN = null;
async function giris() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error("Giriş başarısız:", r.status); process.exit(1); }
  const j = await r.json(); TOKEN = j.accessToken || j.access_token || j.token;
}

for (const slug of SLUGS) {
  const p = await getJson(`/products/${slug}`);
  if (!p?.id) { console.log(`⚠ ürün yok: ${slug}`); continue; }
  const eskiOpts = optsOf(p), eskiRows = rowsOf(p);
  const paket = eskiOpts.filter((o) => o.groupKey === "paket");
  if (!paket.length) { console.log(`= ${slug}: zaten yeni yapıda (paket grubu yok), atlandı`); continue; }
  const adetOpts = eskiOpts.filter((o) => o.groupKey === "adet").sort((a, b) => a.optionSort - b.optionSort);
  const tiers = adetOpts.map((o) => o.optionKey);

  // ---- Yeni seçenekler ----
  const yeniOpts = [];
  adetOpts.forEach((o, i) => yeniOpts.push({ ...o, groupSort: 0, optionSort: i, optionLabel: o.optionLabel.trim(), rules: null }));
  const ebatlar = [...new Set(paket.map((o) => o.optionKey.split("-")[0]))].sort((a, b) => Number(a) - Number(b));
  ebatlar.forEach((e, i) => yeniOpts.push({
    groupKey: "ebat", groupLabel: "Ölçü", groupRole: "priced", groupSort: 1,
    optionKey: `e${e}`, optionLabel: EBAT[e] ?? `${e} cm`, optionSublabel: null, optionSort: i, locked: false,
    rules: { disablesGroups: ebatlar.filter((x) => x !== e).map((x) => `kapak${x}`) },
  }));
  for (const e of ebatlar) {
    const kapaklar = paket.filter((o) => o.optionKey.startsWith(`${e}-`)).sort((a, b) => a.optionSort - b.optionSort);
    kapaklar.forEach((o, i) => {
      const k = o.optionKey.slice(e.length + 1);
      const t = KAPAK[k] ?? { label: o.optionLabel.split("—")[1]?.split("(")[0]?.trim() || k, sub: k.toUpperCase() };
      yeniOpts.push({ groupKey: `kapak${e}`, groupLabel: "Kapak Türü", groupRole: "priced", groupSort: 2, optionKey: k, optionLabel: t.label, optionSublabel: t.sub, optionSort: i, locked: false, rules: null });
    });
  }
  // ---- Yeni fiyat satırları: ebat satırı = o ebadın NK fiyatı; kapak satırı = fark (NK = satır yok → 0) ----
  const yeniRows = [];
  const eskiFiyat = (e, k, t) => eskiRows.find((r) => r.groupKey === "paket" && r.optionKey === `${e}-${k}` && r.dimKey === t);
  for (const e of ebatlar) for (const t of tiers) {
    const taban = eskiFiyat(e, "nk", t);
    if (!taban) { console.error(`✗ ${slug}: ${e}-nk @${t} satırı yok`); process.exit(1); }
    yeniRows.push({ groupKey: "ebat", optionKey: `e${e}`, dimKey: t, price: taban.price, cost: taban.cost ?? undefined });
    // NK için AÇIK 0 ₺ satırı: web ipuçları (optionPriceHints) yalnız satırı olan seçenekleri
    // kıyaslar; satırsız NK dışarıda kalınca taban Parlak Selefon oluyor ve "+1.656 ₺" yerine
    // hiç fark görünmüyordu (7 Eyl canlı ekran görüntüsü). Fiyata etkisi yok.
    yeniRows.push({ groupKey: `kapak${e}`, optionKey: "nk", dimKey: t, price: 0, cost: 0 });
    for (const o of yeniOpts.filter((x) => x.groupKey === `kapak${e}` && x.optionKey !== "nk")) {
      const r = eskiFiyat(e, o.optionKey, t);
      if (!r) continue;
      const fark = Math.round((r.price - taban.price) * 100) / 100;
      yeniRows.push({ groupKey: `kapak${e}`, optionKey: o.optionKey, dimKey: t, price: fark, cost: r.cost != null && taban.cost != null ? Math.round((r.cost - taban.cost) * 100) / 100 : undefined });
    }
  }
  const negatif = yeniRows.filter((r) => r.price < 0);
  if (negatif.length) { console.error(`✗ ${slug}: negatif fark satırı (kapak NK'den ucuz?)`, negatif); process.exit(1); }

  // ---- Parite: her eski kombinasyon yeni yapıda aynı fiyatı vermeli ----
  const P = (opts, rows, sel) => computeConfiguredPrice(opts, rows, normalizeSelections(opts, sel));
  let hata = 0, sayac = 0;
  for (const o of paket) for (const t of tiers) {
    const [e, k] = [o.optionKey.split("-")[0], o.optionKey.slice(o.optionKey.indexOf("-") + 1)];
    const eski = P(eskiOpts, eskiRows, { adet: t, paket: o.optionKey });
    const sel = { adet: t, ebat: `e${e}`, [`kapak${e}`]: k };
    for (const x of ebatlar) if (x !== e) sel[`kapak${x}`] = "cyml4"; // diğer ebadın grubu seçili olsa bile kural düşürmeli
    const yeni = P(yeniOpts, yeniRows, sel);
    sayac++;
    if (Math.abs(eski - yeni) > 0.005) { hata++; console.log(`  ✗ ${o.optionKey} @${t}: eski ${eski} yeni ${yeni}`); }
  }
  const eskiMin = Math.min(...eskiRows.map((r) => r.price).filter((v) => v > 0));
  console.log(`\n## ${slug}: ${eskiOpts.length} seçenek → ${yeniOpts.length} · ${eskiRows.length} satır → ${yeniRows.length} · parite ${sayac - hata}/${sayac}${hata ? " ✗" : " ✓"} · kart fiyatı ${eskiMin} → ${Math.min(...yeniRows.filter((r) => r.groupKey === "ebat").map((r) => r.price))}`);
  for (const g of ["adet", "ebat", ...ebatlar.map((e) => `kapak${e}`)]) console.log(`   ${g.padEnd(8)}`, yeniOpts.filter((o) => o.groupKey === g).map((o) => `${o.optionLabel}${o.optionSublabel ? ` (${o.optionSublabel})` : ""}`).join(" · "));
  if (hata) { console.error("parite hatası — yazılmadı"); process.exit(1); }
  if (DRY) continue;

  if (!TOKEN) await giris();
  const H = { "content-type": "application/json", authorization: `Bearer ${TOKEN}` };
  const fail = async (ad, r) => { console.error(`✗ ${ad}:`, r.status, (await r.text()).slice(0, 300)); process.exit(1); };
  let r = await fetch(`${API}/api/products/${p.id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options: yeniOpts.map((o) => ({ ...o, optionSublabel: o.optionSublabel ?? undefined, rules: o.rules ?? undefined })) }) });
  if (!r.ok) await fail(`${slug} seçenek`, r);
  r = await fetch(`${API}/api/products/${p.id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices: yeniRows }) });
  if (!r.ok) await fail(`${slug} fiyat`, r);
  const y = await getJson(`/products/${slug}`);
  let canliHata = 0;
  for (const o of paket) for (const t of tiers) {
    const [e, k] = [o.optionKey.split("-")[0], o.optionKey.slice(o.optionKey.indexOf("-") + 1)];
    const eski = P(eskiOpts, eskiRows, { adet: t, paket: o.optionKey });
    const yeni = P(optsOf(y), rowsOf(y), { adet: t, ebat: `e${e}`, [`kapak${e}`]: k });
    if (Math.abs(eski - yeni) > 0.005) canliHata++;
  }
  console.log(`   ✓ yazıldı · canlı displayPrice ${y.displayPrice} · canlı parite ${canliHata ? "✗ " + canliHata + " hata" : "✓"}`);
}
if (DRY) console.log("\n[DRY] hiçbir şey yazılmadı");
