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
    icons: [
      { src: "/api/mockup?theme=brand&w=192&h=192", sizes: "192x192", type: "image/svg+xml" },
      { src: "/api/mockup?theme=brand&w=512&h=512", sizes: "512x512", type: "image/svg+xml" },
    ],
  };
}
