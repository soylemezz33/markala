import { AdminPlaceholder } from "@/components/admin-placeholder";
import { ImageSquare } from "@phosphor-icons/react/dist/ssr";

export default function KampanyaPaketleriPage() {
  return (
    <AdminPlaceholder
      title="Kampanya Paketleri"
      desc="Esnaf, kurumsal, açılış ve etkinlik için hazır bundle paketler"
      icon={ImageSquare}
      newButton={{ label: "Yeni Paket" }}
      table={{
        columns: ["Paket", "Kategori", "İçerik", "Liste Fiyat", "Paket Fiyat", "Durum"],
        rows: [
          { Paket: "Esnaf Başlangıç", Kategori: "esnaf", İçerik: "1.000 kartvizit + 1 kaşe + 250 broşür", "Liste Fiyat": "₺ 950", "Paket Fiyat": "₺ 749", Durum: "Aktif" },
          { Paket: "Restoran Açılış", Kategori: "acilis", İçerik: "Vinil branda + 2.000 menü + amerikan servis", "Liste Fiyat": "₺ 6.500", "Paket Fiyat": "₺ 4.999", Durum: "Aktif" },
          { Paket: "Kurumsal Tanıtım", Kategori: "kurumsal", İçerik: "Antetli + zarf + cepli dosya + kartvizit", "Liste Fiyat": "₺ 12.500", "Paket Fiyat": "₺ 9.499", Durum: "Aktif" },
        ],
      }}
      features={[
        "Bundle paketleme — sepete tek tıkla ekleme",
        "Liste fiyatı vs paket fiyatı (otomatik %indirim hesabı)",
        "Kategori bazlı (esnaf/kurumsal/etkinlik/açılış/promosyon)",
        "Stok limiti (\"son 12 paket\" gibi vurgular)",
        "Tasarım desteği dahil/hariç seçeneği",
        "Bitiş tarihi ile otomatik kapanma",
      ]}
      endpoints={[
        { method: "GET", path: "/api/campaign-bundles", desc: "Tüm paketleri listele" },
        { method: "POST", path: "/api/campaign-bundles", desc: "Yeni paket oluştur" },
        { method: "PATCH", path: "/api/campaign-bundles/:slug", desc: "Paket güncelle" },
        { method: "POST", path: "/api/campaign-bundles/:slug/add-to-cart", desc: "Sepete ekle" },
      ]}
    />
  );
}
