import { Container } from "@markala/ui";

/**
 * Giriş sayfası yükleme iskeleti (2026-10-09).
 *
 * SORUN: `giris/layout.tsx` çocukları `<Suspense fallback={null}>` ile sarıyordu. Sayfa
 * dinamik (searchParams okuyor), yani her yumuşak navigasyonda sunucudan RSC yükü çekilir.
 * O yük gelene kadar ekranda HİÇBİR ŞEY yoktu: üst menü ve alttaki kampanya şeridi duruyor,
 * orta alan bomboş. Bazı müşterilerde geçiş takılıp kalıyordu ve "beyaz sayfa açıldı,
 * yenileyince düzeldi" şikâyeti geliyordu (Hasan, 9 Eki — tarayıcı testinde bir kez
 * birebir üretildi: URL /giris oldu, <main> 6 saniye boş kaldı).
 *
 * ÇÖZÜM: Next'in `loading.tsx` dosyası bu rota için Suspense sınırını kendisi kurar ve
 * fallback olarak BUNU gösterir. En kötü hâlde müşteri "yükleniyor" iskeleti görür, boş
 * ekran değil. İskelet, formun gerçek yerleşimiyle aynı ölçülerde: iskeletten forma
 * geçerken sayfa zıplamaz (CLS).
 */
export default function GirisLoading() {
  return (
    <div className="min-h-[80vh] grid lg:grid-cols-12" aria-busy="true" aria-live="polite">
      <div className="lg:col-span-6 xl:col-span-5 flex items-start">
        <Container className="py-8 md:py-12 max-w-md mx-auto w-full">
          <span className="sr-only">Giriş sayfası yükleniyor…</span>
          <div className="mb-6 animate-pulse">
            <div className="h-4 w-16 rounded bg-paper-200" />
            <div className="mt-2 h-9 w-48 rounded bg-paper-200" />
            <div className="mt-3 h-4 w-full max-w-sm rounded bg-paper-200" />
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-11 w-full rounded-lg bg-paper-200" />
            <div className="h-11 w-full rounded-lg bg-paper-200" />
            <div className="h-12 w-full rounded-lg bg-paper-200" />
            <div className="h-4 w-40 rounded bg-paper-200" />
            <div className="h-12 w-full rounded-lg bg-paper-100 border border-paper-200" />
          </div>
        </Container>
      </div>
      <div className="hidden lg:block lg:col-span-6 xl:col-span-7 bg-paper-100" />
    </div>
  );
}
