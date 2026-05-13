import { NextRequest, NextResponse } from "next/server";
import { categories, products } from "@markala/mock-data";

/**
 * UI/UX odaklı SVG mockup endpoint.
 * Kategoriye göre ürünü temsil eden bir illüstrasyon, marka tonunda renkler ve
 * "MARKALA · markala.com.tr" logosu ile profesyonel bir ürün kartı SVG'si üretir.
 *
 * Query params:
 *   slug      → ürün slug'ı (öncelikli)
 *   category  → kategori slug'ı
 *   w, h      → SVG boyut (default 1200x1200 — kart aspect-square için)
 *   theme     → "brand" | "ink" | "paper" (default brand)
 *   v         → varyant (1-4) — galeride farklı görseller için
 */

const PALETTE = {
  brand: {
    bg1: "#F5B800", bg2: "#E8A800",
    fg: "#1A1410", muted: "#6B5A3F", accent: "#FFFFFF",
    paper: "#FBF7EC", paperShade: "#E8DDC2",
  },
  ink: {
    bg1: "#1A1410", bg2: "#0F0B08",
    fg: "#F5B800", muted: "#8C7A52", accent: "#F2EDE0",
    paper: "#2A2218", paperShade: "#1F1812",
  },
  paper: {
    bg1: "#F8F4E8", bg2: "#E8DDC2",
    fg: "#1A1410", muted: "#7A6A52", accent: "#F5B800",
    paper: "#FFFFFF", paperShade: "#F0E8D0",
  },
} as const;

type ThemeKey = keyof typeof PALETTE;

// Kategori → tema/illüstrasyon eşleme
const CATEGORY_THEMES: Record<string, { theme: ThemeKey; illustration: IllustrationKey }> = {
  // Kartvizit
  "kartvizit": { theme: "brand", illustration: "card" },
  // Broşür ailesi
  "brosur": { theme: "paper", illustration: "brochure" },
  "el-ilani": { theme: "brand", illustration: "flyer" },
  "afis": { theme: "ink", illustration: "poster" },
  "kapi-aski-brosur": { theme: "brand", illustration: "doorhang" },
  // Kâğıt ürünler
  "antetli-kagit": { theme: "paper", illustration: "letterhead" },
  "zarf": { theme: "paper", illustration: "envelope" },
  "etiket": { theme: "brand", illustration: "label" },
  "makbuz": { theme: "paper", illustration: "receipt" },
  "amerikan-servis": { theme: "paper", illustration: "placemat" },
  "cepli-dosya": { theme: "ink", illustration: "folder" },
  "oto-paspas": { theme: "paper", illustration: "placemat" },
  // Bloknot ailesi
  "bloknot": { theme: "brand", illustration: "notepad" },
  // Çanta
  "canta-kese": { theme: "ink", illustration: "bag" },
  // Magnet
  "magnet": { theme: "brand", illustration: "magnet" },
  "arac-magneti": { theme: "ink", illustration: "carmagnet" },
  // Bayrak ailesi
  "yelken-bayrak": { theme: "brand", illustration: "flag" },
  "kirlangic-bayrak": { theme: "brand", illustration: "bunting" },
  "masa-bayragi": { theme: "ink", illustration: "deskflag" },
  "makam-bayragi": { theme: "ink", illustration: "ceremonyflag" },
  // Branda
  "vinil-branda-afis": { theme: "ink", illustration: "banner" },
  // Stand & tabela
  "rollup": { theme: "ink", illustration: "rollup" },
  "lightbox": { theme: "ink", illustration: "lightbox" },
  "dekota-baski": { theme: "paper", illustration: "panel" },
  "fosforlu-folyo": { theme: "ink", illustration: "phosphor" },
  "guvenlik-uyari-levhalari": { theme: "brand", illustration: "warning" },
  "folyo": { theme: "paper", illustration: "decal" },
  "arac-sticker": { theme: "ink", illustration: "carmagnet" },
  // Promosyon
  "kupa": { theme: "paper", illustration: "mug" },
  "kase": { theme: "ink", illustration: "stamp" },
  "plaket": { theme: "ink", illustration: "plaque" },
  "madalya": { theme: "brand", illustration: "medal" },
  "plastik-reklam-dubasi": { theme: "brand", illustration: "cone" },
};

type IllustrationKey =
  | "card" | "brochure" | "flyer" | "poster" | "doorhang"
  | "letterhead" | "envelope" | "label" | "receipt" | "placemat"
  | "folder" | "notepad" | "bag" | "magnet" | "carmagnet"
  | "flag" | "bunting" | "deskflag" | "ceremonyflag"
  | "banner" | "rollup" | "lightbox" | "panel" | "phosphor"
  | "warning" | "decal" | "mug" | "stamp" | "plaque" | "medal" | "cone"
  | "default";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

interface IllustrationCtx {
  cx: number; cy: number;
  palette: (typeof PALETTE)[ThemeKey];
  variant: number;
}

/** Her illüstrasyon merkez koordinatı + palette ile kompakt SVG fragment döner. */
function renderIllustration(kind: IllustrationKey, ctx: IllustrationCtx): string {
  const { cx, cy, palette: p, variant } = ctx;
  const v = ((variant - 1) % 4) + 1;

  switch (kind) {
    // Kartvizit — yatay, hafif eğik 2 kart
    case "card":
      return `
        <g transform="translate(${cx}, ${cy})">
          <g transform="rotate(-6) translate(-260, 60)">
            <rect width="520" height="320" rx="12" fill="${p.paperShade}" opacity="0.55"/>
          </g>
          <g transform="rotate(2) translate(-260, -160)">
            <rect width="520" height="320" rx="12" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.08" stroke-width="2"/>
            <rect x="40" y="40" width="80" height="80" rx="6" fill="${p.fg}" opacity="0.92"/>
            <text x="40" y="180" font-family="DM Sans, sans-serif" font-size="38" font-weight="700" fill="${p.fg}">Markanızın Adı</text>
            <text x="40" y="220" font-family="DM Sans, sans-serif" font-size="20" fill="${p.muted}">Yönetici Ünvanı</text>
            <line x1="40" y1="245" x2="200" y2="245" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="2"/>
            <text x="40" y="278" font-family="DM Sans, sans-serif" font-size="16" fill="${p.muted}">+90 5XX 000 00 00</text>
          </g>
        </g>`;

    // Broşür — 3 katlı katlama
    case "brochure":
      return `
        <g transform="translate(${cx}, ${cy})">
          <g transform="translate(-340, -240)">
            <rect width="220" height="480" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.1"/>
            <rect width="220" height="120" fill="${p.fg}" opacity="0.92"/>
            <text x="110" y="78" text-anchor="middle" font-family="DM Sans" font-size="24" font-weight="700" fill="${p.bg1}">PANEL 1</text>
            <rect x="20" y="160" width="180" height="8" fill="${p.fg}" opacity="0.18"/>
            <rect x="20" y="180" width="140" height="8" fill="${p.fg}" opacity="0.12"/>
            <rect x="20" y="240" width="180" height="180" fill="${p.bg1}" opacity="0.35"/>
          </g>
          <g transform="translate(-110, -260)">
            <rect width="220" height="500" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.1"/>
            <text x="110" y="78" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="700" fill="${p.fg}">İÇERİK</text>
            <rect x="20" y="120" width="180" height="8" fill="${p.fg}" opacity="0.18"/>
            <rect x="20" y="140" width="160" height="8" fill="${p.fg}" opacity="0.12"/>
            <rect x="20" y="160" width="170" height="8" fill="${p.fg}" opacity="0.12"/>
            <rect x="20" y="220" width="180" height="220" fill="${p.bg1}" opacity="0.18"/>
          </g>
          <g transform="translate(120, -240)">
            <rect width="220" height="480" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.1"/>
            <text x="110" y="58" text-anchor="middle" font-family="DM Sans" font-size="18" font-weight="600" fill="${p.muted}">İLETİŞİM</text>
            <rect x="20" y="90" width="180" height="6" fill="${p.fg}" opacity="0.12"/>
            <rect x="20" y="106" width="140" height="6" fill="${p.fg}" opacity="0.12"/>
            <rect x="20" y="160" width="180" height="180" fill="${p.fg}" opacity="0.06"/>
            <text x="110" y="260" text-anchor="middle" font-family="DM Sans" font-size="16" font-weight="700" fill="${p.fg}">markala.com.tr</text>
          </g>
        </g>`;

    case "flyer":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-200" y="-280" width="400" height="560" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.1"/>
          <rect x="-200" y="-280" width="400" height="160" fill="${p.fg}" opacity="0.92"/>
          <text x="0" y="-200" text-anchor="middle" font-family="DM Sans" font-size="38" font-weight="800" fill="${p.bg1}">KAMPANYA</text>
          <text x="0" y="-170" text-anchor="middle" font-family="DM Sans" font-size="16" fill="${p.bg1}" opacity="0.85">Sezon İndirimleri</text>
          <text x="0" y="-40" text-anchor="middle" font-family="DM Sans" font-size="120" font-weight="900" fill="${p.fg}">%50</text>
          <text x="0" y="20" text-anchor="middle" font-family="DM Sans" font-size="22" fill="${p.muted}">indirim · sınırlı süre</text>
          <rect x="-120" y="80" width="240" height="56" rx="28" fill="${p.fg}"/>
          <text x="0" y="116" text-anchor="middle" font-family="DM Sans" font-size="20" font-weight="700" fill="${p.bg1}">HEMEN AL</text>
          <text x="0" y="240" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.muted}">markala.com.tr</text>
        </g>`;

    case "poster":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-280" y="-380" width="560" height="760" fill="${p.paper}"/>
          <rect x="-280" y="-380" width="560" height="220" fill="${p.bg1}"/>
          <text x="0" y="-280" text-anchor="middle" font-family="DM Sans" font-size="46" font-weight="900" fill="${p.fg}">ETKİNLİK</text>
          <text x="0" y="-220" text-anchor="middle" font-family="DM Sans" font-size="22" fill="${p.fg}" opacity="0.7">2026 · MERSİN</text>
          <circle cx="0" cy="20" r="140" fill="none" stroke="${p.fg}" stroke-width="6" stroke-opacity="0.55"/>
          <text x="0" y="40" text-anchor="middle" font-family="DM Sans" font-size="80" font-weight="900" fill="${p.fg}">A2</text>
          <rect x="-220" y="240" width="440" height="6" fill="${p.fg}" opacity="0.2"/>
          <text x="0" y="290" text-anchor="middle" font-family="DM Sans" font-size="18" fill="${p.muted}">105 gr Kuşe · 49×69 cm</text>
        </g>`;

    case "doorhang":
      return `
        <g transform="translate(${cx}, ${cy})">
          <path d="M -130 -360 Q -130 -380 -110 -380 L 110 -380 Q 130 -380 130 -360 L 130 360 Q 130 380 110 380 L -110 380 Q -130 380 -130 360 Z" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.15"/>
          <circle cx="0" cy="-300" r="48" fill="none" stroke="${p.fg}" stroke-width="3" stroke-opacity="0.4"/>
          <rect x="-90" y="-200" width="180" height="120" fill="${p.fg}" opacity="0.92"/>
          <text x="0" y="-130" text-anchor="middle" font-family="DM Sans" font-size="24" font-weight="700" fill="${p.bg1}">DND</text>
          <text x="0" y="-40" text-anchor="middle" font-family="DM Sans" font-size="16" font-weight="600" fill="${p.fg}">Rahatsız Etmeyin</text>
          <line x1="-90" y1="0" x2="90" y2="0" stroke="${p.fg}" stroke-opacity="0.15" stroke-width="2"/>
          <text x="0" y="40" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.muted}">Lütfen daha sonra</text>
          <text x="0" y="60" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.muted}">geri geliniz</text>
          <text x="0" y="320" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.fg}">markala.com.tr</text>
        </g>`;

    case "letterhead":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-260" y="-360" width="520" height="720" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.1"/>
          <rect x="-260" y="-360" width="520" height="100" fill="${p.bg1}"/>
          <text x="-220" y="-300" font-family="DM Sans" font-size="32" font-weight="800" fill="${p.fg}">FİRMA ADI</text>
          <text x="-220" y="-275" font-family="DM Sans" font-size="14" fill="${p.fg}" opacity="0.65">Kurumsal Antetli Kâğıt</text>
          <line x1="-220" y1="-220" x2="220" y2="-220" stroke="${p.fg}" stroke-opacity="0.18"/>
          ${[...Array(11)].map((_, i) => `<rect x="-220" y="${-180 + i * 36}" width="${i % 2 === 0 ? 440 : 360}" height="6" fill="${p.fg}" opacity="0.1"/>`).join("")}
          <line x1="-220" y1="290" x2="220" y2="290" stroke="${p.fg}" stroke-opacity="0.18"/>
          <text x="-220" y="320" font-family="DM Sans" font-size="12" fill="${p.muted}">Tel: 0324 000 00 00 · info@firma.com</text>
          <text x="220" y="320" text-anchor="end" font-family="DM Sans" font-size="12" fill="${p.muted}">markala.com.tr</text>
        </g>`;

    case "envelope":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-280" y="-180" width="560" height="360" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="2"/>
          <path d="M -280 -180 L 0 60 L 280 -180" fill="none" stroke="${p.fg}" stroke-opacity="0.25" stroke-width="2"/>
          <rect x="170" y="-150" width="80" height="100" fill="${p.bg1}" opacity="0.85"/>
          <rect x="180" y="-140" width="60" height="80" fill="${p.fg}" opacity="0.12"/>
          <text x="-260" y="120" font-family="DM Sans" font-size="20" font-weight="700" fill="${p.fg}">FİRMA ADI</text>
          <text x="-260" y="148" font-family="DM Sans" font-size="14" fill="${p.muted}">Adres satırı 1, Mersin</text>
          <text x="0" y="220" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.fg}">markala.com.tr</text>
        </g>`;

    case "label":
      return `
        <g transform="translate(${cx}, ${cy})">
          ${[
            { x: -240, y: -240 }, { x: 0, y: -240 }, { x: 240, y: -240 },
            { x: -240, y: 0 }, { x: 0, y: 0 }, { x: 240, y: 0 },
            { x: -240, y: 240 }, { x: 0, y: 240 }, { x: 240, y: 240 },
          ].map((pos) => `
            <g transform="translate(${pos.x - 90}, ${pos.y - 60})">
              <rect width="180" height="120" rx="60" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.15"/>
              <text x="90" y="58" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.fg}">ETİKET</text>
              <text x="90" y="80" text-anchor="middle" font-family="DM Sans" font-size="10" fill="${p.muted}">90 gr Kuşe</text>
            </g>
          `).join("")}
        </g>`;

    case "receipt":
      return `
        <g transform="translate(${cx}, ${cy})">
          <g transform="rotate(-3) translate(-200, -260)">
            <rect width="380" height="540" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.1"/>
            <text x="190" y="48" text-anchor="middle" font-family="DM Sans" font-size="20" font-weight="800" fill="${p.fg}">MAKBUZ</text>
            <text x="190" y="72" text-anchor="middle" font-family="DM Sans" font-size="12" fill="${p.muted}">Tarih: 06/05/2026 · No: 0001</text>
            <line x1="40" y1="100" x2="340" y2="100" stroke="${p.fg}" stroke-opacity="0.15" stroke-dasharray="4 4"/>
            ${[...Array(6)].map((_, i) => `
              <text x="40" y="${140 + i * 40}" font-family="DM Sans" font-size="13" fill="${p.fg}">Hizmet ${i + 1}</text>
              <text x="340" y="${140 + i * 40}" text-anchor="end" font-family="DM Sans" font-size="13" font-weight="700" fill="${p.fg}">${(50 + i * 25).toFixed(2)} ₺</text>
            `).join("")}
            <line x1="40" y1="400" x2="340" y2="400" stroke="${p.fg}" stroke-opacity="0.4" stroke-width="2"/>
            <text x="40" y="430" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.fg}">TOPLAM</text>
            <text x="340" y="430" text-anchor="end" font-family="DM Sans" font-size="20" font-weight="800" fill="${p.fg}">525,00 ₺</text>
            <text x="190" y="500" text-anchor="middle" font-family="DM Sans" font-size="11" fill="${p.muted}">54 gr NCR · 1 asıl + 1 suret</text>
          </g>
        </g>`;

    case "placemat":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-340" y="-220" width="680" height="440" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.15"/>
          <text x="0" y="-150" text-anchor="middle" font-family="DM Sans" font-size="38" font-weight="800" fill="${p.fg}">RESTORAN</text>
          <text x="0" y="-110" text-anchor="middle" font-family="DM Sans" font-size="16" fill="${p.muted}">menü · kampanya · marka tanıtımı</text>
          <circle cx="-180" cy="60" r="80" fill="${p.bg1}" opacity="0.4"/>
          <circle cx="180" cy="60" r="80" fill="${p.fg}" opacity="0.1"/>
          <text x="0" y="180" text-anchor="middle" font-family="DM Sans" font-size="12" font-weight="700" fill="${p.muted}">markala.com.tr</text>
        </g>`;

    case "folder":
      return `
        <g transform="translate(${cx}, ${cy})">
          <path d="M -260 -340 L -260 340 L 260 340 L 260 -260 L 180 -340 Z" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="2"/>
          <path d="M 180 -340 L 180 -260 L 260 -260" fill="none" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="2"/>
          <rect x="-220" y="-300" width="180" height="40" rx="4" fill="${p.bg1}" opacity="0.9"/>
          <text x="-130" y="-272" text-anchor="middle" font-family="DM Sans" font-size="16" font-weight="700" fill="${p.fg}">Müvekkil</text>
          ${[...Array(8)].map((_, i) => `<rect x="-200" y="${-200 + i * 50}" width="${i % 2 === 0 ? 380 : 340}" height="6" fill="${p.fg}" opacity="0.1"/>`).join("")}
          <text x="0" y="320" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.fg}">CEPLİ DOSYA · 22.5×31 cm</text>
        </g>`;

    case "notepad":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-220" y="-300" width="440" height="600" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="2"/>
          <rect x="-220" y="-300" width="440" height="80" fill="${p.fg}"/>
          <text x="0" y="-250" text-anchor="middle" font-family="DM Sans" font-size="24" font-weight="800" fill="${p.bg1}">NOTLUK</text>
          ${[...Array(12)].map((_, i) => `<line x1="-180" y1="${-180 + i * 36}" x2="180" y2="${-180 + i * 36}" stroke="${p.fg}" stroke-opacity="0.12"/>`).join("")}
          <line x1="-150" y1="-180" x2="-150" y2="280" stroke="${p.bg1}" stroke-width="2"/>
          <text x="0" y="320" text-anchor="middle" font-family="DM Sans" font-size="12" font-weight="700" fill="${p.muted}">markala.com.tr</text>
        </g>`;

    case "bag":
      return `
        <g transform="translate(${cx}, ${cy})">
          <path d="M -180 -200 Q -180 -280 -120 -280 L 120 -280 Q 180 -280 180 -200" fill="none" stroke="${p.fg}" stroke-opacity="0.4" stroke-width="3"/>
          <rect x="-220" y="-200" width="440" height="500" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="2"/>
          <rect x="-220" y="-200" width="440" height="180" fill="${p.bg1}" opacity="0.95"/>
          <text x="0" y="-110" text-anchor="middle" font-family="DM Sans" font-size="42" font-weight="900" fill="${p.fg}">MARKALA</text>
          <text x="0" y="-70" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.fg}" opacity="0.7" letter-spacing="2">PREMIUM</text>
          <circle cx="0" cy="100" r="60" fill="${p.fg}" opacity="0.12"/>
          <text x="0" y="260" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.muted}">210 gr A. Bristol · Selefonlu</text>
        </g>`;

    case "magnet":
      return `
        <g transform="translate(${cx}, ${cy})">
          <g transform="rotate(-4) translate(-280, -100)">
            <rect width="220" height="320" rx="12" fill="${p.paperShade}" opacity="0.55"/>
          </g>
          <g transform="rotate(2) translate(-180, -200)">
            <rect width="360" height="240" rx="20" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.18"/>
            <rect width="360" height="60" rx="20" fill="${p.fg}"/>
            <text x="180" y="42" text-anchor="middle" font-family="DM Sans" font-size="20" font-weight="700" fill="${p.bg1}">MAGNET</text>
            <text x="180" y="120" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="800" fill="${p.fg}">Eczane / Taksi</text>
            <text x="180" y="150" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.muted}">+90 5XX 000 00 00</text>
            <text x="180" y="180" text-anchor="middle" font-family="DM Sans" font-size="12" fill="${p.muted}">Adres satırı, Mersin</text>
            <rect x="14" y="200" width="332" height="24" fill="${p.bg1}" opacity="0.45"/>
            <text x="180" y="218" text-anchor="middle" font-family="DM Sans" font-size="11" font-weight="700" fill="${p.fg}">60 MİKRON · 46×68 mm</text>
          </g>
        </g>`;

    case "carmagnet":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-260" y="-180" width="520" height="360" rx="14" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="2"/>
          <rect x="-260" y="-180" width="520" height="100" fill="${p.fg}"/>
          <text x="0" y="-118" text-anchor="middle" font-family="DM Sans" font-size="36" font-weight="900" fill="${p.bg1}">SERVİS</text>
          <text x="0" y="0" text-anchor="middle" font-family="DM Sans" font-size="32" font-weight="800" fill="${p.fg}">+90 324 000 00 00</text>
          <text x="0" y="50" text-anchor="middle" font-family="DM Sans" font-size="18" fill="${p.muted}">7/24 acil destek hizmeti</text>
          <rect x="-220" y="120" width="440" height="40" fill="${p.bg1}" opacity="0.5"/>
          <text x="0" y="148" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.fg}">markala.com.tr</text>
        </g>`;

    case "flag":
      return `
        <g transform="translate(${cx}, ${cy})">
          <line x1="-220" y1="-360" x2="-220" y2="360" stroke="${p.muted}" stroke-width="6"/>
          <path d="M -220 -340 Q 60 -260 60 -100 Q 60 100 -220 220 Z" fill="${p.bg1}" opacity="0.9"/>
          <text transform="translate(-100, 0) rotate(8)" text-anchor="middle" font-family="DM Sans" font-size="48" font-weight="900" fill="${p.fg}">MAĞAZA</text>
          <text transform="translate(-100, 60) rotate(8)" text-anchor="middle" font-family="DM Sans" font-size="22" fill="${p.fg}" opacity="0.7">açık · indirim</text>
          <ellipse cx="-220" cy="380" rx="80" ry="14" fill="${p.fg}" opacity="0.2"/>
        </g>`;

    case "bunting":
      return `
        <g transform="translate(${cx}, ${cy})">
          <path d="M -360 -240 Q 0 -160 360 -240" stroke="${p.fg}" stroke-width="3" stroke-opacity="0.3" fill="none"/>
          ${[
            { x: -280, c: "#FF6B6B" }, { x: -180, c: "#4ECDC4" }, { x: -80, c: "#FFE66D" },
            { x: 20, c: "#A6CFE2" }, { x: 120, c: "#F7B5C5" }, { x: 220, c: "#95E1D3" },
            { x: 320, c: "#FCBF49" },
          ].map((b) => `<path d="M ${b.x - 30} -220 L ${b.x + 30} -220 L ${b.x} -120 Z" fill="${b.c}" stroke="${p.fg}" stroke-opacity="0.15"/>`).join("")}
          <path d="M -360 100 Q 0 180 360 100" stroke="${p.fg}" stroke-width="3" stroke-opacity="0.3" fill="none"/>
          ${[
            { x: -300, c: "#FFE66D" }, { x: -180, c: "#FF6B6B" }, { x: -60, c: "#4ECDC4" },
            { x: 60, c: "#FCBF49" }, { x: 180, c: "#F7B5C5" }, { x: 300, c: "#95E1D3" },
          ].map((b) => `<path d="M ${b.x - 28} 120 L ${b.x + 28} 120 L ${b.x} 220 Z" fill="${b.c}" stroke="${p.fg}" stroke-opacity="0.15"/>`).join("")}
          <text x="0" y="320" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.fg}">KIRLANGIÇ BAYRAK · 3 m İPLİ SET</text>
        </g>`;

    case "deskflag":
      return `
        <g transform="translate(${cx}, ${cy})">
          <ellipse cx="0" cy="240" rx="180" ry="22" fill="${p.fg}" opacity="0.18"/>
          <rect x="-120" y="180" width="240" height="50" rx="4" fill="${p.muted}" opacity="0.6"/>
          <line x1="0" y1="-240" x2="0" y2="180" stroke="#C0C0C0" stroke-width="6"/>
          <path d="M 0 -240 L 200 -200 L 200 -90 L 0 -50 Z" fill="${p.bg1}" stroke="${p.fg}" stroke-opacity="0.2" stroke-width="2"/>
          <text x="100" y="-150" text-anchor="middle" font-family="DM Sans" font-size="18" font-weight="800" fill="${p.fg}">FİRMA</text>
          <text x="100" y="-120" text-anchor="middle" font-family="DM Sans" font-size="11" fill="${p.fg}" opacity="0.7">15×22 cm Saten</text>
        </g>`;

    case "ceremonyflag":
      return `
        <g transform="translate(${cx}, ${cy})">
          <ellipse cx="0" cy="320" rx="220" ry="24" fill="${p.fg}" opacity="0.18"/>
          <rect x="-160" y="260" width="320" height="60" rx="6" fill="${p.muted}" opacity="0.6"/>
          <line x1="0" y1="-340" x2="0" y2="260" stroke="#C8B560" stroke-width="8"/>
          <circle cx="0" cy="-340" r="14" fill="#FFD700"/>
          <path d="M -180 -300 L 180 -300 L 180 -100 L -180 -100 Z" fill="${p.bg1}" stroke="${p.fg}" stroke-opacity="0.25" stroke-width="2"/>
          <text x="0" y="-220" text-anchor="middle" font-family="DM Sans" font-size="32" font-weight="900" fill="${p.fg}">RESMİ</text>
          <text x="0" y="-180" text-anchor="middle" font-family="DM Sans" font-size="18" fill="${p.fg}" opacity="0.7">MAKAM BAYRAĞI</text>
          ${[...Array(8)].map((_, i) => `<line x1="${-180 + i * 50}" y1="-100" x2="${-200 + i * 50}" y2="-50" stroke="#C8B560" stroke-width="2"/>`).join("")}
        </g>`;

    case "banner":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-360" y="-180" width="720" height="360" fill="${p.bg1}"/>
          <text x="0" y="-50" text-anchor="middle" font-family="DM Sans" font-size="64" font-weight="900" fill="${p.fg}">AÇILDIK!</text>
          <text x="0" y="0" text-anchor="middle" font-family="DM Sans" font-size="24" fill="${p.fg}" opacity="0.85">Tüm ürünlerde %30 indirim</text>
          <rect x="-160" y="40" width="320" height="56" rx="28" fill="${p.fg}"/>
          <text x="0" y="76" text-anchor="middle" font-family="DM Sans" font-size="20" font-weight="700" fill="${p.bg1}">markala.com.tr</text>
          ${[{ x: -350, y: -170 }, { x: 340, y: -170 }, { x: -350, y: 160 }, { x: 340, y: 160 }].map((c) => `<circle cx="${c.x}" cy="${c.y}" r="10" fill="${p.fg}" opacity="0.3"/>`).join("")}
        </g>`;

    case "rollup":
      return `
        <g transform="translate(${cx}, ${cy})">
          <ellipse cx="0" cy="380" rx="180" ry="20" fill="${p.fg}" opacity="0.2"/>
          <rect x="-180" y="370" width="360" height="20" rx="6" fill="${p.muted}" opacity="0.7"/>
          <rect x="-160" y="-360" width="320" height="730" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.15" stroke-width="2"/>
          <rect x="-160" y="-360" width="320" height="180" fill="${p.bg1}"/>
          <text x="0" y="-280" text-anchor="middle" font-family="DM Sans" font-size="32" font-weight="900" fill="${p.fg}">MARKA ADI</text>
          <text x="0" y="-240" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.fg}" opacity="0.7">Slogan satırı</text>
          <text x="0" y="-100" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="700" fill="${p.fg}">Hizmet 1</text>
          <text x="0" y="-60" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="700" fill="${p.fg}">Hizmet 2</text>
          <text x="0" y="-20" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="700" fill="${p.fg}">Hizmet 3</text>
          <rect x="-100" y="60" width="200" height="200" fill="${p.bg1}" opacity="0.25"/>
          <text x="0" y="320" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.muted}">85×200 cm · markala.com.tr</text>
        </g>`;

    case "lightbox":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-320" y="-220" width="640" height="440" rx="6" fill="${p.fg}" stroke="${p.muted}" stroke-width="6"/>
          <rect x="-300" y="-200" width="600" height="400" fill="${p.bg1}" opacity="0.95"/>
          <rect x="-300" y="-200" width="600" height="400" fill="url(#lightboxGlow)" opacity="0.6"/>
          <defs>
            <radialGradient id="lightboxGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <text x="0" y="20" text-anchor="middle" font-family="DM Sans" font-size="64" font-weight="900" fill="${p.fg}">MARKA</text>
          <text x="0" y="80" text-anchor="middle" font-family="DM Sans" font-size="20" fill="${p.fg}" opacity="0.7">LED · 100 × 70 cm</text>
        </g>`;

    case "panel":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-300" y="-200" width="600" height="400" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.2" stroke-width="3"/>
          <text x="0" y="-30" text-anchor="middle" font-family="DM Sans" font-size="56" font-weight="900" fill="${p.fg}">TABELA</text>
          <text x="0" y="20" text-anchor="middle" font-family="DM Sans" font-size="20" fill="${p.muted}">5 mm Dekota · UV Baskı</text>
          ${[{ x: -270, y: -170 }, { x: 270, y: -170 }, { x: -270, y: 170 }, { x: 270, y: 170 }].map((c) => `<circle cx="${c.x}" cy="${c.y}" r="8" fill="${p.fg}" opacity="0.4"/>`).join("")}
          <text x="0" y="120" text-anchor="middle" font-family="DM Sans" font-size="16" font-weight="700" fill="${p.bg1=== '#F5B800' ? p.fg : p.bg1}">markala.com.tr</text>
        </g>`;

    case "phosphor":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-220" y="-280" width="440" height="560" fill="#0D5128" stroke="${p.fg}" stroke-opacity="0.2"/>
          <text x="0" y="-60" text-anchor="middle" font-family="DM Sans" font-size="120" font-weight="900" fill="#9FFF6F" filter="url(#glow)">→</text>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <text x="0" y="80" text-anchor="middle" font-family="DM Sans" font-size="32" font-weight="800" fill="#9FFF6F">ACİL ÇIKIŞ</text>
          <text x="0" y="180" text-anchor="middle" font-family="DM Sans" font-size="14" fill="#9FFF6F" opacity="0.7">Karanlıkta 6 saat parlama</text>
        </g>`;

    case "warning":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-220" y="-280" width="440" height="560" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.18"/>
          <path d="M 0 -200 L 180 80 L -180 80 Z" fill="${p.bg1}" stroke="${p.fg}" stroke-width="6"/>
          <text x="0" y="60" text-anchor="middle" font-family="DM Sans" font-size="120" font-weight="900" fill="${p.fg}">!</text>
          <text x="0" y="180" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="800" fill="${p.fg}">DİKKAT</text>
          <text x="0" y="220" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.muted}">İSO 7010 uyumlu</text>
        </g>`;

    case "decal":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-280" y="-180" width="560" height="360" fill="none" stroke="${p.fg}" stroke-opacity="0.6" stroke-width="3" stroke-dasharray="12 6"/>
          <rect x="-260" y="-160" width="520" height="320" fill="${p.bg1}" opacity="0.5"/>
          <text x="0" y="-20" text-anchor="middle" font-family="DM Sans" font-size="48" font-weight="900" fill="${p.fg}">CAM YAZISI</text>
          <text x="0" y="20" text-anchor="middle" font-family="DM Sans" font-size="20" fill="${p.muted}">CNC Kesimli Folyo</text>
          <text x="0" y="120" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.fg}" opacity="0.8">5 yıl dış mekan dayanımı</text>
        </g>`;

    case "mug":
      return `
        <g transform="translate(${cx}, ${cy})">
          <ellipse cx="0" cy="240" rx="180" ry="18" fill="${p.fg}" opacity="0.18"/>
          <rect x="-160" y="-160" width="320" height="380" rx="20" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="3"/>
          <path d="M 160 -80 Q 280 -80 280 40 Q 280 160 160 160" fill="none" stroke="${p.fg}" stroke-opacity="0.25" stroke-width="14" stroke-linecap="round"/>
          <ellipse cx="0" cy="-160" rx="160" ry="32" fill="${p.paperShade}" stroke="${p.fg}" stroke-opacity="0.18" stroke-width="3"/>
          <text x="0" y="20" text-anchor="middle" font-family="DM Sans" font-size="32" font-weight="900" fill="${p.fg}">MARKA</text>
          <text x="0" y="60" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.muted}">SUBLİMASYON</text>
          <text x="0" y="320" text-anchor="middle" font-family="DM Sans" font-size="12" font-weight="700" fill="${p.muted}">330 ml · markala.com.tr</text>
        </g>`;

    case "stamp":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-180" y="-260" width="360" height="200" rx="14" fill="${p.muted}" opacity="0.85"/>
          <rect x="-160" y="-240" width="320" height="160" rx="10" fill="${p.fg}"/>
          <text x="0" y="-140" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="800" fill="${p.bg1}">TRODAT</text>
          <text x="0" y="-110" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.bg1}" opacity="0.7">PRINTY 4912</text>
          <rect x="-200" y="-40" width="400" height="100" rx="6" fill="${p.muted}" opacity="0.7"/>
          <rect x="-220" y="60" width="440" height="160" rx="10" fill="${p.paper}" stroke="${p.fg}" stroke-opacity="0.2"/>
          <rect x="-180" y="100" width="360" height="80" fill="none" stroke="${p.fg}" stroke-width="3" stroke-dasharray="6 4"/>
          <text x="0" y="156" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="800" fill="${p.fg}">FİRMA KAŞESİ</text>
          <text x="0" y="270" text-anchor="middle" font-family="DM Sans" font-size="12" font-weight="700" fill="${p.muted}">47 × 18 mm · 5 satıra kadar</text>
        </g>`;

    case "plaque":
      return `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-100" y="180" width="200" height="60" rx="6" fill="#8B6F47" stroke="${p.fg}" stroke-opacity="0.18"/>
          <ellipse cx="0" cy="180" rx="100" ry="6" fill="#5C4628"/>
          <path d="M -140 -240 Q -140 -260 -120 -260 L 120 -260 Q 140 -260 140 -240 L 140 180 L -140 180 Z" fill="${p.paperShade}" opacity="0.7" stroke="${p.fg}" stroke-opacity="0.4" stroke-width="3"/>
          <path d="M -140 -240 Q -140 -260 -120 -260 L 120 -260 Q 140 -260 140 -240 L 140 -160 L -140 -160 Z" fill="${p.bg1}" opacity="0.4"/>
          <text x="0" y="-180" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.fg}">TEŞEKKÜR PLAKETİ</text>
          <text x="0" y="-60" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="900" fill="${p.fg}">Sayın</text>
          <text x="0" y="-20" text-anchor="middle" font-family="DM Sans" font-size="20" font-weight="700" fill="${p.fg}">İsim Soyad</text>
          <text x="0" y="40" text-anchor="middle" font-family="DM Sans" font-size="14" fill="${p.muted}">değerli katkılarınız için</text>
          <text x="0" y="120" text-anchor="middle" font-family="DM Sans" font-size="12" fill="${p.muted}">2026</text>
        </g>`;

    case "medal":
      return `
        <g transform="translate(${cx}, ${cy})">
          <path d="M -100 -340 L -50 -340 L -10 -180 L 10 -180 L 50 -340 L 100 -340 L 30 -120 L -30 -120 Z" fill="#1F4FA0" opacity="0.85"/>
          <path d="M -100 -340 L -50 -340 L -10 -180 L 10 -180 L 50 -340 L 100 -340 L 30 -120 L -30 -120 Z" fill="#C8102E" opacity="0.85" transform="translate(0, 30)"/>
          <circle cx="0" cy="60" r="180" fill="#FFD700" stroke="#C8B560" stroke-width="8"/>
          <circle cx="0" cy="60" r="140" fill="none" stroke="#C8B560" stroke-width="4" stroke-dasharray="6 4"/>
          <text x="0" y="50" text-anchor="middle" font-family="DM Sans" font-size="56" font-weight="900" fill="#7B5800">1.</text>
          <text x="0" y="110" text-anchor="middle" font-family="DM Sans" font-size="18" font-weight="700" fill="#7B5800">2026</text>
          <text x="0" y="290" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="700" fill="${p.muted}">7 cm · KURDELALI MADALYA</text>
        </g>`;

    case "cone":
      return `
        <g transform="translate(${cx}, ${cy})">
          <ellipse cx="0" cy="280" rx="200" ry="22" fill="${p.fg}" opacity="0.2"/>
          <rect x="-180" y="200" width="360" height="80" rx="6" fill="${p.muted}" opacity="0.6"/>
          <path d="M -90 200 L -50 -240 Q -45 -260 -25 -260 L 25 -260 Q 45 -260 50 -240 L 90 200 Z" fill="#E63946" stroke="${p.fg}" stroke-opacity="0.3" stroke-width="2"/>
          <rect x="-70" y="-100" width="140" height="40" fill="${p.paper}" opacity="0.92"/>
          <text x="0" y="-72" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="800" fill="#E63946">DİKKAT</text>
          <text x="0" y="60" text-anchor="middle" font-family="DM Sans" font-size="11" font-weight="700" fill="${p.paper}">DUBA · 75 cm</text>
        </g>`;

    default:
      return `
        <g transform="translate(${cx}, ${cy})">
          <circle r="180" fill="${p.fg}" opacity="0.08"/>
          <text text-anchor="middle" font-family="DM Sans" font-size="80" font-weight="900" fill="${p.fg}">M</text>
        </g>`;
  }
  void v; // variant placeholder for future variation
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const categoryParam = url.searchParams.get("category");
  const w = Number(url.searchParams.get("w") ?? "1200") || 1200;
  const h = Number(url.searchParams.get("h") ?? "1200") || 1200;
  const themeOverride = url.searchParams.get("theme") as ThemeKey | null;
  const variant = Number(url.searchParams.get("v") ?? "1") || 1;

  let title = "Markala";
  let subtitle = "Matbaa & Reklam Ürünleri";
  let categoryName: string | undefined;
  let categorySlug: string | undefined;

  if (slug) {
    const product = products.find((p) => p.slug === slug);
    if (product) {
      title = product.name;
      subtitle = product.shortDescription;
      categorySlug = product.categorySlug;
      const cat = categories.find((c) => c.slug === product.categorySlug);
      categoryName = cat?.name;
    }
  } else if (categoryParam) {
    const cat = categories.find((c) => c.slug === categoryParam);
    if (cat) {
      title = cat.name;
      subtitle = cat.shortDescription;
      categorySlug = cat.slug;
      categoryName = "Kategori";
    }
  }

  const themeKey: ThemeKey = themeOverride && themeOverride in PALETTE
    ? themeOverride
    : (categorySlug ? CATEGORY_THEMES[categorySlug]?.theme ?? "brand" : "brand");
  const palette = PALETTE[themeKey];
  const illustrationKey = categorySlug ? CATEGORY_THEMES[categorySlug]?.illustration ?? "default" : "default";

  const titleSafe = escapeXml(title);
  const subSafe = escapeXml(subtitle);
  const catSafe = categoryName ? escapeXml(categoryName) : null;

  // Başlık & altyazıyı uzunsa kırp
  const subShort = subSafe.length > 84 ? subSafe.slice(0, 81) + "…" : subSafe;
  const titleSize = Math.min(w / Math.max(titleSafe.length * 0.55, 18), 72);

  const illustrationFragment = renderIllustration(illustrationKey as IllustrationKey, {
    cx: w / 2,
    cy: h / 2 - 40,
    palette,
    variant,
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${titleSafe}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg1}"/>
      <stop offset="100%" stop-color="${palette.bg2}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="${palette.fg}" opacity="0.05"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#bgGrad)"/>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>

  <!-- Sol üst marka logosu -->
  <g transform="translate(48, 64)">
    <text font-family="DM Sans, system-ui, sans-serif" font-size="22" font-weight="800" fill="${palette.fg}" letter-spacing="1">MARKALA</text>
    <text y="22" font-family="DM Sans, sans-serif" font-size="11" font-weight="600" fill="${palette.fg}" opacity="0.65" letter-spacing="2">MARKALA.COM.TR</text>
  </g>

  <!-- Sağ üst kategori rozet -->
  ${catSafe ? `
  <g transform="translate(${w - 48}, 80)">
    <rect x="-${catSafe.length * 9 + 32}" y="-22" width="${catSafe.length * 9 + 32}" height="32" rx="16" fill="${palette.fg}" opacity="0.92"/>
    <text x="-16" y="-2" text-anchor="end" font-family="DM Sans, sans-serif" font-size="12" font-weight="700" fill="${palette.bg1}" letter-spacing="0.5">${catSafe.toUpperCase()}</text>
  </g>` : ""}

  <!-- Ürün illüstrasyonu (merkez) -->
  ${illustrationFragment}

  <!-- Başlık -->
  <g transform="translate(${w / 2}, ${h - 180})">
    <text text-anchor="middle" font-family="DM Sans, ui-serif, Georgia, serif" font-size="${titleSize}" font-weight="800" fill="${palette.fg}">${titleSafe}</text>
    <text y="42" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="18" font-weight="500" fill="${palette.fg}" opacity="0.78">${subShort}</text>
  </g>

  <!-- Footer çizgi + bilgi -->
  <line x1="48" y1="${h - 70}" x2="${w - 48}" y2="${h - 70}" stroke="${palette.fg}" stroke-opacity="0.18"/>
  <g transform="translate(48, ${h - 36})">
    <text font-family="DM Sans, sans-serif" font-size="11" font-weight="600" fill="${palette.fg}" opacity="0.65" letter-spacing="1.2">324 AJANS · MARKALA · TÜRKİYE GENELİ DHL KARGO</text>
  </g>
  <g transform="translate(${w - 48}, ${h - 36})">
    <text text-anchor="end" font-family="DM Sans, sans-serif" font-size="13" font-weight="700" fill="${palette.fg}" opacity="0.92">markala.com.tr</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=604800, stale-while-revalidate=2592000",
    },
  });
}
