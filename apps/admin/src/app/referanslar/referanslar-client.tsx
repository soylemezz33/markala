"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ImageUploader } from "@/components/image-uploader";
import { Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import type { BrandDto } from "@markala/api-client";
import { createBrand, updateBrand, removeBrand } from "./actions";

interface Props {
  brands: BrandDto[];
}

interface FormState {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  logoUrl: "",
  websiteUrl: "",
  sortOrder: "0",
  isActive: true,
};

function buildPayload(form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };
  if (form.logoUrl.trim() !== "") payload.logoUrl = form.logoUrl.trim();
  if (form.websiteUrl.trim() !== "") payload.websiteUrl = form.websiteUrl.trim();
  return payload;
}

export function ReferanslarClient({ brands }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(b: BrandDto) {
    setEditingId(b.id);
    setForm({
      name: b.name,
      logoUrl: b.logoUrl ?? "",
      websiteUrl: b.websiteUrl ?? "",
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

  function handleDelete(b: BrandDto) {
    if (!confirm(`"${b.name}" markasını silmek istediğinize emin misiniz?`)) return;
    startTransition(async () => {
      try {
        await removeBrand(b.id);
        toast.success(`"${b.name}" silindi.`);
      } catch {
        toast.error("Silme başarısız.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Marka adı zorunludur.");
      return;
    }
    const payload = buildPayload(form);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateBrand(editingId, payload);
          toast.success("Marka güncellendi.");
        } else {
          await createBrand(payload);
          toast.success("Marka oluşturuldu.");
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
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Referanslar</h1>
          <p className="text-ink-500 text-sm mt-1">{brands.length} marka</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} weight="bold" /> Yeni Marka
        </button>
      </header>

      {/* Table */}
      {brands.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">Henüz hiç marka eklenmemiş.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} weight="bold" /> İlk Markayı Ekle
          </button>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Logo</th>
                  <th className="text-left px-4 py-3 font-semibold">Marka</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Web Sitesi</th>
                  <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">Sıra</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3">
                      {b.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.logoUrl}
                          alt={b.name}
                          className="h-8 w-auto max-w-[80px] object-contain"
                        />
                      ) : (
                        <span className="text-ink-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink-900">{b.name}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden md:table-cell text-xs">
                      {b.websiteUrl ? (
                        <a
                          href={b.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-700 hover:underline"
                        >
                          {b.websiteUrl}
                        </a>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-700 hidden lg:table-cell">
                      {b.sortOrder}
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
                        <button
                          onClick={() => handleDelete(b)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-error/10 hover:border-error/30 hover:text-error text-ink-700 disabled:opacity-50"
                        >
                          <Trash size={12} /> Sil
                        </button>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200">
              <h2 className="text-lg font-semibold text-ink-900">
                {editingId ? "Marka Düzenle" : "Yeni Marka"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 -mr-1.5 rounded hover:bg-paper-100 text-ink-500"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Marka Adı <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Örn. Toroslar Holding"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Logo */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Logo <span className="font-normal text-ink-500">(boş bırakılabilir)</span>
                </label>
                <ImageUploader
                  value={form.logoUrl}
                  onChange={(url) => setField("logoUrl", url)}
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Web Sitesi <span className="font-normal text-ink-500">(boş = yok)</span>
                </label>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setField("websiteUrl", e.target.value)}
                  placeholder="https://ornek.com"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Sıra <span className="font-normal text-ink-500">(küçük = önce)</span>
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
                <span className="text-sm text-ink-900 font-medium">Marka aktif (sitede görünür)</span>
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
