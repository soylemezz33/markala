/**
 * Türkçe çekim eki üretimi — ünlü uyumu + ünsüz benzeşmesi.
 *
 * Neden gerekli (2026-09-01): şehir sayfası şablonu ekleri SABİT yazıyordu
 * (`{city.name}'de`, `{city.name}'in`). 7 ilin 5'inde canlıda bozuk Türkçe
 * üretiyordu — "Antalya'de matbaa & baskı hizmeti", "Gaziantep'de",
 * "Hatay'de". 81 ile çıkınca bu ~60 sayfaya yayılacaktı.
 *
 * Kurallar:
 * - Ünlü uyumu SON ünlüye bakar: "Kütahya" ince ünlülerle başlasa da son
 *   ünlüsü "a" olduğu için "Kütahya'da"dır.
 * - Ünsüz benzeşmesi (FISTIKÇI ŞAHAP): sert ünsüzle biten sözcükte
 *   bulunma/ayrılma ekinin "d"si "t" olur — "Gaziantep'te", "Sivas'tan".
 *   Yönelme ekinde bu değişim YOKTUR — "Sinop'a", "Uşak'a".
 * - Ünlüyle biten sözcükte kaynaştırma harfi: yönelmede "y" (Muğla'ya),
 *   ilgi (tamlayan) ekinde "n" (Muğla'nın).
 */

const BACK = "aıou";
const FRONT = "eiöü";
const VOWELS = BACK + FRONT;
/** Sert ünsüzler — "FISTIKÇI ŞAHAP" */
const VOICELESS = "fstkçşhp";

/** Türkçe'ye duyarlı küçültme: İ→i, I→ı (JS'in toLowerCase'i bunu bozar). */
function trLower(s: string): string {
  return s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
}

/** Şapkalı ünlüleri sadeleştir: â→a, î→i, û→u (Elâzığ, Hakkâri). */
function deAccent(s: string): string {
  return s.replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
}

/**
 * Tamlanan eki almış birleşik il adları: "Kocaeli", "Kırklareli".
 * Bunlar araya kaynaştırma "n"si alır — Kocaeli'nde, Kırklareli'nin.
 */
const COMPOUND = new Set(["Kocaeli", "Kırklareli"]);

interface Harmony {
  /** 2'li uyum: a | e — bulunma, yönelme, ayrılma */
  wide: "a" | "e";
  /** 4'lü uyum: ı | i | u | ü — ilgi eki */
  narrow: "ı" | "i" | "u" | "ü";
  /** Sert ünsüzle mi bitiyor (d→t benzeşmesi) */
  voiceless: boolean;
  /** Ünlüyle mi bitiyor (kaynaştırma harfi gerekir) */
  endsVowel: boolean;
  /** Birleşik ad — araya "n" girer */
  compound: boolean;
}

function analyze(name: string): Harmony {
  const w = deAccent(trLower(name));
  let v = "a";
  for (let i = w.length - 1; i >= 0; i--) {
    const ch = w[i];
    // NOT: boş string kontrolü şart — "aeiou".includes("") true döner.
    if (ch && VOWELS.includes(ch)) { v = ch; break; }
  }
  const last = w[w.length - 1] ?? "";
  return {
    wide: BACK.includes(v) ? "a" : "e",
    narrow: v === "a" || v === "ı" ? "ı"
          : v === "e" || v === "i" ? "i"
          : v === "o" || v === "u" ? "u"
          : "ü",
    voiceless: VOICELESS.includes(last),
    endsVowel: VOWELS.includes(last),
    compound: COMPOUND.has(name),
  };
}

/** Bulunma hâli: Antalya'da, Gaziantep'te, Mersin'de, Kocaeli'nde */
export function trLoc(name: string): string {
  const h = analyze(name);
  if (h.compound) return `${name}'n${h.wide === "a" ? "da" : "de"}`;
  return `${name}'${h.voiceless ? "t" : "d"}${h.wide}`;
}

/** Bulunma + ilgi sıfatı: Antalya'daki, Gaziantep'teki */
export function trLocAdj(name: string): string {
  return `${trLoc(name)}ki`;
}

/** Yönelme hâli: Antalya'ya, Mersin'e, Sinop'a, Kocaeli'ne */
export function trDat(name: string): string {
  const h = analyze(name);
  if (h.compound) return `${name}'n${h.wide}`;
  return `${name}'${h.endsVowel ? "y" : ""}${h.wide}`;
}

/** Ayrılma hâli: Antalya'dan, Gaziantep'ten, Kocaeli'nden */
export function trAbl(name: string): string {
  const h = analyze(name);
  if (h.compound) return `${name}'n${h.wide === "a" ? "dan" : "den"}`;
  return `${name}'${h.voiceless ? "t" : "d"}${h.wide}n`;
}

/** İlgi (tamlayan) hâli: Antalya'nın, Mersin'in, İstanbul'un, Kocaeli'nin */
export function trGen(name: string): string {
  const h = analyze(name);
  if (h.compound || h.endsVowel) return `${name}'n${h.narrow}n`;
  return `${name}'${h.narrow}n`;
}
