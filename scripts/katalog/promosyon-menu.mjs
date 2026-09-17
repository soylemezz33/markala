#!/usr/bin/env node
/**
 * Header menüsüne "Promosyon" sekmesi (2026-09-17, Turkuaz entegrasyonu go-live adımı).
 *
 * İLK TURKUAZ SENKRONUNDAN SONRA çalıştırılır (kategoriler ve ürünler DB'de olmalı).
 * İdempotent: sekme zaten varsa yalnız eksik bağlantıları tamamlar. Menü DB'den yönetilir
 * (site_settings.header_nav) — koddaki DEFAULT_NAV yalnız yedektir, ona dokunulmaz.
 *
 * Kullanım:
 *   node scripts/katalog/promosyon-menu.mjs --dry   (yazmadan göster)
 *   node scripts/katalog/promosyon-menu.mjs
 * Kimlik: Projects\markala-google\.env içindeki ADMIN_* satırları.
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

// Menüde YENİ sekme AÇILMAZ: "Promosyon & Hediye" sekmesi zaten var (içinde Markala'nın
// kendi ürettiği kupa/magnet/plaket/madalya/kaşe grubu). Turkuaz kategorileri bu sekmeye
// iki yeni grup olarak eklenir; mevcut grup ve öne çıkanlara DOKUNULMAZ.
const SEKME_ETIKETI = "Promosyon & Hediye";
const GRUPLAR = [
  {
    title: "Ofis & Kırtasiye",
    items: [
      { label: "Promosyon Kalem", href: "/kategori/promosyon-kalem" },
      { label: "Defter & Ajanda", href: "/kategori/promosyon-defter-ajanda" },
      { label: "Çanta & Sekreterlik", href: "/kategori/promosyon-canta" },
      { label: "Duvar & Masa Saati", href: "/kategori/promosyon-saat" },
    ],
  },
  {
    title: "Hediyelik & Teknoloji",
    items: [
      { label: "Bardak & Termos", href: "/kategori/promosyon-bardak-termos" },
      { label: "USB & Teknoloji", href: "/kategori/promosyon-teknoloji" },
      { label: "Anahtarlık & Rozet", href: "/kategori/promosyon-anahtarlik" },
      { label: "Tişört & Şapka", href: "/kategori/promosyon-tekstil" },
      { label: "VIP Hediye Setleri", href: "/kategori/promosyon-vip-set" },
      { label: "Tüm Promosyon Çeşitleri", href: "/kategori/promosyon-cesitli" },
    ],
  },
];

const getJson = async (p) => {
  const r = await fetch(`${API}/api${p}`);
  return r.ok ? r.json() : null;
};

// Kategorilerin gerçekten var olduğunu doğrula — senkron çalışmadan menü verme.
const kategoriler = await getJson("/categories");
const mevcutSluglar = new Set((Array.isArray(kategoriler) ? kategoriler : []).map((k) => k.slug));
const eksik = GRUPLAR.flatMap((g) => g.items)
  .map((i) => i.href.replace("/kategori/", ""))
  .filter((s) => !mevcutSluglar.has(s));
if (eksik.length > 0) {
  console.error("Önce Turkuaz senkronu çalışmalı — eksik kategoriler:", eksik.join(", "));
  process.exit(1);
}

const nav = await getJson("/settings/header-nav");
if (!Array.isArray(nav) || nav.length === 0) {
  console.error("header_nav okunamadı ya da boş — menü elle kontrol edilmeli.");
  process.exit(1);
}

let sekme = nav.find((c) => c.label === SEKME_ETIKETI);
let degisti = false;
if (!sekme) {
  sekme = { label: SEKME_ETIKETI, href: "/kategori/promosyon-kalem", groups: GRUPLAR, highlight: "new" };
  nav.push(sekme);
  degisti = true;
  console.log("Promosyon sekmesi EKLENECEK (menü sonuna).");
} else {
  // Var olan sekmede yalnız eksik bağlantı tamamlanır — elle yapılan düzen korunur.
  for (const g of GRUPLAR) {
    let hedefGrup = (sekme.groups ??= []).find((x) => x.title === g.title);
    if (!hedefGrup) {
      sekme.groups.push(g);
      degisti = true;
      continue;
    }
    for (const it of g.items) {
      if (!hedefGrup.items.some((x) => x.href === it.href)) {
        hedefGrup.items.push(it);
        degisti = true;
      }
    }
  }
  console.log(degisti ? "Promosyon sekmesi eksikleri tamamlanacak." : "Menü zaten güncel.");
}

for (const g of sekme.groups ?? []) {
  console.log(`  [${g.title}] ${g.items.map((i) => i.label).join(" | ")}`);
}
if (!degisti) process.exit(0);
if (DRY) {
  console.log("\n[DRY] hiçbir şey yazılmadı");
  process.exit(0);
}

const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
if (!email || !password) {
  console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli.");
  process.exit(1);
}
const login = await fetch(`${API}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) {
  console.error("Giriş başarısız:", login.status);
  process.exit(1);
}
const lj = await login.json();
const H = {
  "content-type": "application/json",
  authorization: `Bearer ${lj.accessToken || lj.access_token || lj.token}`,
};
const r = await fetch(`${API}/api/settings`, {
  method: "PATCH",
  headers: H,
  body: JSON.stringify({ group: "header", values: { header_nav: nav } }),
});
if (!r.ok) {
  console.error("✗ menü yazılamadı:", r.status, (await r.text()).slice(0, 300));
  process.exit(1);
}
console.log("✓ menü güncellendi. Vitrin ISR ~300 sn içinde tazelenir (gerekirse /api/revalidate).");
