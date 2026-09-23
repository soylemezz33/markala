import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { REVALIDE_KAPALI_ONEKLER, revalideEdilebilir } from "./revalidate-guard";

const APP_DIR = path.resolve(__dirname, "../app");

/** app dizinindeki tüm page.tsx yollarını döndürür. */
function sayfalar(dizin: string): string[] {
  const cikti: string[] = [];
  for (const girdi of fs.readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) cikti.push(...sayfalar(tam));
    else if (girdi.name === "page.tsx") cikti.push(tam);
  }
  return cikti;
}

/** page.tsx yolunu rota yoluna çevirir: .../app/yardim/[kategori]/page.tsx → /yardim/[kategori] */
function rotaYolu(dosya: string): string {
  const bagil = path.relative(APP_DIR, path.dirname(dosya)).split(path.sep).join("/");
  return "/" + bagil;
}

describe("revalideEdilebilir", () => {
  it("kapalı önekleri reddeder, diğerlerine izin verir", () => {
    expect(revalideEdilebilir("/yardim/kargo-ve-teslimat")).toBe(false);
    expect(revalideEdilebilir("/hizmetler/tabela")).toBe(false);
    expect(revalideEdilebilir("/matbaa/aydin/efeler")).toBe(false);
    expect(revalideEdilebilir("/urun/rollup")).toBe(true);
    expect(revalideEdilebilir("/kategori/branda")).toBe(true);
    expect(revalideEdilebilir("/")).toBe(true);
    // /yardim kökünün kendisi dinamik parametre taşımaz → tazelenebilir
    expect(revalideEdilebilir("/yardim")).toBe(true);
  });
});

describe("kapalı önek listesi app dizinini yansıtır", () => {
  it("dynamicParams=false + revalidate yok olan her rota listede kapsanır", () => {
    const korumasiz: string[] = [];
    for (const dosya of sayfalar(APP_DIR)) {
      const kaynak = fs.readFileSync(dosya, "utf8");
      const kapali = /^\s*export const dynamicParams\s*=\s*false/m.test(kaynak);
      const isrVar = /^\s*export const revalidate\s*=/m.test(kaynak);
      if (!kapali || isrVar) continue;
      const rota = rotaYolu(dosya);
      // Rotanın somut bir örneği bu önekle başlar mı? ("/yardim/[kategori]" → "/yardim/")
      if (REVALIDE_KAPALI_ONEKLER.some((onek) => (rota + "/").startsWith(onek))) continue;
      korumasiz.push(rota);
    }
    expect(
      korumasiz,
      `Bu rotalar dynamicParams=false ve ISR'siz; revalidatePath onları kalıcı 404 yapar. ` +
        `REVALIDE_KAPALI_ONEKLER listesine ekleyin: ${korumasiz.join(", ")}`,
    ).toEqual([]);
  });
});
