import type { CampaignBanner } from "@markala/types";

export const campaignBanners: CampaignBanner[] = [
  {
    id: "kartvizit-firsat",
    title: "1.000 adet kartvizit",
    subtitle: "350 gr mat kuşe — 24 saatte teslim",
    ctaLabel: "İncele",
    ctaHref: "/urun/klasik-kartvizit",
    imageUrl: `/images/campaigns/kartvizit-firsat.jpg`,
    tone: "brand",
  },
  {
    id: "branda-firsat",
    title: "Açılışlar için branda",
    subtitle: "440 gr UV dayanıklı, m² 110 ₺'den",
    ctaLabel: "Sipariş Ver",
    ctaHref: "/urun/vinil-branda-440gr",
    imageUrl: `/images/campaigns/branda-firsat.jpg`,
    tone: "dark",
  },
  {
    id: "rollup-firsat",
    title: "Fuar standı seti",
    subtitle: "Roll-Up + Yelken Bayrak — kombinasyon indirim",
    ctaLabel: "Detay",
    ctaHref: "/kategori/rollup",
    imageUrl: `/images/campaigns/rollup-firsat.jpg`,
    tone: "muted",
  },
];
