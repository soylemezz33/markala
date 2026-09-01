#!/usr/bin/env node
/**
 * ÇAPRAZ SATIŞ — "Bununla birlikte alınanlar" setleri + ölü "benzer ürün" kayıtlarının temizliği.
 * (2026-09-01, Hasan onaylı)
 *
 * İKİ İŞ:
 *  1) content.relatedSlugs içindeki KALDIRILMIŞ/PASİF ürünleri düzelt. 16 üründe
 *     vinil-branda-440gr (pasife alındı), kase-trodat-4912 ve cam-folyosu-kesimli
 *     (slug değişti) kayıtlıydı — sayfa bunları sessizce eliyordu.
 *  2) content.birlikteSlugs doldur: TAMAMLAYICI ürünler (alternatif değil).
 *
 * KÜRATÖRLÜK, İSTATİSTİK DEĞİL: 29 siparişle "bunu alanlar şunu da aldı" çıkarılamaz.
 * Setler işin mantığından kuruldu; sipariş hacmi artınca gerçek veriyle değiştirilmeli.
 *
 * İSG mantığı: hangi levhayı alırsa alsın her işyerinin acil çıkış, toplanma alanı ve
 * yangın söndürücü işaretine ihtiyacı var — çekirdek üçlü bu. Zaten o kategorideyse
 * kendi kategorisinden öneri yapılmaz (benzer ürünler bölümü onu zaten gösteriyor).
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/katalog/capraz-satis-kur.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

/** Kaldırılmış slug → yerine geçen. null = karşılığı yok, kaydı sil. */
const TASINDI = {
  "vinil-branda-440gr": "avrupa-vinil-branda",
  "kase-trodat-4912": "trodat-printy-4912",
  "cam-folyosu-kesimli": "kesim-folyo",
};

/** İSG çekirdek çapaları — her işyerinin ihtiyacı. */
const ACIL = "acil-cikis-sag-asagi-ok-fotolumenli-dekota-12x295-cm";
const TOPLANMA = "lumen-folyolu-toplanma-yerine-gider-sag-ok";
const SONDURUCU = "yangin-sondurucu";
const ALARM = "yangin-alarmi-fotolumenli";
const BARET = "baretsiz-girilmez";

/** İSG kategorisi → tamamlayıcı çapalar (kendi kategorisi HARİÇ tutulur). */
const ISG_SET = {
  "is-guvenligi-yangin": [ACIL, TOPLANMA, BARET],
  "is-guvenligi-acil-ilk-yardim": [SONDURUCU, ALARM, BARET],
  "is-guvenligi-uyari-ikaz": [ACIL, SONDURUCU, BARET],
  "is-guvenligi-emredici-kkd": [ACIL, SONDURUCU, TOPLANMA],
  "is-guvenligi-yasaklayici": [ACIL, SONDURUCU, TOPLANMA],
  "is-guvenligi-elektrik-voltaj": [ACIL, SONDURUCU, TOPLANMA],
  "is-guvenligi-trafik-saha": [BARET, ACIL, SONDURUCU],
  "is-guvenligi-ges": [ACIL, SONDURUCU, BARET],
  "is-guvenligi-kalite-kontrol": [ACIL, SONDURUCU, BARET],
  "is-guvenligi-bilgilendirme-talimat": [ACIL, SONDURUCU, TOPLANMA],
};

/** İSG dışı elle kurulmuş setler — gerçekten birlikte sipariş edilen işler. */
const SETLER = {
  // Kurumsal kırtasiye: yeni açılan işletme bunları birlikte bastırır
  "klasik-kartvizit": ["antetli-kagit", "zarf-diplomat-tek-renk", "cepli-dosya", "makbuz"],
  "kabartmali-kartvizit": ["antetli-kagit", "zarf-diplomat-tek-renk", "cepli-dosya"],
  "sivama-kartvizit": ["antetli-kagit", "zarf-diplomat-tek-renk", "cepli-dosya"],
  "yaldizli-kartvizit": ["antetli-kagit", "zarf-diplomat-tek-renk", "cepli-dosya"],
  "antetli-kagit": ["klasik-kartvizit", "zarf-diplomat-tek-renk", "cepli-dosya", "makbuz"],
  "zarf-diplomat-tek-renk": ["antetli-kagit", "klasik-kartvizit", "cepli-dosya"],
  "zarf-diplomat-renkli": ["antetli-kagit", "klasik-kartvizit", "cepli-dosya"],
  "cepli-dosya": ["antetli-kagit", "klasik-kartvizit", "zarf-diplomat-tek-renk"],
  makbuz: ["antetli-kagit", "klasik-kartvizit", "zarf-diplomat-tek-renk"],

  // Fuar / tanıtım standı: birlikte kurulur
  "yelken-bayrak-damla": ["rollup-standart", "masa-bayragi-krom", "kirlangic-bayrak-3m"],
  "kirlangic-bayrak-3m": ["yelken-bayrak-damla", "rollup-standart", "masa-bayragi-krom"],
  "rollup-standart": ["yelken-bayrak-damla", "masa-bayragi-krom", "brosur"],
  "masa-bayragi-krom": ["makam-bayragi-puskullu", "yelken-bayrak-damla", "klasik-kartvizit"],

  // Matbaa tanıtım seti
  brosur: ["el-ilani", "afis-105gr", "kapi-aski-brosur"],
  "el-ilani": ["brosur", "afis-105gr", "kapi-aski-brosur"],
  "afis-105gr": ["brosur", "el-ilani", "rollup-standart"],

  // Dış mekân tanıtım: branda alan afiş/bayrak da alır
  "avrupa-vinil-branda": ["mesh-branda", "yelken-bayrak-damla", "afis-105gr"],
  "cin-vinil-branda": ["avrupa-vinil-branda", "yelken-bayrak-damla", "afis-105gr"],
  "mesh-branda": ["avrupa-vinil-branda", "yelken-bayrak-damla", "rollup-standart"],

  // Araç giydirme seti
  "arac-magneti-30x40": ["arac-sticker-yan", "kesim-folyo", "one-way-vision-baski"],
  "arac-sticker-yan": ["arac-magneti-30x40", "kesim-folyo", "one-way-vision-baski"],

  // Vitrin / cam işi
  "kesim-folyo": ["kumlama-buzlu-cam-folyosu", "one-way-vision-baski", "seffaf-folyo"],
  "kumlama-buzlu-cam-folyosu": ["kesim-folyo", "seffaf-folyo", "one-way-vision-baski"],
};

async function girisYap() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status}`); process.exit(1); }
  return (await r.json()).accessToken;
}
const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };

const liste = await fetch(`${API}/api/products?take=5000&list=true`).then((r) => r.json());
const aktif = new Map(liste.map((p) => [p.slug, p]));
console.log(`Katalog: ${aktif.size} aktif ürün\n`);

// Kullanılan tüm çapa/set slug'ları GERÇEKTEN var mı? Yoksa hiç yazma.
const kullanilan = new Set([
  ...Object.values(TASINDI).filter(Boolean),
  ...Object.values(ISG_SET).flat(),
  ...Object.values(SETLER).flat(),
  ...Object.keys(SETLER),
]);
const eksik = [...kullanilan].filter((s) => !aktif.has(s));
if (eksik.length) {
  console.error("✗ Bu slug'lar katalogda YOK — script durdu, yanlış kayıt yazılmasın:");
  for (const s of eksik) console.error(`    ${s}`);
  process.exit(1);
}
console.log("✓ Kullanılan tüm slug'lar katalogda mevcut\n");

let relDuzeltilen = 0, birlikteYazilan = 0, hata = 0, dokunulmayan = 0;

for (const [slug, ozet] of aktif) {
  const tam = await fetch(`${API}/api/products/${slug}`).then((r) => (r.ok ? r.json() : null));
  if (!tam?.id) { console.error(`✗ okunamadı: ${slug}`); hata++; continue; }
  const content = tam.content && typeof tam.content === "object" ? tam.content : {};
  const yeni = { ...content };
  const degisiklik = [];

  // 1) relatedSlugs temizliği
  const rel = Array.isArray(content.relatedSlugs) ? content.relatedSlugs : null;
  if (rel) {
    const duzeltilmis = [];
    let bozukVar = false;
    for (const s of rel) {
      if (aktif.has(s)) { duzeltilmis.push(s); continue; }
      bozukVar = true;
      const yerine = TASINDI[s];
      if (yerine && aktif.has(yerine) && yerine !== slug && !duzeltilmis.includes(yerine)) duzeltilmis.push(yerine);
    }
    if (bozukVar) {
      yeni.relatedSlugs = duzeltilmis.filter((s) => s !== slug);
      degisiklik.push(`benzer: ${rel.join(",")} → ${yeni.relatedSlugs.join(",") || "(boş)"}`);
    }
  }

  // 2) birlikteSlugs
  const katSlug = ozet.category?.slug ?? tam.category?.slug ?? "";
  let set = SETLER[slug] ?? (ISG_SET[katSlug] ?? null);
  if (set) {
    // Kendini ve KENDİ KATEGORİSİNDEKİLERİ ele (benzer ürünler bölümü zaten gösteriyor)
    const temiz = set.filter((s) => s !== slug && (aktif.get(s)?.category?.slug ?? "") !== katSlug);
    const mevcut = Array.isArray(content.birlikteSlugs) ? content.birlikteSlugs : [];
    if (temiz.length && JSON.stringify(mevcut) !== JSON.stringify(temiz)) {
      yeni.birlikteSlugs = temiz;
      degisiklik.push(`birlikte: ${temiz.join(", ")}`);
    }
  }

  if (!degisiklik.length) { dokunulmayan++; continue; }
  if (DRY) {
    console.log(`■ ${slug}`);
    for (const d of degisiklik) console.log(`    ${d}`);
    if (yeni.relatedSlugs !== undefined) relDuzeltilen++;
    if (yeni.birlikteSlugs !== undefined) birlikteYazilan++;
    continue;
  }

  const r = await fetch(`${API}/api/products/${tam.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ content: yeni }) });
  if (!r.ok) { console.error(`✗ ${slug}: ${r.status}`); hata++; continue; }
  const k = await fetch(`${API}/api/products/${slug}`).then((x) => (x.ok ? x.json() : null));
  const kb = k?.content?.birlikteSlugs;
  const kr = k?.content?.relatedSlugs;
  if (yeni.birlikteSlugs && JSON.stringify(kb) !== JSON.stringify(yeni.birlikteSlugs)) { console.error(`✗ ${slug}: birlikteSlugs yazılmadı`); hata++; continue; }
  if (yeni.relatedSlugs && JSON.stringify(kr) !== JSON.stringify(yeni.relatedSlugs)) { console.error(`✗ ${slug}: relatedSlugs yazılmadı`); hata++; continue; }
  if (yeni.relatedSlugs !== undefined) relDuzeltilen++;
  if (yeni.birlikteSlugs !== undefined) birlikteYazilan++;
  if ((relDuzeltilen + birlikteYazilan) % 50 === 0) console.log(`  … ${relDuzeltilen + birlikteYazilan} ürün işlendi`);
}

console.log(`\nÖzet — ${DRY ? "[DRY] " : ""}benzer düzeltilen: ${relDuzeltilen} · birlikte yazılan: ${birlikteYazilan} · dokunulmayan: ${dokunulmayan} · hata: ${hata}`);
process.exit(hata ? 1 : 0);
