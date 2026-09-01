import { chromium } from 'file:///C:/Users/Administrator/Desktop/markala/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright/index.mjs';
const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1280,height:1400} });
await p.goto(`https://markala.com.tr/kategoriler?v=${Date.now()}`, { waitUntil:'networkidle' });
const kart = await p.$$eval('a[href^="/kategori/"]', els => els.slice(0,8).map(e => e.innerText.replace(/\n+/g,' · ').slice(0,64)));
console.log(kart.join('\n'));
