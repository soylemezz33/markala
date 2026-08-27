import { chromium } from 'file:///C:/Users/Administrator/Desktop/markala/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('https://markala.com.tr/urun/klasik-kartvizit', { waitUntil: 'networkidle' });
const tabs = await p.$$eval('[role="tablist"] button, [role="tab"]', els => els.map(e => e.textContent.trim()));
console.log('SEVIYE SEKMELERI:', JSON.stringify(tabs));
for (const t of ['Dokulu (Tuale)', 'Standart']) {
  const el = await p.$(`text=${t}`);
  if (!el) { console.log('  bulunamadi:', t); continue; }
  await el.click(); await p.waitForTimeout(700);
  const opts = await p.$$eval('button', es => es.map(e => e.textContent.trim()).filter(x => /gr |Tuale|Bristol|Kuşe|sıvama/i.test(x)).slice(0, 12));
  console.log(`  [${t}] ->`, opts.join(' | ').slice(0, 400));
}
await b.close();
