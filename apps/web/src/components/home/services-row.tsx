import { Container } from "@markala/ui";
import { Truck, ShieldCheck, PaintBrush, CreditCard } from "@phosphor-icons/react/dist/ssr";

const services = [
  { icon: Truck, title: "81 ile teslimat", desc: "Türkiye'nin her noktasına 1-3 iş günü içinde kargo" },
  { icon: PaintBrush, title: "Ücretsiz tasarım", desc: "Profesyonel grafik ekibimiz sizin için tasarlasın" },
  { icon: ShieldCheck, title: "Kalite garantisi", desc: "Hatalı baskıda ücretsiz yenisi, kalitemizin arkasındayız" },
  { icon: CreditCard, title: "3 taksit", desc: "Tüm kartlara 3 taksit, 3D Secure ile güvenli ödeme" },
];

export function ServicesRow() {
  return (
    <section className="py-12 md:py-16 border-y border-paper-200 bg-paper-50">
      <Container>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {services.map((s) => (
            <li key={s.title} className="flex items-start gap-4">
              <div className="flex-none w-11 h-11 rounded-md bg-brand-100 text-brand-700 grid place-items-center">
                <s.icon size={22} />
              </div>
              <div>
                <div className="font-medium text-ink-900">{s.title}</div>
                <p className="text-sm text-ink-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
