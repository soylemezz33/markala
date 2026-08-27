import { chromium } from 'file:///C:/Users/Administrator/Desktop/markala/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage();
for (const url of ['https://markala.com.tr/urun/el-ilani','https://markala.com.tr/urun/klasik-kartvizit']) {
  await p.goto(url, { waitUntil: 'networkidle' });
  const t = await p.textContent('body');
  console.log('=== ' + url);
  console.log('  Teklif Al var mı :', /Teklif Al/.test(t));
  const opts = await p.$$eval('button, label', els => els.map(e => e.textContent.trim()).filter(x => x && x.length < 60));
  console.log('  seçenekler:', [...new Set(opts)].slice(0, 40).join(' | '));
  const fiyat = (t.match(/[\d.]+,\d\d\s*₺|₺\s*[\d.]+/g) || []).slice(0, 6);
  console.log('  fiyatlar:', fiyat.join(' , '));
}
await b.close();
