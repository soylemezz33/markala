import { Container } from "@markala/ui";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MagneticButton } from "@/components/ui/magnetic-button";

export function CtaBanner() {
  return (
    <section className="relative py-16 md:py-24 bg-paper-50 border-y border-paper-200">
      <Container className="relative grid md:grid-cols-12 items-center gap-8">
        <div className="md:col-span-8">
          <p className="text-sm text-brand-700 font-medium uppercase tracking-wider">Hoş geldin kuponu</p>
          <h2 className="mt-2 text-display-md md:text-display-lg font-serif text-ink-900">
            İlk siparişine <span className="marker">%10 indirim</span> seni bekliyor.
          </h2>
          <p className="mt-3 text-ink-700">
            Kupon kodu: <code className="font-mono px-2 py-0.5 rounded bg-paper-100 text-brand-700 border border-paper-200">HOSGELDIN</code> — sepette uygulanır, tek kullanım.
          </p>
        </div>
        <div className="md:col-span-4 flex md:justify-end">
          <MagneticButton href="/urunler" variant="primary" size="lg">
            Hemen Sipariş Ver <ArrowRight size={18} weight="bold" />
          </MagneticButton>
        </div>
      </Container>
    </section>
  );
}
