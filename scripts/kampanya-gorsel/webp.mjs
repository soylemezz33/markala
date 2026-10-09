import fs from "node:fs";
import sharpMod from "file:///C:/Users/Administrator/Desktop/markala/node_modules/.pnpm/sharp@0.35.4_@types+node@22.19.17/node_modules/sharp/dist/index.mjs";

const sharp = sharpMod.default ?? sharpMod;

for (const s of ["secim-paketi-az", "secim-paketi-orta", "secim-paketi-fazla"]) {
  await sharp(`${s}.png`).resize(1200, 900, { fit: "fill" }).webp({ quality: 86, effort: 6 }).toFile(`${s}.webp`);
  const m = await sharp(`${s}.webp`).metadata();
  console.log(`${s}.webp  ${m.width}x${m.height}  ${Math.round(fs.statSync(`${s}.webp`).size / 1024)} KB`);
}
