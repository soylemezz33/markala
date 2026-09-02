import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * apps/api içinde `packages/*` paketlerinden ÇALIŞMA ZAMANI import'u yasaktır.
 *
 * Neden (2026-09-02 üretim olayı): packages/types `"main": "./src/index.ts"` ile
 * HAM TypeScript yayınlıyor. Tip import'ları derlemede silindiği için sorun
 * çıkarmaz; ama bir DEĞER import edilirse derlenmiş dist `require("@markala/types")`
 * yapar ve Node .ts dosyasını okuyamaz:
 *
 *   SyntaxError: Unexpected token 'export'
 *
 * Sonuç: markala-api crash-loop, api.markala.com.tr 502. Bu hatayı type-check,
 * birim testler ve Docker build'in HİÇBİRİ yakalamaz — yalnız konteyner ayağa
 * kalkarken görünür. Bu test o boşluğu kapatır.
 *
 * İzin verilen: `import type { X } from "@markala/types"` ve
 * `import { type X } from ...` (ikisi de derlemede silinir).
 * Test dosyaları hariç: vitest TS'i kendisi derler, orada güvenli.
 */

const SRC = join(__dirname, "..");

function tsDosyalari(dir: string): string[] {
  const out: string[] = [];
  for (const ad of readdirSync(dir)) {
    const tam = join(dir, ad);
    if (statSync(tam).isDirectory()) {
      out.push(...tsDosyalari(tam));
    } else if (ad.endsWith(".ts") && !ad.endsWith(".spec.ts") && !ad.endsWith(".d.ts")) {
      out.push(tam);
    }
  }
  return out;
}

describe("paket import kuralı", () => {
  it("apps/api üretim kodunda @markala/* çalışma zamanı import'u yok", () => {
    const ihlaller: string[] = [];

    for (const dosya of tsDosyalari(SRC)) {
      const icerik = readFileSync(dosya, "utf8");
      // "import ... from '@markala/...'" satırlarını yakala; `import type` olanları ele.
      // Cümle içinde tırnak/`;` OLMAMALI: aksi halde regex önceki import
      // ifadelerinin üzerinden atlayıp yanlış dosyayı suçluyordu (@nestjs/common).
      const re = /import\s+([^"';]*?)\s+from\s+["']@markala\/[^"']+["']/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(icerik)) !== null) {
        const clause = m[1].trim();
        const tipOnly =
          clause.startsWith("type ") ||
          // { type A, type B } — süslü parantez içindeki HER isim `type` ile başlamalı
          (clause.startsWith("{") &&
            clause
              .replace(/[{}]/g, "")
              .split(",")
              .filter((x) => x.trim())
              .every((x) => x.trim().startsWith("type ")));
        if (!tipOnly) {
          ihlaller.push(`${dosya.replace(SRC, "src")} → ${m[0].split("\n")[0]}`);
        }
      }
    }

    expect(ihlaller).toEqual([]);
  });
});
