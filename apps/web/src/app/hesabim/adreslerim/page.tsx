import { Button } from "@markala/ui";
import { MapPin, Plus, House, Buildings, Truck } from "@phosphor-icons/react/dist/ssr";

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-ink-900">Kayıtlı Adresler</h2>
          <p className="mt-1 text-sm text-ink-500">Sık kullandığınız adresleri kaydedin, ödeme adımında otomatik dolsun.</p>
        </div>
        <Button variant="outline" size="md">
          <Plus size={16} weight="bold" /> Yeni Adres
        </Button>
      </header>

      <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
          <MapPin size={28} />
        </div>
        <h3 className="mt-5 font-semibold text-ink-900 text-lg">Henüz adresiniz yok</h3>
        <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
          İlk siparişinizde teslimat adresi otomatik kaydedilir.
        </p>
        <Button className="mt-5">
          <Plus size={16} weight="bold" /> Adres Ekle
        </Button>
      </div>

      {/* Bilgi kartları */}
      <div className="grid sm:grid-cols-3 gap-4">
        <InfoCard icon={<House size={20} />} title="Ev adresi" desc="Kişisel siparişler için" />
        <InfoCard icon={<Buildings size={20} />} title="İş adresi" desc="Kurumsal teslimat" />
        <InfoCard icon={<Truck size={20} />} title="Farklı teslimat" desc="Sipariş sırasında özel" />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl">
      <div className="w-10 h-10 rounded-md bg-paper-50 text-brand-700 grid place-items-center mb-3">{icon}</div>
      <div className="font-semibold text-ink-900">{title}</div>
      <p className="mt-1 text-sm text-ink-500">{desc}</p>
    </div>
  );
}
