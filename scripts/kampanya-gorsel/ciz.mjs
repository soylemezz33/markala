import { chromium } from "file:///C:/Users/Administrator/Desktop/markala/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright/index.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1300, height: 1000 }, deviceScaleFactor: 2 });
const url = pathToFileURL(path.resolve("sablon.html")).href;
await p.goto(url, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1500);
for (const id of ["secim-paketi-az", "secim-paketi-orta", "secim-paketi-fazla", "esnaf-baslangic", "yeni-isletme", "restoran-acilis"]) {
  await p.locator("#" + id).screenshot({ path: `${id}.png` });
  console.log("cizildi:", id);
}
await b.close();
