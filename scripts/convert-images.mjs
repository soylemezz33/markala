import fs from "node:fs";

// === PRODUCTS ===
{
  const path = "packages/mock-data/src/products.ts";
  let s = fs.readFileSync(path, "utf8");
  // Helper'ı yenile
  s = s.replace(
    /\/\*\*[\s\S]*?\*\/\s*const mockupImg[^;]+;/,
    `/**
 * Ürün görselleri yerel /public/images/products/[slug]/ altında.
 * Path: /images/products/[slug]/[index].jpg (Hasan tarafından yüklenecek).
 */
const prodImg = (slug: string, i: number = 1) => \`/images/products/\${slug}/\${i}.jpg\`;`,
  );
  // mockupImg("cat", "name", "v") → ürünün slug'ını içerideki slug'tan al
  // Strateji: her objedeki slug'a göre o ürünün images array'ini değiştir
  const productRe = /(\{\s*slug:\s*"([^"]+)",[^{}]*?images:\s*\[)([^\]]+)(\])/gs;
  s = s.replace(productRe, (_m, head, slug, body, tail) => {
    let i = 0;
    const newBody = body.replace(/mockupImg\([^)]+\)/g, () => {
      i++;
      return `prodImg("${slug}", ${i})`;
    });
    return head + newBody + tail;
  });
  fs.writeFileSync(path, s);
  console.log("✅ products.ts");
}

// === HERO SLIDES ===
{
  const path = "packages/mock-data/src/hero-slides.ts";
  let s = fs.readFileSync(path, "utf8");
  const slideRe = /(\{\s*id:\s*"([^"]+)",[^{}]*?productImage:\s*)"\/api\/mockup\/[^"]+"/gs;
  s = s.replace(slideRe, (_m, head, id) => `${head}\`/images/hero/${id}.jpg\``);
  fs.writeFileSync(path, s);
  console.log("✅ hero-slides.ts");
}

// === CAMPAIGNS (banner) ===
{
  const path = "packages/mock-data/src/campaigns.ts";
  let s = fs.readFileSync(path, "utf8");
  const re = /(\{\s*id:\s*"([^"]+)",[^{}]*?imageUrl:\s*)"\/api\/mockup\/[^"]+"/gs;
  s = s.replace(re, (_m, head, id) => `${head}\`/images/campaigns/${id}.jpg\``);
  fs.writeFileSync(path, s);
  console.log("✅ campaigns.ts");
}

// === CAMPAIGN BUNDLES ===
{
  const path = "packages/mock-data/src/campaign-bundles.ts";
  let s = fs.readFileSync(path, "utf8");
  s = s.replace(
    /const img\s*=[^;]+;/,
    `const bundleImg = (slug: string) => \`/images/bundles/\${slug}.jpg\`;`,
  );
  // img("cat", "name") çağrılarını bundleImg(slug) ile değiştir
  const bundleRe = /(\{\s*slug:\s*"([^"]+)",[^{}]*?imageUrl:\s*)img\(\s*"[^"]+"\s*,\s*"[^"]+"\s*\)/gs;
  s = s.replace(bundleRe, (_m, head, slug) => `${head}bundleImg("${slug}")`);
  fs.writeFileSync(path, s);
  console.log("✅ campaign-bundles.ts");
}

// === ALL Image components: remove unoptimized ===
{
  const files = [
    "apps/web/src/components/product-card.tsx",
    "apps/web/src/components/category-card.tsx",
    "apps/web/src/components/product/gallery.tsx",
    "apps/web/src/components/home/campaign-strip.tsx",
    "apps/web/src/components/home/hero-carousel.tsx",
    "apps/web/src/components/home/category-icon-strip.tsx",
    "apps/web/src/components/cart/cart-drawer.tsx",
    "apps/web/src/app/sepet/page.tsx",
    "apps/web/src/app/odeme/page.tsx",
    "apps/web/src/app/odeme/basarili/[orderId]/page.tsx",
    "apps/web/src/app/hesabim/siparislerim/page.tsx",
    "apps/web/src/app/hesabim/siparislerim/[orderId]/page.tsx",
    "apps/web/src/app/kategori/[slug]/page.tsx",
    "apps/web/src/app/kampanyalar/page.tsx",
    "apps/web/src/app/referanslar/page.tsx",
  ];
  let total = 0;
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    let s = fs.readFileSync(f, "utf8");
    const before = s;
    s = s.replace(/\s+unoptimized(\s|=\{true\})?/g, "");
    if (s !== before) {
      fs.writeFileSync(f, s);
      total++;
      console.log("  · removed unoptimized:", f);
    }
  }
  console.log(`✅ ${total} dosyadan unoptimized kaldırıldı`);
}

console.log("\n🎉 Conversion tamamlandı");
