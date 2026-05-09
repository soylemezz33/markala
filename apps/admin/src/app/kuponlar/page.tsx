import { AdminPlaceholder } from "@/components/admin-placeholder";
import { Tag } from "@phosphor-icons/react/dist/ssr";

export default function KuponlarPage() {
  return (
    <AdminPlaceholder
      title="Kuponlar"
      desc="İndirim kuponları, kampanya kodları, kullanıcı bazlı kupon dağıtımı"
      icon={Tag}
      newButton={{ label: "Yeni Kupon" }}
      table={{
        columns: ["Kod", "Tür", "İndirim", "Kullanım", "Geçerlilik", "Durum"],
        rows: [
          { Kod: "HOSGELDIN", Tür: "İlk sipariş", İndirim: "%10", Kullanım: "47 / ∞", Geçerlilik: "Sürekli", Durum: "Aktif" },
          { Kod: "MAYIS25", Tür: "Sezon", İndirim: "%25 (max 250 ₺)", Kullanım: "12 / 500", Geçerlilik: "31.05.2026", Durum: "Aktif" },
          { Kod: "KURUMSAL15", Tür: "B2B", İndirim: "%15", Kullanım: "8 / ∞", Geçerlilik: "Sürekli", Durum: "Aktif" },
          { Kod: "BLACKFRIDAY", Tür: "Kampanya", İndirim: "%40", Kullanım: "0 / 1000", Geçerlilik: "29.11.2026", Durum: "Planlı" },
        ],
      }}
      features={[
        "Sabit tutar veya yüzde bazlı indirim",
        "Min sepet tutarı eşiği",
        "Kategori veya ürün bazlı kısıtlama",
        "Tek kullanımlık veya çok kullanımlı",
        "Kullanıcı bazlı (özel kupon) ya da herkese açık",
        "Kombine edilemezlik kuralları",
        "Otomatik e-posta ile dağıtım (SendGrid)",
      ]}
      endpoints={[
        { method: "GET", path: "/api/coupons", desc: "Tüm kuponları listele" },
        { method: "POST", path: "/api/coupons", desc: "Yeni kupon oluştur" },
        { method: "PATCH", path: "/api/coupons/:code", desc: "Kupon güncelle" },
        { method: "DELETE", path: "/api/coupons/:code", desc: "Kupon devre dışı" },
        { method: "POST", path: "/api/coupons/:code/validate", desc: "Sepette kupon doğrula" },
      ]}
    />
  );
}
