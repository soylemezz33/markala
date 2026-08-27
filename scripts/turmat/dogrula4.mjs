import { chromium } from 'file:///C:/Users/Administrator/Desktop/markala/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage();
const r = await p.goto('https://markala.com.tr/urun/urun-kutusu', { waitUntil: 'networkidle' });
console.log('http:', r.status(), '| title:', await p.title());
console.log('h1:', (await p.$$eval('h1', e => e.map(x => x.textContent.trim()))).join(' / '));
console.log('gorsel sayisi:', await p.$$eval('main img', e => e.length));
await b.close();
