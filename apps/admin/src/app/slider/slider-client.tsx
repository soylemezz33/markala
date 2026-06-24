"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ImageUploader } from "@/components/image-uploader";
import {
  Plus,
  Pencil,
  Trash,
  ArrowsOutCardinal,
  Image as ImageIcon,
  Info,
  Eye,
  EyeSlash,
  X,
} from "@phosphor-icons/react";
import type { HeroSlideDto } from "@markala/api-client";
import { createSlide, updateSlide, removeSlide } from "./actions";

interface Props {
  slides: HeroSlideDto[];
}

interface FormState {
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  imageUrl: "",
  mobileImageUrl: "",
  ctaLabel: "",
  ctaHref: "",
  sortOrder: "0",
  isActive: true,
};

function buildPayload(form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    imageUrl: form.imageUrl.trim(),
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };

  if (form.subtitle.trim() !== "") payload.subtitle = form.subtitle.trim();
  if (form.mobileImageUrl.trim() !== "") payload.mobileImageUrl = form.mobileImageUrl.trim();
  if (form.ctaLabel.trim() !== "") payload.ctaLabel = form.ctaLabel.trim();
  if (form.ctaHref.trim() !== "") payload.ctaHref = form.ctaHref.trim();

  return payload;
}

export function SliderClient({ slides }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(s: HeroSlideDto) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? "",
      imageUrl: s.imageUrl,
      mobileImageUrl: s.mobileImageUrl ?? "",
      ctaLabel: s.ctaLabel ?? "",
      ctaHref: s.ctaHref ?? "",
      sortOrder: String(s.sortOrder),
      isActive: s.isActive,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleToggle(s: HeroSlideDto) {
    startTransition(async () => {
      try {
        await updateSlide(s.id, { isActive: !s.isActive });
        toast.success(`"${s.title}" ${s.isActive ? "pasifleştirildi" : "aktifleştirildi"}.`);
      } catch {
        toast.error("Durum değiştirme başarısız.");
      }
    });
  }

  function handleDelete(s: HeroSlideDto) {
    if (!window.confirm(`"${s.title}" slide'ı kalıcı olarak silinecek. Emin misin?`)) return;
    startTransition(async () => {
      try {
        await removeSlide(s.id);
        toast.success(`"${s.title}" silindi.`);
      } catch {
        toast.error("Silme başarısız.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      toast.error("Lütfen bir görsel yükleyin.");
      return;
    }
    const payload = buildPayload(form);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateSlide(editingId, payload);
          toast.success("Slide güncellendi.");
        } else {
          await createSlide(payload);
          toast.success("Slide oluşturuldu.");
        }
        closeModal();
      } catch {
        toast.error(editingId ? "Güncelleme başarısız." : "Oluşturma başarısız.");
      }
    });
  }

  return (
    <AdminShell>
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink-900">Anasayfa Slider</h1>
          <p className="text-ink-500 text-sm mt-1">
            Hero carousel slide&apos;larını ekle, düzenle, sırala. Her 6 saniyede otomatik geçer.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded text-sm font-medium hover:bg-ink-700"
        >
          <Plus size={16} weight="bold" /> Yeni Slide
        </button>
      </header>

      {/* Bilgi: anasayfa hero'su artık kodlu premium slider — bu slide'lar geçici olarak gösterilmiyor */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg flex gap-3">
        <div className="flex-none w-9 h-9 rounded-md bg-amber-400 text-ink-900 grid place-items-center">
          <Info size={18} weight="fill" />
        </div>
        <div className="text-sm text-ink-800">
          <strong>Not:</strong> Anasayfa hero alanı şu an <strong>kodlu premium slider</strong> kullanıyor;
          buradaki slide&apos;lar geçici olarak anasayfada gösterilmiyor. Bu slider&apos;ı tekrar devreye almak
          (admin&apos;den yönetilebilir hero) istersen geliştirme ekibine bildir.
        </div>
      </div>

      {/* Boyut bilgisi */}
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
              <strong>Konu:</strong> Ürün izole edilmiş, arka plan transparent veya açık ton
            </li>
          </ul>
          <p className="mt-3 text-xs text-ink-500">
            Yüklenen görsel sadece slide&apos;ın <strong>sağ tarafındaki ürün alanına</strong>{" "}
            yerleştirilir.
          </p>
        </div>
      </div>

      {/* Slide listesi */}
      {slides.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">Henüz hiç slide oluşturulmamış.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded text-sm font-medium hover:bg-ink-700"
          >
            <Plus size={16} weight="bold" /> İlk Slide&apos;ı Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-paper-200 flex items-center justify-between text-xs text-ink-500">
            <span>{slides.length} slide · sıralama sortOrder ile değişir</span>
            <span>Otomatik geçiş süresi: 6 sn</span>
          </div>
          <ul className="divide-y divide-paper-200">
            {slides.map((s) => (
              <li key={s.id} className="p-4 flex items-center gap-4 hover:bg-paper-100">
                <span className="text-ink-300 cursor-default">
                  <ArrowsOutCardinal size={18} />
                </span>

                {/* Görsel önizleme */}
                <div className="flex-none w-20 h-20 rounded-md bg-paper-200 grid place-items-center text-ink-500 overflow-hidden">
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
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
                    onClick={() => handleToggle(s)}
                    disabled={isPending}
                    className={`p-2 rounded disabled:opacity-50 ${
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
                    onClick={() => openEdit(s)}
                    className="p-2 rounded text-ink-700 hover:bg-paper-100"
                    aria-label="Düzenle"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    disabled={isPending}
                    className="p-2 rounded text-ink-500 hover:bg-error/10 hover:text-error disabled:opacity-50"
                    aria-label="Sil"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-paper-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal başlık */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200">
              <h2 className="text-lg font-semibold text-ink-900">
                {editingId ? "Slide Düzenle" : "Yeni Slide"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 -mr-1.5 rounded hover:bg-paper-100 text-ink-500"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Başlık <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Profesyonel Baskı Çözümleri"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Alt Başlık{" "}
                  <span className="font-normal text-ink-500">(boş = yok)</span>
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setField("subtitle", e.target.value)}
                  placeholder="Hızlı teslimat, garantili kalite"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Görsel <span className="text-error">*</span>
                </label>
                <ImageUploader
                  value={form.imageUrl}
                  onChange={(url) => setField("imageUrl", url)}
                />
              </div>

              {/* Mobile Image URL */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Mobil Görsel{" "}
                  <span className="font-normal text-ink-500">(boş = masaüstü ile aynı)</span>
                </label>
                <ImageUploader
                  value={form.mobileImageUrl}
                  onChange={(url) => setField("mobileImageUrl", url)}
                />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    CTA Metni{" "}
                    <span className="font-normal text-ink-500">(boş = yok)</span>
                  </label>
                  <input
                    type="text"
                    value={form.ctaLabel}
                    onChange={(e) => setField("ctaLabel", e.target.value)}
                    placeholder="HEMEN İNCELE"
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    CTA Bağlantı{" "}
                    <span className="font-normal text-ink-500">(boş = yok)</span>
                  </label>
                  <input
                    type="text"
                    value={form.ctaHref}
                    onChange={(e) => setField("ctaHref", e.target.value)}
                    placeholder="/urunler"
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Sıra{" "}
                  <span className="font-normal text-ink-500">(küçük = önce)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.sortOrder}
                  onChange={(e) => setField("sortOrder", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* isActive */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="w-4 h-4 rounded border-paper-200 accent-brand-500"
                />
                <span className="text-sm text-ink-900 font-medium">Slide aktif</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-paper-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg border border-paper-200 hover:bg-paper-100 text-ink-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-ink-900 disabled:opacity-60"
                >
                  {isPending ? "Kaydediliyor…" : editingId ? "Güncelle" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
