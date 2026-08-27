import { chromium } from 'file:///C:/Users/Administrator/Desktop/markala/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('https://markala.com.tr/urun/el-ilani', { waitUntil: 'networkidle' });
for (const ebat of ['A7', 'A5', 'A4', 'A3']) {
  const el = await p.$(`button:has-text("${ebat}")`);
  if (!el) { console.log(ebat, '-> secenek bulunamadi'); continue; }
  await el.click(); await p.waitForTimeout(600);
  const adet = await p.$$eval('button', es => es.map(e => e.textContent.trim()).filter(x => /^\d[\d.]*\s*Adet/.test(x)));
  console.log(ebat, '->', adet.join(' | '));
}
await b.close();
