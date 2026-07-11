import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Markala — Matbaa & Reklam Ürünleri",
    short_name: "Markala",
    description:
      "Kartvizit, broşür, branda, kupa, kaşe ve 20+ matbaa ürünü kategorisi. Türkiye geneli DHL kargo, ücretsiz tasarım desteği.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F4E8",
    theme_color: "#F5B800",
    orientation: "portrait",
    lang: "tr-TR",
    categories: ["business", "shopping", "productivity"],
    // Raster PNG ikonlar — iOS Safari ve eski Android Chrome SVG manifest ikonunu yok sayar,
    // bu yüzden ana ekran/PWA kurulumunda gerçek marka ikonu görünsün diye PNG kullanılır.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
