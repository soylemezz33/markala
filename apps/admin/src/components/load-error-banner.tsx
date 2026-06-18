import { Warning } from "@phosphor-icons/react/dist/ssr";

/**
 * SSR sayfa veri çekimi geçici olarak başarısız olduğunda gösterilen nazik uyarı şeridi.
 * Sayfa boş/fallback veriyle render edilir; tek bir geçici backend hatası tüm admin
 * panelini error boundary'ye düşürüp çökertmesin diye.
 *
 * Sabit konumlu (fixed) — client'ların kendi AdminShell layout'unu değiştirmeden,
 * içeriğin üstünde yüzer şekilde görünür.
 */
export function LoadErrorBanner({
  message = "Veriler şu an yüklenemedi. Sayfayı yenileyin — sorun sürerse birazdan tekrar deneyin.",
}: {
  message?: string;
}) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-2xl">
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-warning/40 bg-warning/10 text-ink-900 shadow-lg">
        <Warning size={18} weight="fill" className="flex-none mt-0.5 text-warning" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
