import { AdminPlaceholder } from "@/components/admin-placeholder";
import { FileText } from "@phosphor-icons/react/dist/ssr";

export default function BlogPage() {
  return (
    <AdminPlaceholder
      title="Blog Yazıları"
      desc="SEO içerik üretimi — long-tail anahtar kelime hedefli rehber yazılar"
      icon={FileText}
      newButton={{ label: "Yeni Yazı" }}
      table={{
        columns: ["Başlık", "Kategori", "Yazar", "Yayın", "Görüntülenme", "Durum"],
        rows: [
          { Başlık: "Kartvizit Tasarımında 10 Kritik Detay", Kategori: "Rehber", Yazar: "Hasan", Yayın: "Henüz yayınlanmadı", Görüntülenme: "—", Durum: "Taslak" },
          { Başlık: "350 gr ile 400 gr Arasındaki Fark", Kategori: "Karşılaştırma", Yazar: "—", Yayın: "Planlandı", Görüntülenme: "—", Durum: "Planlı" },
          { Başlık: "Restoran Menü Tasarımı: Renk Psikolojisi", Kategori: "Sektör", Yazar: "—", Yayın: "Planlandı", Görüntülenme: "—", Durum: "Planlı" },
        ],
      }}
      features={[
        "Markdown editör + canlı önizleme",
        "Featured image (kapak görseli) — R2 yükleme",
        "Slug, meta title, meta description, kanonical URL",
        "Anahtar kelime hedefleme (Tier 1-2-3)",
        "İlgili ürün linkleme (iç linkleme)",
        "Yayın tarihi planlama",
        "Schema.org Article markup",
        "RSS feed otomatik üretim",
      ]}
      endpoints={[
        { method: "GET", path: "/api/blog/posts", desc: "Yayınlanmış yazılar" },
        { method: "POST", path: "/api/blog/posts", desc: "Yeni yazı" },
        { method: "PATCH", path: "/api/blog/posts/:slug", desc: "Yazı güncelle" },
        { method: "POST", path: "/api/blog/posts/:slug/publish", desc: "Yayına al" },
      ]}
    />
  );
}
