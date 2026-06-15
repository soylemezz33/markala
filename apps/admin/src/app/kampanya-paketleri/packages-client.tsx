"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, PencilSimple, Prohibit, X } from "@phosphor-icons/react";
import type { CampaignPackageDto } from "@markala/api-client";
import { createPackage, updatePackage } from "./actions";

interface Props {
  packages: CampaignPackageDto[];
}

type Category = "esnaf" | "kurumsal" | "etkinlik" | "acilis" | "promosyon";

interface FormState {
  slug: string;
  name: string;
  category: Category;
  contents: string;
  listPrice: string;
  packagePrice: string;
  stockLimit: string;
  endDate: string;
  designSupport: boolean;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  category: "esnaf",
  contents: "",
  listPrice: "",
  packagePrice: "",
  stockLimit: "",
  endDate: "",
  designSupport: false,
  sortOrder: "0",
  isActive: true,
};

const CATEGORY_LABELS: Record<Category, string> = {
  esnaf: "Esnaf",
  kurumsal: "Kurumsal",
  etkinlik: "Etkinlik",
  acilis: "Açılış",
  promosyon: "Promosyon",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function discountPercent(listPrice: string, packagePrice: string): number {
  const list = Number(listPrice);
  const pkg = Number(packagePrice);
  if (!list || list === 0) return 0;
  return Math.round((1 - pkg / list) * 100);
}

function buildPayload(form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    category: form.category,
    contents: form.contents.trim(),
    listPrice: Number(form.listPrice) || 0,
    packagePrice: Number(form.packagePrice) || 0,
    designSupport: form.designSupport,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };

  if (form.stockLimit !== "") {
    payload.stockLimit = Number(form.stockLimit);
  }

  if (form.endDate !== "") {
    payload.endDate = form.endDate;
  }

  return payload;
}

export function PackagesClient({ packages }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: CampaignPackageDto) {
    setEditingId(p.id);
    setForm({
      slug: p.slug,
      name: p.name,
      category: p.category,
      contents: p.contents,
      listPrice: p.listPrice != null ? String(Number(p.listPrice)) : "",
      packagePrice: p.packagePrice != null ? String(Number(p.packagePrice)) : "",
      stockLimit: p.stockLimit != null ? String(p.stockLimit) : "",
      endDate: formatDate(p.endDate),
      designSupport: p.designSupport,
      sortOrder: String(p.sortOrder),
      isActive: p.isActive,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleDeactivate(p: CampaignPackageDto) {
    startTransition(async () => {
      try {
        await updatePackage(p.id, { isActive: false });
        toast.success(`"${p.name}" pasifleştirildi.`);
      } catch {
        toast.error("Pasifleştirme başarısız.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload(form);
    if (!editingId) {
      payload.slug = form.slug.trim();
    }

    startTransition(async () => {
      try {
        if (editingId) {
          await updatePackage(editingId, payload);
          toast.success("Paket güncellendi.");
        } else {
          await createPackage(payload);
          toast.success("Paket oluşturuldu.");
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
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Kampanya Paketleri</h1>
          <p className="text-ink-500 text-sm mt-1">{packages.length} paket</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} weight="bold" /> Yeni Paket
        </button>
      </header>

      {/* Table */}
      {packages.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">Henüz hiç kampanya paketi oluşturulmamış.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} weight="bold" /> İlk Paketi Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Paket</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">İçerik</th>
                  <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">Liste Fiyat</th>
                  <th className="text-right px-4 py-3 font-semibold">Paket Fiyat</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {packages.map((p) => {
                  const discount = discountPercent(p.listPrice, p.packagePrice);
                  return (
                    <tr key={p.id} className="hover:bg-paper-100/40">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-ink-900">{p.name}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-700 hidden md:table-cell">
                        {CATEGORY_LABELS[p.category]}
                      </td>
                      <td className="px-4 py-3 text-ink-600 text-xs hidden lg:table-cell max-w-xs truncate">
                        {p.contents}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-500 tabular-nums hidden md:table-cell">
                        ₺ {Number(p.listPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-semibold text-ink-900">
                          ₺ {Number(p.packagePrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                        {discount > 0 && (
                          <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/15 text-success">
                            %{discount}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            p.isActive
                              ? "bg-success/15 text-success"
                              : "bg-paper-200 text-ink-500"
                          }`}
                        >
                          {p.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700"
                          >
                            <PencilSimple size={12} /> Düzenle
                          </button>
                          {p.isActive && (
                            <button
                              onClick={() => handleDeactivate(p)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-error/10 hover:border-error/30 hover:text-error text-ink-700 disabled:opacity-50"
                            >
                              <Prohibit size={12} /> Pasifleştir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                {editingId ? "Paket Düzenle" : "Yeni Paket"}
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
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Paket Adı <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Esnaf Başlangıç Paketi"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Slug <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="esnaf-baslangic-paketi"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm font-mono text-ink-900 outline-none focus:border-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!!editingId && (
                  <p className="text-[11px] text-ink-500 mt-1">Slug düzenlenemez.</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value as Category)}
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                >
                  <option value="esnaf">Esnaf</option>
                  <option value="kurumsal">Kurumsal</option>
                  <option value="etkinlik">Etkinlik</option>
                  <option value="acilis">Açılış</option>
                  <option value="promosyon">Promosyon</option>
                </select>
              </div>

              {/* Contents */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  İçerik <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.contents}
                  onChange={(e) => setField("contents", e.target.value)}
                  placeholder="1.000 kartvizit + 1 kaşe + 250 broşür"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500 resize-none"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Liste Fiyatı (₺) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={form.listPrice}
                    onChange={(e) => setField("listPrice", e.target.value)}
                    placeholder="950.00"
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Paket Fiyatı (₺) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={form.packagePrice}
                    onChange={(e) => setField("packagePrice", e.target.value)}
                    placeholder="749.00"
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              {form.listPrice && form.packagePrice && (
                <p className="text-[11px] text-success -mt-2">
                  İndirim: %{discountPercent(form.listPrice, form.packagePrice)}
                </p>
              )}

              {/* Stock limit */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Stok Limiti{" "}
                  <span className="font-normal text-ink-500">(boş = sınırsız)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.stockLimit}
                  onChange={(e) => setField("stockLimit", e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* End date */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Bitiş Tarihi{" "}
                  <span className="font-normal text-ink-500">(boş = süresiz)</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Sıralama</label>
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

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.designSupport}
                    onChange={(e) => setField("designSupport", e.target.checked)}
                    className="w-4 h-4 rounded border-paper-200 accent-brand-500"
                  />
                  <span className="text-sm text-ink-900 font-medium">Tasarım desteği dahil</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setField("isActive", e.target.checked)}
                    className="w-4 h-4 rounded border-paper-200 accent-brand-500"
                  />
                  <span className="text-sm text-ink-900 font-medium">Paket aktif</span>
                </label>
              </div>

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
