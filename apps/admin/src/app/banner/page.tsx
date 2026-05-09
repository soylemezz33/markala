import { AdminPlaceholder } from "@/components/admin-placeholder";
import { ImageSquare } from "@phosphor-icons/react/dist/ssr";

export default function BannerPage() {
  return (
    <AdminPlaceholder
      title="Banner Yönetimi"
      desc="Anasayfa CTA banner, kategori sayfa banner, sepet üstü duyuru banner"
      icon={ImageSquare}
      newButton={{ label: "Yeni Banner" }}
      table={{
        columns: ["Banner", "Konum", "Görsel", "CTA", "Yayın Tarihi", "Durum"],
        rows: [
          { Banner: "İlk Sipariş %10", Konum: "Anasayfa Hero", Görsel: "hero-welcome-1.jpg", CTA: "ALIŞVERİŞE BAŞLA", "Yayın Tarihi": "Sürekli", Durum: "Aktif" },
          { Banner: "Ramazan Kampanya", Konum: "Sepet üstü", Görsel: "ramazan-2026.jpg", CTA: "KAMPANYAYI GÖR", "Yayın Tarihi": "01.04.2026 - 30.04.2026", Durum: "Geçti" },
        ],
      }}
      features={[
        "Çoklu konum desteği (anasayfa hero, kategori, sepet, footer)",
        "Mobil ve desktop için ayrı görseller",
        "Tarih aralığı ile otomatik yayın/sonlandırma",
        "Hedefleme: tüm ziyaretçiler / sadece üyeler / sadece misafirler",
        "A/B test (2 farklı banner aynı slot)",
        "Tıklanma analitiği",
      ]}
      endpoints={[
        { method: "GET", path: "/api/banners?location=hero", desc: "Konuma göre aktif banner" },
        { method: "POST", path: "/api/banners", desc: "Yeni banner" },
        { method: "PATCH", path: "/api/banners/:id", desc: "Banner güncelle" },
        { method: "POST", path: "/api/banners/:id/track-click", desc: "Tıklanma kaydı" },
      ]}
    />
  );
}
