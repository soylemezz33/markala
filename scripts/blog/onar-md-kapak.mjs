#!/usr/bin/env node
/**
 * Blog onarımı (2026-08-26):
 *  1. HTML olarak basılmış 7 makaleyi Markdown'a çevirir (blog motoru Markdown bekler;
 *     ham HTML'i XSS koruması gereği kaçışlar — etiketler ekranda metin olarak görünüyordu).
 *  2. TÜM makalelere konuya uygun kapak görseli atar (coverImage) — hepsi aynı jenerik
 *     placeholder'daydı. Görseller katalogdaki mevcut küçük WebP/JPG'ler (yeni dosya yok).
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/blog/onar-md-kapak.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

/** Bizim ürettiğimiz sınırlı HTML kümesini Markdown'a çevirir (p/h2/h3/ul/li/strong/em/a). */
function htmlToMd(html) {
  let md = html.trim();
  md = md.replace(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)");
  md = md.replace(/<strong>([\s\S]*?)<\/strong>/g, "**$1**");
  md = md.replace(/<em>([\s\S]*?)<\/em>/g, "*$1*");
  md = md.replace(/<h2>([\s\S]*?)<\/h2>/g, "\n## $1\n");
  md = md.replace(/<h3>([\s\S]*?)<\/h3>/g, "\n### $1\n");
  md = md.replace(/<li>([\s\S]*?)<\/li>/g, (_m, t) => `- ${t.trim()}\n`);
  md = md.replace(/<\/?ul>/g, "\n");
  md = md.replace(/<p>([\s\S]*?)<\/p>/g, (_m, t) => `${t.trim()}\n\n`);
  md = md.replace(/<[^>]+>/g, ""); // kalan tek tük etiketi temizle
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

/** slug → kapak görseli kaynağı: ["product", slug] veya ["category", slug] */
const KAPAK = {
  "yelken-bayrak-olculeri-ve-secim-rehberi": ["product", "yelken-bayrak-damla"],
  "branda-afis-olcusu-nasil-secilir-440-510-gr": ["product", "vinil-branda-440gr"],
  "el-ilani-mi-brosur-mu-hangisi-ne-zaman": ["category", "brosur"],
  "ges-uyari-etiketleri-gunes-santrali-zorunlu-isaretler": ["category", "is-guvenligi-ges"],
  "asansor-uyari-levhalari-hangileri-zorunlu": ["product", "asansor-kullanma-talimati"],
  "arac-magneti-ile-reklam-olcu-tasarim-kullanim-rehberi": ["product", "arac-magneti-30x40"],
  "folyo-yazi-ve-cam-giydirme-vitrin-reklaminin-temeli": ["category", "folyo"],
  "topraklama-isareti-sembolu-anlami-kullanim": ["product", "topraklama-etiketi-topraklama-isareti-3"],
  "kartvizit-kagit-gramaji-350-mi-400-mu": ["category", "kartvizit"],
  "kartvizit-tasariminda-10-altin-kural": ["product", "klasik-kartvizit"],
  "baskiya-hazir-dosya-nasil-hazirlanir": ["product", "klasik-kartvizit"],
  "vinil-branda-mi-mesh-branda-mi": ["category", "vinil-branda-afis"],
};

async function gorselBul(tip, slug) {
  try {
    if (tip === "product") {
      const p = await fetch(`${API}/api/products/${slug}`).then((r) => (r.ok ? r.json() : null));
      const u = p?.images?.[0];
      if (u && !u.includes("/api/mockup")) return u;
    } else {
      const cats = await fetch(`${API}/api/categories`).then((r) => r.json());
      const c = (Array.isArray(cats) ? cats : cats.items ?? []).find((x) => x.slug === slug);
      const u = c?.imageUrl;
      if (u && !u.includes("/api/mockup")) return u;
    }
  } catch {}
  return null;
}

const login = await fetch(`${API}/api/auth/login`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
}).then((r) => r.json());
const H = { "content-type": "application/json", authorization: `Bearer ${login.accessToken || login.access_token || login.token}` };

const posts = await fetch(`${API}/api/blog/posts?take=100`, { headers: H })
  .then((r) => r.json())
  .then((j) => (Array.isArray(j) ? j : j.data || j.items || []));
console.log(`Toplam yazı: ${posts.length}`);

let mdDonusum = 0, kapakSet = 0, hata = 0;
for (const p of posts) {
  const patch = {};
  // 1) HTML içerik mi? (Markdown'da <p>/<h2> bulunmaz)
  if (/<p>|<h2>/.test(p.content ?? "")) {
    patch.content = htmlToMd(p.content);
    mdDonusum++;
  }
  // 2) kapak görseli
  const k = KAPAK[p.slug];
  if (k) {
    const url = await gorselBul(k[0], k[1]);
    if (url) {
      const ok = await fetch(url, { method: "HEAD" }).then((r) => r.ok).catch(() => false);
      if (ok && p.coverImage !== url) { patch.coverImage = url; kapakSet++; }
      else if (!ok) console.log(`⚠ görsel 200 değil: ${p.slug} → ${url}`);
    } else console.log(`⚠ görsel bulunamadı: ${p.slug} (${k.join("/")})`);
  }
  if (!Object.keys(patch).length) { console.log(`- değişiklik yok: ${p.slug}`); continue; }
  if (DRY) { console.log(`[DRY] ${p.slug}: ${Object.keys(patch).join("+")}`); continue; }
  const res = await fetch(`${API}/api/blog/posts/${p.id}`, { method: "PATCH", headers: H, body: JSON.stringify(patch) });
  if (!res.ok) { console.error(`✗ ${p.slug}: ${res.status} ${(await res.text()).slice(0, 120)}`); hata++; continue; }
  console.log(`✓ ${p.slug}: ${Object.keys(patch).join(" + ")}`);
}
console.log(`\nÖzet — MD'ye çevrilen: ${mdDonusum} · kapak atanan: ${kapakSet} · hata: ${hata}`);
