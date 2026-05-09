import { AdminPlaceholder } from "@/components/admin-placeholder";
import { Question } from "@phosphor-icons/react/dist/ssr";

export default function SssPage() {
  return (
    <AdminPlaceholder
      title="SSS Yönetimi"
      desc="Sıkça Sorulan Sorular — kategorili, ürün bazlı veya genel SSS"
      icon={Question}
      newButton={{ label: "Yeni Soru" }}
      table={{
        columns: ["Soru", "Kategori", "Bağlı Ürün", "Görüntülenme", "Durum"],
        rows: [
          { Soru: "Tasarım dosyamı hangi formatta göndermeliyim?", Kategori: "Tasarım", "Bağlı Ürün": "Genel", Görüntülenme: "1.247", Durum: "Aktif" },
          { Soru: "Selefon ile UV lak farkı nedir?", Kategori: "Ürün", "Bağlı Ürün": "Klasik Kartvizit", Görüntülenme: "892", Durum: "Aktif" },
          { Soru: "Kaç günde elime ulaşır?", Kategori: "Kargo", "Bağlı Ürün": "Genel", Görüntülenme: "2.156", Durum: "Aktif" },
        ],
      }}
      features={[
        "Kategorili gruplama (Tasarım/Ürün/Kargo/Ödeme/İade)",
        "Ürün sayfasında otomatik gösterim",
        "Schema.org FAQPage markup (zaten aktif)",
        "Sıralama ve gruplama (drag-drop)",
        "Çoklu yanıt formatı (metin/görsel/video)",
        "Arama içinde indekslenebilir",
      ]}
      endpoints={[
        { method: "GET", path: "/api/faqs?category=design", desc: "Kategoriye göre SSS" },
        { method: "GET", path: "/api/faqs?productSlug=...", desc: "Ürüne özel SSS" },
        { method: "POST", path: "/api/faqs", desc: "Yeni soru" },
        { method: "PATCH", path: "/api/faqs/:id", desc: "Soru güncelle" },
      ]}
    />
  );
}
