"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, PencilSimple, Prohibit, X } from "@phosphor-icons/react";
import type { LegalPageDto } from "@markala/api-client";
import { createLegal, updateLegal, removeLegal } from "./actions";

interface Props {
  pages: LegalPageDto[];
}

interface FormState {
  title: string;
  slug: string;
  content: string;
  version: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  content: "",
  version: "v1.0",
  isActive: true,
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function LegalClient({ pages }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: LegalPageDto) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content,
      version: p.version,
      isActive: p.isActive,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleDeactivate(p: LegalPageDto) {
    startTransition(async () => {
      try {
        await removeLegal(p.id);
        toast.success(`"${p.title}" pasifleştirildi.`);
      } catch {
        toast.error("Pasifleştirme başarısız.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      content: form.content,
      version: form.version.trim() || "v1.0",
      isActive: form.isActive,
    };
    if (!editingId) {
      payload.slug = form.slug.trim().toLowerCase();
    }

    startTransition(async () => {
      try {
        if (editingId) {
          await updateLegal(editingId, payload);
          toast.success("Yasal sayfa güncellendi.");
        } else {
          await createLegal(payload);
          toast.success("Yasal sayfa oluşturuldu.");
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
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Yasal Sayfalar</h1>
          <p className="text-ink-500 text-sm mt-1">{pages.length} sayfa</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} weight="bold" /> Yeni Sayfa
        </button>
      </header>

      {/* Table */}
      {pages.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">Henüz hiç yasal sayfa oluşturulmamış.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} weight="bold" /> İlk Sayfayı Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Sayfa</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Versiyon</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Son Güncelleme</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink-900">{p.title}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <code className="text-xs bg-paper-200 px-1.5 py-0.5 rounded text-ink-700 font-mono">
                        {p.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden lg:table-cell">{p.version}</td>
                    <td className="px-4 py-3 text-ink-500 text-xs hidden lg:table-cell">
                      {formatDate(p.updatedAt)}
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
          <div className="bg-paper-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200">
              <h2 className="text-lg font-semibold text-ink-900">
                {editingId ? "Yasal Sayfa Düzenle" : "Yeni Yasal Sayfa"}
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
                  Sayfa Başlığı <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="KVKK Aydınlatma Metni"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Slug — disabled when editing */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Slug{" "}
                  {editingId ? (
                    <span className="font-normal text-ink-500">(düzenlemede değiştirilemez)</span>
                  ) : (
                    <span className="text-error">*</span>
                  )}
                </label>
                <input
                  type="text"
                  required={!editingId}
                  disabled={!!editingId}
                  value={form.slug}
                  onChange={(e) =>
                    setField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  placeholder="kvkk"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 font-mono outline-none focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!editingId && (
                  <p className="mt-1 text-[11px] text-ink-400">
                    Yalnızca küçük harf, rakam ve tire. Örn: <code>kvkk</code>, <code>mesafeli-satis</code>
                  </p>
                )}
              </div>

              {/* Version */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Versiyon{" "}
                  <span className="font-normal text-ink-500">(örn. v1.0, v2.3)</span>
                </label>
                <input
                  type="text"
                  value={form.version}
                  onChange={(e) => setField("version", e.target.value)}
                  placeholder="v1.0"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Content — large textarea */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  İçerik <span className="text-error">*</span>{" "}
                  <span className="font-normal text-ink-500">(HTML / düz metin)</span>
                </label>
                <textarea
                  required
                  rows={14}
                  value={form.content}
                  onChange={(e) => setField("content", e.target.value)}
                  placeholder="<p>KVKK kapsamında...</p>"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 font-mono outline-none focus:border-brand-500 resize-y"
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
                <span className="text-sm text-ink-900 font-medium">Sayfa aktif (yayında)</span>
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
