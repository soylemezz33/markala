"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, PencilSimple, Prohibit, X } from "@phosphor-icons/react";
import type { BannerDto } from "@markala/api-client";
import { createBanner, updateBanner, removeBanner } from "./actions";

interface Props {
  banners: BannerDto[];
}

type BannerLocation = "hero" | "category" | "cart" | "footer";

interface FormState {
  title: string;
  location: BannerLocation;
  imageUrl: string;
  mobileImageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  startDate: string;
  endDate: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  location: "hero",
  imageUrl: "",
  mobileImageUrl: "",
  ctaLabel: "",
  ctaHref: "",
  startDate: "",
  endDate: "",
  sortOrder: "0",
  isActive: true,
};

const LOCATION_LABELS: Record<BannerLocation, string> = {
  hero: "Anasayfa Hero",
  category: "Kategori",
  cart: "Sepet",
  footer: "Footer",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatDateRange(banner: BannerDto): string {
  if (!banner.startDate && !banner.endDate) return "Sürekli";
  const start = formatDate(banner.startDate) || "—";
  const end = formatDate(banner.endDate) || "—";
  return `${start} – ${end}`;
}

function buildPayload(form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    location: form.location,
    imageUrl: form.imageUrl.trim(),
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };

  if (form.mobileImageUrl.trim() !== "") {
    payload.mobileImageUrl = form.mobileImageUrl.trim();
  }
  if (form.ctaLabel.trim() !== "") {
    payload.ctaLabel = form.ctaLabel.trim();
  }
  if (form.ctaHref.trim() !== "") {
    payload.ctaHref = form.ctaHref.trim();
  }
  if (form.startDate !== "") {
    payload.startDate = form.startDate;
  }
  if (form.endDate !== "") {
    payload.endDate = form.endDate;
  }

  return payload;
}

export function BannerClient({ banners }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(b: BannerDto) {
    setEditingId(b.id);
    setForm({
      title: b.title,
      location: b.location as BannerLocation,
      imageUrl: b.imageUrl,
      mobileImageUrl: b.mobileImageUrl ?? "",
      ctaLabel: b.ctaLabel ?? "",
      ctaHref: b.ctaHref ?? "",
      startDate: formatDate(b.startDate),
      endDate: formatDate(b.endDate),
      sortOrder: String(b.sortOrder),
      isActive: b.isActive,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleDeactivate(b: BannerDto) {
    startTransition(async () => {
      try {
        await updateBanner(b.id, { isActive: false });
        toast.success(`"${b.title}" pasifleştirildi.`);
      } catch {
        toast.error("Pasifleştirme başarısız.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload(form);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateBanner(editingId, payload);
          toast.success("Banner güncellendi.");
        } else {
          await createBanner(payload);
          toast.success("Banner oluşturuldu.");
        }
        closeModal();
      } catch {
        toast.error(editingId ? "Güncelleme başarısız." : "Oluşturma başarısız.");
      }
    });
  }

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <AdminShell>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Bannerlar</h1>
          <p className="text-ink-500 text-sm mt-1">{banners.length} banner</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} weight="bold" /> Yeni Banner
        </button>
      </header>

      {/* Table */}
      {banners.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">Henüz hiç banner oluşturulmamış.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} weight="bold" /> İlk Banneri Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Banner</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Konum</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Görsel</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">CTA</th>
                  <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">Tarih</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {banners.map((b) => (
                  <tr key={b.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink-900">{b.title}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden md:table-cell">
                      {LOCATION_LABELS[b.location as BannerLocation] ?? b.location}
                    </td>
                    <td className="px-4 py-3 text-ink-500 text-xs hidden md:table-cell">
                      {b.imageUrl.startsWith("http")
                        ? b.imageUrl.split("/").pop()
                        : b.imageUrl}
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden lg:table-cell">
                      {b.ctaLabel ?? <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-700 hidden lg:table-cell text-xs">
                      {formatDateRange(b)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          b.isActive
                            ? "bg-success/15 text-success"
                            : "bg-paper-200 text-ink-500"
                        }`}
                      >
                        {b.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700"
                        >
                          <PencilSimple size={12} /> Düzenle
                        </button>
                        {b.isActive && (
                          <button
                            onClick={() => handleDeactivate(b)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-error/10 hover:border-error/30 hover:text-error text-ink-700 disabled:opacity-50"
                          >
                            <Prohibit size={12} /> Pasifleştir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200">
              <h2 className="text-lg font-semibold text-ink-900">
                {editingId ? "Banner Düzenle" : "Yeni Banner"}
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
                  placeholder="İlk Sipariş %10 İndirim"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Konum <span className="text-error">*</span>
                </label>
                <select
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value as BannerLocation)}
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                >
                  <option value="hero">Anasayfa Hero</option>
                  <option value="category">Kategori</option>
                  <option value="cart">Sepet</option>
                  <option value="footer">Footer</option>
                </select>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Görsel URL <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setField("imageUrl", e.target.value)}
                  placeholder="https://cdn.markala.com/banner.jpg"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Mobile Image URL */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Mobil Görsel URL{" "}
                  <span className="font-normal text-ink-500">(boş = masaüstü ile aynı)</span>
                </label>
                <input
                  type="text"
                  value={form.mobileImageUrl}
                  onChange={(e) => setField("mobileImageUrl", e.target.value)}
                  placeholder="https://cdn.markala.com/banner-mobile.jpg"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* CTA Label + Href */}
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
                    placeholder="ALIŞVERİŞE BAŞLA"
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

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Başlangıç{" "}
                    <span className="font-normal text-ink-500">(boş = yok)</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Bitiş{" "}
                    <span className="font-normal text-ink-500">(boş = yok)</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
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
                <span className="text-sm text-ink-900 font-medium">Banner aktif</span>
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
