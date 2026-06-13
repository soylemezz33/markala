import { AdminShell } from "@/components/admin-shell";
import {
  Plus,
  Pencil,
  Trash,
  ArrowsOutCardinal,
  Image as ImageIcon,
  Info,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react/dist/ssr";
import { getAdminApi } from "@/lib/api";

export default async function SliderAdminPage() {
  const api = await getAdminApi();
  const slides = await api.heroSlides.list(true);

  return (
    <AdminShell>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink-900">Anasayfa Slider</h1>
          <p className="text-ink-500 text-sm mt-1">
            Hero carousel slide'larını ekle, düzenle, sırala. Her 6 saniyede otomatik geçer.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded text-sm font-medium hover:bg-ink-700">
          <Plus size={16} weight="bold" /> Yeni Slide
        </button>
      </header>

      {/* Önemli boyut bilgisi */}
      <div className="mb-6 p-5 bg-brand-100 border border-brand-300 rounded-lg flex gap-4">
        <div className="flex-none w-10 h-10 rounded-md bg-brand-500 text-ink-900 grid place-items-center">
          <Info size={20} weight="fill" />
        </div>
        <div className="flex-1">
          <h2 className="font-medium text-ink-900">Görsel Boyut Standardı</h2>
          <ul className="mt-2 text-sm text-ink-700 space-y-1">
            <li>
              <strong>Önerilen:</strong>{" "}
              <code className="font-mono px-2 py-0.5 rounded bg-paper-50 text-ink-900 border border-paper-200">
                1040 × 1040 px
              </code>{" "}
              (Retina için 2x)
            </li>
            <li>
              <strong>Minimum:</strong>{" "}
              <code className="font-mono px-2 py-0.5 rounded bg-paper-50 text-ink-900 border border-paper-200">
                520 × 520 px
              </code>
            </li>
            <li>
              <strong>Aspect ratio:</strong> 1:1 (kare)
            </li>
            <li>
              <strong>Format:</strong> WebP (öncelik) veya JPG · Max 500 KB
            </li>
            <li>
              <strong>Konu:</strong> Ürün izole edilmiş, arka plan transparent veya açık ton (slide
              gradient bg üzerinde durur)
            </li>
          </ul>
          <p className="mt-3 text-xs text-ink-500">
            Yüklenen görsel sadece slide'ın <strong>sağ tarafındaki ürün alanına</strong>{" "}
            yerleştirilir. Sol taraftaki başlık + CTA + arka plan rengi tema seçiminden gelir.
          </p>
        </div>
      </div>

      {/* Slide tablosu */}
      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-paper-200 flex items-center justify-between text-xs text-ink-500">
          <span>{slides.length} slide · sıralama drag-drop ile değişir</span>
          <span>Otomatik geçiş süresi: 6 sn</span>
        </div>
        <ul className="divide-y divide-paper-200">
          {slides.map((s) => (
            <li key={s.id} className="p-4 flex items-center gap-4 hover:bg-paper-100">
              <button
                aria-label="Sırala"
                className="text-ink-300 hover:text-ink-700 cursor-grab"
              >
                <ArrowsOutCardinal size={18} />
              </button>

              {/* Görsel önizleme */}
              <div className="flex-none w-20 h-20 rounded-md bg-paper-200 grid place-items-center text-ink-500 overflow-hidden">
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={24} />
                )}
              </div>

              {/* Bilgi */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {s.ctaLabel && (
                    <span className="text-xs px-2 py-0.5 rounded bg-paper-100 text-ink-700 font-medium">
                      {s.ctaLabel}
                    </span>
                  )}
                  {s.ctaHref && (
                    <span className="text-xs text-ink-500 font-mono truncate max-w-[200px]">
                      {s.ctaHref}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-medium text-ink-900">{s.title}</h3>
                {s.subtitle && (
                  <p className="text-xs text-ink-500 mt-0.5 truncate">{s.subtitle}</p>
                )}
                <p className="text-xs text-ink-500 mt-0.5">Sıra: {s.sortOrder}</p>
              </div>

              {/* Aksiyonlar */}
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded ${
                    s.isActive
                      ? "text-success hover:bg-success/10"
                      : "text-ink-500 hover:bg-paper-100"
                  }`}
                  aria-label={s.isActive ? "Pasif yap" : "Aktif yap"}
                  title={s.isActive ? "Aktif — görünüyor" : "Pasif — gizli"}
                >
                  {s.isActive ? <Eye size={18} /> : <EyeSlash size={18} />}
                </button>
                <button
                  className="p-2 rounded text-ink-700 hover:bg-paper-100"
                  aria-label="Düzenle"
                >
                  <Pencil size={18} />
                </button>
                <button
                  className="p-2 rounded text-ink-500 hover:bg-error/10 hover:text-error"
                  aria-label="Sil"
                >
                  <Trash size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
