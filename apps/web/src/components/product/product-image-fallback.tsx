import { ImageSquare } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@markala/ui";

/**
 * Gerçek görseli olmayan ürünler için sade "görsel yok" durumu.
 * Jenerik /api/mockup pazarlama kartı yerine kullanılır (örn. teklif usulü iş güvenliği levhaları).
 * Ürün adını gösterir — metin tabanlı levhalarda ad zaten içeriğin kendisidir.
 */
export function ProductImageFallback({ name, className }: { name?: string; className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper-100 px-4 text-center",
        className,
      )}
    >
      <ImageSquare size={32} weight="thin" className="text-ink-300" />
      {name ? (
        <span className="text-xs font-medium text-ink-500 line-clamp-3">{name}</span>
      ) : null}
    </div>
  );
}
