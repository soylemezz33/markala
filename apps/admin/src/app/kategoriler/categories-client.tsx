"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, PencilSimple, Eye, Storefront, Trash, X } from "@phosphor-icons/react";
import { createCategory, updateCategory, removeCategory } from "./actions";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  imageUrl?: string;
  accentColor?: string | null;
  startingPrice?: unknown;
  productionTime?: string;
  sortOrder?: number;
  isActive?: boolean;
  _count?: { products: number };
}

interface Props {
  categories: CategoryRow[];
}

interface FormState {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  imageUrl: string;
  accentColor: string;
  startingPrice: string;
  productionTime: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  shortDescription: "",
  longDescription: "",
  imageUrl: "",
  accentColor: "",
  startingPrice: "",
  productionTime: "",
  sortOrder: "",
  isActive: true,
};

/** Türkçe karakterleri sadeleştirip slug üretir (backend SLUG_REGEX: a-z0-9 ve tire). */
function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return input
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c] ?? c)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoriesClient({ categories }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  function openCreate() {
    setEditingId(null);
    setSlugTouched(false);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setEditingId(c.id);
    setSlugTouched(true);
    setForm({
      slug: c.slug,
      name: c.name,
      shortDescription: c.shortDescription ?? "",
      longDescription: c.longDescription ?? "",
      imageUrl: c.imageUrl ?? "",
      accentColor: c.accentColor ?? "",
      startingPrice: c.startingPrice != null ? String(Number(c.startingPrice)) : "",
      productionTime: c.productionTime ?? "",
      sortOrder: c.sortOrder != null ? String(c.sortOrder) : "",
      isActive: c.isActive ?? true,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleNameChange(val: string) {
    setField("name", val);
    if (!slugTouched && !editingId) setField("slug", slugify(val));
  }

  function handleDelete(c: CategoryRow) {
    if (!confirm(`"${c.name}" kategorisi pasifleştirilecek. Emin misiniz?`)) return;
    startTransition(async () => {
      try {
        await removeCategory(c.id);
        toast.success(`"${c.name}" pasifleştirildi.`);
      } catch {
        toast.error("İşlem başarısız.");
      }
    });
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription.trim(),
      imageUrl: form.imageUrl.trim(),
      startingPrice: Number(form.startingPrice) || 0,
      productionTime: form.productionTime.trim(),
      isActive: form.isActive,
    };
    if (form.accentColor.trim() !== "") payload.accentColor = form.accentColor.trim();
    if (form.sortOrder !== "") payload.sortOrder = Number(form.sortOrder);
    return payload;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.name.trim().length < 2) return toast.error("Kategori adı en az 2 karakter olmalı.");
    if (!form.slug.trim()) return toast.error("Geçerli bir slug girin.");
    if (form.shortDescription.trim().length < 2) return toast.error("Kısa açıklama girin.");
    if (form.longDescription.trim().length < 2) return toast.error("Uzun açıklama girin.");
    if (!form.imageUrl.trim()) return toast.error("Görsel URL girin.");
    if (!form.productionTime.trim()) return toast.error("Üretim süresi girin.");

    const payload = buildPayload();
    startTransition(async () => {
      try {
        if (editingId) {
          await updateCategory(editingId, payload);
          toast.success("Kategori güncellendi.");
        } else {
          await createCategory(payload);
          toast.success("Kategori oluşturuldu.");
        }
        closeModal();
      } catch {
        toast.error(editingId ? "Güncelleme başarısız." : "Oluşturma başarısız.");
      }
    });
  }

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Kategoriler</h1>
          <p className="text-ink-500 text-sm mt-1">Toplam {categories.length} kategori</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-700"
        >
          <Plus size={14} weight="bold" /> Yeni Kategori
        </button>
      </header>

      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Slug</th>
                <th className="text-center px-4 py-3 font-semibold">Ürün</th>
                <th className="text-center px-4 py-3 font-semibold">Durum</th>
                <th className="text-right px-4 py-3 font-semibold">Başlangıç ₺</th>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {categories.map((c) => (
                <tr key={c.slug} className="hover:bg-paper-100/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-none w-9 h-9 rounded bg-paper-100 grid place-items-center text-ink-500">
                        <Storefront size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-ink-900">{c.name}</div>
                        <div className="text-[11px] text-ink-500 truncate max-w-[300px]">{c.shortDescription}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500 hidden md:table-cell">{c.slug}</td>
                  <td className="px-4 py-3 text-center text-ink-700 tabular-nums">{c._count?.products ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.isActive === false ? "bg-paper-200 text-ink-500" : "bg-success/10 text-success"
                      }`}
                    >
                      {c.isActive === false ? "Pasif" : "Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{Number(c.startingPrice).toLocaleString("tr-TR")} ₺</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Link href={`https://markala.com.tr/kategori/${c.slug}`} target="_blank" className="p-1.5 rounded text-ink-500 hover:bg-paper-100" title="Sitede gör">
                        <Eye size={14} />
                      </Link>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded text-ink-500 hover:bg-paper-100 hover:text-brand-700" title="Düzenle">
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={isPending}
                        className="p-1.5 rounded text-ink-500 hover:bg-error/10 hover:text-error disabled:opacity-50"
                        title="Pasifleştir"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-500 text-sm">
                    Henüz kategori yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                {editingId ? "Kategori Düzenle" : "Yeni Kategori"}
              </h2>
              <button onClick={closeModal} className="p-1.5 -mr-1.5 rounded hover:bg-paper-100 text-ink-500" aria-label="Kapat">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <Field label="Kategori Adı" required>
                <input
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Slug (URL — yalnız küçük harf, rakam, tire)" required>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setField("slug", e.target.value);
                  }}
                  placeholder="kartvizit"
                  className={inputCls + " font-mono text-xs"}
                />
              </Field>
              <Field label="Kısa Açıklama" required>
                <input
                  required
                  value={form.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Uzun Açıklama" required>
                <textarea
                  required
                  value={form.longDescription}
                  onChange={(e) => setField("longDescription", e.target.value)}
                  rows={4}
                  className={inputCls}
                />
              </Field>
              <Field label="Görsel URL" required>
                <input
                  required
                  value={form.imageUrl}
                  onChange={(e) => setField("imageUrl", e.target.value)}
                  placeholder="https://..."
                  className={inputCls + " font-mono text-xs"}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Başlangıç Fiyatı (TL)" required>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={form.startingPrice}
                    onChange={(e) => setField("startingPrice", e.target.value)}
                    className={inputCls + " tabular-nums"}
                  />
                </Field>
                <Field label="Üretim Süresi" required>
                  <input
                    required
                    value={form.productionTime}
                    onChange={(e) => setField("productionTime", e.target.value)}
                    placeholder="2-3 iş günü"
                    className={inputCls}
                  />
                </Field>
                <Field label="Vurgu Rengi (#RRGGBB — opsiyonel)">
                  <input
                    value={form.accentColor}
                    onChange={(e) => setField("accentColor", e.target.value)}
                    placeholder="#F5B800"
                    className={inputCls + " font-mono text-xs"}
                  />
                </Field>
                <Field label="Sıra (opsiyonel)">
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setField("sortOrder", e.target.value)}
                    className={inputCls + " tabular-nums"}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="w-4 h-4 rounded border-paper-200 accent-brand-500"
                />
                <span className="text-sm text-ink-900 font-medium">Kategori aktif</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-paper-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm rounded-lg border border-paper-200 hover:bg-paper-100 text-ink-700">
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

const inputCls =
  "w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-700 mb-1.5">
        {label} {required && <span className="text-error">*</span>}
      </span>
      {children}
    </label>
  );
}
