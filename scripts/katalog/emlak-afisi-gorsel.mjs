// Emlak Afişi ürün/kategori görseli üretici (2026-09-04). SVG → 1200×1200 webp, apps/api içindeki sharp paketiyle.
// Kullanım: node scripts/katalog/emlak-afisi-gorsel.mjs scripts/katalog/assets/emlak-afisi   (→ .webp + .png)
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
const sharp = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/api/package.json"))("sharp");
const out = process.argv[2];
const F = `font-family="Segoe UI, Arial, Helvetica, sans-serif"`;
const poster = (w, h, id, baslik, alt, altbilgi, rozet) => `
  <defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5A3AC8"/><stop offset="1" stop-color="#3B1E8C"/></linearGradient>
  <clipPath id="c${id}"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="10"/></clipPath></defs>
  <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="10" fill="url(#g${id})"/>
  <g clip-path="url(#c${id})" opacity="0.18" fill="none" stroke="#fff" stroke-width="2">
    <circle cx="${w/2}" cy="${-h/2}" r="${w*0.55}"/><circle cx="${w/2}" cy="${-h/2}" r="${w*0.8}"/><circle cx="${w/2}" cy="${-h/2}" r="${w*1.05}"/>
  </g>
  <g clip-path="url(#c${id})" fill="#fff" opacity="0.35">${Array.from({length:5},(_,r)=>Array.from({length:6},(_,c)=>`<circle cx="${-w/2+22+c*16}" cy="${h/2-22-r*16}" r="4"/>`).join("")).join("")}</g>
  <rect x="${-w*0.34}" y="${-h*0.44}" width="${w*0.68}" height="${h*0.075}" rx="${h*0.0375}" fill="#F5B800"/>
  <text x="0" y="${-h*0.44+h*0.052}" text-anchor="middle" ${F} font-weight="800" font-size="${h*0.036}" fill="#2A1466" letter-spacing="1">${rozet}</text>
  <text x="0" y="${-h*0.19}" text-anchor="middle" ${F} font-weight="900" font-size="${w*0.215}" fill="#fff" letter-spacing="-1">${baslik}</text>
  <g transform="translate(0,${-h*0.04}) scale(${w/620})" fill="#fff">
    <path d="M-70 40 L0 -30 L70 40 L48 40 L48 100 L-48 100 L-48 40 Z M-14 100 L-14 62 L14 62 L14 100 Z" fill-rule="evenodd"/>
    <path d="M30 -10 L30 -38 L48 -38 L48 8 Z"/>
  </g>
  <text x="0" y="${h*0.225}" text-anchor="middle" ${F} font-weight="700" font-size="${w*0.062}" fill="#fff">${alt}</text>
  <rect x="${-w*0.42}" y="${h*0.29}" width="${w*0.84}" height="${h*0.085}" rx="8" fill="#fff" opacity="0.14"/>
  <text x="0" y="${h*0.29+h*0.058}" text-anchor="middle" ${F} font-weight="700" font-size="${w*0.05}" fill="#F5B800" letter-spacing="1">${altbilgi}</text>
  <text x="0" y="${h*0.455}" text-anchor="middle" ${F} font-weight="600" font-size="${w*0.036}" fill="#fff" opacity="0.7">markala.com.tr</text>`;
const shadow = (w,h)=>`<rect x="${-w/2+10}" y="${-h/2+28}" width="${w}" height="${h}" rx="12" fill="#1a1230" opacity="0.28" filter="url(#blur)"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
<defs><filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter></defs>
<rect width="1200" height="1200" fill="#ffffff"/>
<g transform="translate(795,585) rotate(5)">${shadow(600,840)}${poster(600,840,"a","SATILIK","3+1 · 145 m² · 2. Kat","BİLGİ İÇİN ARAYIN","EMLAK OFİSİ")}</g>
<g transform="translate(320,745) rotate(-7)">${shadow(420,588)}${poster(420,588,"b","KİRALIK","2+1 · 95 m² · Eşyalı","BİLGİ İÇİN ARAYIN","EMLAK OFİSİ")}</g>
</svg>`;
const buf = Buffer.from(svg);
await sharp(buf).webp({ quality: 88 }).toFile(out + ".webp");
await sharp(buf).png().toFile(out + ".png");
console.log("ok", out);
